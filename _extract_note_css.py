#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
anyaku-production-inline.html の「記事ランキングTOP3」「ブログ記事」セクションで
使用されている Tailwind ユーティリティCSSを抽出し、
`.note-embed` ラッパー配下にスコープ化した CSS を生成する。

既存サイト(main.css / BEM)との競合を避けるため、
- すべてのルールを `.note-embed` 配下にプレフィックスする
- Tailwind の preflight(グローバルリセット)は取り込まず、最小限のリセットのみスコープ付与
"""
import re
import sys

SRC = "anyaku-production-inline.html"
OUT = "css/note-sections.css"

# 対象セクションを特定するためのマーカー(ファイル整形の有無に依存しない)
SEC_START_MARKER = 'aria-labelledby="blog-heading"'   # 記事ランキングTOP3
SEC_END_MARKER = '<section id="about"'                # ブログ記事の直後

# Tailwind が preflight で全要素に付与する内部変数のデフォルト値。
# transform / gradient / shadow ユーティリティの動作に必須。
TW_VARS = [
    "--tw-translate-x: 0;",
    "--tw-translate-y: 0;",
    "--tw-rotate: 0;",
    "--tw-skew-x: 0;",
    "--tw-skew-y: 0;",
    "--tw-scale-x: 1;",
    "--tw-scale-y: 1;",
    "--tw-gradient-from-position: ;",
    "--tw-gradient-via-position: ;",
    "--tw-gradient-to-position: ;",
    "--tw-ring-offset-shadow: 0 0 #0000;",
    "--tw-ring-shadow: 0 0 #0000;",
    "--tw-shadow: 0 0 #0000;",
    "--tw-shadow-colored: 0 0 #0000;",
]


def read_text():
    with open(SRC, encoding="utf-8") as f:
        return f.read()


def get_section_html(text):
    """2セクション(記事ランキングTOP3 / ブログ記事)のHTMLを抜き出す。
    ファイルがミニファイ済み/整形済みのどちらでも動作する。
    """
    a = text.find(SEC_START_MARKER)
    if a == -1:
        raise RuntimeError("記事ランキングセクションが見つかりません")
    # 直前の <section まで戻る
    start = text.rfind("<section", 0, a)
    end = text.find(SEC_END_MARKER, a)
    if start == -1 or end == -1:
        raise RuntimeError("セクション範囲の特定に失敗しました")
    return text[start:end]


def get_used_classes(text):
    section = get_section_html(text)
    classes = set()
    for m in re.finditer(r'class="([^"]*)"', section):
        for c in m.group(1).split():
            if c:
                classes.add(c)
    return classes


def get_css_text(text):
    """全 <style> ブロックの中身を連結して返す(ミニファイ対応)。"""
    parts = re.findall(r"<style[^>]*>(.*?)</style>", text, flags=re.S)
    return "\n".join(parts)


def unescape_selector_class(tok):
    """CSS エスケープを除去して HTML class トークンへ戻す。
    - unicode エスケープ (\\2c など、1-6桁hex + 任意の空白1文字) に対応
    - 通常のエスケープ (\\. など) に対応
    """
    def repl(m):
        if m.group(1) is not None:
            return chr(int(m.group(1), 16))
        return m.group(2)
    return re.sub(r"\\([0-9a-fA-F]{1,6})[ \t]?|\\(.)", repl, tok)


def selector_classes(selector):
    """セレクタ内の class トークン(HTML表記)を返す。"""
    result = []
    # .foo\:bar-\[..\]:hover や unicode エスケープ \2c を含む class を抽出
    char = r"(?:\\[0-9a-fA-F]{1,6}[ \t]?|\\.|[^\s.,:>+~()\[\]{}])"
    for m in re.finditer(r"\.(" + char + r"+)", selector):
        result.append(unescape_selector_class(m.group(1)))
    return result


def parse_rules(css):
    """
    トップレベルおよび @media 内のルールをパースして
    [(media_or_None, selector, body), ...] を返す。
    @font-face / @keyframes / :root などは別途処理。
    """
    rules = []
    i = 0
    n = len(css)
    while i < n:
        # 空白スキップ
        while i < n and css[i] in " \t\r\n":
            i += 1
        if i >= n:
            break
        if css[i] == "@":
            # at-rule
            j = css.find("{", i)
            if j == -1:
                break
            at_head = css[i:j].strip()
            # ブロックの終端を対応括弧で探す
            depth = 0
            k = j
            while k < n:
                if css[k] == "{":
                    depth += 1
                elif css[k] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            block_body = css[j + 1:k]
            if at_head.startswith("@media"):
                # メディア内のルールを再帰パース
                for (_, sel, body) in parse_rules(block_body):
                    rules.append((at_head, sel, body))
            # @font-face / @keyframes は無視
            i = k + 1
        else:
            j = css.find("{", i)
            if j == -1:
                break
            selector = css[i:j].strip()
            k = css.find("}", j)
            if k == -1:
                break
            body = css[j + 1:k].strip()
            rules.append((None, selector, body))
            i = k + 1
    return rules


def scope_selector(selector):
    """カンマ区切りセレクタそれぞれに `.note-embed ` を付与。"""
    parts = [p.strip() for p in selector.split(",")]
    return ", ".join(".note-embed " + p for p in parts)


def media_sort_key(at_head):
    """メディアクエリを Tailwind と同じ mobile-first 順(min-width 昇順)に並べる。
    min-width を持たないもの(prefers-reduced-motion 等)は最後に回す。
    """
    m = re.search(r"min-width\s*:\s*(\d+)", at_head)
    if m:
        return (0, int(m.group(1)), at_head)
    return (1, 0, at_head)


def main():
    text = read_text()
    used = get_used_classes(text)
    css = get_css_text(text)
    rules = parse_rules(css)

    kept = []  # (media, scoped_selector, body)
    for media, selector, body in rules:
        cls = selector_classes(selector)
        if not cls:
            continue
        if any(c in used for c in cls):
            kept.append((media, scope_selector(selector), body))

    # メディアごとに分類
    base = [(s, b) for (m, s, b) in kept if m is None]
    media_map = {}
    for (m, s, b) in kept:
        if m is not None:
            media_map.setdefault(m, []).append((s, b))

    out = []
    out.append("/* ============================================================")
    out.append(" * note-sections.css")
    out.append(" * 「記事ランキングTOP3」「ブログ記事」セクション専用スタイル")
    out.append(" *")
    out.append(" * 出典: anyaku-production-inline.html (Next.js + Tailwind CSS v3.4)")
    out.append(" * 生成: _extract_note_css.py により自動抽出")
    out.append(" *")
    out.append(" * 【重要】既存サイト(main.css/BEM設計)との競合防止のため、")
    out.append(" *  全ルールを `.note-embed` ラッパー配下にスコープ化しています。")
    out.append(" *  → HTML側は <div class=\"note-embed\"> でセクションを包んでいます。")
    out.append(" *")
    out.append(" * 【.aspへの流し込み時の注意】")
    out.append(" *  - この1ファイルを読み込むだけでOK(他CSSへの依存なし)")
    out.append(" *  - Tailwindのグローバルreset(preflight)は含めず、")
    out.append(" *    最小限のresetのみ .note-embed 配下に限定して適用")
    out.append(" * ============================================================ */")
    out.append("")
    out.append("/* --- ブランドカラー変数(Tailwind theme由来) --- */")
    out.append(".note-embed {")
    out.append("  --brand-red: #e60012;")
    out.append("  --brand-gold: #b5941c;")
    out.append("  --brand-ink: #323743;")
    out.append("  --brand-muted: #666666;")
    out.append("  --brand-panel: #f0f0f0;")
    out.append("  --brand-cream: #fbf5e8;")
    out.append("  color: var(--brand-ink);")
    out.append('  font-family: "Noto Sans JP", system-ui, sans-serif;')
    out.append("}")
    out.append("")
    out.append("/* --- 最小限のreset(このブロック内のみ) --- */")
    out.append(".note-embed *,")
    out.append(".note-embed *::before,")
    out.append(".note-embed *::after { box-sizing: border-box; }")
    out.append(".note-embed a { color: inherit; text-decoration: none; }")
    out.append(".note-embed img { max-width: 100%; }")
    out.append("")
    out.append("/* --- Tailwind 内部変数の初期化 --- */")
    out.append("/*   transform(translateによる中央寄せ) / gradient / shadow の")
    out.append(" *   ユーティリティが依存する --tw-* 変数を初期化。")
    out.append(" *   (本来 Tailwind の preflight が付与するものをスコープ限定で再現) */")
    out.append(".note-embed *,")
    out.append(".note-embed ::before,")
    out.append(".note-embed ::after {")
    for line in TW_VARS:
        out.append("  " + line)
    out.append("}")
    out.append("")
    out.append("/* --- Tailwind ユーティリティ(使用分のみ抽出・スコープ化) --- */")
    for s, b in base:
        out.append("%s { %s }" % (s, b))

    for media in sorted(media_map.keys(), key=media_sort_key):
        out.append("")
        out.append("%s {" % media)
        for s, b in media_map[media]:
            out.append("  %s { %s }" % (s, b))
        out.append("}")

    out.append("")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(out))

    print("used classes: %d" % len(used))
    print("kept base rules: %d" % len(base))
    print("kept media rules: %d" % sum(len(v) for v in media_map.values()))
    # 未マッチのクラス(CSSが見つからなかったもの)を報告
    matched = set()
    for _, s, _b in kept:
        for c in selector_classes(s):
            matched.add(c)
    missing = sorted(used - matched)
    print("classes without matched CSS (%d):" % len(missing))
    for c in missing:
        print("  -", c)


if __name__ == "__main__":
    main()
