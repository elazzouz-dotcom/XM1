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


// إعداد موصل فردي: OAuth أو API أو Token أو عنوان خدمة
let selectedConnector = null; let selectedMethod = 'api';
const connectorModal = document.getElementById('connectorConfigModal'); const connectorFields = document.getElementById('connectorConfigFields'); const connectorStatus = document.getElementById('connectorConfigStatus');
const connectorHelp = { github:'OAuth عبر GitHub أو Personal Access Token محدود الصلاحيات.', gmail:'OAuth Google مطلوب للوصول إلى Gmail.', cloudflare:'API Token Cloudflare بنطاقات Workers وD1 وKV.', workers:'API Token Cloudflare للنشر وإدارة bindings.', gemini:'Gemini API Key من Google AI Studio.', openai:'مفتاح API من OpenAI أو endpoint متوافق.', shopify:'OAuth عبر Shopify App أو Admin API Token.', default:'أدخل بيانات API الرسمية للخدمة؛ لا تستخدم كلمة مرور الحساب.' };
function openConnectorConfig(id) { selectedConnector = id; const row = document.querySelector(`.connector-row[data-connector="${id}"]`); document.getElementById('connectorConfigTitle').textContent = `إعداد ${connectorNames[id] || id}`; document.getElementById('connectorConfigDescription').textContent = connectorHelp[id] || connectorHelp.default; document.getElementById('connectorConfigIcon').innerHTML = row?.querySelector('.app-icon')?.outerHTML || '<i class="fa-solid fa-plug"></i>'; const saved = JSON.parse(localStorage.getItem(`mx1_connector_${id}`) || '{}'); selectedMethod = saved.method || (id === 'github' || id === 'gmail' ? 'oauth' : 'api'); document.querySelectorAll('.connector-method').forEach(button => button.classList.toggle('active', button.dataset.method === selectedMethod)); renderConnectorFields(saved); if (connectorModal) connectorModal.hidden = false; }
function renderConnectorFields(saved = {}) { const method = selectedMethod; if (!connectorFields) return; if (method === 'oauth') connectorFields.innerHTML = `<p class="method-note">سيُفتح مسار OAuth الرسمي للمزود عند نشر Worker وإضافة Client ID وClient Secret كأسرار.</p><button id="startOAuthBtn" class="secondary-button">بدء OAuth</button>`; else connectorFields.innerHTML = `<label>${method === 'ip' ? 'عنوان API / IP' : method === 'token' ? 'Token' : 'API Key'}<input id="connectorSecretInput" class="setting-input" type="password" placeholder="يُحفظ محليًا مؤقتًا أو في Secret خارجي" value="${escapeHtml(saved.value || '')}"></label><label>Endpoint اختياري<input id="connectorEndpointInput" class="setting-input" type="url" placeholder="https://api.example.com" value="${escapeHtml(saved.endpoint || '')}"></label>`; document.getElementById('startOAuthBtn')?.addEventListener('click', () => { const provider = selectedConnector === 'github' ? 'github' : selectedConnector === 'gmail' ? 'google' : null; if (!provider) { connectorStatus.textContent = 'هذا التطبيق يحتاج إعداد OAuth خاصًا به في Worker.'; return; } window.location.href = `${apiBase()}/api/auth/${provider}/start`; }); }
document.querySelectorAll('.connector-row').forEach(row => row.querySelector('.connector-toggle')?.addEventListener('dblclick', () => openConnectorConfig(row.dataset.connector)));
document.querySelectorAll('.connector-row').forEach(row => { const original = row.querySelector('.connector-toggle'); if (original && !row.querySelector('.connector-config-button')) { const configure = document.createElement('button'); configure.className = 'connector-config-button'; configure.textContent = 'إعداد'; configure.addEventListener('click', () => openConnectorConfig(row.dataset.connector)); original.after(configure); } });
document.querySelectorAll('.connector-method').forEach(button => button.addEventListener('click', () => { selectedMethod = button.dataset.method; document.querySelectorAll('.connector-method').forEach(item => item.classList.toggle('active', item === button)); renderConnectorFields(JSON.parse(localStorage.getItem(`mx1_connector_${selectedConnector}`) || '{}')); }));
document.getElementById('connectorConfigClose')?.addEventListener('click', () => { if (connectorModal) connectorModal.hidden = true; });
document.getElementById('connectorConfigSave')?.addEventListener('click', () => { const value = document.getElementById('connectorSecretInput')?.value || ''; const endpoint = document.getElementById('connectorEndpointInput')?.value || ''; localStorage.setItem(`mx1_connector_${selectedConnector}`, JSON.stringify({ method: selectedMethod, value, endpoint, configured: true })); connectorStatus.textContent = 'تم حفظ إعداد الموصل على هذا الجهاز؛ يلزم ربط Worker لتشغيله داخل MX2 وMX3.'; if (connectorModal) connectorModal.hidden = true; });


