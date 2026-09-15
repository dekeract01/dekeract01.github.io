#!/usr/bin/env python3
"""Build the site's HTML pages from content/ + templates/base.html.

No dependencies beyond the Python standard library. Run it after editing
anything under content/, then commit and push as usual:

    python3 build.py

See content/blog/_template.html and content/projects/_template.html for
how to add a new post or project. See content/pages/*.html to edit the
About, Contact, Research, Blog intro, or Projects intro copy.
"""

from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
BASE_TEMPLATE = (ROOT / "templates" / "base.html").read_text()

NAV_ITEMS = [
    ("About", "/about/"),
    ("Research", "/research/"),
    ("Blog", "/blog/"),
    ("Projects", "/projects/"),
    ("Contact", "/contact/"),
]


def render_nav(active):
    items = []
    for label, href in NAV_ITEMS:
        current = ' aria-current="page"' if label == active else ""
        items.append(f'<li><a href="{href}"{current}>{label}</a></li>')
    return "".join(items)


def render_page(title, content_html, active_nav):
    return (
        BASE_TEMPLATE
        .replace("{{TITLE}}", title)
        .replace("{{NAV}}", render_nav(active_nav))
        .replace("{{CONTENT}}", content_html)
    )


def parse_content(path):
    """Split a content file into its front-matter dict and HTML body."""
    text = path.read_text()
    assert text.startswith("---\n"), f"{path} must start with a '---' front-matter block"
    end = text.index("\n---\n", 4)
    header_text = text[4:end]
    body = text[end + 5:].strip()
    meta = {}
    for line in header_text.splitlines():
        if not line.strip():
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    return meta, body


def fmt_date(iso_date):
    return datetime.strptime(iso_date, "%Y-%m-%d").strftime("%-d %B %Y")


def write(path, html):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html)
    print(f"wrote {path.relative_to(ROOT)}")


def build_simple_page(name, active_nav, out_path):
    meta, body = parse_content(CONTENT / "pages" / f"{name}.html")
    content = f'<main class="wrap"><article class="card"><h1>{meta["title"]}</h1>{body}</article></main>'
    write(out_path, render_page(meta["title"], content, active_nav))


def load_entries(kind):
    """Load and sort (newest first) all posts/projects of a given kind."""
    entries = []
    for path in sorted((CONTENT / kind).glob("*.html")):
        if path.name.startswith("_"):
            continue
        meta, body = parse_content(path)
        meta["slug"] = path.stem
        meta["body"] = body
        entries.append(meta)
    entries.sort(key=lambda m: m["first_published"], reverse=True)
    return entries


def render_meta_block(meta):
    rows = [
        f'<div><dt>First published</dt><dd><time datetime="{meta["first_published"]}">{fmt_date(meta["first_published"])}</time></dd></div>',
        f'<div><dt>Last updated</dt><dd><time datetime="{meta["last_updated"]}">{fmt_date(meta["last_updated"])}</time></dd></div>',
    ]
    if meta.get("repo_url"):
        rows.append(
            f'<div><dt>Repository</dt><dd><a href="{meta["repo_url"]}">{meta.get("repo_label", meta["repo_url"])}</a></dd></div>'
        )
    return f'<section class="post-meta" aria-label="Post details"><dl>{"".join(rows)}</dl></section>'


def build_entry_page(kind, meta, active_nav, out_path):
    content = (
        '<main class="wrap"><article class="card post">'
        f'<h1>{meta["title"]}</h1>'
        f'{render_meta_block(meta)}'
        f'{meta["body"]}'
        '</article></main>'
    )
    write(out_path, render_page(meta["title"], content, active_nav))


def build_listing_page(kind, active_nav, out_path, card_extra=None):
    page_meta, intro_body = parse_content(CONTENT / "pages" / f"{kind}.html")
    entries = load_entries(kind)
    list_class = "post-list" if kind == "blog" else "project-list"
    cards = []
    for meta in entries:
        extra = card_extra(meta) if card_extra else ""
        cards.append(
            '<article class="card post-preview">'
            f'{extra}'
            f'<h2><a href="/{kind}/{meta["slug"]}.html">{meta["title"]}</a></h2>'
            f'<p><time datetime="{meta["first_published"]}">First published {fmt_date(meta["first_published"])}</time>'
            f' · <time datetime="{meta["last_updated"]}">Last updated {fmt_date(meta["last_updated"])}</time></p>'
            f'<p>{meta["summary"]}</p>'
            '</article>'
        )
    content = (
        '<main class="wrap">'
        f'<article class="card"><h1>{page_meta["title"]}</h1>{intro_body}</article>'
        f'<section class="{list_class}" aria-label="{page_meta["title"]}">{"".join(cards)}</section>'
        '</main>'
    )
    write(out_path, render_page(page_meta["title"], content, active_nav))

    for meta in entries:
        build_entry_page(kind, meta, active_nav, ROOT / kind / f'{meta["slug"]}.html')


def main():
    build_simple_page("about", "About", ROOT / "about" / "index.html")
    build_simple_page("contact", "Contact", ROOT / "contact" / "index.html")
    build_simple_page("research", "Research", ROOT / "research" / "index.html")

    build_listing_page("blog", "Blog", ROOT / "blog" / "index.html")
    build_listing_page(
        "projects",
        "Projects",
        ROOT / "projects" / "index.html",
        card_extra=lambda meta: f'<p class="project-card-year">{meta["first_published"][:4]}</p>',
    )


if __name__ == "__main__":
    main()
