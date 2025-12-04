import sqlite3
from tabulate import tabulate  # pip install tabulate pour beau formatage

def get_db_connection(db_path='clients.db'):
    """Connexion DB avec gestion d'erreurs."""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Pour dict-like rows
        return conn
    except sqlite3.Error as e:
        print(f"Erreur connexion DB: {e}")
        return None

def fetch_users_with_clients(db_path='clients.db'):
    """Récupère users + leurs clients associés (adapté à la structure app.py)."""
    conn = get_db_connection(db_path)
    if not conn:
        return []

    try:
        # Query : Users + LEFT JOIN clients (affiche users sans clients)
        # Adapté aux champs typiques de app.py : users (id, username, fullname, email), clients (id, user_id, name, email, phone)
        query = """
        SELECT u.id as user_id, u.username, u.fullname as user_fullname, u.email as user_email,
               c.id as client_id, c.name as client_name, c.email as client_email, c.phone
        FROM users u 
        LEFT JOIN clients c ON u.id = c.user_id
        ORDER BY u.id, c.id;
        """
        cursor = conn.execute(query)
        rows = cursor.fetchall()
        conn.close()
        return rows
    except sqlite3.Error as e:
        print(f"Erreur query: {e}")
        if conn:
            conn.close()
        return []

def print_users_clients(rows):
    """Affiche en table groupée par user."""
    if not rows:
        print("Aucun utilisateur ou erreur DB.")
        return

    # Groupe par user
    grouped = {}
    for row in rows:
        user_id = row['user_id']
        if user_id not in grouped:
            grouped[user_id] = {
                'user': dict(row),
                'clients': []
            }
            # Supprime champs clients du user (aliasés)
            if 'client_id' in grouped[user_id]['user']:
                del grouped[user_id]['user']['client_id']
            if 'client_name' in grouped[user_id]['user']:
                del grouped[user_id]['user']['client_name']
            if 'client_email' in grouped[user_id]['user']:
                del grouped[user_id]['user']['client_email']
            if 'phone' in grouped[user_id]['user']:
                del grouped[user_id]['user']['phone']
        if row['client_id']:  # Ajoute client si existe
            client = {k: v for k, v in row.items() if k.startswith('client_')}
            client['id'] = row['client_id']
            grouped[user_id]['clients'].append(client)

    # Affichage
    print("\n=== UTILISATEURS ET LEURS CLIENTS ===\n")
    for user_id, data in grouped.items():
        print(f"🔹 Utilisateur ID: {user_id}")
        print(tabulate([data['user']], headers='keys', tablefmt='grid'))
        
        if data['clients']:
            print(f"   Clients associés ({len(data['clients'])}):")
            clients_table = []
            for client in data['clients']:
                clients_table.append([
                    client['id'], 
                    client.get('client_name', 'N/A'),  # Utilise 'client_name' (alias de c.name)
                    client.get('client_email', 'N/A'), 
                    client.get('phone', 'N/A')
                ])
            print(tabulate(clients_table, headers=['ID', 'Nom', 'Email', 'Phone'], tablefmt='grid'))
        else:
            print("   Aucun client associé.")
        print()  # Ligne vide

if __name__ == "__main__":
    rows = fetch_users_with_clients()
    print_users_clients(rows)
    print("\nFin du script.")