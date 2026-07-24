import { next } from '@vercel/functions';

function unauthorized(): Response {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate':
        'Basic realm="Futari Tsumugi Test", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export default function middleware(request: Request): Response {
  const username = process.env.FUTARI_BASIC_USER;
  const password = process.env.FUTARI_BASIC_PASSWORD;

  if (!username || !password) {
    return new Response('Authentication settings are missing.', {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Basic ')) {
    return unauthorized();
  }

  try {
    const encoded = authorization.slice('Basic '.length).trim();
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      return unauthorized();
    }

    const inputUsername = decoded.slice(0, separatorIndex);
    const inputPassword = decoded.slice(separatorIndex + 1);

    if (inputUsername === username && inputPassword === password) {
      return next();
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}