// شريط النشر السفلي وقائمة أنواع المحتوى
const publishMenu = document.getElementById('publishMenu'); const publishBackdrop = document.getElementById('publishBackdrop');
function togglePublishMenu(open) { if (!publishMenu) return; publishMenu.hidden = !open; if (publishBackdrop) publishBackdrop.hidden = !open; }
document.getElementById('openPublishBtn')?.addEventListener('click', () => togglePublishMenu(publishMenu?.hidden));
publishBackdrop?.addEventListener('click', () => togglePublishMenu(false));
document.querySelectorAll('.publish-option').forEach(option => option.addEventListener('click', () => { const choice = option.dataset.publishChoice; togglePublishMenu(false); if (choice === 'text') { openPanel('homePanel'); document.getElementById('homePanel')?.classList.add('composer-open'); document.querySelector('.publish-type[data-publish-type="text"]')?.click(); document.getElementById('publishInput')?.focus(); } else if (choice === 'image') { openPanel('homePanel'); document.getElementById('homePanel')?.classList.add('composer-open'); document.querySelector('.publish-type[data-publish-type="image"]')?.click(); } else if (choice === 'video') { openPanel('homePanel'); document.getElementById('homePanel')?.classList.add('composer-open'); document.querySelector('.publish-type[data-publish-type="video"]')?.click(); document.getElementById('videoInput')?.click(); } else { openPanel('homePanel'); document.getElementById('homePanel')?.classList.add('composer-open'); document.querySelector('.publish-type[data-publish-type="zip"]')?.click(); } }));


document.querySelectorAll('.mini-ai-card').forEach(card => card.addEventListener('click', async () => { openPanel('aiPanel'); const panel = document.getElementById('aiPanel'); try { if (panel && !document.fullscreenElement) await panel.requestFullscreen?.(); } catch {} }));

// أوامر الشريط المصغر الإضافي؛ يعيد استخدام أحداث MX1 الأصلية ولا يستبدلها
const miniPublishButton = document.getElementById('openPublishBtn2');
miniPublishButton?.addEventListener('click', () => document.getElementById('openPublishBtn')?.click());
document.getElementById('miniMessageSend')?.addEventListener('click', () => {
  const miniInput = document.getElementById('miniMessageInput'); const message = miniInput?.value.trim(); if (!message) return;
  document.getElementById('mx2HeaderBtn')?.click();
  window.setTimeout(() => { const input = document.getElementById('xm2Input'); if (input) { input.value = message; document.getElementById('xm2Send')?.click(); } }, 60);
  if (miniInput) miniInput.value = '';
});
document.getElementById('miniMessageInput')?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); document.getElementById('miniMessageSend')?.click(); } });
document.getElementById('miniShareBtn')?.addEventListener('click', async () => { try { if (navigator.share) await navigator.share({ title:'MX1', text:'MX1 — مساحة النشر الذكية', url:window.location.href }); else await navigator.clipboard.writeText(window.location.href); } catch {} });

