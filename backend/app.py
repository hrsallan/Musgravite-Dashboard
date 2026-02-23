from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import threading

app = Flask(__name__)

# CORS amplo — garante headers mesmo em respostas 4xx/5xx
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(BASE_DIR, "data", "musgravite.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def conectar():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def garantir_tabelas():
    """
    Cria as tabelas necessárias caso ainda não existam.
    Isso evita HTTP 500 no primeiro acesso (quando a tabela não existe),
    que o frontend interpretava como 'API offline'.
    """
    conn = conectar()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS resultados_analise (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            regiao       TEXT,
            cidade       TEXT,
            quantidade   INTEGER,
            data_analise TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS log_processamento (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            arquivo            TEXT,
            hash               TEXT UNIQUE,
            data_processamento TEXT
        )
    """)
    conn.commit()
    conn.close()


# Roda ao iniciar — garante estrutura do banco antes de aceitar requests
garantir_tabelas()


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@app.route("/api/status", methods=["GET"])
def api_status():
    """Healthcheck — usado pelo frontend para detectar se a API está online."""
    try:
        conn = conectar()
        total = conn.execute(
            "SELECT COUNT(*) FROM resultados_analise"
        ).fetchone()[0]
        conn.close()
        return jsonify({"status": "ok", "registros": total}), 200
    except Exception as e:
        return jsonify({"status": "erro", "detalhe": str(e)}), 500


@app.route("/api/notas/regioes", methods=["GET"])
def notas_regioes():
    try:
        conn = conectar()
        rows = conn.execute("""
            SELECT regiao,
                   SUM(quantidade)   AS total,
                   MAX(data_analise) AS data_analise
            FROM resultados_analise
            GROUP BY regiao
            ORDER BY total DESC
        """).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/api/notas/detalhado", methods=["GET"])
def notas_detalhado():
    try:
        conn = conectar()
        rows = conn.execute("""
            SELECT regiao, cidade, quantidade, data_analise
            FROM resultados_analise
            ORDER BY quantidade DESC
        """).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/api/upload", methods=["POST"])
def upload():
    """
    Recebe arquivo via multipart (campo 'file').
    Salva e processa em background — responde IMEDIATAMENTE ao frontend
    para evitar timeout e tela de loading infinita.
    """
    if "file" not in request.files:
        return jsonify({"erro": "Campo 'file' ausente."}), 400

    arquivo = request.files["file"]
    if not arquivo.filename:
        return jsonify({"erro": "Nome de arquivo vazio."}), 400

    ext = os.path.splitext(arquivo.filename)[1].lower()
    if ext not in {".xlsx", ".xls", ".csv"}:
        return jsonify({"erro": f"Extensão não suportada: {ext}"}), 415

    # Salva o arquivo imediatamente
    caminho = os.path.join(UPLOAD_DIR, arquivo.filename)
    arquivo.save(caminho)

    # Processa em background — não bloqueia o response
    def _processar_bg():
        try:
            # Importa a FUNÇÃO diretamente, não executa o módulo todo
            import importlib.util
            analise_path = os.path.join(BASE_DIR, "core", "analiseDADOS.py")
            spec = importlib.util.spec_from_file_location("analiseDADOS", analise_path)
            mod  = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            # Chama a função com os caminhos corretos
            resultado = mod.processar_arquivo(caminho, DB_PATH)
            print(f"[OK] Processado: {resultado}")
        except ValueError as ve:
            # Arquivo duplicado — não é erro crítico
            print(f"[DUPLICADO] {ve}")
        except Exception as e:
            print(f"[ERRO] Falha ao processar {arquivo.filename}: {e}")

    t = threading.Thread(target=_processar_bg, daemon=True)
    t.start()

    # Responde imediatamente — o frontend não precisa esperar o processamento
    return jsonify({
        "mensagem": f'"{arquivo.filename}" recebido e sendo processado.',
        "status": "processando"
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
