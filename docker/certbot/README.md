# Odnawianie certyfikatu TLS (Let's Encrypt)

Certyfikat dla `oragh-app.me` jest wydawany przez Let's Encrypt, a `authenticator`
w `/etc/letsencrypt/renewal/oragh-app.me.conf` to **standalone**.

## Problem
Tryb `standalone` sam binduje port 80 na czas walidacji HTTP-01. W produkcji port 80
trzyma kontener `oragh_nginx`, wiec certbot nie moze sie zabindowac i odnowienie pada.
Skutek: certyfikat wygasl 24.04.2026 i HTTPS przestal dzialac.

## Rozwiazanie
Hooki certbota, ktore na czas odnowienia zatrzymuja i ponownie uruchamiaja nginx.
Na serwerze nalezy je umiescic w (i nadac `chmod +x`):

    /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh    <- patrz renewal-hooks/pre/
    /etc/letsencrypt/renewal-hooks/post/start-nginx.sh  <- patrz renewal-hooks/post/

certbot.timer (systemd) uruchamia `certbot renew` 2x dziennie; hooki odpalaja sie
tylko gdy faktycznie nastepuje odnowienie (~co 60 dni). Krotka przerwa w dzialaniu
strony (kilka sekund) na czas restartu nginx jest akceptowalna.

## Test
    sudo certbot renew --dry-run

Powinno zwrocic: "Congratulations, all simulated renewals succeeded".
