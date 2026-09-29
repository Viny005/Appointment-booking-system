#!/usr/bin/env python3
"""Check this repository's Markdown links, stable IDs and document structure.

Only the Python standard library is needed. --external enables network checks.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ID = r'(?:NFR-[A-Z0-9]+-\d{2}|ADR-\d{3}|(?:G|NG|SC|CON|UC|AF|QG|QS|R)-\d{2})'


def plain(text):
    return re.sub(r'`[^`]*`', lambda m: m[0][1:-1], text)


def outside_fences(text):
    return re.sub(r'^(`{3,}|~{3,})[^\n]*\n.*?^\1\s*$', '', text, flags=re.M | re.S)


def anchors(text):
    result = re.findall(r'<a\s+(?:id|name)="([^"]+)"', text)
    counts = Counter()
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', text, re.M):
        slug = re.sub(r'[^\w\- ]', '', plain(heading).lower()).replace(' ', '-')
        suffix = '' if counts[slug] == 0 else '-' + str(counts[slug])
        result.append(slug + suffix)
        counts[slug] += 1
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--external', action='store_true')
    args = parser.parse_args()
    files = sorted(p for p in ROOT.rglob('*.md') if '.git' not in p.parts)
    texts = {p: outside_fences(p.read_text(encoding='utf-8-sig')) for p in files}
    errors, definitions, all_ids, external = [], {}, set(), set()
    reference_files = {}
    count = 0
    for p, text in texts.items():
        label = p.relative_to(ROOT).as_posix()
        ans = anchors(text)
        for a, n in Counter(ans).items():
            if n > 1:
                errors.append(f'{label}: duplicate anchor {a}')
        all_ids.update(re.findall(r'\b' + ID + r'\b', text))
        for ident in re.findall(r'\[(' + ID + r')\]\(', text):
            reference_files.setdefault(ident, set()).add(p)
        for a in re.findall(r'<a id="([^"]+)"', text):
            ident = a.upper()
            if re.fullmatch(ID, ident):
                if ident in definitions:
                    errors.append(f'{label}: duplicate definition {ident}')
                definitions[ident] = p

        refs = dict((k.lower(), v) for k, v in re.findall(
            r'^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?', text, re.M))
        links = re.findall(r'!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)', text)
        for name, ref in re.findall(r'!?\[([^\]\n]+)\]\[([^\]\n]*)\]', text):
            key = (ref or name).lower()
            if key not in refs:
                errors.append(f'{label}: undefined reference [{key}]')
            else:
                links.append(refs[key])
        links.extend(re.findall(r'<(https?://[^>]+)>', text))
        # Validate reference definitions even when unused, and HTML link/image targets.
        links.extend(refs.values())
        links.extend(re.findall(r'(?:href|src)=[\'"]([^\'"]+)[\'"]', text))
        for target in links:
            count += 1
            target = target.strip('<>')
            u = urlsplit(target)
            if u.scheme in ('http', 'https'):
                external.add(target)
                continue
            if u.scheme:
                if u.scheme != 'mailto':
                    errors.append(f'{label}: unsupported URI {target}')
                continue
            path = (p.parent / unquote(u.path)).resolve() if u.path else p
            if not path.is_relative_to(ROOT):
                errors.append(f'{label}: link leaves repository: {target}')
            elif not path.exists():
                errors.append(f'{label}: missing target {target}')
            elif u.fragment:
                if path.is_dir():
                    path /= 'README.md'
                if path not in texts or unquote(u.fragment) not in anchors(texts[path]):
                    errors.append(f'{label}: missing anchor {target}')

    for ident in sorted(all_ids - definitions.keys()):
        errors.append(f'Undefined ID: {ident}')
    matrix = texts.get(ROOT / 'docs/TRACEABILITY.md', '')
    registry = texts.get(ROOT / 'docs/ID-REGISTRY.md', '')
    matrix_ids = set(re.findall(r'\[(' + ID + r')\]\(', matrix))
    registry_ids = set(re.findall(r'\[(' + ID + r')\]\(', registry))
    required = set(definitions)
    for ident in sorted(required - matrix_ids):
        errors.append(f'Missing traceability: {ident}')
    for ident in sorted(definitions.keys() - registry_ids):
        errors.append(f'Missing registry entry: {ident}')
    for ident, source in definitions.items():
        substantive = reference_files.get(ident, set()) - {source, ROOT / 'docs/ID-REGISTRY.md'}
        if not substantive:
            errors.append(f'Orphan definition: {ident}')
    # A name in the matrix alone is insufficient: each UC/AF/NFR needs both
    # an architecture link and a quality scenario in the same mapping row.
    matrix_rows = [line for line in matrix.splitlines() if line.startswith('|')]
    for ident in sorted(i for i in required if i.startswith(('UC-', 'AF-', 'NFR-'))):
        rows = [line for line in matrix_rows if f'[{ident}](' in line]
        if not any(re.search(r'\]\(arch/A\d{2}[^)]*\)', row) and re.search(r'\[QS-\d{2}\]\(', row) for row in rows):
            errors.append(f'Incomplete requirement/architecture/scenario chain: {ident}')
    for ident in sorted(i for i in required if i.startswith('QS-')):
        rows = [line for line in matrix_rows if f'[{ident}](' in line]
        if not any(re.search(r'\[(?:UC-\d{2}|AF-\d{2}|NFR-[A-Z0-9]+-\d{2})\]\(', row) for row in rows):
            errors.append(f'Quality scenario has no requirement: {ident}')
    for n in range(1, 13):
        if len(list((ROOT / 'docs/arch').glob(f'A{n:02}-*.md'))) != 1:
            errors.append(f'Missing or duplicate arc42 chapter A{n:02}')
    for code in ['P1', 'P2', 'F1', 'F2', 'F3', 'D1', 'D2', 'B1', 'B2', 'S1', 'S3', 'N1', 'N2', 'E2']:
        if not list((ROOT / 'docs/spec').glob(f'{code}-*.md')):
            errors.append(f'Missing Siedersleben block {code}')
    adr_ids = sorted(i for i in definitions if i.startswith('ADR-'))
    for ident in adr_ids:
        n = int(ident[-3:])
        matches = list((ROOT / 'adr').glob(f'{n:03}-*.md'))
        if len(matches) != 1:
            errors.append(f'Missing or duplicate ADR {n:03}')
            continue
        text = texts[matches[0]]
        status = re.search(r'^\*\*Status:\*\* (.+?)\\?$', text, re.M)
        if not status or status[1].strip() not in ('Proposed', 'Accepted', 'Superseded', 'Rejected'):
            errors.append(f'ADR {n:03}: ambiguous or missing status')
        for section in ['Kontext', 'Entscheidung', 'Betrachtete Alternativen', 'Konsequenzen']:
            m = re.search(r'^## ' + section + r'\s*\n(.*?)(?=^## |\Z)', text, re.M | re.S)
            if not m or len(m[1].strip()) < 20:
                errors.append(f'ADR {n:03}: empty section {section}')

    for path in (ROOT / 'adr').glob('[0-9][0-9][0-9]-*.md'):
        if 'ADR-' + path.name[:3] not in definitions:
            errors.append(f'{path.name}: missing canonical ADR definition')

    # Structural gates; semantic review and future application tests remain manual.
    for name in ['LEGAL-COMPLIANCE-DE.md', 'READY-FOR-IMPLEMENTATION.md', 'OPEN-QUESTIONS.md']:
        if ROOT / 'docs' / name not in texts:
            errors.append(f'Missing baseline document: {name}')

    if args.external:
        def check(url):
            try:
                with urlopen(Request(url, headers={'User-Agent': 'Appointment-Docs-Checker/1.0'}), timeout=25) as response:
                    return url, response.status, None
            except Exception as exc:
                return url, None, str(exc)
        with ThreadPoolExecutor(max_workers=5) as pool:
            for url, status, error in pool.map(check, sorted(external)):
                if error:
                    errors.append(f'External link {url}: {error}')
                else:
                    print(f'HTTP {status}: {url}')
    for error in errors:
        print('ERROR:', error)
    print(f'{len(files)} Markdown files; {count} links; {len(definitions)} canonical IDs; '
          f'{len(external)} external URLs; {len(errors)} errors.')
    if not args.external:
        print('External URLs inventoried; use --external to check reachability.')
    return bool(errors)


if __name__ == '__main__':
    sys.exit(main())
