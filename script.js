document.addEventListener('DOMContentLoaded', () => {
  const state = { assistant: 'cloudflare', panel: 'homePanel', history: { cloudflare: [], mx3: [] } };
  const panels = [...document.querySelectorAll('.home-panel,.workspace-panel')];
  const apiBase = () => (localStorage.getItem('mx1_api_base') || '').replace(/\/$/, '');
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
        const response = await fetch(`${base}/api/mx2/chat`, { method: 'POST', headers: {'content-type':'application/json', ...(apiToken() ? {authorization:`Bearer ${apiToken()}`} : {})}, body:JSON.stringify({ message: text, assistant: state.assistant === 'cloudflare' ? 'mx2' : 'mx3', history }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`); const answer = data.response || data.message || 'تم استلام الرد من الخادم.'; appendXm2(answer, 'ai'); history.push({ role: 'assistant', content: answer }); return;
      } catch (error) { appendXm2(`تعذر الوصول إلى الخادم: ${escapeHtml(error.message)}`, 'ai'); return; }
    }
    const answer = state.assistant === 'cloudflare' ? 'MX2 يعمل محليًا. أضف عنوان Worker في الاتصالات لتفعيل الربط الحقيقي مع Cloudflare.' : 'MX3 يعمل محليًا. أضف عنوان API لتفعيل الاتصال بالخدمة الخلفية.'; appendXm2(answer, 'ai'); history.push({ role: 'assistant', content: answer });
  }
  document.getElementById('xm2Send')?.addEventListener('click', sendAssistantMessage);
  document.getElementById('xm2Input')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAssistantMessage(); } });

  document.getElementById('publishBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('publishInput'); const text = input?.value.trim(); const base = apiBase();
    if (!text) { input?.focus(); return; }
    const button = document.getElementById('publishBtn'); button.disabled = true; button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ النشر';
    try {
      if (!base) throw new Error('أضف عنوان API من الإعدادات أولًا');
      const response = await fetch(`${base}/api/agent/execute`, { method:'POST', headers:{'content-type':'application/json', ...(apiToken()?{authorization:`Bearer ${apiToken()}`}:{})}, body:JSON.stringify({ requirement:text, auto_merge:false }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      input.value = ''; alert(`تم إنشاء عملية النشر ${data.id || ''} في وضع المراجعة الآمنة.`);
    } catch (error) { alert(`لم يتم النشر: ${error.message}`); } finally { button.disabled = false; button.innerHTML = '<i class="fa-solid fa-arrow-up"></i> نشر'; }
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
