#!/usr/bin/env python3
"""Builds assets/search-index.js for the site-wide search (the "/" palette).

Run from the repository root after adding or editing a guide or a software entry:

    python3 tools/build-search-index.py

Guides and categories are read from astuces.html, software from logiciels.js.
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


hub = (ROOT / "astuces.html").read_text(encoding="utf-8")

guides = []
for m in re.finditer(r'<a class="guide-card"([^>]*)>(.*?)</a>', hub, re.S):
    attrs, body = m.group(1), m.group(2)
    href = re.search(r'href="([^"]+)"', attrs).group(1)
    kw = re.search(r'data-search="([^"]*)"', attrs)
    tag = re.search(r'<span class="tag">(.*?)</span>', body, re.S)
    title = re.search(r"<h[23]>(.*?)</h[23]>", body, re.S)
    desc = re.search(r"<p>(.*?)</p>", body, re.S)
    time = re.search(r'<div class="guide-meta"><span>(.*?)</span>', body, re.S)
    guides.append({
        "t": text(title.group(1)),
        "d": text(desc.group(1)) if desc else "",
        "s": f"{text(tag.group(1))}, {text(time.group(1))}" if tag and time else "",
        "k": (text(tag.group(1)) if tag else "") + " " + (html.unescape(kw.group(1)) if kw else ""),
        "c": text(tag.group(1)) if tag else "",
        "u": href,
    })

cats = []
for m in re.finditer(r'<a class="cat-card" href="([^"]+)">(.*?)</a>', hub, re.S):
    href, body = m.group(1), m.group(2)
    name = re.search(r"<h[23]>(.*?)</h[23]>", body, re.S)
    desc = re.search(r"<p>(.*?)</p>", body, re.S)
    n = sum(1 for g in guides if g["c"] == text(name.group(1)))
    cats.append({"t": text(name.group(1)), "d": text(desc.group(1)), "s": f"Dossier, {n} guides", "u": href})

src = (ROOT / "logiciels.js").read_text(encoding="utf-8")
software = json.loads(src[src.index("["): src.rindex("]") + 1])
apps = [{
    "t": s["name"],
    "d": s["desc"],
    "s": f'{s["cat"]}, {s["version"]}',
    "k": " ".join(s.get("tags", [])) + " " + s["cat"],
    "u": f'logiciel.html?id={s["id"]}',
    "i": s.get("logo", ""),
} for s in software]

pages = [
    {"t": "Toutes les astuces", "d": "Les guides et les dossiers", "s": "Page", "u": "astuces.html"},
    {"t": "Catalogue des logiciels", "d": "Logiciels gratuits, liens officiels", "s": "Page", "u": "outils.html"},
    {"t": "À propos", "d": "La méthode, les sources et les règles éditoriales", "s": "Page", "u": "apropos.html"},
    {"t": "Conditions d’utilisation", "d": "Informations légales", "s": "Page", "u": "conditions.html"},
    {"t": "Confidentialité", "d": "Données personnelles et services externes", "s": "Page", "u": "confidentialite.html"},
]

data = {"guides": guides, "cats": cats, "apps": apps, "pages": pages}
out = "/* Généré par tools/build-search-index.py, ne pas modifier à la main. */\nwindow.UH_INDEX=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "assets" / "search-index.js").write_text(out, encoding="utf-8")
print(f"{len(guides)} guides, {len(cats)} dossiers, {len(apps)} logiciels")
