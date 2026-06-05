# Runbook: naprawa HTTPS i healthchecków (incydent 2026-06-05)

Notatki z diagnozy i naprawy produkcji ORAGH-App na VPS DigitalOcean.
Środowisko: Ubuntu 24.04, `oragh@178.128.202.98`, stack Docker w `/opt/oragh`,
domena `https://oragh-app.me/`.

Kontenery: `oragh_nginx` (80/443), `oragh_backend` (Django/gunicorn :8000), `oragh_postgres`.

---

## Co się zepsuło i dlaczego

### 1. HTTPS nie działał — wygasły certyfikat Let's Encrypt
- Cert był ważny do **24.04.2026**, wygasł i nigdy się nie odnowił.
- Przyczyna: w `/etc/letsencrypt/renewal/oragh-app.me.conf` `authenticator = standalone`.
  Tryb standalone sam binduje **port 80** na czas walidacji HTTP-01 — ale port 80
  trzyma kontener `oragh_nginx`. Konflikt → odnowienie pada za każdym razem.
- DNS i domena działały cały czas; problem był wyłącznie w wygasłym certyfikacie.

### 2. backend `unhealthy`
- Healthcheck w `backend/Dockerfile`: `curl -f http://localhost:8000/api/health/`
  — ale obraz `python:3.11-slim` **nie zawiera `curl`** → "command not found".
- Dodatkowo `ALLOWED_HOSTS` (z `.env`) nie zawierał `localhost`, a healthcheck uderza
  z nagłówkiem `Host: localhost` → Django `DisallowedHost`.

### 3. nginx `unhealthy`
- Healthcheck: `wget --spider http://localhost/health` — ale `production.conf` nie miał
  lokacji `/health`, a blok :80 robił `return 301` na HTTPS dla wszystkiego → wget
  dostawał przekierowanie na HTTPS z certem dla `oragh-app.me` (mismatch na `localhost`) → pada.

---

## Diagnostyka — przydatne komendy

### Z zewnątrz (lokalnie)
```bash
# Stan certyfikatu po domenie (SNI) i jego daty waznosci:
echo | openssl s_client -servername oragh-app.me -connect oragh-app.me:443 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates

# Szybki test kodow HTTP/HTTPS i przekierowan:
curl -sS -m 10 -o /dev/null -w "HTTPS: %{http_code}\n" https://oragh-app.me/
curl -sS -m 10 -o /dev/null -w "HTTP: %{http_code} -> %{redirect_url}\n" http://oragh-app.me/
```

### Na serwerze (przez SSH; sudo non-interactive: `sudo -S` czyta haslo z stdin)
```bash
docker ps                                   # stan + statusy health kontenerow
docker compose ps                           # to samo w kontekscie compose (z /opt/oragh)
docker logs --tail 30 oragh_backend         # logi aplikacji (tu widac DisallowedHost)
docker logs --tail 30 oragh_nginx           # logi nginx (access/error)
ss -tlnp | grep -E ':80 |:443 '             # co nasluchuje na portach

# Co dokladnie jest healthcheckiem w obrazie i jaki byl ostatni wynik:
docker inspect --format '{{json .Config.Healthcheck}}' oragh_backend
docker inspect --format '{{json .State.Health}}'      oragh_backend

# Certbot (wymaga sudo):
sudo certbot certificates                   # lista certow i daty waznosci
cat /etc/letsencrypt/renewal/oragh-app.me.conf   # m.in. authenticator
systemctl list-timers | grep certbot        # czy timer odnawiania zyje
tail -30 /var/log/letsencrypt/letsencrypt.log    # dlaczego renew sie nie udal
```

---

## Naprawa

### Krok 1 — odnowienie certyfikatu (natychmiastowe)
Zwolnić port 80, odnowić, wstać nginx:
```bash
sudo bash -c 'cd /opt/oragh && docker compose stop nginx && certbot renew && docker compose start nginx'
```

### Krok 2 — trwałe auto-odnawianie (hooki certbota)
Hooki, które zatrzymują/wznawiają nginx wokół odnowienia (bo authenticator=standalone):
```bash
# /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh
#!/bin/bash
cd /opt/oragh && docker compose stop nginx

# /etc/letsencrypt/renewal-hooks/post/start-nginx.sh
#!/bin/bash
cd /opt/oragh && docker compose start nginx
```
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh \
              /etc/letsencrypt/renewal-hooks/post/start-nginx.sh
sudo certbot renew --dry-run    # test bez konsumpcji limitow LE
```
> Kopia hooków w repo: `docker/certbot/` (patrz `docker/certbot/README.md`).

### Krok 3 — ALLOWED_HOSTS (w `/opt/oragh/.env`, tylko na serwerze)
```bash
# Dodano localhost,127.0.0.1 (dla healthchecku). Swiadomie BEZ publicznego IP
# (utrzymanie dostepu tylko po domenie = lepsze utwardzenie).
ALLOWED_HOSTS=oragh-app.me,www.oragh-app.me,localhost,127.0.0.1
```
`production.py`: `ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')`.