// وضعا العرض: اجتماعي للصور/المقالات وفيديو عمودي للفيديوهات
const setFeedMode = mode => { document.body.classList.toggle('mx1-video-mode', mode === 'video'); document.querySelectorAll('[data-feed-mode]').forEach(button => button.classList.toggle('active', button.dataset.feedMode === mode)); localStorage.setItem('mx1_feed_mode', mode); };
document.querySelectorAll('[data-feed-mode]').forEach(button => button.addEventListener('click', () => setFeedMode(button.dataset.feedMode)));
setFeedMode(localStorage.getItem('mx1_feed_mode') || 'social');
const videoInput = document.getElementById('videoInput');
videoInput?.addEventListener('change', () => { const file = videoInput.files?.[0]; const preview = document.getElementById('publishPreview'); if (!file || !preview) return; const url = URL.createObjectURL(file); preview.innerHTML = `<video class="publish-video-preview" src="${url}" controls playsinline></video><span>${file.name}</span>`; document.body.classList.add('mx1-video-mode'); });

// موجز MX1 المحلي: يعرض المنشور فورًا داخل المساحة الوسطى، مع بقاء الرفع إلى Worker قائمًا
const localPostKey = 'mx1_local_posts_v1';
const readLocalPosts = () => { try { return JSON.parse(localStorage.getItem(localPostKey) || '[]'); } catch { return []; } };
const writeLocalPosts = posts => localStorage.setItem(localPostKey, JSON.stringify(posts.slice(0, 40)));
const postText = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function renderLocalPosts() { const feed = document.getElementById('postFeed'); if (!feed) return; const posts = readLocalPosts(); feed.innerHTML = posts.map(post => { const media = post.kind === 'image' && post.url ? `<img class="social-post-media" src="${post.url}" alt="${postText(post.name)}">` : post.kind === 'video' && post.url ? `<video class="social-post-media" src="${post.url}" controls playsinline></video>` : ''; const file = post.kind === 'file' ? `<div class="social-file"><i class="fa-solid fa-file-zipper"></i><span>${postText(post.name)}</span></div>` : ''; return `<article class="social-post-card ${post.kind === 'video' ? 'video-post-card' : ''}"><header class="social-post-head"><span class="social-avatar"><i class="fa-solid fa-user"></i></span><span><strong>${postText(post.author || 'مالك مساحة MX1')}</strong><small>${postText(post.time || 'الآن')} · MX1</small></span></header>${post.kind === 'text' ? `<p class="social-post-text">${postText(post.text).replace(/\n/g,'<br>')}</p>` : ''}${media}${file}${post.caption ? `<p class="social-post-caption">${postText(post.caption)}</p>` : ''}<footer class="social-post-actions"><button type="button"><i class="fa-regular fa-heart"></i> إعجاب</button><button type="button"><i class="fa-regular fa-comment"></i> تعليق</button><button type="button"><i class="fa-solid fa-share"></i> مشاركة</button></footer></article>`; }).join(''); const activity = document.querySelector('#homePanel .activity-card'); if (activity) activity.style.display = posts.length ? 'none' : ''; }
function captureLocalPost() { const active = document.querySelector('.publish-type.active'); const kind = active?.dataset.publishType || 'text'; const text = document.getElementById('publishInput')?.value.trim() || ''; const image = document.getElementById('imageInput')?.files?.[0]; const video = document.getElementById('videoInput')?.files?.[0]; const zip = document.getElementById('zipInput')?.files?.[0]; const file = kind === 'image' ? image : kind === 'video' ? video : kind === 'zip' ? zip : null; if (kind === 'text' && !text) return; if (kind !== 'text' && !file) return; const post = { id: Date.now(), kind: kind === 'zip' ? 'file' : kind, text, caption: text, name: file?.name || 'منشور نصي', author: localStorage.getItem('mx1_profile_name') || 'مالك مساحة MX1', time: new Date().toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' }), url: file && (kind === 'image' || kind === 'video') ? URL.createObjectURL(file) : '' }; const posts = readLocalPosts(); posts.unshift(post); writeLocalPosts(posts); renderLocalPosts(); document.getElementById('homePanel')?.classList.add('composer-open'); }
document.getElementById('publishBtn')?.addEventListener('click', () => window.setTimeout(captureLocalPost, 90));
renderLocalPosts();

// تنظيم Instagram التراكمي: تبويبات المنشورات، الإضافة، النشاط، والمشاركة
const setGridFilter = filter => { document.querySelectorAll('.grid-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.gridFilter === filter)); document.querySelectorAll('#postFeed .social-post-card').forEach(card => { card.hidden = filter !== 'all' && !card.classList.contains(`${filter}-post-card`) && !(filter === 'file' && card.querySelector('.social-file')); }); };
document.querySelectorAll('[data-grid-filter]').forEach(tab => tab.addEventListener('click', () => setGridFilter(tab.dataset.gridFilter)));
document.getElementById('emptyPublishBtn')?.addEventListener('click', () => document.getElementById('openPublishBtn')?.click());
document.getElementById('profileShareBtn')?.addEventListener('click', async () => { try { if (navigator.share) await navigator.share({ title:'MX1', text:'مساحة MX1', url:window.location.href }); else await navigator.clipboard.writeText(window.location.href); } catch {} });
document.getElementById('publishOptionConnect')?.addEventListener('click', event => { event.stopImmediatePropagation(); document.getElementById('publishBackdrop')?.setAttribute('hidden',''); document.getElementById('connectorBtn')?.click(); }, true);
const updatePostCount = () => { const count = document.querySelectorAll('#postFeed .social-post-card').length; const el = document.getElementById('postCount'); if (el) el.textContent = String(count); };
const existingRenderLocalPosts = window.renderLocalPosts;
if (typeof existingRenderLocalPosts === 'function') { existingRenderLocalPosts(); }
updatePostCount();


// مركز الموصلات المتقدم — إضافة تراكمية لا تستبدل القائمة القديمة
(() => {
  const hub = document.getElementById('connectorHubPanel');
  const grid = document.getElementById('hubConnectorGrid');
  if (!hub || !grid) return;
  const baseCatalog = [
    ['github','GitHub','المستودعات والملفات','fa-brands fa-github','devtools'],
    ['gmail','Gmail','البريد والبحث','fa-solid fa-envelope','productivity'],
    ['cloudflare','Cloudflare','Workers وD1 وKV','fa-solid fa-cloud','deploy'],
    ['workers','Cloudflare Workers','النشر والـ bindings','fa-solid fa-cloud-arrow-up','deploy'],
    ['firecrawl','Firecrawl','استخراج صفحات الويب','fa-solid fa-fire','devtools'],
    ['clickhouse','ClickHouse','الاستعلامات والتحليلات','fa-solid fa-chart-column','database'],
    ['cloudinary','Cloudinary','الصور والملفات','fa-solid fa-images','storage'],
    ['cockroachdb','CockroachDB Cloud','قواعد البيانات','fa-solid fa-database','database'],
    ['shopify','Shopify','المتجر والمنتجات','fa-brands fa-shopify','productivity']
  ];
  const domCatalog = [...document.querySelectorAll('.connector-row')].map(row => { const id = row.dataset.connector; const name = row.querySelector('strong')?.textContent || id; const description = row.querySelector('small')?.textContent || 'خدمة متصلة'; const icon = row.querySelector('.app-icon')?.className || 'fa-solid fa-plug'; const category = row.dataset.category || 'productivity'; return [id,name,description,icon,category]; }); const catalog = [...baseCatalog, ...domCatalog];
  const uniqueCatalog = [...new Map(catalog.map(item => [item[0], item])).values()];
  const hubActiveConnectors = new Set(JSON.parse(localStorage.getItem('mx1_connectors') || '[]'));
  const showHubPanel = () => { document.querySelectorAll('.home-panel,.workspace-panel').forEach(panel => panel.classList.toggle('panel-active', panel.id === 'connectorHubPanel')); };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const savedConfig = id => { try { return JSON.parse(localStorage.getItem(`mx1_connector_${id}`) || '{}'); } catch { return {}; } };
  const renderHub = () => {
    const query = (document.getElementById('hubConnectorSearch')?.value || '').trim().toLowerCase();
    const filter = document.querySelector('.hub-filter.active')?.dataset.hubFilter || 'all';
    const visible = uniqueCatalog.filter(([id,name,description,icon,category]) => (filter === 'all' || category === filter) && (`${name} ${description} ${id}`.toLowerCase().includes(query)));
    grid.innerHTML = visible.map(([id,name,description,icon,category]) => {
      const active = hubActiveConnectors.has(id); const config = savedConfig(id); const ready = Boolean(config.configured || active); const stateText = active ? 'متصل بسياق MX2 وMX3' : config.configured ? 'مهيأ — يحتاج تفعيل' : 'غير مهيأ';
      return `<article class="hub-connector-card ${active ? 'connected' : ''}" data-hub-connector="${id}" data-category="${category}"><span class="hub-connector-icon"><i class="${icon}"></i></span><div><strong>${safe(name)}</strong><small>${safe(description)}</small></div><div class="hub-connector-actions"><button class="hub-configure" data-connector-id="${id}" title="إعداد ${safe(name)}"><i class="fa-solid fa-sliders"></i></button><button class="hub-toggle ${active ? 'primary' : ''}" data-connector-id="${id}">${active ? 'مفعّل' : 'تفعيل'}</button></div><div class="hub-connector-meta"><span class="hub-status-dot"></span><span>${stateText}</span>${ready ? '<span>·</span><span>حالة محفوظة</span>' : ''}</div></article>`;
    }).join('') || '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>لا توجد خدمة مطابقة</p><small>جرّب اسم التطبيق أو غيّر التصنيف.</small></div>';
    const count = document.getElementById('hubConnectorCount'); if (count) count.textContent = String(hubActiveConnectors.size);
    document.querySelectorAll('.hub-toggle').forEach(button => button.addEventListener('click', () => { const id = button.dataset.connectorId; if (!id) return; hubActiveConnectors.has(id) ? hubActiveConnectors.delete(id) : hubActiveConnectors.add(id); localStorage.setItem('mx1_connectors', JSON.stringify([...hubActiveConnectors])); renderHub(); }));
    document.querySelectorAll('.hub-configure').forEach(button => button.addEventListener('click', () => document.querySelector(`.connector-row[data-connector="${button.dataset.connectorId}"] .connector-config-button`)?.click()));
    document.querySelectorAll('.hub-test').forEach(button => button.addEventListener('click', async () => { const id = button.dataset.connectorId; const config = savedConfig(id); if (!config.endpoint) { button.textContent = 'أضف Endpoint أولًا'; setTimeout(() => { button.innerHTML = '<i class="fa-solid fa-plug-circle-check"></i>'; }, 1800); return; } button.disabled = true; try { const response = await fetch(`${config.endpoint.replace(/\/$/, '')}/api/status`); button.textContent = response.ok ? 'متصل' : `HTTP ${response.status}`; } catch { button.textContent = 'فشل'; } finally { setTimeout(() => { button.innerHTML = '<i class="fa-solid fa-plug-circle-check"></i>'; button.disabled = false; }, 1800); } }));
  };
  window.mx1RenderConnectorHub = renderHub;
  const head = document.querySelector('.connector-menu-head');
  if (head && !document.getElementById('openConnectorHubBtn')) { const button = document.createElement('button'); button.id = 'openConnectorHubBtn'; button.className = 'secondary-button'; button.style.height = '32px'; button.style.padding = '0 9px'; button.textContent = 'المركز'; button.addEventListener('click', () => { const menu = document.getElementById('connectorMenu'); if (menu) menu.hidden = true; showHubPanel(); renderHub(); }); head.appendChild(button); }
  document.getElementById('hubConnectorSearch')?.addEventListener('input', renderHub);
  document.querySelectorAll('.hub-filter').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.hub-filter').forEach(item => item.classList.toggle('active', item === button)); renderHub(); }));
  document.getElementById('hubRefreshBtn')?.addEventListener('click', renderHub);
  document.getElementById('connectorBtn')?.addEventListener('dblclick', () => { const menu = document.getElementById('connectorMenu'); if (menu) menu.hidden = true; showHubPanel(); renderHub(); });
  renderHub();
})();
