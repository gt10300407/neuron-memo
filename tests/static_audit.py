#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "index.html"
VERSION_HTML_PATH = ROOT / "v090.html"
JS_PATH = ROOT / "app.js"
CSS_PATH = ROOT / "app.css"
MANIFEST_PATH = ROOT / "manifest.webmanifest"
SW_PATH = ROOT / "sw.js"

html = HTML_PATH.read_text(encoding="utf-8")
version_html = VERSION_HTML_PATH.read_text(encoding="utf-8")
js = JS_PATH.read_text(encoding="utf-8")
css = CSS_PATH.read_text(encoding="utf-8")
sw = SW_PATH.read_text(encoding="utf-8")
manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


class AuditParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.scripts: list[dict[str, str]] = []
        self.inline_script_chunks: list[str] = []
        self._inside_script = False
        self.event_attributes: list[tuple[str, str]] = []
        self.inputs: dict[str, dict[str, str]] = {}
        self.tags: Counter[str] = Counter()

    def handle_starttag(self, tag: str, attrs) -> None:
        values = {key: (value or "") for key, value in attrs}
        self.tags[tag] += 1
        if "id" in values:
            self.ids.append(values["id"])
        for key in values:
            if key.lower().startswith("on"):
                self.event_attributes.append((tag, key))
        if tag == "script":
            self.scripts.append(values)
            self._inside_script = True
        if tag == "input" and values.get("id"):
            self.inputs[values["id"]] = values

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self._inside_script = False

    def handle_data(self, data: str) -> None:
        if self._inside_script and data.strip():
            self.inline_script_chunks.append(data)


parser = AuditParser()
parser.feed(html)

assert '<html lang="ko">' in html
assert '<meta name="viewport"' in html
assert '<title>수령길-컴맹 v0.9.0</title>' in html
assert html == version_html, "index.html과 v090.html이 서로 다릅니다."
assert not parser.event_attributes, f"인라인 이벤트 속성 발견: {parser.event_attributes}"
duplicates = [item for item, count in Counter(parser.ids).items() if count > 1]
assert not duplicates, f"중복 ID 발견: {duplicates}"
assert parser.tags["object"] == 0
assert parser.tags["iframe"] == 0
assert parser.tags["script"] == 1
assert parser.scripts[0].get("src") == "app.js"
assert not parser.inline_script_chunks, "인라인 JavaScript가 포함되어 있습니다."

search = parser.inputs.get("searchInput")
assert search, "searchInput이 없습니다."
assert search.get("placeholder") == '검색어 또는 "정확한 문장"'
assert "정확한" not in search, "placeholder 따옴표가 잘못 파싱되었습니다."

assert "Content-Security-Policy" in html
assert "default-src 'self'" in html
assert "script-src 'self'" in html
assert "connect-src 'none'" in html
assert "object-src 'none'" in html
assert "base-uri 'none'" in html
assert "frame-ancestors 'none'" in html
assert "unsafe-eval" not in html
assert "api.github.com" not in (html + js)
assert "github_pat_" not in (html + js)
assert "SYNC_KEY" not in js
assert "scheduleSync" not in js
assert "syncNow" not in js
assert "exactTopics" not in js
assert "eval(" not in js
assert "new Function" not in js

assert "MAX_IMPORT_BYTES=20*1024*1024" in js
assert "MAX_NOTES=100000" in js
assert "function normalizeImportedData" in js
assert "function sanitizeHtml" in js
assert "indexedDB.open" in js
assert "navigator.storage" in js

assert "listLimit=160" in js
assert 'value="120"' in html
assert "noteTextCache" in js
assert "tokenCache" in js
assert "function buildGraphIndex" in js
assert "inverted=new Map()" in js

assert '["http:","https:","mailto:"]' in js
assert "noopener noreferrer" in js

assert manifest["display"] == "standalone"
assert manifest["start_url"] == "./index.html"
assert len(manifest.get("icons", [])) >= 2
for icon in manifest["icons"]:
    assert (ROOT / icon["src"]).is_file(), f"아이콘 없음: {icon['src']}"
for required in ("./index.html", "./v090.html", "./app.css", "./app.js", "./manifest.webmanifest"):
    assert required in sw, f"서비스워커 캐시 대상 누락: {required}"

for relative in ("app.css", "app.js", "manifest.webmanifest", "sw.js", "icons/icon-192.png", "icons/icon-512.png"):
    assert (ROOT / relative).is_file(), f"파일 누락: {relative}"

referenced = set(re.findall(r'\$\(["\']#([A-Za-z][\w:-]*)["\']\)', js))
dynamic_ids = {"edgeClear", "graphManageLinks", "graphOpenNote"}
missing_ids = sorted(referenced - set(parser.ids) - dynamic_ids)
assert not missing_ids, f"HTML에 없는 ID 참조: {missing_ids}"

old_pages = [path.name for path in ROOT.glob("v*.html") if path.name != "v090.html"]
assert not old_pages, f"구형 버전 페이지가 남아 있습니다: {old_pages}"

assert JS_PATH.stat().st_size < 350_000
assert CSS_PATH.stat().st_size < 200_000

print(
    "static audit PASS | "
    f"ids={len(parser.ids)} js={JS_PATH.stat().st_size}B css={CSS_PATH.stat().st_size}B"
)
