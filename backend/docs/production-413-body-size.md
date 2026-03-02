# Erreur 413 (Request Entity Too Large) en production

En production, l’upload du **logo d’organisation** (ou d’autres fichiers) peut renvoyer **413 Request Entity Too Large**.  
Cela vient en général du **reverse proxy** (nginx, Caddy, etc.) qui limite la taille du corps des requêtes **avant** qu’elles n’atteignent Node.js.

L’API Express accepte déjà jusqu’à **10 Mo** pour le JSON et les formulaires ; le proxy doit autoriser au moins la même taille.

---

## Nginx

Dans le bloc `server` ou `http`, ajouter (**attention au point-virgule** ) :

```nginx
client_max_body_size 10M;
```

Exemple :

```nginx
server {
    listen 80;
    server_name plateform.goldenstudio-eatech.cloud;

    client_max_body_size 10M;   # autoriser les uploads (logo, médiathèque, etc.)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis recharger nginx :

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Caddy

Dans votre `Caddyfile` :

```
plateform.goldenstudio-eatech.cloud {
    request_body {
        max_size 10MB
    }
    reverse_proxy localhost:3000
}
```

---

## Autres plateformes (PaaS)

- **OVH / AlwaysData / o2switch** : dans la config nginx ou Apache fournie par l’hébergeur, augmenter la limite d’upload (souvent dans un panneau ou un fichier `.user.ini` / `php.ini` pour Apache).
- **Heroku / Render / Railway** : en général pas de limite côté proxy ; si 413 persiste, vérifier qu’aucun middleware ou CDN devant l’app n’impose une limite plus faible.

Une fois la limite du proxy portée à **10M** (ou plus), l’upload du logo et des médias doit fonctionner comme en local.
