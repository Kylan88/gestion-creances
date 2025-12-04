import sqlite3
import bcrypt

# Connexion DB
conn = sqlite3.connect('clients.db')
cursor = conn.cursor()

# Récupérer l'admin
cursor.execute("SELECT username, password FROM users WHERE username = ?", ('admin',))
user = cursor.fetchone()

print(f"Admin trouvé: {user}")

if user:
    username, hashed_password = user
    
    # Le mot de passe hashé par défaut
    plain_password = b'password'
    stored_hash = hashed_password.encode('utf-8')
    
    print(f"Mot de passe hashé: {hashed_password}")
    print(f"Vérification bcrypt: {bcrypt.checkpw(plain_password, stored_hash)}")
    
    if bcrypt.checkpw(plain_password, stored_hash):
        print("✅ L'authentification marche !")
    else:
        print("❌ Problème avec bcrypt")
        
        # Recréer l'admin avec le bon hash
        new_hash = bcrypt.hashpw(plain_password, bcrypt.gensalt()).decode('utf-8')
        print(f"Nouveau hash: {new_hash}")
        
        cursor.execute("UPDATE users SET password = ? WHERE username = ?", (new_hash, 'admin'))
        conn.commit()
        print("Admin mis à jour avec nouveau hash")

conn.close()
