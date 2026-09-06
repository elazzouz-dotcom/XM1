document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const feedBox = document.getElementById('feedBox');
    const modelSelect = document.getElementById('modelSelect');

    if (!feedBox || !userInput) return;

    if (sendBtn) {
        sendBtn.addEventListener('click', handleUserMessage);
    }

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    });

    function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        const selectedModel = modelSelect && modelSelect.selectedIndex >= 0
            ? modelSelect.options[modelSelect.selectedIndex].text
            : 'MXAI Enterprise';

        appendMessage(text, 'user');
        userInput.value = '';

        const botMsgId = 'bot-' + Date.now();
        appendLoadingMessage(botMsgId, selectedModel);

        setTimeout(() => {
            updateBotMessage(botMsgId, generateAdvancedReply(text));
        }, 1000);
    }

    function generateAdvancedReply(query) {
        const q = query.toLowerCase();

        if (q.includes('تاريخ') || q.includes('اليوم') || q.includes('يوم')) {
            const today = new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' });
            return `تاريخ اليوم هو <strong>${escapeHtml(today)}</strong>. النظام يعمل بكفاءة وأمان تام عبر شبكة MXAI السحابية.`;
        } else if (q.includes('cloudflare') || q.includes('كلودفلير')) {
            return `تم تصميم واجهة <strong>MXAI</strong> هنا لتلهم المعايير التقنية المتقدمة لـ Cloudflare: سرعة فائقة، أمان موثوق، وتصميم بصري داكن مريح للعين ومناسب للمطورين.`;
        } else if (q.includes('برمجة') || q.includes('كود') || q.includes('system')) {
            return `بصفتي مساعد البنية التحتية الذكية في MXAI، أنا جاهز لتدقيق الأكواد، فحص الثغرات، وتحسين أداء السيرفرات لديك. ما هي المشكلة التقنية التي تواجهها؟`;
        }
        return `تم استلام الطلب بنجاح وتحليله عبر خوارزميات <strong>MXAI</strong>: <br><code style="background:#111827; padding:4px 8px; border-radius:4px; color:#f38020;">${escapeHtml(query)}</code><br><br>كيف يمكنني مساعدتك بشكل عميق في هذا المشروع التقني؟`;
    }

    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'feed-message user' : 'feed-message ai';
        messageDiv.innerHTML = sender === 'user'
            ? `<strong>أنت:</strong> ${escapeHtml(text)}`
            : `<strong>نظام MXAI:</strong> ${text}`;
        appendToFeed(messageDiv);
    }

    function appendLoadingMessage(id, modelName) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'feed-message ai';
        messageDiv.id = id;
        messageDiv.innerHTML = `<strong>نظام MXAI:</strong> <span class="message-content" style="color: var(--text-muted);">جارٍ المعالجة الآمنة عبر ${escapeHtml(modelName)}...</span>`;
        appendToFeed(messageDiv);
    }

    function updateBotMessage(id, html) {
        const element = document.getElementById(id);
        if (element) {
            const content = element.querySelector('.message-content');
            if (content) {
                content.style.color = '';
                content.innerHTML = html;
            }
        }
        feedBox.scrollTop = feedBox.scrollHeight;
    }

    function appendToFeed(messageDiv) {
        feedBox.appendChild(messageDiv);
        feedBox.scrollTop = feedBox.scrollHeight;
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }
});
