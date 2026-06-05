# Plan przebudowy ORAGH-App — wersja dla jednej orkiestry (AGH)

> Data: 2026-06-05. Dokument roboczy. Kontekst i uzasadnienie: `ocena-architektury.md`.
> Cel: uprościć projekt, zunifikować style, uporządkować modele, zdiagnozować błędy i przygotować wersję łatwą w utrzymaniu i przekazaniu następcy.

---

## 1. Założenia bazowe (kierunek przebudowy)

- **Stack docelowy:** Django + szablony Django + **HTMX** (+ Alpine.js do drobnych interakcji). **React usuwany.**
- **Zakres:** jedna orkiestra (AGH). Bez multi-tenancy — tylko „tani szew" na przyszłość (Aneks A).
- **Auth:** sesje Django + CSRF. Koniec z JWT / refresh tokenami / axios interceptorami.
- **DRF:** docelowo usuwany (chyba że zdecydujemy zostawić cienkie API — patrz decyzje).
- **Baza danych:** schemat zachowany w maksymalnym stopniu, żeby **przenieść istniejące dane** AGH. Stary React zostaje jako referencja zachowań do czasu cutoveru.
- **Strategia:** czysty rebuild na osobnym branchu, **feature po featurze**, z testami dorzucanymi przy okazji każdego portu. Cutover (przełączenie produkcji) na końcu, z planem rollbacku.

### Dlaczego rebuild na branchu, a nie „strangler" obok Reacta
Auth zmienia się fundamentalnie (JWT → sesje). Równoległe utrzymanie obu modeli uwierzytelniania w jednym działającym systemie jest bardziej upierdliwe niż czysty rebuild. Apka jest na tyle mała, że rebuild feature-po-featurze z zachowaniem schematu DB jest czystszy.

---

## 2. Decyzje do podjęcia (zaznacz wieczorem)

- [ ] **CSS / system designu:** Bootstrap 5 + własny motyw SCSS *(rekomendacja — znasz z pracy, szybkie spójne komponenty)* — vs Tailwind (utility-first, tokeny przez konfig) — vs własny minimalny CSS na zmiennych.
- [ ] **DRF:** usuwamy całkowicie — vs zostawiamy cienkie API (np. health + ewentualny eksport danych).
- [ ] **Model użytkownika:** zostaje `MusicianProfile` (OneToOne do `User`) — vs custom User (`AbstractUser`) *(czystsze docelowo, ale migracja w trakcie projektu bywa bolesna)*.
- [ ] **Instrumenty:** zostają w kodzie (`INSTRUMENT_CHOICES`) — vs model w DB, zarządzalny z admina *(większa elastyczność, +1 tabela)*.
- [ ] **Interaktywność:** HTMX wystarczy — vs HTMX + Alpine.js (gdzie potrzeba stanu po stronie klienta).

---

## 3. Przekrojowe zasady (obowiązują w KAŻDEJ fazie)

1. **Spójne style przez konstrukcję.** Każdy moduł używa współdzielonych komponentów/partiali. **Zero bespoke CSS w modułach.** Nowy moduł = komponowanie istniejących klocków. (Szczegóły — Faza 1.)
2. **Każdy feature dostaje testy** przy porcie (min. smoke test widoku + test uprawnień + 1 test logiki).
3. **Autoryzacja w jednym miejscu** — żadnych powtarzanych `if board/staff/superuser` rozsianych po modelach (patrz Faza 2).
4. **Fat model, thin view** — logika domenowa w modelach/serwisach, widoki cienkie.
5. Każda zmiana modelu = migracja przemyślana pod kątem **zachowania danych produkcyjnych** AGH.

---

## 4. Fazy

### Faza 0 — Stabilizacja i higiena (na OBECNEJ apce; rozmiar: S)
Niezależne od rebuildu, warto zrobić od razu, żeby produkcja była solidna w trakcie prac.

**Zrobione 2026-06-05** (na żywej produkcji, z backupami `.bak.<TS>` w `/opt/oragh`):
- [x] HTTPS/cert + auto-odnawianie, healthchecki — patrz `RUNBOOK-https-and-healthchecks.md`.
- [x] Usunięte `ports: 5432:5432` z prod compose (baza tylko w sieci wewnętrznej; zweryfikowane: brak mapowania).
- [x] Usunięty martwy/hardcoded `DATABASE_URL` z compose.
- [x] Przywrócone workery gunicorna (`--workers 3`, zweryfikowane w logach).
- [x] **Wyłączone publiczne API docs** — `/api/swagger/` i `/api/redoc/` → 403 na nginx.
- [x] **Włączony rate-limiting** — `limit_req` na logowaniu (strefa `login`) + łagodny na `/api/` (strefa `api`).
- [x] **Przywrócony nagłówek `Referrer-Policy`** (był gubiony przez nadpisanie `add_header` w bloku server).

