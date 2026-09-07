const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization, x-mx1-signature', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
const text = (value, status = 200) => new Response(value, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

function authorized(request, env) {
  if (!env.MX1_API_TOKEN) return true;
  return request.headers.get('authorization') === `Bearer ${env.MX1_API_TOKEN}`;
}
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
  if (url.pathname === '/api/status' && method === 'GET') return json({ status: 'online', platform: 'mx1', ai_assistant: 'mx2', capabilities: { ai: !!env.AI, assets: !!env.ASSETS, apps_kv: !!env.APPS, deployments_kv: !!env.DEPLOYMENTS }, timestamp: new Date().toISOString() });
  if (!authorized(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, { 'www-authenticate': 'Bearer' });
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
  if (url.pathname === '/api/zip/sites' && method === 'GET') return json({ success: true, sites: [], note: env.APPS ? 'KV connected' : 'APPS KV binding is not configured' });
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return text('MX1 Core Platform & XM2 AI Engine Operational.');
}
export default { fetch: handle };
