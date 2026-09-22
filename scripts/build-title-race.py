"""Rebuild lib/data/title-race.json: every pro title at PPA Tour events.

Source: the PPA Tour History sheet, tab "PPA Tournaments (BIBLE)"
(Drive 1w08nRZyLj1PnXHovC52IX5QTQkVs6ZaucN7QXox9VvA). Export it as .xlsx, then:

    python3 scripts/build-title-race.py ~/Downloads/history.xlsx

Same parse as Jackalope's title-race video (ziff scripts/title-race/build.py):
one title per player per gold (a doubles gold counts for each partner), the
sheet's name typos folded, and the 2023 USA Pickleball Nationals included
because the sheet includes it. The script refuses to write unless Anna Leigh
Waters and Ben Johns land on the totals Hannah Johns and Jim Ramsey confirmed
(196 and 186 on 17 Sept 2026) or higher. A lower number means the parse broke.

Slugs and headshots are resolved here, statically: a player links to
/athletes/<slug> only when that page exists (published roster or curated
athletes), and gets /ppa/pros/<slug>.jpg only when the file is in the repo.
Everyone else falls back to Jackalope's feed at render time (lib/title-race.ts).
"""
import sys, re, json, os, datetime, collections
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'lib', 'data', 'title-race.json')
FIX = {'Gabe Tardio': 'Gabriel Tardio', 'Rachel Rohrabaher': 'Rachel Rohrabacher', 'Tyra Hurricane Black': 'Tyra Black'}
MIXED_ONLY = {'Eric Oncins': 'M', 'Jack Sock': 'M'}  # add a new mixed-only winner here
MON = {m: i for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'], 1)}
COLS = {'WS': 5, 'MS': 8, 'MX': 11, 'WD': 14, 'MD': 17}
FLOOR = {'Anna Leigh Waters': 196, 'Ben Johns': 186}


def pdate(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    if isinstance(v, str):
        m = re.match(r'([A-Za-z]+)[ ,]*(\d+)', v)
        y = re.search(r'(20\d\d)', v)
        if m and y:
            return datetime.date(int(y.group(1)), MON[m.group(1)[:3].lower()], int(m.group(2)))


def norm(s):
    return re.sub(r'[^a-z]', '', s.lower())


def main(xlsx):
    ws = openpyxl.load_workbook(xlsx, data_only=True)['PPA Tournaments (BIBLE)']
    ev = collections.OrderedDict()
    for r in ws.iter_rows(min_row=2, values_only=True):
        d = pdate(r[0])
        if not d or not r[1]:
            continue
        name = re.sub(r'\s*\(Included in PPA medal counts\)', '', str(r[1])).strip()
        for k, c in COLS.items():
            v = r[c]
            if not v or str(v).strip().lower() in ('n/a', 'na', 'none'):
                continue
            for p in str(v).split('/'):
                p = re.sub(r'\s+', ' ', p).strip()
                p = FIX.get(p, p)
                ev.setdefault((d.isoformat(), name), []).append([p, k])
    events = sorted(({'d': k[0], 'n': k[1], 'w': w} for k, w in ev.items()), key=lambda e: e['d'])
    count = collections.Counter(p for e in events for p, _ in e['w'])
    for who, n in FLOOR.items():
        if count[who] < n:
            sys.exit(f'{who} parsed to {count[who]}, expected {n}+. Check the sheet export.')

    gender = {}
    for e in events:
        for p, k in e['w']:
            if k in ('WS', 'WD'):
                gender[p] = 'W'
            if k in ('MS', 'MD'):
                gender[p] = 'M'
    for p in [p for p in count if p not in gender]:
        gender[p] = MIXED_ONLY.get(p) or sys.exit(f'no gender for {p}: add them to MIXED_ONLY')

    # Pages that exist: the published roster, plus curated athletes mapped to canonical.
    with open(os.path.join(ROOT, 'lib', 'data', 'published-athletes.json')) as f:
        pub = {norm(a['name']): a['slug'] for a in json.load(f)}
    with open(os.path.join(ROOT, 'lib', 'athletes.ts')) as f:
        curated = {norm(n): s for s, n in re.findall(r'slug:\s*"([a-z0-9-]+)",\s*\n\s*name:\s*"([^"]+)"', f.read())}
    with open(os.path.join(ROOT, 'lib', 'published-athletes.ts')) as f:
        block = f.read().split('CURATED_TO_CANONICAL')[1].split('};')[0]
    canon = dict(re.findall(r'"([a-z-]+)":\s*"([a-z-]+)"', block))
    pros = os.path.join(ROOT, 'public', 'ppa', 'pros')

    players = {}
    for p in sorted(count):
        k = norm(p)
        cs = curated.get(k)
        slug = pub.get(k) or (canon.get(cs, cs) if cs else None)
        head = f'/ppa/pros/{cs}.jpg' if cs and os.path.exists(os.path.join(pros, cs + '.jpg')) else None
        players[p] = {k2: v for k2, v in {'g': gender[p], 'slug': slug, 'head': head}.items() if v}

    last = events[-1]
    out = {
        'source': 'PPA Tour History sheet, PPA Tournaments (BIBLE) tab',
        'through': {'date': last['d'], 'event': last['n']},
        'events': events,
        'players': players,
    }
    with open(OUT, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    linked = sum(1 for v in players.values() if 'slug' in v)
    heads = sum(1 for v in players.values() if 'head' in v)
    print(f"{len(events)} events, {len(players)} players, ALW {count['Anna Leigh Waters']}, "
          f"Ben {count['Ben Johns']}, linked {linked}, local headshots {heads}")


if __name__ == '__main__':
    main(sys.argv[1])
