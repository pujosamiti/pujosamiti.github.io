# Backup & restore

Three procedures: mirroring prod to a dev machine, taking snapshot backups,
and disaster recovery. **No dump or backup file may ever be committed — the
repo is public and the data includes member contact details and finances.**
`docs/tmp/` is git-ignored (`.gitignore:12`) for exactly this reason; dumps
made elsewhere go outside the repo entirely.

## 1. Why copy prod to local

Local dev runs against its own SQLite file, not prod
([004](004-database.md) §1). The ledger, nirghanto and roster views are only
meaningfully testable against real data shapes (Bengali names, event-wise
bhog entries, locked history), so the workflow is: mirror prod down, develop
locally, apply migrations locally first, then to prod before deploying.

## 2. Prod → local copy

From `api/`:

```sh
# 1. Export prod to a SQL dump — OUTSIDE the repo (contains member data)
npx wrangler d1 export pujosamiti --remote --output=/tmp/prod-dump.sql

# 2. The dump references sqlite_sequence, which a fresh DB doesn't have yet
sed -i '' '/sqlite_sequence/d' /tmp/prod-dump.sql

# 3. Wipe local state and replay the dump
rm -rf .wrangler/state/v3/d1
npx wrangler d1 execute pujosamiti --local --file=/tmp/prod-dump.sql

# 4. Delete the dump
rm /tmp/prod-dump.sql
```

Notes:

- The export briefly makes prod D1 unavailable to queries (wrangler warns);
  at samiti scale this is seconds.
- The raw export includes `session` and `verification` (live auth tokens).
  Acceptable for a dump that lives minutes on your own machine — never for a
  backup that might travel (§3 skips them).
- Step 3 fails with "table already exists" if you skip the wipe.

## 3. Snapshot backups (`docs/tmp/backup-<date>/`)

Point-in-time prod backups live in `docs/tmp/backup-*/` — git-ignored,
local-only. Existing snapshots: `backup-7-aug-2026` (a one-off local/prod
superset merge from the ETL era — its `00-REPORT.md` explains itself),
`backup-9-aug-2026`, `backup-10-aug-2026`, `backup-10-aug-2026-v2`, and
`backup-28-aug-2026`. The format, per `backup-10-aug-2026-v2` onward:

- `00-schema.sql` — full prod schema (tables then indexes, from `sqlite_master`).
- `<table>.sql` per table — header comment with row count and date, a
  `DELETE FROM "table";`, then one `INSERT` per row with **explicit column
  lists** (files survive column reordering and read as documentation).
- `MANIFEST.txt` — per-table row counts, what was skipped and why, restore order.

Always skipped: `_cf_KV`, `sqlite_sequence` (engine internals) and `session`,
`verification` (live tokens, ephemeral — users just sign in again).

### The two scripts (committed, `scripts/` — code only, never data)

```bash
python3 scripts/backup-prod.py                  # → docs/tmp/backup-<today>
python3 scripts/backup-prod.py 01-sep-2026      # → docs/tmp/backup-01-sep-2026
python3 scripts/restore-local.py backup-01-sep-2026
python3 scripts/restore-local.py backup-01-sep-2026 --fresh   # wipe + reload schema
```

`backup-prod.py` is a FULL backup: every table (parents before children, the
order derived from the schema's own `REFERENCES`), plus `media/uma-media/` —
the Uma article art the rows point at — and a `MANIFEST.txt` that checks every
referenced image is present. R2 is not enabled on this project (the binding in
`api/wrangler.jsonc` is commented out), so there are no bucket objects: Uma art
is served from `web/public/uma-media` in the repo.

`restore-local.py` only ever writes to `--local`; it cannot touch prod by
accident. It clears every table first, children before parents, `session` and
`verification` included — those point at `user`, which cannot be emptied while
they exist, and a token is worthless once the rows beneath it are replaced. So
**sign in again on localhost afterwards**. Running it twice is harmless.

**By hand instead**: run `00-schema.sql` on an empty DB, then each table file
in `MANIFEST.txt` order — `person` and `family` before the tables that
reference them.

Snapshot sizes: 28 Aug 2026 was 2,210 rows across 16 tables; **1 Sep 2026 is
5,179 rows across 27 tables plus 18 media files (3.6 MB)**, the growth being
procurement, the sponsorship board and Uma.

## 4. Disaster recovery (prod)

D1 keeps automatic **Time Travel** backups (30 days of history on the free
plan):

```sh
cd api
npx wrangler d1 time-travel info pujosamiti          # find a restore point
npx wrangler d1 time-travel restore pujosamiti --timestamp=<unix>
```

This rewinds prod in place — take a §3 snapshot first if the current (broken)
state might still be needed. For anything Time Travel can't reach (>30 days),
the newest `docs/tmp/backup-*` snapshot is the fallback.

## 5. Rules of thumb

- Take a §3 snapshot before any risky prod operation (bulk update, migration
  with data movement, Time Travel restore).
- Snapshots live only on committee machines — treat them with the same care
  as `~/.pujosamiti/`.
- After mirroring prod locally, remember your local now contains real member
  data too. That's fine on a committee machine; don't copy it further.
