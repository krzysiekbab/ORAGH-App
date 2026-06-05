# Ocena architektury ORAGH-App

> Data: 2026-06-05. Skan obecnego stanu (backend Django/DRF ~5,4k linii, frontend React ~16,6k linii, deployment Docker/nginx/certbot). Dokument bazowy do dyskusji o przebudowie — patrz `plan-rebuild.md`.

## Czy projekt jest „zbyt skomplikowany"?

I tak, i nie.

- **Jako praca magisterska** — architektura jest w sam raz. Django/DRF + React + Docker + nginx + certbot ładnie pokazuje bezpieczeństwo „w głąb" na wielu warstwach, co jest celem pracy.
- **Jako system produkcyjny dla jednej orkiestry, utrzymywany przez jedną osobę i kiedyś przekazany następcy** — jest cięższy, niż problem tego wymaga.

Złożoność nie jest rozłożona równo:

| Warstwa | Rozmiar | Uwaga |
|---|---|---|
| Backend (Django) | ~5,4k linii, 6 appów | zwięzły, idiomatyczny |
| **Frontend (React)** | **~16,6k linii, 66 plików** | **3× większy niż backend** |

Sedno: **płacisz podwójnie za każdą funkcję** — raz w DRF (serializer + view + url + permissions), drugi raz w React (service + store + page + typy). Jeden feature = dwa kawałki kodu w dwóch językach, dwa buildy, dwa źródła błędów. Stąd m.in. zepsuty build TS i cała warstwa JWT/CORS/axios, której nie byłoby przy klasycznym Django.

## React → szablony Django? Tak — to najlepszy ruch.

Największa pojedyncza redukcja złożoności. Zyski:
- **−16k linii** i cała warstwa SPA znika. Jeden język, jedno repo, jeden artefakt deployu.
- **Auth się upraszcza radykalnie**: sesje Django + CSRF zamiast JWT + refresh tokens + zustand authStore + axios interceptors.
- **Następca to zrozumie** — szczególnie znający Django (i Ty, skoro pracujesz z szablonami w pracy).
- Znika cała klasa problemów `tsc`/`vite`/`node`.

Czego nie stracić i jak ocalić:
- Interaktywność (siatka obecności, modale, live update) → **HTMX + odrobina Alpine.js** daje ~90% odczucia SPA za ~10% kodu.
- To realne przepisanie frontu (tygodnie), więc decyzja na wersję finalną/uczelnianą, nie na jutro.

**Werdykt:** na wersję produkcyjną przejść na szablony Django + HTMX. DRF zostawić tylko, jeśli realnie potrzebne publiczne API / apka mobilna.

## Django → FastAPI? Nie.

Django daje za darmo to, co czyni projekt utrzymywalnym: **admin, ORM, migracje, auth, uprawnienia**. FastAPI każe to zbudować ręcznie (zwłaszcza admina). Dodałoby złożoności, nie ujęło — i kłóci się z kierunkiem „idę w szablony". Wniosek: zostać przy Django i wejść w nie głębiej.

## Skan deploymentu — znaleziska (priorytetowo)

**🔴/🟠 Do poprawienia:**
1. **Postgres `ports: 5432:5432`** w prod compose — niepotrzebne, baza potrzebuje tylko sieci wewnętrznej. Dziś firewall blokuje (zweryfikowane: 5432 z zewnątrz zamknięty, 443 otwarty, 8000 zamknięty), ale to obrona przez jeden mechanizm; Docker bywa, że omija `ufw`. Usunąć mapowanie. (Rozjazd z tezą — listing 4.3 twierdzi, że tylko nginx mapuje porty.)
2. **Hardcoded hasło DB w `docker-compose.yml`** (`DATABASE_URL=...:oragh_password@db...`, linia 27) — jest w gicie, a do tego to **martwa konfiguracja** (`production.py` czyta `POSTGRES_*`, nie `DATABASE_URL`). Leak bez pożytku. (Rozjazd z tezą „brak sekretów w VCS".)
3. **Gunicorn w prod = 1 worker** — compose `command:` nadpisuje `--workers 3` z Dockerfile. Dodać `--workers`.
4. **`SECRET_KEY` ma niebezpieczny default w `base.py` (l. 12)** — przy braku env cicho użyje `django-insecure-...`. W prod powinno twardo paść.

**🟡 Warto:**
- **Brak testów** (żadnego `tests.py`/`test_*.py`) — największe ryzyko dla utrzymywalności.
- Zepsuty build frontu → brak CI, które by to łapało.
- `LocMemCache` (per-proces); `REDIS_URL` zadeklarowany, lecz nieużywany.
- `migrate`/`collectstatic` przy każdym starcie — OK przy 1 instancji, problem przy skalowaniu poziomym.

**🟢 Dobre:** podział settings base/dev/prod, HSTS + secure cookies + SSL redirect + proxy header, nginx (nagłówki, rate-limiting, `server_tokens off`), certbot, kontener na non-root userze, struktura app-per-feature, indeksy na modelach, polskie `verbose_name`, dopieszczony admin. Architektura danych jest porządna.

## Multi-tenancy (skalowanie na inne zespoły)

Dziś projekt jest w 100% jednodzierżawcowy (brak modelu `Organizacja/Zespół`, grupa `board` globalna, instrumenty zaszyte w kodzie). Drogi: (a) osobny deploy per orkiestra — zero zmian w kodzie, najbezpieczniejsze dla kilku zespołów; (b) row-level multi-tenancy — jeden deploy, ale dotykasz każdego modelu i ryzykujesz wycieki; (c) schema-per-tenant (`django-tenants`).

**Decyzja użytkownika (2026-06-05): skupiamy się na JEDNEJ wersji dla AGH.** Multi-tenancy odłożone — w planie przebudowy zostaje tylko „tani szew" na przyszłość (Aneks A w `plan-rebuild.md`).
