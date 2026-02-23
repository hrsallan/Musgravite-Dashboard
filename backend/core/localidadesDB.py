import pandas as pd
import sqlite3
import os

dir_localidade = r'C:\Users\anali\OneDrive\Desktop\Musgravite Dashboard\backend\data\CODIGOS LOCAIS.xlsx'
db_path = r'C:\Users\anali\OneDrive\Desktop\Musgravite Dashboard\backend\data\musgravite.db'

if not os.path.exists(dir_localidade):
    print(f"ERRO: O arquivo Excel não foi encontrado em: {dir_localidade}")
else:
    df_codigos = pd.read_excel(dir_localidade, header=None)

    df_limpo = df_codigos[[1, 4]].copy()
    df_limpo.columns = ['cidade', 'regiao']

    df_limpo['cidade'] = df_limpo['cidade'].astype(str).str.strip().str.upper()
    df_limpo['regiao'] = df_limpo['regiao'].astype(str).str.strip().str.upper()
    df_final = df_limpo.drop_duplicates()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS localidades_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cidade TEXT,
            regiao TEXT
        )
    ''')

    cursor.execute('DELETE FROM localidades_base')

    lista_para_banco = df_final.values.tolist()
    cursor.executemany('INSERT INTO localidades_base (cidade, regiao) VALUES (?, ?)', lista_para_banco)

    conn.commit()
    conn.close()

    print("===== PROCESSAMENTO CONCLUÍDO =====")
    print(f"Total de cidades únicas processadas: {len(df_final)}")
    print(f"Banco de dados atualizado em: {db_path}")