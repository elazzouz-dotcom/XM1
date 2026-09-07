document.addEventListener('DOMContentLoaded', () => {
  const state = { assistant: 'cloudflare', panel: 'homePanel', history: { cloudflare: [], mx3: [] } };
  const panels = [...document.querySelectorAll('.home-panel,.workspace-panel')];
  const defaultApiBase = () => window.location.hostname === 'xm1.elazzouz4.workers.dev' ? window.location.origin : '';
  const apiBase = () => (localStorage.getItem('mx1_api_base') || defaultApiBase()).replace(/\/$/, '');
  const apiToken = () => localStorage.getItem('mx1_api_token') || '';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function openPanel(id) {
    const target = document.getElementById(id) || document.getElementById('homePanel');
    panels.forEach(panel => panel.classList.toggle('panel-active', panel === target));
    state.panel = target.id;
    history.replaceState(null, '', target.id === 'homePanel' ? location.pathname : `#${target.id}`);
  }
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.open)));
  document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => openPanel('homePanel')));
  document.getElementById('settingsBtn')?.addEventListener('click', () => openPanel('settingsPanel'));
  document.getElementById('profileBtn')?.addEventListener('click', () => openPanel('profilePanel'));
  document.getElementById('settingsProfileBtn')?.addEventListener('click', () => openPanel('profilePanel'));

  const initial = location.hash?.slice(1);
  openPanel(initial && document.getElementById(initial) ? initial : 'homePanel');

  document.querySelectorAll('.assistant-tab').forEach(tab => tab.addEventListener('click', () => {
    state.assistant = tab.dataset.assistant;
    document.querySelectorAll('.assistant-tab').forEach(item => item.classList.toggle('active', item === tab));
    const label = state.assistant === 'cloudflare' ? 'MX2 — Cloudflare' : 'MX3 — المساعد الداخلي';
    const status = document.getElementById('assistantStatus');
    if (status) status.innerHTML = `<span class="status-dot"></span> المسار المحدد: ${label}`;
    appendXm2(`تم التبديل إلى ${label}.`, 'ai');
  }));

  const xm2Feed = document.getElementById('xm2Feed');
  function appendXm2(text, sender) {
    if (!xm2Feed) return;
    const item = document.createElement('div'); item.className = `feed-message ${sender}`;
    item.innerHTML = sender === 'user' ? `<strong>أنت:</strong> ${escapeHtml(text)}` : `<strong>${state.assistant === 'cloudflare' ? 'MX2' : 'MX3'}:</strong> ${text}`;
    xm2Feed.appendChild(item); xm2Feed.scrollTop = xm2Feed.scrollHeight;
  }
  async function sendAssistantMessage() {
    const input = document.getElementById('xm2Input'); const text = input?.value.trim(); if (!text) return;
    appendXm2(text, 'user'); input.value = '';
    const history = state.history[state.assistant]; history.push({ role: 'user', content: text });
    const base = apiBase();
    if (base) {
      try {
        const response = await fetch(`${base}/api/mx2/chat`, { method: 'POST', headers: {'content-type':'application/json', ...(apiToken() ? {authorization:`Bearer ${apiToken()}`} : {})}, body:JSON.stringify({ message: text, assistant: state.assistant === 'cloudflare' ? 'mx2' : 'mx3', history, connectors: [...activeConnectors] }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`); const answer = data.response || data.message || 'تم استلام الرد من الخادم.'; appendXm2(answer, 'ai'); history.push({ role: 'assistant', content: answer }); return;
      } catch (error) { appendXm2(`تعذر الوصول إلى الخادم: ${escapeHtml(error.message)}`, 'ai'); return; }
    }
    const answer = state.assistant === 'cloudflare' ? 'MX2 يعمل محليًا. أضف عنوان Worker في الاتصالات لتفعيل الربط الحقيقي مع Cloudflare.' : 'MX3 يعمل محليًا. أضف عنوان API لتفعيل الاتصال بالخدمة الخلفية.'; appendXm2(answer, 'ai'); history.push({ role: 'assistant', content: answer });
  }
  document.getElementById('xm2Send')?.addEventListener('click', sendAssistantMessage);
  document.getElementById('xm2Input')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAssistantMessage(); } });

  document.getElementById('publishBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('publishInput'); const text = input?.value.trim(); const base = apiBase(); const button = document.getElementById('publishBtn'); const notice = document.getElementById('uploadStatus');
    if (publishType === 'image') { const file = document.getElementById('imageInput')?.files?.[0]; if (!file) { notice.textContent = 'اختر صورة أولًا.'; return; } if (!base) { notice.textContent = 'أضف عنوان API من الإعدادات أولًا.'; return; } button.disabled = true; notice.textContent = 'جارٍ رفع الصورة...'; try { const form = new FormData(); form.append('file', file, file.name); const response = await fetch(`${base}/api/assets/upload`, { method: 'POST', headers: apiToken() ? { authorization: `Bearer ${apiToken()}` } : {}, body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`); notice.innerHTML = `تم نشر الصورة: <a href="${base}${data.url}" target="_blank" rel="noopener">فتح الصورة</a>`; } catch (error) { notice.textContent = `تعذر نشر الصورة: ${error.message}`; } finally { button.disabled = false; } return; }
    if (!text) { input?.focus(); return; }
    button.disabled = true; button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ النشر';
    try { if (!base) throw new Error('أضف عنوان API من الإعدادات أولًا'); const response = await fetch(`${base}/api/agent/execute`, { method:'POST', headers:{'content-type':'application/json', ...(apiToken()?{authorization:`Bearer ${apiToken()}`}:{})}, body:JSON.stringify({ requirement:text, auto_merge:false, type: publishType }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`); input.value = ''; notice.textContent = `تم إنشاء عملية النشر ${data.id || ''} في وضع المراجعة الآمنة.`; } catch (error) { notice.textContent = `تعذر النشر عبر Worker: ${error.message}`; } finally { button.disabled = false; button.innerHTML = '<i class="fa-solid fa-arrow-up"></i> نشر'; }
  });

  const baseInput = document.getElementById('apiBaseInput'); const tokenInput = document.getElementById('apiTokenInput'); const status = document.getElementById('connectionStatus');
  if (baseInput) baseInput.value = apiBase();
  document.getElementById('saveConnectionBtn')?.addEventListener('click', () => { localStorage.setItem('mx1_api_base', baseInput?.value.trim() || ''); localStorage.setItem('mx1_api_token', tokenInput?.value.trim() || ''); if (status) status.textContent = 'تم حفظ الاتصال على هذا الجهاز'; });
  document.getElementById('testConnectionBtn')?.addEventListener('click', async () => {
    const base = baseInput?.value.trim().replace(/\/$/, ''); if (!base) { if (status) status.textContent = 'أدخل عنوان API أو IP'; return; } if (status) status.textContent = 'جارٍ الاختبار...';
    try { const response = await fetch(`${base}/api/status`, { headers: apiToken() ? {authorization:`Bearer ${apiToken()}`} : {} }); const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`); if (status) status.textContent = `متصل — ${data.platform || 'MX1'}`; } catch (error) { if (status) status.textContent = `فشل الاتصال — ${error.message}`; }
  });

  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => { openPanel('connectPanel'); document.getElementById('publishInput')?.focus(); }));
  document.getElementById('fullscreenBtn')?.addEventListener('click', async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch {} });
});


