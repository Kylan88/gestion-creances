import sqlite3

       # Connexion aux deux bases de données
source_conn = sqlite3.connect('database.db')
target_conn = sqlite3.connect('clients.db')
source_cursor = source_conn.cursor()
target_cursor = target_conn.cursor()

       # Copier les données de la table paiements
source_cursor.execute("SELECT * FROM paiements")
rows = source_cursor.fetchall()
for row in rows:
           target_cursor.execute("INSERT INTO paiements (client_id, montant, date_paiement, enregistre_par) VALUES (?, ?, ?, ?)", row[1:])  # Ignorer l'ID auto-incrémenté
target_conn.commit()

# Fermer les connexions
source_conn.close()
target_conn.close()
print("Migration terminée.")
