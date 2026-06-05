#!/bin/bash
# Pre-renewal hook: zwalnia port 80, by certbot (authenticator=standalone) mogl
# przeprowadzic challenge HTTP-01. Bez tego kontener oragh_nginx trzyma port 80
# i odnowienie zawsze sie nie udaje (cert wygasl tak 24.04.2026).
# Docelowo na serwerze: /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh
cd /opt/oragh && docker compose stop nginx
