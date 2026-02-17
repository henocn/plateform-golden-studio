# Déploiement du projet Golden Studio sur un VPS

Ce guide explique comment déployer ce projet (backend Node.js, frontend Vite/React, base de données, configuration Apache, etc.) sur un VPS à partir d'un clonage Git.

## 1. Prérequis
- Un VPS (Ubuntu/Debian recommandé)
- Accès SSH root ou sudo
- Node.js (>= 18), npm, git
- Apache2 (ou Nginx)
- PostgreSQL ou MySQL (selon votre projet)

## 2. Clonage du projet
```bash
# Connectez-vous à votre VPS
ssh user@votre-vps

# Installez git si besoin
sudo apt update && sudo apt install git -y

# Clonez le dépôt
cd /var/www
sudo git clone <url-du-repo> plateform-golden-studio
cd plateform-golden-studio
```

## 3. Configuration des variables d'environnement
- Copiez les fichiers `.env.example` en `.env` dans `backend/` et `backoffice/`.
- Modifiez les valeurs selon votre environnement (DB, ports, secrets, etc.).

```bash
cd backend
cp .env.example .env
nano .env
cd ../backoffice
cp .env.example .env
nano .env
```

## 4. Installation des dépendances
```bash
# Backend
cd /var/www/plateform-golden-studio/backend
npm install

# Frontend
cd ../backoffice
npm install
```

## 5. Mise en place de la base de données
- Installez PostgreSQL ou MySQL si besoin :
  - `sudo apt install postgresql` ou `sudo apt install mysql-server`
- Créez la base et l'utilisateur, puis configurez le `.env` backend.
- Lancez les migrations si le projet en propose :

```bash
# Exemple pour Sequelize
cd /var/www/plateform-golden-studio/backend
npx sequelize-cli db:migrate
```

## 6. Lancement des serveurs

### Backend (API Node.js)
```bash
cd /var/www/plateform-golden-studio/backend
npm run build # si applicable
npm run start & # ou npm run dev pour dev
```

### Frontend (Vite/React)
```bash
cd /var/www/plateform-golden-studio/backoffice
npm run build
# Pour servir le build :
npm install -g serve
serve -s dist &
```

## 7. Configuration Apache (reverse proxy)

- Activez les modules nécessaires :
```bash
sudo a2enmod proxy proxy_http rewrite headers
sudo systemctl restart apache2
```

- Ajoutez un VirtualHost dans `/etc/apache2/sites-available/plateform-golden-studio.conf` :

```
<VirtualHost *:80>
    ServerName mon-domaine.com
    DocumentRoot /var/www/plateform-golden-studio/backoffice/dist

    <Directory /var/www/plateform-golden-studio/backoffice/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    ErrorLog ${APACHE_LOG_DIR}/gs-error.log
    CustomLog ${APACHE_LOG_DIR}/gs-access.log combined
</VirtualHost>
```

- Activez le site et rechargez Apache :
```bash
sudo a2ensite plateform-golden-studio.conf
sudo systemctl reload apache2
```

## 8. Sécurisation & production
- Utilisez un process manager pour Node.js (pm2 recommandé)
- Configurez un certificat SSL (Let's Encrypt)
- Sécurisez les permissions des fichiers

## 9. Mise à jour du projet
```bash
cd /var/www/plateform-golden-studio
sudo git pull
# Rebuild si besoin
cd backend && npm install && npm run build
cd ../backoffice && npm install && npm run build
```

---

Adaptez ce guide selon vos besoins spécifiques (base de données, ports, etc.).
