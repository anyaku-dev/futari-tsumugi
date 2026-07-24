"""
プレビュー用ローカルサーバー
/recommend/futari-tsumugi/ へのリクエストをルートに書き換えて配信します。
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

class RewriteHandler(SimpleHTTPRequestHandler):
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
