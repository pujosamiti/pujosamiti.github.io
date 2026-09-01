#!/usr/bin/env python3
"""Restore a prod backup into the LOCAL D1, on this machine only.

    python3 scripts/restore-local.py backup-01-sep-2026
    python3 scripts/restore-local.py backup-01-sep-2026 --fresh

Default: replaces the DATA table by table, in the manifest's order, leaving the
local database file in place. Local sign-ins are cleared with it — sign in
again on localhost afterwards.

--fresh: deletes the local D1 state entirely and rebuilds from 00-schema.sql
first. Use it when the local schema has drifted from prod — and expect to sign
in again afterwards, since the session table goes with it.

Media is copied back to web/public/uma-media only with --media, since those
files are tracked in git and the working tree is normally the better copy.

Never runs against --remote. Restoring prod from a snapshot is a deliberate,
supervised act; this script cannot do it by accident.
"""
import pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = ROOT / 'api'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
flags = {a for a in sys.argv[1:] if a.startswith('--')}
if not args:
    raise SystemExit('usage: restore-local.py <backup-dir-name> [--fresh] [--media]')

SRC = ROOT / 'docs' / 'tmp' / args[0]
if not SRC.is_dir():
    raise SystemExit(f'no such backup: {SRC}')
manifest = (SRC / 'MANIFEST.txt').read_text() if (SRC / 'MANIFEST.txt').exists() else ''


def run(sql_file: pathlib.Path):
    r = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'pujosamiti', '--local', '--file', str(sql_file)],
        capture_output=True, text=True, cwd=API)
    if r.returncode != 0 or 'ERROR' in r.stdout or 'ERROR' in r.stderr:
        tail = (r.stdout + r.stderr)[-500:]
        raise SystemExit(f'failed on {sql_file.name}:\n{tail}')


if '--fresh' in flags:
    state = API / '.wrangler' / 'state' / 'v3' / 'd1'
    shutil.rmtree(state, ignore_errors=True)
    print(f'wiped {state}')
    run(SRC / '00-schema.sql')
    print('00-schema.sql applied')

# The manifest lists tables parents-first; fall back to filenames if it is absent.
order = re.findall(r'^\s*\d+\.\s+(\S+)', manifest, re.M)
if not order:
    order = sorted(p.stem for p in SRC.glob('*.sql') if p.name != '00-schema.sql')

# Empty everything first, children before parents, so no delete trips a foreign
# key. session and verification hold no data worth keeping and are cleared with
# the rest: they point at `user`, which cannot be emptied while they exist, and
# a signed-in token means nothing once the rows beneath it have been replaced.
tmp = SRC / '.restore-tmp.sql'
clear = ['DELETE FROM "session";', 'DELETE FROM "verification";'] + [
    f'DELETE FROM "{t}";' for t in reversed(order)]
tmp.write_text('\n'.join(clear) + '\n')
run(tmp)
print(f'cleared {len(clear)} tables — sign in again on localhost afterwards')

total = 0
for name in order:
    f = SRC / f'{name}.sql'
    if not f.exists():
        print(f'{name}: no file, skipped')
        continue
    run(f)
    n = sum(1 for line in f.read_text().splitlines() if line.startswith('INSERT'))
    total += n
    print(f'{name}: {n}')
tmp.unlink(missing_ok=True)

if '--media' in flags and (SRC / 'media' / 'uma-media').is_dir():
    dest = ROOT / 'web' / 'public' / 'uma-media'
    shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(SRC / 'media' / 'uma-media', dest)
    print(f'media → {dest}')

print(f'\nrestored {total} rows from {SRC.name} into the local D1')
print('restart `npm run dev:api` if it is running, so it picks the file up cleanly')
