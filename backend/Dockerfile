# Dockerfile pour ton Flask app.py (basé sur ton code exact)
FROM python:3.10-slim

# Définit le dossier de travail
WORKDIR /app

# Copie requirements et installe les dépendances (ton requirements.txt)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie tout le code (app.py, clients.db, etc.)
COPY . .

# Expose le port 5000 (comme dans ton app.py)
EXPOSE 5000

# Lance avec gunicorn (le serveur pro pour production)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]