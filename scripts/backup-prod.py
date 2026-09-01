#!/usr/bin/env python3
"""Full prod backup: the D1 database plus every file the database points at.

Writes docs/tmp/backup-<name>/ in the convention of docs/005-backup-and-restore:
  00-schema.sql        CREATE TABLE / CREATE INDEX for the whole database
  <table>.sql          DELETE FROM + INSERTs with explicit column lists
  media/uma-media/     the Uma article art the rows reference
  MANIFEST.txt         row counts, media list, restore order

Engine internals (_cf_KV, sqlite_sequence) and live auth tokens (session,
verification) are skipped — tokens are ephemeral and people simply sign in
again, while restoring them would resurrect dead sessions.

R2 is not enabled on this project (api/wrangler.jsonc has the binding
commented out), so there are no bucket objects: Uma art ships in the repo at
web/public/uma-media and is copied here so a backup stands alone.

    python3 scripts/backup-prod.py                # backup-<today>
    python3 scripts/backup-prod.py my-label       # backup-my-label
"""
import datetime, json, os, pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = ROOT / 'api'
MEDIA_SRC = ROOT / 'web' / 'public' / 'uma-media'
SKIP = {'_cf_KV', 'sqlite_sequence', 'session', 'verification'}

label = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().strftime('%-d-%b-%Y').lower()
OUT = ROOT / 'docs' / 'tmp' / (label if label.startswith('backup-') else f'backup-{label}')
OUT.mkdir(parents=True, exist_ok=True)
today = datetime.date.today().strftime('%d %b %Y')


def q(sql: str):
    """One read-only query against prod, as JSON."""
    r = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'pujosamiti', '--remote', '--json', '--command', sql],
        capture_output=True, text=True, cwd=API)
    out = r.stdout[r.stdout.index('['):] if '[' in r.stdout else r.stdout
    try:
        d = json.JSONDecoder().raw_decode(out)[0]
    except ValueError:
        raise SystemExit(f'query failed: {sql[:70]}\n{r.stdout[-400:]}\n{r.stderr[-400:]}')
    d = d[0] if isinstance(d, list) else d
    if 'results' not in d:
        raise SystemExit(f'query failed: {sql[:70]} → {d}')
    return d['results']


def lit(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, bytes):
        return "X'" + v.hex() + "'"
    return "'" + str(v).replace("'", "''") + "'"


def fk_order(tables: dict[str, str]) -> list[str]:
    """Parents before children, so a restore never trips a foreign key."""
    deps = {
        name: {t for t in tables if t != name and f'REFERENCES "{t}"' in sql or t != name and f'REFERENCES `{t}`' in sql}
        for name, sql in tables.items()
    }
    ordered, seen = [], set()

    def visit(t, trail=()):
        if t in seen or t in trail:      # a cycle: emit and let the DELETEs sort it out
            return
        for d in sorted(deps[t]):
            visit(d, trail + (t,))
        seen.add(t)
        ordered.append(t)

    for t in sorted(tables):
        visit(t)
    return ordered


master = q("SELECT name, sql, type FROM sqlite_master "
           "WHERE type IN ('table','index') AND sql IS NOT NULL ORDER BY type='index', name")
tables = {r['name']: r['sql'] for r in master if r['type'] == 'table'}
indexes = [r['sql'] for r in master if r['type'] == 'index']

(OUT / '00-schema.sql').write_text(
    f'-- Prod schema, {today}\n\n' + '\n\n'.join(list(tables.values()) + indexes) + '\n')

order = [t for t in fk_order(tables) if t not in SKIP]
lines = [f'Pujosamiti FULL prod backup — {today}',
         'source: D1 pujosamiti (--remote) + web/public/uma-media', '',
         'TABLES (restore in this order — parents before children)', '']
total = 0
for i, name in enumerate(order, 1):
    rows = q(f'SELECT * FROM "{name}"')
    with open(OUT / f'{name}.sql', 'w') as f:
        f.write(f'-- {name}: {len(rows)} rows, {today}\n')
        f.write(f'DELETE FROM "{name}";\n')
        for row in rows:
            cols = list(row.keys())
            f.write(f'INSERT OR REPLACE INTO "{name}" ({", ".join(cols)}) '
                    f'VALUES ({", ".join(lit(row[c]) for c in cols)});\n')
    lines.append(f'{i:>3}. {name:<26} {len(rows):>8} rows')
    total += len(rows)
    print(f'{name}: {len(rows)}')
for name in sorted(SKIP):
    lines.append(f'     {name:<26} {"skipped":>8}')

# Media the database points at — copied whole, then checked reference by reference.
media_out = OUT / 'media' / 'uma-media'
if MEDIA_SRC.is_dir():
    shutil.rmtree(media_out, ignore_errors=True)
    shutil.copytree(MEDIA_SRC, media_out)
refs = {pathlib.PurePosixPath(list(r.values())[0]).name for r in q(
    "SELECT cover_image AS m FROM uma_issue WHERE cover_image IS NOT NULL "
    "UNION SELECT hero_image FROM uma_article WHERE hero_image IS NOT NULL")}
have = {p.name for p in media_out.glob('*')} if media_out.is_dir() else set()
missing = sorted(refs - have)
size_mb = sum(p.stat().st_size for p in media_out.rglob('*') if p.is_file()) / 1e6 if media_out.is_dir() else 0

lines += ['', f'TOTAL {total:>32} rows', '',
          'MEDIA', '',
          f'     uma-media                  {len(have):>8} files  ({size_mb:.1f} MB)',
          f'     referenced by rows         {len(refs):>8}',
          f'     MISSING                    {len(missing):>8}' + (f'  → {", ".join(missing)}' if missing else ''),
          '',
          'R2: not enabled on this project (api/wrangler.jsonc binding is commented',
          'out) — no bucket objects exist. Uma art lives in web/public/uma-media and',
          'is served from the site itself.', '',
          'Skipped: _cf_KV and sqlite_sequence (engine internals); session and',
          'verification (live tokens — people sign in again).', '',
          'RESTORE to local:  python3 scripts/restore-local.py ' + OUT.name]
(OUT / 'MANIFEST.txt').write_text('\n'.join(lines) + '\n')

print(f'\nTOTAL {total} rows, {len(have)} media files → {OUT}')
if missing:
    print(f'WARNING: {len(missing)} referenced file(s) missing: {", ".join(missing)}')
