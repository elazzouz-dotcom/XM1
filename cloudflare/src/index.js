import { unzipSync } from 'fflate';

const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization, x-mx1-signature', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
const text = (value, status = 200) => new Response(value, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

function authorized(request, env) {
  if (!env.MX1_API_TOKEN) return true;
  return request.headers.get('authorization') === `Bearer ${env.MX1_API_TOKEN}`;
}
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
const decodeB64 = value => atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
async function signSession(payload, env) { const body = b64url(new TextEncoder().encode(JSON.stringify(payload))); const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SESSION_SECRET || 'mx1-dev-session-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const sig = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))); return `${body}.${sig}`; }
async function readSession(request, env) { try { const cookie = request.headers.get('cookie') || ''; const raw = cookie.match(/mx1_session=([^;]+)/)?.[1]; if (!raw) return null; const [body, signature] = raw.split('.'); const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SESSION_SECRET || 'mx1-dev-session-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']); const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(decodeB64(signature), c => c.charCodeAt(0)), new TextEncoder().encode(body)); return valid ? JSON.parse(decodeB64(body)) : null; } catch { return null; } }
function cookieValue(request, name) { return (request.headers.get('cookie') || '').match(new RegExp(`${name}=([^;]+)`))?.[1] || ''; }
function oauthConfig(provider, env) { return provider === 'google' ? { client: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET, auth: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', scope: 'openid email profile' } : { client: env.GITHUB_CLIENT_ID, secret: env.GITHUB_CLIENT_SECRET, auth: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token', scope: 'read:user user:email' }; }
function cors(request) { return request.method === 'OPTIONS' ? new Response(null, { status: 204, headers }) : null; }
function safeText(v, max = 12000) { return String(v ?? '').trim().slice(0, max); }
function validatePath(path) { return path && !path.startsWith('/') && !path.includes('..') && !path.includes('\\') && path.length < 240; }
function tasksFor(requirement) {
  const r = safeText(requirement, 4000);
  return [
    { id: crypto.randomUUID(), type: 'analysis', title: 'تحليل المتطلب', status: 'planned', input: r },
    { id: crypto.randomUUID(), type: 'file', title: 'اقتراح ملفات التغيير', status: 'planned', paths: ['src/'] },
    { id: crypto.randomUUID(), type: 'test', title: 'التحقق من السلامة', status: 'planned' },
    { id: crypto.randomUUID(), type: 'review', title: 'مراجعة قبل الدمج', status: 'planned' }
  ];
}
async function geminiReply(message, env, history = []) {
  if (!env.GEMINI_API_KEY) return null;
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const contents = [...(Array.isArray(history) ? history.slice(-10) : []), { role: 'user', parts: [{ text: safeText(message) }] }].map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: safeText(item.content || item.parts?.[0]?.text, 8000) }] }));
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents, generationConfig: { temperature: 0.4 } }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
  return data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
}
async function aiReply(message, env, assistant = 'mx2', history = []) {
  const userMessage = safeText(message);
  const context = Array.isArray(history) ? history.slice(-10).map(item => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: safeText(item.content, 8000) })) : [];
  if (assistant === 'mx3' && env.MX3_API_URL && env.MX3_API_TOKEN) {
    const endpoint = env.MX3_API_URL.replace(/\/$/, '') + '/chat/completions';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.MX3_API_TOKEN}` }, body: JSON.stringify({ model: env.MX3_MODEL || 'gpt-5-mini', messages: [{ role: 'system', content: 'أنت MX3، مساعد برمجي داخل منصة MX1. أجب بدقة، اشرح القيود، ولا تنفذ تغييرات مدمرة دون تحقق.' }, ...context, { role: 'user', content: userMessage }] }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `MX3 provider HTTP ${response.status}`);
    return data?.choices?.[0]?.message?.content || data?.response || '';
  }
  if (!env.AI?.run) return null;
  const system = assistant === 'mx3' ? 'أنت MX3، مساعد برمجي داخل منصة MX1. أجب بدقة واشرح القيود.' : 'أنت MX2، مساعد Cloudflare وGitHub. قدّم اقتراحات آمنة ولا تنفذ تغييرات مدمرة.';
  const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [{ role: 'system', content: system }, ...context, { role: 'user', content: userMessage }] });
  return result?.response || String(result ?? '');
}
async function handle(request, env) {
  const preflight = cors(request); if (preflight) return preflight;
  const url = new URL(request.url); const method = request.method;
  if (url.pathname === '/api/status' && method === 'GET') return json({ status: 'online', platform: 'mx1', ai_assistant: 'mx2', capabilities: { ai: !!env.AI, assets: !!env.ASSETS, apps_kv: !!env.APPS, deployments_kv: !!env.DEPLOYMENTS, oauth_google: !!env.GOOGLE_CLIENT_ID, oauth_github: !!env.GITHUB_CLIENT_ID, gemini: !!env.GEMINI_API_KEY }, timestamp: new Date().toISOString() });
  if (url.pathname === '/api/auth/me' && method === 'GET') return json({ authenticated: !!(await readSession(request, env)), user: await readSession(request, env) });
  if (url.pathname === '/api/auth/logout' && method === 'POST') return json({ success: true }, 200, { 'set-cookie': 'mx1_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax' });
  const authStart = url.pathname.match(/^\/api\/auth\/(google|github)\/start$/); const authCallback = url.pathname.match(/^\/api\/auth\/(google|github)\/callback$/);
  if (authStart && method === 'GET') { const provider = authStart[1]; const cfg = oauthConfig(provider, env); if (!cfg.client || !cfg.secret) return json({ success: false, error: `${provider} OAuth is not configured` }, 503); const state = crypto.randomUUID(); const callback = `${url.origin}/api/auth/${provider}/callback`; const authUrl = new URL(cfg.auth); authUrl.searchParams.set('client_id', cfg.client); authUrl.searchParams.set('redirect_uri', callback); authUrl.searchParams.set('response_type', 'code'); authUrl.searchParams.set('scope', cfg.scope); authUrl.searchParams.set('state', state); return Response.redirect(authUrl.toString(), 302, { 'set-cookie': `mx1_oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax` }); }
  if (authCallback && method === 'GET') { const provider = authCallback[1]; const cfg = oauthConfig(provider, env); const state = url.searchParams.get('state'); const code = url.searchParams.get('code'); if (!code || !state || state !== cookieValue(request, 'mx1_oauth_state')) return text('OAuth state validation failed', 400); const callback = `${url.origin}/api/auth/${provider}/callback`; const tokenResponse = await fetch(cfg.token, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ client_id: cfg.client, client_secret: cfg.secret, code, redirect_uri: callback }) }); const token = await tokenResponse.json(); if (!token.access_token) return json({ success: false, error: 'OAuth token exchange failed' }, 502); const profileResponse = await fetch(provider === 'google' ? 'https://openidconnect.googleapis.com/v1/userinfo' : 'https://api.github.com/user', { headers: { authorization: `Bearer ${token.access_token}`, accept: 'application/json', 'user-agent': 'MX1' } }); const p = await profileResponse.json(); const user = provider === 'google' ? { provider, id: p.sub, email: p.email, name: p.name, avatar: p.picture } : { provider, id: String(p.id), email: p.email, name: p.name || p.login, avatar: p.avatar_url }; const session = await signSession(user, env); return Response.redirect(`${url.origin}/#profilePanel`, 302, { 'set-cookie': [`mx1_session=${session}; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax`, 'mx1_oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'] }); }
  if (url.pathname === '/api/profile' && method === 'GET') { const user = await readSession(request, env); if (!user) return json({ success: false, error: 'Unauthorized' }, 401); const saved = env.APPS ? await env.APPS.get(`profile:${user.provider}:${user.id}`, 'json') : null; return json({ success: true, profile: { ...user, ...saved } }); }
  if (url.pathname === '/api/profile' && method === 'POST') { const user = await readSession(request, env); if (!user) return json({ success: false, error: 'Unauthorized' }, 401); if (!env.APPS) return json({ success: false, error: 'APPS KV binding is not configured' }, 503); const body = await request.json(); const profile = { name: safeText(body.name, 120), avatar: safeText(body.avatar, 2000) }; await env.APPS.put(`profile:${user.provider}:${user.id}`, JSON.stringify(profile)); return json({ success: true, profile: { ...user, ...profile } }); }
  if (!authorized(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, { 'www-authenticate': 'Bearer' });
  if (url.pathname === '/api/gateway' && method === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
    const provider = body.provider === 'gemini' ? 'gemini' : 'cloudflare';
    if (!safeText(body.message, 12000)) return json({ success: false, error: 'message is required' }, 422);
    try {
      const response = provider === 'gemini' ? await geminiReply(body.message, env, body.history) : await aiReply(body.message, env, 'mx2', body.history);
      if (!response) return json({ success: false, provider, error: provider === 'gemini' ? 'Gemini is not configured' : 'Workers AI is not configured' }, 503);
      return json({ success: true, provider, response });
    } catch (error) { return json({ success: false, provider, error: error.message }, 502); }
  }
  if (url.pathname === '/api/mx2/chat' && method === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
    if (!safeText(body.message, 12000)) return json({ success: false, error: 'message is required' }, 422);
    try { const response = await aiReply(body.message, env, body.assistant === 'mx3' ? 'mx3' : 'mx2', body.history); if (!response) return json({ success: false, assistant: 'mx2', error: 'Workers AI binding is not configured' }, 503); return json({ success: true, assistant: 'mx2', response }); } catch (error) { return json({ success: false, error: error.message }, 502); }
  }
  if (url.pathname === '/api/webhook/ingress' && method === 'POST') {
    let payload; try { payload = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
    const record = { id: crypto.randomUUID(), received_at: new Date().toISOString(), event: payload?.action || 'unknown', repository: payload?.repository?.full_name || null };
    if (env.DEPLOYMENTS) await env.DEPLOYMENTS.put(`webhook:${record.id}`, JSON.stringify(record), { expirationTtl: 604800 });
    return json({ success: true, platform: 'mx1', record });
  }
  if (url.pathname === '/api/agent/plan' && method === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
    if (!safeText(body.requirement, 4000)) return json({ success: false, error: 'requirement is required' }, 422);
    const tasks = tasksFor(body.requirement); return json({ success: true, mode: 'plan-only', requirement: safeText(body.requirement, 4000), tasks });
  }
  if (url.pathname === '/api/agent/execute' && method === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
    const requirement = safeText(body.requirement, 4000); if (!requirement) return json({ success: false, error: 'requirement is required' }, 422);
    const id = crypto.randomUUID(); const tasks = tasksFor(requirement); const result = { id, status: 'staged', auto_merge: body.auto_merge === true && env.ALLOW_AUTO_MERGE === 'true', requirement, tasks, note: 'Changes are staged for validation; production merge remains disabled unless explicitly configured.' };
    if (env.DEPLOYMENTS) await env.DEPLOYMENTS.put(`agent:${id}`, JSON.stringify(result), { expirationTtl: 604800 });
    return json({ success: true, ...result });
  }
  if (url.pathname === '/api/github/repos' && method === 'GET') {
    if (!env.GITHUB_TOKEN) return json({ success: false, error: 'GITHUB_TOKEN is not configured' }, 503);
    const r = await fetch('https://api.github.com/user/repos?per_page=100', { headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'mx1' } });
    return new Response(await r.text(), { status: r.status, headers });
  }
  if (url.pathname === '/api/github/generate' && method === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
    if (!validatePath(body.path) || !safeText(body.prompt, 8000)) return json({ success: false, error: 'Valid path and prompt are required' }, 422);
    const generated = await aiReply(`اكتب محتوى الملف ${body.path} بناءً على المتطلب التالي. أعد الكود فقط.\n${body.prompt}`, env, 'mx3');
    if (!generated) return json({ success: false, error: 'Workers AI binding is not configured' }, 503);
    return json({ success: true, path: body.path, code: generated.replace(/^```[a-zA-Z0-9_-]*\n|```$/g, '').trim(), validated: true, ready_to_push: false });
  }
  if (url.pathname === '/api/zip/upload' && method === 'POST') {
    if (!env.APPS) return json({ success: false, error: 'APPS KV binding is not configured' }, 503);
    const form = await request.formData(); const file = form.get('file'); if (!file || typeof file.arrayBuffer !== 'function') return json({ success: false, error: 'ZIP file is required' }, 422);
    if (file.size > 10 * 1024 * 1024) return json({ success: false, error: 'ZIP file exceeds 10MB limit' }, 413);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer()); const files = unzipSync(bytes); const siteId = crypto.randomUUID(); let count = 0; let entry = 'index.html';
      for (const [name, content] of Object.entries(files)) { if (!name || name.includes('..') || name.startsWith('/') || name.endsWith('/') || content.length > 2 * 1024 * 1024) continue; const safe = name.replace(/^\.\//, ''); if (safe === 'index.html') entry = safe; await env.APPS.put(`site:${siteId}:${safe}`, content, { expirationTtl: 86400 }); count++; }
      await env.APPS.put(`site:${siteId}:meta`, JSON.stringify({ siteId, files: count, entry, created_at: new Date().toISOString() }), { expirationTtl: 86400 });
      return json({ success: true, siteId, preview: `/preview/${siteId}/`, files: count });
    } catch (error) { return json({ success: false, error: `ZIP extraction failed: ${error.message}` }, 400); }
  }
  if (url.pathname === '/api/zip/sites' && method === 'GET') return json({ success: true, sites: [], note: env.APPS ? 'KV connected' : 'APPS KV binding is not configured' });
  if (url.pathname.startsWith('/preview/') && method === 'GET') {
    if (!env.APPS) return text('APPS KV binding is not configured', 503);
    const parts = url.pathname.split('/').filter(Boolean); const siteId = parts[1]; const filePath = parts.slice(2).join('/') || 'index.html'; if (!siteId || filePath.includes('..')) return text('Not found', 404);
    const object = await env.APPS.get(`site:${siteId}:${filePath}`, { type: 'arrayBuffer' }); if (!object) return text('Not found', 404); const ext = filePath.split('.').pop()?.toLowerCase(); const mime = { html:'text/html; charset=utf-8', css:'text/css', js:'application/javascript', json:'application/json', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', svg:'image/svg+xml' }[ext] || 'application/octet-stream'; return new Response(object, { headers: { ...headers, 'content-type': mime, 'content-security-policy': "default-src 'self' 'unsafe-inline' data: blob: https:; frame-ancestors 'self'" } });
  }
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return text('MX1 Core Platform & XM2 AI Engine Operational.');
}
export default { fetch: handle };
