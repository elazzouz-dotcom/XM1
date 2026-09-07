document.addEventListener('DOMContentLoaded', () => {
    const state = { assistant: 'cloudflare' }; // cloudflare = MX2, mx3 = المساعد الداخلي
    const xm2Feed = document.getElementById('xm2Feed');
    const xm2Input = document.getElementById('xm2Input');
    const xm2Send = document.getElementById('xm2Send');
    const assistantStatus = document.getElementById('assistantStatus');
    const generalFeed = document.getElementById('feedBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    document.querySelectorAll('.assistant-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.assistant = tab.dataset.assistant;
            document.querySelectorAll('.assistant-tab').forEach(item => item.classList.toggle('active', item === tab));
            const label = state.assistant === 'cloudflare' ? 'MX2 — مساعد Cloudflare' : 'MX3 — المساعد الداخلي';
            assistantStatus.innerHTML = `<span class="status-dot"></span> المسار المحدد: ${label}`;
            appendXm2(`تم التبديل إلى ${label}. اكتب رسالتك في هذا المسار.`, 'ai');
        });
    });

    function appendXm2(text, sender) {
        const item = document.createElement('div');
        item.className = `feed-message ${sender}`;
        item.innerHTML = sender === 'user' ? `<strong>أنت:</strong> ${escapeHtml(text)}` : `<strong>${state.assistant === 'cloudflare' ? 'MX2 / Cloudflare' : 'MX3 / المساعد الداخلي'}:</strong> ${text}`;
        xm2Feed.appendChild(item);
        xm2Feed.scrollTop = xm2Feed.scrollHeight;
    }

    function xm2Reply(text) {
        const q = text.toLowerCase();
        if (state.assistant === 'cloudflare') {
            if (q.includes('worker') || q.includes('cloudflare') || q.includes('نشر')) return 'مسار Cloudflare جاهز لمراجعة Workers وPages وD1 وKV وR2. اربط هذا المسار ببيئة Cloudflare API ذات صلاحية كتابة حتى تتحول الأوامر إلى تغييرات فعلية.';
            if (q.includes('github') || q.includes('مستودع')) return 'يمكن ربط مستودع GitHub بمسار النشر عبر workflow، مع إبقاء إعدادات الأسرار خارج الكود داخل Cloudflare Secrets.';
            return 'تم استلام رسالتك في مسار Cloudflare. هذا الإصدار يحافظ على الفصل بين واجهة XM2 والموصل الخارجي إلى أن يُضاف endpoint موثّق.';
        }
        if (q.includes('كود') || q.includes('برمج') || q.includes('مشروع')) return 'أنا مسار MX3 الداخلي. أستطيع مساعدتك في تحليل بنية المشروع، صياغة التعديلات، وشرح خطوات التنفيذ داخل MX1.';
        return 'تم استلام رسالتك في مسار MX3 الداخلي. اكتب الهدف أو الملف أو المشكلة التي تريد تحليلها وسأرتبها إلى خطوات عملية.';
    }

    function connection() {
        return { base: localStorage.getItem('mx1_api_base') || '', token: localStorage.getItem('mx1_api_token') || '' };
    }
    async function sendXm2() {
        const text = xm2Input.value.trim();
        if (!text) return;
        appendXm2(text, 'user');
        xm2Input.value = '';
        const cfg = connection();
        if (cfg.base) {
            try {
                const response = await fetch(`${cfg.base.replace(/\/$/, '')}/api/mx2/chat`, { method: 'POST', headers: { 'content-type': 'application/json', ...(cfg.token ? { authorization: `Bearer ${cfg.token}` } : {}) }, body: JSON.stringify({ message: text, assistant: state.assistant === 'cloudflare' ? 'mx2' : 'mx3' }) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
                appendXm2(data.response || data.message || 'تم استلام الرد من الخادم.', 'ai');
                return;
            } catch (error) { appendXm2(`تعذر الاتصال بالخادم: ${escapeHtml(error.message)}. تم تشغيل الرد المحلي مؤقتًا.`, 'ai'); }
        }
        window.setTimeout(() => appendXm2(xm2Reply(text), 'ai'), 350);
    }
    xm2Send?.addEventListener('click', sendXm2);
    xm2Input?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendXm2(); } });

    function appendGeneral(text, sender) {
        const item = document.createElement('div');
        item.className = `feed-message ${sender}`;
        item.innerHTML = sender === 'user' ? `<strong>أنت:</strong> ${escapeHtml(text)}` : `<strong>نظام MX1:</strong> ${text}`;
        generalFeed.appendChild(item);
        generalFeed.scrollTop = generalFeed.scrollHeight;
    }
    function sendGeneral() {
        const text = userInput.value.trim();
        if (!text) return;
        appendGeneral(text, 'user');
        userInput.value = '';
        window.setTimeout(() => appendGeneral('تم استلام طلبك في مساحة MX1 العامة. استخدم XM2 إذا أردت تحديد المسار بين Cloudflare وMX2.', 'ai'), 350);
    }
    sendBtn?.addEventListener('click', sendGeneral);

    const apiBaseInput = document.getElementById('apiBaseInput');
    const apiTokenInput = document.getElementById('apiTokenInput');
    const connectionStatus = document.getElementById('connectionStatus');
    const savedBase = localStorage.getItem('mx1_api_base') || '';
    if (apiBaseInput) apiBaseInput.value = savedBase;
    document.getElementById('saveConnectionBtn')?.addEventListener('click', () => {
        localStorage.setItem('mx1_api_base', apiBaseInput?.value.trim() || '');
        localStorage.setItem('mx1_api_token', apiTokenInput?.value.trim() || '');
        if (connectionStatus) connectionStatus.textContent = 'تم الحفظ محليًا';
    });
    document.getElementById('testConnectionBtn')?.addEventListener('click', async () => {
        const base = apiBaseInput?.value.trim().replace(/\/$/, '');
        if (!base) { if (connectionStatus) connectionStatus.textContent = 'أدخل عنوان API أولًا'; return; }
        if (connectionStatus) connectionStatus.textContent = 'جارٍ الاختبار...';
        try { const r = await fetch(`${base}/api/status`); const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); if (connectionStatus) connectionStatus.textContent = `متصل: ${d.platform || 'MX1'}`; }
        catch (error) { if (connectionStatus) connectionStatus.textContent = `فشل الاتصال: ${error.message}`; }
    });
    userInput?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendGeneral(); } });

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
    }
});


// أدوات تجربة الاستخدام في MX1
const fullscreenBtn = document.getElementById('fullscreenBtn');
const mobileNavBtn = document.getElementById('mobileNavBtn');
const sidebar = document.querySelector('.sidebar');
fullscreenBtn?.addEventListener('click', async () => {
    try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
        else await document.exitFullscreen?.();
    } catch (_) { document.body.classList.toggle('fullscreen-mode'); }
});
document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('fullscreen-mode', Boolean(document.fullscreenElement));
    const icon = fullscreenBtn?.querySelector('i');
    if (icon) icon.className = document.fullscreenElement ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
});
mobileNavBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
});
document.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => sidebar?.classList.remove('mobile-open')));
