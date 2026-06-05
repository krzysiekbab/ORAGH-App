#!/bin/bash
# Post-renewal hook: wznawia nginx po odnowieniu certyfikatu, aby zaladowal
# swiezy fullchain.pem/privkey.pem.
# Docelowo na serwerze: /etc/letsencrypt/renewal-hooks/post/start-nginx.sh
cd /opt/oragh && docker compose start nginx