const gatewayState = { provider: 'cloudflare', history: [] };
document.querySelectorAll('.provider-tab').forEach(tab => tab.addEventListener('click', () => {
  gatewayState.provider = tab.dataset.provider;
  document.querySelectorAll('.provider-tab').forEach(item => item.classList.toggle('active', item === tab));
}));
document.getElementById('gatewaySend')?.addEventListener('click', async () => {
  const input = document.getElementById('gatewayInput'); const result = document.getElementById('gatewayResult'); const message = input?.value.trim(); const base = apiBase();
  if (!message) { if (result) result.textContent = 'اكتب طلبًا أولًا.'; return; }
  if (!base) { if (result) result.textContent = 'أضف عنوان API من صفحة الاتصالات أولًا.'; return; }
  if (result) result.textContent = 'جارٍ التوجيه عبر MX1 Gateway...';
  try {
    const response = await fetch(`${base}/api/gateway`, { method: 'POST', headers: { 'content-type': 'application/json', ...(apiToken() ? { authorization: `Bearer ${apiToken()}` } : {}) }, body: JSON.stringify({ provider: gatewayState.provider, message, history: gatewayState.history.slice(-10), connectors: [...activeConnectors] }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    gatewayState.history.push({ role: 'user', content: message }, { role: 'assistant', content: data.response });
    if (result) result.textContent = `${data.provider}: ${data.response}`;
  } catch (error) { if (result) result.textContent = `فشل التوجيه: ${error.message}`; }
});


// نشر ZIP فعلي عبر Worker
const zipInput = document.getElementById('zipInput');
document.getElementById('zipPickBtn')?.addEventListener('click', () => zipInput?.click());
zipInput?.addEventListener('change', async () => {
  const file = zipInput.files?.[0]; const status = document.getElementById('uploadStatus'); const base = apiBase();
  if (!file) return; if (!base) { if (status) status.textContent = 'أضف عنوان API من الاتصالات أولًا.'; return; }
  if (status) status.textContent = 'جارٍ رفع ZIP وفك الضغط...';
  try {
    const form = new FormData(); form.append('file', file, file.name);
    const response = await fetch(`${base}/api/zip/upload`, { method: 'POST', headers: apiToken() ? { authorization: `Bearer ${apiToken()}` } : {}, body: form });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    if (status) status.innerHTML = `تم النشر: <a href="${base}${data.preview}" target="_blank" rel="noopener">فتح المعاينة</a> (${data.files} ملف)`;
  } catch (error) { if (status) status.textContent = `فشل ZIP: ${error.message}`; }
});

document.getElementById('integrationBtn')?.addEventListener('click', () => openPanel('connectPanel'));
document.getElementById('aiFullscreenBtn')?.addEventListener('click', async () => {
  const panel = document.getElementById('aiPanel');
  try { if (!document.fullscreenElement) await panel?.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch { panel?.classList.toggle('ai-fullscreen-active'); }
});


// طبقة الموصلات: التطبيقات المحددة تصبح سياقًا متاحًا للمحادثة
const connectorNames = { github:'GitHub', gmail:'Gmail', cloudflare:'Cloudflare', workers:'Cloudflare Workers', firecrawl:'Firecrawl', clickhouse:'ClickHouse', cloudinary:'Cloudinary', cockroachdb:'CockroachDB Cloud', shopify:'Shopify' };
const activeConnectors = new Set(JSON.parse(localStorage.getItem('mx1_connectors') || '[]'));
const connectorMenu = document.getElementById('connectorMenu'); const connectorCount = document.getElementById('connectorCount'); const activeConnectorsEl = document.getElementById('activeConnectors');
function renderConnectors() {
  if (connectorCount) connectorCount.textContent = String(activeConnectors.size);
  document.querySelectorAll('.connector-row').forEach(row => { const active = activeConnectors.has(row.dataset.connector); row.classList.toggle('connected', active); const button = row.querySelector('.connector-toggle'); if (button) button.textContent = active ? 'مفعّل' : 'تفعيل'; });
  if (activeConnectorsEl) activeConnectorsEl.innerHTML = [...activeConnectors].map(id => `<span class="active-connector"><i class="fa-solid fa-plug"></i>${connectorNames[id]}</span>`).join('');
}
document.getElementById('connectorBtn')?.addEventListener('click', () => { if (connectorMenu) connectorMenu.hidden = !connectorMenu.hidden; });
document.getElementById('connectorClose')?.addEventListener('click', () => { if (connectorMenu) connectorMenu.hidden = true; });
document.querySelectorAll('.connector-toggle').forEach(button => button.addEventListener('click', event => { const row = event.currentTarget.closest('.connector-row'); const id = row?.dataset.connector; if (!id) return; activeConnectors.has(id) ? activeConnectors.delete(id) : activeConnectors.add(id); localStorage.setItem('mx1_connectors', JSON.stringify([...activeConnectors])); renderConnectors(); }));
renderConnectors();


// كتالوج موسّع للتطبيقات التقنية مع بحث وتصنيف داخل لوحة الموصلات
const extraConnectorCatalog = [
  ['gemini','Gemini','Google AI API','fa-gem','ai'],['openai','OpenAI','نماذج الذكاء الاصطناعي','fa-brain','ai'],['anthropic','Anthropic','Claude API','fa-robot','ai'],['replicate','Replicate','نماذج وتوليد الوسائط','fa-arrows-rotate','ai'],['huggingface','Hugging Face','نماذج ومجموعات بيانات','fa-face-smile','ai'],['vercel','Vercel','النشر والاستضافة','fa-triangle-exclamation','deploy'],['netlify','Netlify','النشر والاستضافة','fa-globe','deploy'],['aws-s3','AWS S3','تخزين الكائنات','fa-cube','storage'],['google-drive','Google Drive','الملفات والمستندات','fa-hard-drive','storage'],['dropbox','Dropbox','تخزين الملفات','fa-box-archive','storage'],['supabase','Supabase','قاعدة بيانات وAuth','fa-database','database'],['firebase','Firebase','تطبيقات وقواعد بيانات','fa-fire','database'],['neon','Neon','Postgres سحابي','fa-database','database'],['notion','Notion','المعرفة والمستندات','fa-book','productivity'],['slack','Slack','الرسائل والتنبيهات','fa-comments','productivity'],['discord','Discord','المجتمع والتنبيهات','fa-gamepad','productivity'],['linear','Linear','إدارة المهام','fa-list-check','productivity'],['sentry','Sentry','المراقبة والأخطاء','fa-bug','devtools'],['browser','المتصفح','تصفح وأتمتة الويب','fa-globe','devtools']
];
const extraNames = Object.fromEntries(extraConnectorCatalog.map(([id,name]) => [id,name])); Object.assign(connectorNames, extraNames);
const connectorList = document.getElementById('connectorList');
if (connectorList) {
  const controls = document.createElement('div'); controls.className = 'connector-controls'; controls.innerHTML = '<input id="connectorSearch" class="connector-search" placeholder="ابحث عن تطبيق أو خدمة..." type="search"><div class="connector-filters"><button data-filter="all" class="active">الكل</button><button data-filter="ai">AI</button><button data-filter="deploy">نشر</button><button data-filter="storage">تخزين</button><button data-filter="database">بيانات</button><button data-filter="productivity">عمل</button></div>'; connectorList.before(controls);
  extraConnectorCatalog.forEach(([id,name,description,icon,category]) => { const row = document.createElement('div'); row.className = 'connector-row'; row.dataset.connector = id; row.dataset.category = category; row.innerHTML = `<i class="fa-solid ${icon} app-icon"></i><span><strong>${name}</strong><small>${description}</small></span><button class="connector-toggle">تفعيل</button>`; connectorList.appendChild(row); });
  const applyConnectorFilter = () => { const query = document.getElementById('connectorSearch')?.value.toLowerCase() || ''; const filter = document.querySelector('.connector-filters button.active')?.dataset.filter || 'all'; connectorList.querySelectorAll('.connector-row').forEach(row => { const text = row.textContent.toLowerCase(); row.hidden = (filter !== 'all' && row.dataset.category !== filter) || (query && !text.includes(query)); }); };
  document.getElementById('connectorSearch')?.addEventListener('input', applyConnectorFilter);
  document.querySelectorAll('.connector-filters button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.connector-filters button').forEach(item => item.classList.remove('active')); button.classList.add('active'); applyConnectorFilter(); }));
  extraConnectorCatalog.forEach(([id]) => connectorList.querySelector(`[data-connector="${id}"] .connector-toggle`)?.addEventListener('click', () => { activeConnectors.has(id) ? activeConnectors.delete(id) : activeConnectors.add(id); localStorage.setItem('mx1_connectors', JSON.stringify([...activeConnectors])); renderConnectors(); }));
  renderConnectors();
}


// مساحة النشر متعددة الأنواع: نص، صورة، وموقع ZIP
let publishType = 'text';
document.getElementById('mx2HeaderBtn')?.addEventListener('click', () => openPanel('aiPanel'));
document.querySelectorAll('.publish-type').forEach(tab => tab.addEventListener('click', () => {
  publishType = tab.dataset.publishType; document.querySelectorAll('.publish-type').forEach(item => item.classList.toggle('active', item === tab));
  const input = document.getElementById('publishInput'); const image = document.getElementById('imageInput'); const zip = document.getElementById('zipInput');
  if (publishType === 'image') { input.placeholder = 'أضف وصفًا للصورة ثم اختر ملفًا...'; image?.click(); } else if (publishType === 'zip') { input.placeholder = 'أضف وصفًا للموقع ثم اختر ZIP...'; zip?.click(); } else input.placeholder = 'اكتب نصًا أو مقالًا للنشر...';
}));
document.getElementById('imageInput')?.addEventListener('change', () => { const file = document.getElementById('imageInput').files?.[0]; const preview = document.getElementById('publishPreview'); if (!file || !preview) return; const url = URL.createObjectURL(file); preview.innerHTML = `<img src="${url}" alt="معاينة الصورة" class="publish-image-preview"><span>${file.name}</span>`; });


// روابط المتاجر الرسمية: فتح التطبيق أو صفحة البحث الرسمية دون ادعاء منح صلاحيات API
function storeSearchUrl(store, name) { const q = encodeURIComponent(name); return store === 'ios' ? `https://apps.apple.com/us/search?term=${q}` : `https://play.google.com/store/search?q=${q}&c=apps`; }
function addStoreLinks() { document.querySelectorAll('.connector-row').forEach(row => { if (row.querySelector('.connector-store-links')) return; const label = row.querySelector('strong')?.textContent || ''; const links = document.createElement('div'); links.className = 'connector-store-links'; links.innerHTML = `<a href="${storeSearchUrl('ios', label)}" target="_blank" rel="noopener">App Store</a><a href="${storeSearchUrl('android', label)}" target="_blank" rel="noopener">Google Play</a>`; row.appendChild(links); }); }
addStoreLinks();
