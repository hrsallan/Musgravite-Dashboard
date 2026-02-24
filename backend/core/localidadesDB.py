import pandas as pd
import sqlite3
import os
import unicodedata

def remover_acentos(texto):
    if not isinstance(texto, str):
        return texto
    # Normaliza para a forma NFD (decomposição) e filtra caracteres que não são "combining marks"
    return "".join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )

dir_localidade = r'C:\Users\anali\OneDrive\Desktop\Musgravite Dashboard\backend\data\CODIGOS LOCAIS.xlsx'
db_path = r'C:\Users\anali\OneDrive\Desktop\Musgravite Dashboard\backend\data\musgravite.db'

if not os.path.exists(dir_localidade):
    print(f"ERRO: O arquivo Excel não foi encontrado em: {dir_localidade}")
else:
    df_codigos = pd.read_excel(dir_localidade, header=None)

    df_limpo = df_codigos[[1, 4]].copy()
    df_limpo.columns = ['cidade', 'regiao']

    # Tratamento de strings e remoção de acentos
    for col in ['cidade', 'regiao']:
        df_limpo[col] = (df_limpo[col]
                         .astype(str)
                         .str.strip()
                         .apply(remover_acentos) # Remove acentos aqui
                         .str.upper())

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