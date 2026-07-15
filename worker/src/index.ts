interface Env {
  LINKS: KVNamespace;
  BEACON_SECRET?: string;
  API_BASE_URL?: string;
}

interface LinkData {
  n: string;       // dest_number
  t: string;       // prefill_text
  a: boolean;      // active
  l: string;       // link_id
}

interface ClickEvent {
  l: string;       // link_id
  country?: string;
  device: string;
  ref?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const slug = url.pathname.slice(1); // Remove leading /

    // Root path - simple text response
    if (!slug || slug === '') {
      return new Response('leadwa', {
        headers: { 'content-type': 'text/plain' }
      });
    }

    // KV lookup
    const linkDataStr = await env.LINKS.get(slug);

    if (!linkDataStr) {
      return notFoundPage();
    }

    let linkData: LinkData;
    try {
      linkData = JSON.parse(linkDataStr);
    } catch {
      return notFoundPage();
    }

    // Check if active
    if (!linkData.a) {
      return notFoundPage();
    }

    // Build WhatsApp URL
    const whatsappUrl = buildWhatsAppUrl(linkData.n, linkData.t);

    // Fire-and-forget click beacon
    if (env.BEACON_SECRET && env.API_BASE_URL) {
      const clickEvent: ClickEvent = {
        l: linkData.l,
        country: (request as any).cf?.country,
        device: detectDevice(request.headers.get('user-agent') || ''),
        ref: request.headers.get('referer') || undefined
      };

      ctx.waitUntil(
        sendClickBeacon(env.API_BASE_URL, env.BEACON_SECRET, clickEvent)
      );
    }

    // Redirect (never await beacon)
    return Response.redirect(whatsappUrl, 302);
  }
};

function buildWhatsAppUrl(destNumber: string, prefillText: string): string {
  const text = prefillText ? `?text=${encodeURIComponent(prefillText)}` : '';
  return `https://wa.me/${destNumber}${text}`;
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  return 'desktop';
}

function notFoundPage(): Response {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link not found - Leadwa</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;color:#1f2937}
.box{text-align:center;padding:2rem}
h1{font-size:3rem;margin:0;color:#6366f1}
p{margin:1rem 0 0;color:#6b7280}
a{color:#6366f1;text-decoration:none}
</style>
</head>
<body>
<div class="box">
<h1>404</h1>
<p>This Leadwa link doesn't exist or has been deactivated.</p>
<p><a href="https://leadwa.co">leadwa.co</a></p>
</div>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: { 'content-type': 'text/html;charset=utf-8' }
  });
}

async function sendClickBeacon(
  apiBaseUrl: string,
  secret: string,
  event: ClickEvent
): Promise<void> {
  try {
    await fetch(`${apiBaseUrl}/events/click`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-beacon-secret': secret
      },
      body: JSON.stringify(event)
    });
  } catch (error) {
    // Swallow errors - beacon failures should not affect redirects
    console.error('Click beacon failed:', error);
  }
}
