# Deployment

Läuft auf core@docker.itiv.kit.edu \
Nach SSH-Login:

```
cd dt-visualisierer  
git pull
docker compose down
docker compose build
docker compose up -d
```