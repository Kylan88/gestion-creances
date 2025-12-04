import sqlite3

def check_tables(db_file):
      try:
          conn = sqlite3.connect(db_file)
          cursor = conn.cursor()
          cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
          tables = cursor.fetchall()
          print(f"Tables dans {db_file}: {tables}")
          for table in tables:
              table_name = table[0]
              cursor.execute(f"PRAGMA table_info({table_name})")
              print(f"Structure de {table_name}: {cursor.fetchall()}")
      except sqlite3.Error as e:
          print(f"Erreur avec {db_file}: {e}")
      finally:
          conn.close()

  # Vérifiez les deux fichiers
check_tables('clients.db')
check_tables('database.db')