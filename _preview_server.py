"""
プレビュー用ローカルサーバー
/recommend/futari-tsumugi/ へのリクエストをルートに書き換えて配信します。
また note-feed.asp?feed=ranking|blog へのリクエストは note API をサーバー側で中継し、
本番の note-feed.asp （Classic ASP）と同じ振る舞いをローカルで再現します。
（note API は CORS 非対応のため、ブラウザから直接取得できないための措置）
"""
import os
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

# note フィード取得先（ホワイトリスト固定 = 任意URL指定は不可）
# ranking = 「ランキング上位記事」マガジン / blog = 「スタッフおすすめ記事」マガジン
NOTE_FEEDS = {
    'ranking': 'https://note.com/api/v1/layout/magazine/m337eb74a473c/section?page=1',
    'blog': 'https://note.com/api/v1/layout/magazine/mf2d28c48d139/section?page=1',
}


class RewriteHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        # 本番と同じ note-feed.asp?feed=... 形式
        if parsed.path.endswith('/note-feed.asp'):
            self.handle_note_feed(query.get('feed', [None])[0])
            return
        super().do_GET()

    def handle_note_feed(self, feed):
        url = NOTE_FEEDS.get(feed)
        if not url:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'{"error":"bad feed"}')
            return
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; FutariTsumugi/1.0)',
                'Accept': 'application/json',
            })
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
        except Exception:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'{"error":"note fetch failed"}')
            return
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'public, max-age=300')
        self.end_headers()
        self.wfile.write(data)

    def translate_path(self, path):
        # /recommend/futari-tsumugi/ → /  に書き換え
        if path.startswith('/recommend/futari-tsumugi/'):
            path = path[len('/recommend/futari-tsumugi'):]
        elif path == '/recommend/futari-tsumugi':
            path = '/'
        return super().translate_path(path)

    def log_message(self, format, *args):
        # 404以外はログを抑制してターミナルをすっきりさせる
        status = args[1] if len(args) > 1 else ''
        if str(status).startswith('4') or str(status).startswith('5'):
            super().log_message(format, *args)

os.chdir(BASE_DIR)
print(f"Preview server running at http://localhost:{PORT}/index_preview.html")
print("Press Ctrl+C to stop.")
try:
    HTTPServer(('', PORT), RewriteHandler).serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
