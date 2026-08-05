<%@LANGUAGE=VBScript CODEPAGE=65001%>
<%
' ============================================================================
'  note-feed.asp  ---  note.com フィード中継（サーバー側プロキシ）
' ----------------------------------------------------------------------------
'  用途 : index.asp の「記事ランキング TOP3」「スタッフおすすめ記事」で使用。
'         note.com の API は CORS 非対応のためブラウザから直接取得できません。
'         同一オリジン（www.jtb.co.jp）の本ファイルがサーバー間通信で代理取得し、
'         取得した JSON をそのままブラウザへ返します。
'
'  使い方 : /recommend/futari-tsumugi/note-feed.asp?feed=ranking
'           /recommend/futari-tsumugi/note-feed.asp?feed=blog
'
'  安全対策 :
'    - 取得先 URL は本ファイル内のホワイトリスト固定。パラメータから URL を
'      組み立てないため、任意 URL への踏み台利用（SSRF）はできません。
'    - 失敗時は 502 を返すのみ。index.asp 側はベタ書きカードを表示し続けます。
'
'  キャッシュ : Application 変数に CACHE_SECONDS 秒保持し、note への
'               アクセス回数と表示待ち時間を抑えます。
' ============================================================================

Const CACHE_SECONDS = 300           ' キャッシュ保持秒数（300秒 = 5分）
Const HTTP_TIMEOUT_RESOLVE = 5000   ' 名前解決タイムアウト(ms)
Const HTTP_TIMEOUT_CONNECT = 5000   ' 接続タイムアウト(ms)
Const HTTP_TIMEOUT_SEND    = 5000   ' 送信タイムアウト(ms)
Const HTTP_TIMEOUT_RECEIVE = 8000   ' 受信タイムアウト(ms)

' --- フォワードプロキシ経由が必要な環境では下2つを設定してください --------
'     例 : USE_PROXY = True : PROXY_SERVER = "proxy.example.co.jp:8080"
Const USE_PROXY    = False
Const PROXY_SERVER = ""

Response.Buffer = True
Response.Clear
Response.CodePage = 65001
Response.CharSet = "UTF-8"
Response.ContentType = "application/json"

Dim feedKey, targetUrl
feedKey = LCase(Trim("" & Request.QueryString("feed")))

' ---- ホワイトリスト（ここに定義した2種類以外は一切取得しません） ----------
Select Case feedKey
  Case "ranking"
    ' 「ランキング上位記事」マガジン
    targetUrl = "https://note.com/api/v1/layout/magazine/m337eb74a473c/section?page=1"
  Case "blog"
    ' 「スタッフおすすめ記事」マガジン
    targetUrl = "https://note.com/api/v1/layout/magazine/mf2d28c48d139/section?page=1"
  Case Else
    Response.Status = "400 Bad Request"
    Response.Write "{""error"":""bad feed""}"
    Response.End
End Select

Dim cacheKey, cacheTimeKey, cached
cacheKey = "noteFeed_" & feedKey
cacheTimeKey = "noteFeedAt_" & feedKey

' ---- キャッシュが有効ならそれを返す --------------------------------------
If Not IsEmpty(Application(cacheTimeKey)) And Not IsEmpty(Application(cacheKey)) Then
  If DateDiff("s", Application(cacheTimeKey), Now()) < CACHE_SECONDS Then
    Response.AddHeader "X-Note-Cache", "HIT"
    Response.AddHeader "Cache-Control", "public, max-age=300"
    Response.BinaryWrite Application(cacheKey)
    Response.End
  End If
End If

' ---- note API をサーバー側で取得 -----------------------------------------
Dim http, ok, payload
ok = False

On Error Resume Next
Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
If Err.Number = 0 Then
  http.setTimeouts HTTP_TIMEOUT_RESOLVE, HTTP_TIMEOUT_CONNECT, HTTP_TIMEOUT_SEND, HTTP_TIMEOUT_RECEIVE
  If USE_PROXY Then http.setProxy 2, PROXY_SERVER
  http.open "GET", targetUrl, False
  http.setRequestHeader "User-Agent", "Mozilla/5.0 (compatible; FutariTsumugi/1.0)"
  http.setRequestHeader "Accept", "application/json"
  http.send
  If Err.Number = 0 Then
    If http.status = 200 Then
      payload = http.responseBody
      ok = True
    End If
  End If
End If
Err.Clear
On Error GoTo 0

Set http = Nothing

' ---- 結果を返す -----------------------------------------------------------
If ok Then
  Application.Lock
  Application(cacheKey) = payload
  Application(cacheTimeKey) = Now()
  Application.UnLock

  Response.AddHeader "X-Note-Cache", "MISS"
  Response.AddHeader "Cache-Control", "public, max-age=300"
  Response.BinaryWrite payload
Else
  ' 取得失敗。index.asp 側はベタ書きカードを表示し続けるため画面は崩れません。
  Response.Status = "502 Bad Gateway"
  Response.Write "{""error"":""note fetch failed""}"
End If

Response.End
%>
