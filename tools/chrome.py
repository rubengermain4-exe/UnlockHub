#!/usr/bin/env python3
"""Shared navigation and footer for every UnlockHub page.

The site stays static: each page carries its own copy of the nav and footer
between <!-- nav --> ... <!-- /nav --> and <!-- footer --> ... <!-- /footer -->.
Edit the templates below, then run from the repository root:

    python3 tools/chrome.py

Every page is refreshed in place. Nothing else in the pages is touched.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

CATEGORIES = [
    ("securite", "Sécurité"),
    ("pc", "PC & Windows"),
    ("internet", "Internet"),
    ("logiciels", "Logiciels"),
    ("etudiant", "Étudiant"),
    ("mobile", "Mobile"),
    ("creation", "Création"),
]

FEATURED_SOFTWARE = [
    ("blender", "Blender"),
    ("davinci-resolve", "DaVinci Resolve"),
    ("obs-studio", "OBS Studio"),
    ("gimp", "GIMP"),
    ("bitwarden", "Bitwarden"),
]

LOCK = (
    '<svg class="lock-mark" viewBox="0 0 18 22" aria-hidden="true">'
    '<path class="lock-shackle" d="M4.6 10.2V6.6a4.4 4.4 0 0 1 8.8 0v3.6" fill="none" '
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'
    '<rect x="1" y="9" width="16" height="12.6" rx="3.4" fill="currentColor"/>'
    '<path class="lock-hole" d="M9 12.6a1.7 1.7 0 0 1 .9 3.15l.45 2.35h-2.7l.45-2.35A1.7 1.7 0 0 1 9 12.6Z"/>'
    "</svg>"
)


def nav(r: str, section: str) -> str:
    def link(href, key, label):
        cur = ' aria-current="page"' if key == section else ""
        return f'<a href="{r}{href}" data-section="{key}"{cur}>{label}</a>'

    return (
        "<!-- nav -->\n"
        '<a class="skip" href="#contenu">Aller au contenu</a>\n'
        '<header class="site-nav" data-nav>\n'
        '<div class="site-nav-inner">\n'
        f'<a class="wordmark" href="{r}index.html" aria-label="UnlockHub, accueil">{LOCK}<span>Unlock<b>Hub</b></span></a>\n'
        '<nav class="nav-links" aria-label="Menu principal">'
        + link("astuces.html", "astuces", "Astuces")
        + link("outils.html", "outils", "Logiciels")
        + link("apropos.html", "apropos", "À propos")
        + "</nav>\n"
        f'<a class="nav-search" href="{r}astuces.html" data-palette aria-label="Rechercher un guide ou un logiciel"><span>Rechercher</span><kbd>/</kbd></a>\n'
        '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-sheet" aria-label="Menu"><span></span><span></span></button>\n'
        "</div>\n"
        "</header>\n"
        '<div class="nav-sheet" id="nav-sheet">'
        f'<a href="{r}index.html">Accueil</a><a href="{r}astuces.html">Astuces</a>'
        f'<a href="{r}outils.html">Logiciels</a><a href="{r}apropos.html">À propos</a>'
        '<p class="nav-sheet-foot">Accès libre, sans compte ni inscription.</p></div>\n'
        "<!-- /nav -->"
    )


def footer(r: str) -> str:
    cats = "".join(f'<li><a href="{r}astuces/{slug}.html">{label}</a></li>' for slug, label in CATEGORIES)
    soft = f'<li><a href="{r}outils.html">Tout le catalogue</a></li>' + "".join(
        f'<li><a href="{r}logiciel.html?id={sid}">{label}</a></li>' for sid, label in FEATURED_SOFTWARE
    )
    return (
        "<!-- footer -->\n"
        '<footer class="site-footer">\n<div class="wrap-wide">\n<div class="footer-top">\n'
        '<div class="footer-brand">'
        f'<a class="wordmark" href="{r}index.html">{LOCK}<span>Unlock<b>Hub</b></span></a>'
        "<p>Le numérique, sans se ruiner. Des guides concrets et des logiciels gratuits, en accès libre.</p>"
        f'<div class="footer-rat"><img src="{r}assets/rat.png" alt="" width="56" height="56" loading="lazy" decoding="async">'
        "<span>Toutes les astuces pour être un vrai rat du web.</span></div>"
        "</div>\n"
        f'<div class="footer-col"><h2>Astuces</h2><ul>{cats}</ul></div>\n'
        f'<div class="footer-col"><h2>Logiciels</h2><ul>{soft}</ul></div>\n'
        '<div class="footer-col"><h2>Le projet</h2><ul>'
        f'<li><a href="{r}apropos.html">À propos</a></li>'
        f'<li><a href="{r}conditions.html">Conditions d’utilisation</a></li>'
        f'<li><a href="{r}confidentialite.html">Confidentialité</a></li>'
        '<li><a href="https://github.com/rubengermain4-exe/UnlockHub" rel="noopener">Code source</a></li>'
        "</ul></div>\n"
        "</div>\n"
        '<div class="footer-bottom"><span>© 2026 UnlockHub. Accès libre, sans compte ni inscription.</span>'
        "<span>Explore, apprends, économise, grandis.</span></div>\n"
        "</div>\n</footer>\n"
        "<!-- /footer -->"
    )


def section_for(rel: str) -> str:
    if rel.startswith("astuces"):
        return "astuces"
    if rel in ("outils.html", "logiciel.html"):
        return "outils"
    if rel == "apropos.html":
        return "apropos"
    return ""


def refresh(path: pathlib.Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    r = "../" * rel.count("/")
    html = path.read_text(encoding="utf-8")
    new = re.sub(r"<!-- nav -->.*?<!-- /nav -->", lambda m: nav(r, section_for(rel)), html, flags=re.S)
    new = re.sub(r"<!-- footer -->.*?<!-- /footer -->", lambda m: footer(r), new, flags=re.S)
    if new != html:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def pages():
    return sorted(list(ROOT.glob("*.html")) + list(ROOT.glob("astuces/*.html")))


if __name__ == "__main__":
    changed = [p.relative_to(ROOT).as_posix() for p in pages() if refresh(p)]
    print(f"{len(changed)} page(s) mises à jour")