**Pozostałe (wymagają zmian w kodzie — pasują do rebuildu, nie do „szybkich poprawek"):**
- [ ] `SECRET_KEY`: twardy fail w prod, gdy brak env (zamiast insecure default w `base.py`).
- [ ] Naprawić błędy TypeScript blokujące build frontu (żeby dało się go budować do czasu cutoveru).
- [ ] (Opcjonalnie) `Content-Security-Policy` — świadomie odłożone: przy SPA z MUI/emotion zła CSP wywali stronę; temat na wersję z szablonami.
- [ ] Zweryfikować, czy backupy mają kopię **off-site** (dziś są lokalnie w `/home/oragh/backups`, szyfrowane) i raz przetestować odtworzenie.

### Faza 1 — Fundament: system designu + szablony bazowe (rozmiar: M) ⭐ KLUCZOWA
To tu rodzi się „spójność, którą dziedziczą moduły". Robione PRZED jakimkolwiek widokiem.
- [ ] **Tokeny designu** (zmienne CSS/SCSS): paleta (barwy ORAGH), typografia, skala odstępów, promienie, cienie, breakpointy.
- [ ] **Hierarchia szablonów:** `base.html` (head, meta, CSP, assety) → `layouts/` (dashboard z nawigacją, layout auth) → `partials/` (navbar, sidebar, stopka, flash/toasty).
- [ ] **Biblioteka komponentów (partiale):** przyciski, karty, formularze (spójny rendering pól), tabele/listy, modale, paginacja, badge/statusy, pusty stan, avatar. Rozważyć `django-cotton` albo `{% include %}` z konwencją nazw.
- [ ] **HTMX + Alpine**: konwencje (atrybuty `hx-*`, wzorzec zwracania partiali, obsługa błędów/toastów, CSRF w HTMX).
- [ ] **Dokument konwencji** `docs/STYLEGUIDE.md`: jak budować nowy moduł z komponentów, nazewnictwo, przykłady. To jest „kontrakt" dla przyszłych modułów i następcy.
- [ ] Pipeline assetów: `django-compressor`/`whitenoise` albo prosty build SCSS; bez Node-SPA.

### Faza 2 — Review i uproszczenie modeli/klas (rozmiar: M) ⭐
Przed przepisywaniem widoków, bo widoki/szablony stoją na modelach. Konkretni kandydaci (z dzisiejszego skanu):
- [ ] **Centralizacja autoryzacji.** Identyczna logika `can_user_edit/delete/pin/lock/access` powtórzona w `Directory`, `Post`, `Comment`, `Concert`. Ujednolicić: jeden mechanizm (Django groups+permissions) + warstwa `policy`/`permissions.py` zamiast metod rozsianych po modelach. Usuwa najwięcej duplikacji.
- [ ] **Ujednolicić mechanizmy uprawnień.** Teraz miks: `has_perm` (Concert), grupy `board` (forum), `is_staff/superuser` (wszędzie). Wybrać jeden model i się go trzymać.
- [ ] **Legacy `db_table`** (`main_musicianprofile`, `concerts_concert`, „same table as old model") — relikt migracji SQLite→Postgres. Decyzja: zostawić i udokumentować *albo* znormalizować nazwy migracją.
- [ ] **`@property *_count`** robiące `.count()` (np. `participants_count`, `posts_count`) → w listach grozi N+1. Zastąpić `annotate()` w querysetach widoków.
- [ ] **`Season.save()`** robi walidację + `update(is_active=False)` na innych sezonach. Walidację przenieść do `clean()`/formularza; „jeden aktywny" w transakcji lub jako constraint.
- [ ] **Dwie flagi aktywności** — `MusicianProfile.active` vs `User.is_active`. Ujednoznacznić semantykę i udokumentować.
- [ ] **Decyzje z sekcji 2** (custom User? instrumenty w DB?) materializują się tutaj.
- [ ] Po usunięciu Reacta: **serializery DRF znikają**, logika domenowa zostaje w modelach jako jedyne źródło prawdy.
- [ ] Każda zmiana = migracja przetestowana na kopii danych produkcyjnych.

### Faza 3 — Przepisanie funkcjonalności (feature po featurze) (rozmiar: L)
Kolejność wg zależności. Każdy feature: widoki + szablony (z komponentów Fazy 1) + uprawnienia + testy + skreślenie odpowiednika w React.
1. [ ] **Auth** (logowanie sesyjne, wylogowanie, reset hasła) — fundament.
2. [ ] **Rejestracja + aktywacja konta** (`AccountActivationToken`, mail do admina, aktywacja linkiem) — prześledzić dokładnie (patrz Faza 4).
3. [ ] **Profile muzyków** (lista, podgląd, edycja, zdjęcie, zmiana hasła).
4. [ ] **Sezony** (CRUD, aktywny sezon, przypisani muzycy, sekcje wg instrumentów).
5. [ ] **Wydarzenia + obecności** (typy wydarzeń, siatka zaznaczania obecności 0/0,5/1, statystyki) — najwięcej interaktywności → HTMX.
6. [ ] **Koncerty** (CRUD, uczestnicy, statusy, setlista).
7. [ ] **Forum** (katalogi hierarchiczne, posty, komentarze, przypinanie/blokada, poziomy dostępu).
8. [ ] **Home/Dashboard** (statystyki, nadchodzące wydarzenia, ostatnia aktywność).

### Faza 4 — Diagnostyka błędów i prześledzenie funkcjonalności (rozmiar: M)
Realizuje Twoje „chciałbym zdiagnozować błędy i prześledzić każdą funkcjonalność". Dwutorowo:
- **W trakcie Fazy 3:** portując feature, spisujemy wykryte bugi i edge-case'y (osobny `docs/known-issues.md`).
- **Pasy dedykowane** (przed cutoverem), per feature — checklist:
  - [ ] Ścieżki uprawnień (gość / muzyk / board / admin) — kto co widzi i może.
  - [ ] Walidacje i błędne dane wejściowe.
  - [ ] Stany brzegowe (pusty sezon, brak aktywnego sezonu, usunięty autor itp.).
  - [ ] N+1 / wydajność list.
  - [ ] Spójność danych po operacjach (np. kaskady `on_delete`).
- Kandydaci do przyjrzenia się już teraz: przepływ aktywacji konta, „jeden aktywny sezon", liczenie frekwencji (0,5), dostęp do katalogów `board-only` z dziedziczeniem po rodzicu.

### Faza 5 — Testy, CI, dokumentacja (rozmiar: M)
- [ ] Testy: pytest-django, fixtures/factory_boy; pokrycie krytycznych ścieżek (auth, uprawnienia, frekwencja).
- [ ] CI (GitHub Actions): lint + testy + `migrate --check` + budowa obrazu. To by złapało dzisiejszy zepsuty build.
- [ ] `docs/ARCHITECTURE.md` (mapa modułów, model danych, decyzje), `docs/ONBOARDING.md` (jak odpalić, jak dodać moduł — linkuje STYLEGUIDE), aktualizacja README. RUNBOOK już jest.

### Faza 6 — Deploy przebudowanej wersji + cutover (rozmiar: M)
- [ ] **Uproszczenie stacku:** znika kontener frontendu (React/Node). Zostaje: `nginx` (statyki Django + proxy) + `backend` (gunicorn) + `db`. Albo nawet statyki przez `whitenoise` i nginx tylko jako TLS-terminator.
- [ ] Przepisać `production.conf` pod server-side Django (statyki/media, brak SPA `try_files`).
- [ ] **Plan cutoveru:** zrzut danych prod → migracja na nowy schemat → test na stagingu → przełączenie → smoke test → rollback (backup + stary obraz) gotowy.
- [ ] Auto-odnawianie certu zostaje (hooki — patrz RUNBOOK).

---

## 5. Sugerowana kolejność i kamienie milowe

```
Faza 0  (higiena prod)            ──┐ można równolegle
Faza 1  (design system) ⭐         ──┘
        │
Faza 2  (modele) ⭐
        │
Faza 3  (features 1→8) + Faza 4 (bugi w locie) + Faza 5 (testy w locie)
        │
Faza 4  (dedykowane pasy diagnostyczne)
        │
Faza 5  (CI + docs domknięcie)
        │
Faza 6  (cutover)
```

Kamienie milowe: **M1** — fundament (Faza 1+2 gotowe). **M2** — auth+profile+sezony+obecności działają na szablonach. **M3** — wszystkie features sportowane, React wyłączony lokalnie. **M4** — testy/CI/docs. **M5** — cutover na produkcji.

---

## Aneks A — Tani szew pod multi-tenancy (na przyszłość, NIE robimy teraz)
Żeby ewentualne dodanie wielu zespołów nie wymagało rewolucji, w trakcie przebudowy warto bezkosztowo:
- Nie zaszywać „AGH" w kodzie — nazwa/branding/logo w ustawieniach lub modelu `OrgaPlatformSettings` (singleton).
- Trzymać scoping zapytań w **managerach** (`Model.objects`), nie rozsiany po widokach — wtedy dodanie `organization_id` to później jeden punkt zmiany.
- Instrumenty/sekcje raczej w DB niż w `CHOICES` (jeśli zdecydujesz w sekcji 2).
To wszystko — bez budowania samego multi-tenancy.

## Aneks B — Co znika względem dziś
- Cały `frontend/` (React, ~16,6k linii), Node, vite, tsc.
- Warstwa JWT (`simplejwt`), CORS, `axios`, `zustand`, serializery DRF, `drf-yasg` (o ile DRF wypada).
- Kontener `frontend`/`nginx`-z-buildem-React; uproszczony `docker-compose.yml`.
- Klasa błędów: zepsuty build TS, rozjazd typów front/back, podwójna logika.
