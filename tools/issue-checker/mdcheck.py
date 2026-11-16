import sys, re
from markdown_it import MarkdownIt
md = MarkdownIt('commonmark', {'html': False})
for p in sys.argv[1:]:
    src = open(p, encoding='utf-8').read()
    L = [l for l in src.split('\n') if l.strip()]
    toks = md.parse(src)
    html = md.render(src)
    nonascii = [(i+1, l) for i, l in enumerate(src.split('\n')) if re.search(r'[^\x00-\x7F]', l)]
    setext = [t.markup for t in toks if t.type == 'heading_open' and t.markup in ('=', '-')]
    trailing = [i+1 for i, l in enumerate(src.split('\n')) if l.endswith('  ')]
    raw = [t.content[:40] for t in toks if t.type in ('html_block',)] + re.findall(r'&lt;[!a-zA-Z/][^&]{0,30}', re.sub(r'<pre>.*?</pre>', '', html, flags=re.S))
    print(p)
    print('  A7 closes with copyright then ID as last line:', L[-1] == L[0] and L[-2] == L[1] and L[1].startswith('NOT COPYRIGHTED '))
    print('  ends with newline, ID is last line:', src.endswith(L[-1] + '\n'))
    print('  H1 raw HTML/comment leaks:', raw or 'none')
    print('  H2 non-ASCII lines:', nonascii or 'none')
    print('  H3 setext headings:', setext or 'none', '| trailing-space breaks:', trailing or 'none')
    print('  fenced code blocks:', sum(t.type == 'fence' for t in toks), '| headings:', sum(t.type == 'heading_open' for t in toks), '| rules:', sum(t.type == 'hr' for t in toks), '| images:', html.count('<img'))
    open(p.replace('/', '_') + '.html', 'w').write('<!doctype html><meta charset="utf-8"><body style="max-width:780px;margin:24px auto;font-family:sans-serif">' + html)
