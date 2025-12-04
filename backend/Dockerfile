# Dockerfile optimisé pour ton Flask app.py sur Koyeb (basé sur ton code exact)
FROM python:3.10-slim

# Définis le dossier de travail
WORKDIR /app

# Copie requirements et installe (ton requirements.txt avec gunicorn)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie tout ton code (app.py, clients.db, uploads, etc.)
COPY . .

# Crée le dossier uploads si besoin (comme dans ton app.py)
RUN mkdir -p uploads/avatars

# Expose le port 5000 (ton Flask par défaut)
EXPOSE 5000

# Lance gunicorn sur 0.0.0.0:5000 (accessible depuis Koyeb)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]