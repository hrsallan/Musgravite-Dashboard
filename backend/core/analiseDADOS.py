"""
analiseDADOS.py
Processa o relatorioAM.xlsx e atualiza a tabela resultados_analise no SQLite.
Pode ser executado diretamente (python analiseDADOS.py) ou chamado via app.py.
"""
import pandas as pd
import sqlite3
import os
import hashlib
from datetime import datetime

# ─── CAMINHOS (relativos ao próprio arquivo) ──────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_BASE, "..", "data")

# Permitem sobrescrita quando chamado via importlib pelo app.py
if "dir_relatorio" not in dir():
    dir_relatorio = os.path.join(_DATA, "relatorioAM.xlsx")
if "db_path" not in dir():
    db_path = os.path.join(_DATA, "musgravite.db")


# ─── FUNÇÕES ──────────────────────────────────────────────────────────────────
def calcular_file_hash(caminho: str) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()


def processar_arquivo(caminho: str, banco: str) -> dict:
    """Processa um arquivo de relatório e salva no banco. Retorna resumo."""
    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    atual_hash = calcular_file_hash(caminho)
    data_agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    conn = sqlite3.connect(banco)
    cursor = conn.cursor()

    # Log de processamento (evita duplicatas)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS log_processamento (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            arquivo             TEXT,
            hash                TEXT UNIQUE,
            data_processamento  TEXT
        )
    """)

    cursor.execute("SELECT data_processamento FROM log_processamento WHERE hash = ?", (atual_hash,))
    existente = cursor.fetchone()
    if existente:
        conn.close()
        raise ValueError(f"Este arquivo já foi processado em {existente[0]}. "
                         "Para reprocessar, apague o registro em log_processamento.")

    # Carrega relatório e localidades
    df = pd.read_excel(caminho)
    df_loc = pd.read_sql_query("SELECT cidade, regiao FROM localidades_base", conn)

    # Dicionários por região
    regioes = {}
    for regiao in df_loc["regiao"].unique():
        cidades = df_loc[df_loc["regiao"] == regiao]["cidade"].tolist()
        regioes[regiao] = dict.fromkeys(cidades, 0)

    # Contagem
    for cidade in df["Cidade"]:
        c = str(cidade).upper().strip()
        for reg, dic in regioes.items():
            if c in dic:
                dic[c] += 1
                break

    # Salva resultados
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resultados_analise (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            regiao       TEXT,
            cidade       TEXT,
            quantidade   INTEGER,
            data_analise TEXT
        )
    """)
    cursor.execute("DELETE FROM resultados_analise")

    dados = []
    resumo = {}
    for reg, dic in regioes.items():
        soma = sum(dic.values())
        resumo[reg] = soma
        for cidade, qtd in dic.items():
            if qtd > 0:
                dados.append((reg, cidade, qtd, data_agora))

    cursor.executemany(
        "INSERT INTO resultados_analise (regiao, cidade, quantidade, data_analise) VALUES (?, ?, ?, ?)",
        dados
    )
    cursor.execute(
        "INSERT INTO log_processamento (arquivo, hash, data_processamento) VALUES (?, ?, ?)",
        (os.path.basename(caminho), atual_hash, data_agora)
    )
    conn.commit()
    conn.close()
    return {"data": data_agora, "regioes": resumo, "registros": len(dados)}


# ─── EXECUÇÃO DIRETA ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.exists(dir_relatorio):
        print(f"[ERRO] Relatório não encontrado: {dir_relatorio}")
    else:
        try:
            res = processar_arquivo(dir_relatorio, db_path)
            print(f"\n[SUCESSO] Análise concluída em {res['data']}")
            for reg, total in res["regioes"].items():
                print(f"  {reg}: {total} notas")
            print(f"  Total de registros: {res['registros']}")
        except ValueError as e:
            print(f"\n[BLOQUEADO] {e}")
        except Exception as e:
            print(f"\n[ERRO] {e}")