### Krok 4 — healthcheck backendu (bez curl, z nagłówkiem proxy)
`backend/Dockerfile`. Dwie pułapki:
1. `python:3.11-slim` nie ma `curl` → używamy Pythona.
2. Produkcja ma `SECURE_SSL_REDIRECT=True`, więc czyste HTTP dostaje **302 na HTTPS**
   (a gunicorn na :8000 mówi tylko HTTP → `SSLError: WRONG_VERSION_NUMBER`).
   Rozwiązanie: wysłać `X-Forwarded-Proto: https` (zgodnie z `SECURE_PROXY_SSL_HEADER`),
   wtedy Django traktuje żądanie jak zza proxy i zwraca 200 bez przekierowania.
```dockerfile
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request as u; u.urlopen(u.Request('http://localhost:8000/api/health/', headers={'X-Forwarded-Proto': 'https'}))" || exit 1
```

### Krok 5 — healthcheck nginx (lokacja /health + IPv4)
a) `docker/nginx/conf.d/production.conf`, w bloku `listen 80`, PRZED `location /`:
```nginx
location = /health {
    access_log off;
    add_header Content-Type text/plain;
    return 200 "healthy\n";
}
```
b) `frontend/Dockerfile` — healthcheck musi pukać na **`127.0.0.1`**, nie `localhost`.
   busybox `wget` rozwiązuje `localhost` najpierw na IPv6 `[::1]`, a nginx słucha tylko
   na IPv4 (`listen 80`) → `wget: can't connect ... Connection refused`.
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1
```

### Wdrożenie zmian
```bash
cd /opt/oragh
# Sama zmiana KONFIGU nginx (bind volume) -> wystarczy test + reload, bez rebuildu:
docker compose exec -T nginx nginx -t          # walidacja
docker compose exec -T nginx nginx -s reload    # reload bez przerwy

# Ale zmiana HEALTHCHECK (jest w obrazie, nie w configu) -> trzeba rebuild + recreate.
# Backend: zmiana Dockerfile + .env -> rebuild + recreate.
docker compose up -d --build backend nginx
```

---

## Weryfikacja
```bash
# Z zewnatrz:
curl -sS -o /dev/null -w "%{http_code}\n" https://oragh-app.me/         # 200
echo | openssl s_client -servername oragh-app.me -connect oragh-app.me:443 2>/dev/null \
  | openssl x509 -noout -enddate                                         # ~3 mies. do przodu

# Na serwerze (po start-period healthchecku, ~10-40s):
docker ps --format '{{.Names}}: {{.Status}}'   # oba kontenery -> (healthy)
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost/health        # 200
```

## Rollback
Backupy oryginałów zostają na serwerze obok plików z sufiksem `.bak.<TIMESTAMP>`:
`/opt/oragh/backend/Dockerfile.bak.*`, `.../production.conf.bak.*`, `/opt/oragh/.env.bak.*`.
Przywrócenie = `sudo cp <plik>.bak.<TS> <plik>` + reload/rebuild jak wyżej.

---

## Co finalnie zadziałało (i pułapki wykryte dopiero w praktyce)

> **Healthchecki ostatecznie nadpisano w `docker-compose.yml`, nie w obrazach.**
> Powód: `npm run build` w `frontend/Dockerfile` odpala `tsc`, a w `master` są
> **błędy TypeScript** (`src/pages/auth/ActivateAccountPage.tsx`) → obrazu frontendu
> NIE da się teraz przebudować. Blok `healthcheck:` w compose przesłania healthcheck
> z obrazu i nie wymaga rebuildu — patrz definicje w `docker-compose.yml`.
> **TODO przed kolejnym deployem frontendu:** naprawić te błędy TS.

### Pułapka: nginx trzyma nieaktualny IP backendu (stale upstream)
Po `docker compose up -d --build backend` backend dostaje **nowy IP** w sieci Docker,
a nginx (jeśli nie był odtworzony) dalej kieruje `proxy_pass http://backend` na stary IP
→ `/api/...` **timeoutuje** (curl 28), choć `/` (statyczny) działa.
Naprawa: odtworzyć/reloadować nginx po recreate backendu:
```bash
cd /opt/oragh && docker compose up -d --no-build backend nginx   # razem -> nginx resolvuje swiezy IP
# lub szybciej, jesli nginx nie byl recreate:
docker compose exec -T nginx nginx -s reload
```

### Diagnostyka healthchecku od środka kontenera (bez sudo — oragh jest w grupie docker)
```bash
# Co bylo ostatnim wynikiem healthchecku:
docker inspect --format '{{json .State.Health}}' oragh_backend
# Reczne odtworzenie komendy healthchecku:
docker exec oragh_backend python -c "import urllib.request as u; print(u.urlopen(u.Request('http://localhost:8000/api/health/', headers={'X-Forwarded-Proto':'https'})).status)"
docker exec oragh_nginx wget --no-verbose --tries=1 --spider http://127.0.0.1/health; echo $?
```

## Notatka bezpieczeństwa
- Hasło sudo użytkownika `oragh` NIE jest nigdzie zapisane (świadomie — antywzorzec z rozdz. 4.4.2 pracy).
  Trafiło do historii czatu → zalecana zmiana: `passwd`.
- `ALLOWED_HOSTS` celowo bez publicznego IP — boty skanujące po IP są (poprawnie) odrzucane.
