// note-feed.asp の Vercel 版（本番ASPサーバーが動かないVercel上で note API を中継する）
// 使い方: /api/note-feed?feed=ranking | /api/note-feed?feed=blog
// 安全対策: feed はホワイトリスト固定。パラメータからURLを組み立てないため任意URLへの踏み台利用（SSRF）はできません。

export const config = { runtime: 'edge' };

const FEEDS: Record<string, string> = {
  ranking: 'https://note.com/api/v1/layout/magazine/m337eb74a473c/section?page=1',
  blog: 'https://note.com/api/v1/layout/magazine/mf2d28c48d139/section?page=1',
};

export default async function handler(request: Request): Promise<Response> {
  const feed = new URL(request.url).searchParams.get('feed')?.toLowerCase() ?? '';
  const targetUrl = FEEDS[feed];

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'bad feed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FutariTsumugi/1.0)',
        Accept: 'application/json',
      },
    });

    if (!upstream.ok) {
      throw new Error(`upstream status ${upstream.status}`);
    }

    const body = await upstream.text();
    // CDNキャッシュで note への実アクセス頻度を抑える（note-feed.aspのApplication変数キャッシュに相当）
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'note fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
