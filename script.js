document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const modelSelect = document.getElementById('modelSelect');

    if (sendBtn) {
        sendBtn.addEventListener('click', handleUserMessage);
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });
    }

    function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        const selectedModel = modelSelect ? modelSelect.options[modelSelect.selectedIndex].text : 'MXAI Enterprise';

        appendMessage(text, 'user');
        userInput.value = '';
        
        const botMsgId = 'bot-' + Date.now();
        appendLoadingMessage(botMsgId, selectedModel);

        setTimeout(() => {
            let dynamicReply = generateAdvancedReply(text);
            updateBotMessage(botMsgId, dynamicReply);
        }, 1000);
    }

    function generateAdvancedReply(query) {
        const q = query.toLowerCase();
        
        if (q.includes('تاريخ') || q.includes('اليوم') || q.includes('يوم')) {
            return `تاريخ اليوم هو **الجمعة، 4 سبتمبر 2026**. النظام يعمل بكفاءة وأمان تام عبر شبكة MXAI الححابية.`;
        } else if (q.includes('cloudflare') || q.includes('كلودفلير')) {
            return `تم تصميم واجهة **MXAI** هنا لتلهم المعايير التقنية المتقدمة لـ Cloudflare: سرعة فائقة، أمان موثوق، وتصميم بصري داكن مريح للعين ومناسب للمطورين.`;
        } else if (q.includes('برمجة') || q.includes('كود') || q.includes('system')) {
            return `بصفتي مساعد البنية التحتية الذكية في MXAI، أنا جاهز لتدقيق الأكواد، فحص الثغرات، وتحسين أداء السيرفرات لديك. ما هي المشكلة التقنية التي تواجهها؟`;
        } else {
            return `تم استلام الطلب بنجاح وتحليله عبر خوارزميات **MXAI**: <br><code style="background:#111827; padding:4px 8px; border-radius:4px; color:#f38020;">${escapeHtml(query)}</code><br><br>كيف يمكنني مساعدتك بشكل عميق في هذا المشروع التقني؟`;
        }
    }

    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (sender === 'user') {
            messageDiv.classList.add('user-message');
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${escapeHtml(text)}
                </div>
            `;
        } else {
            messageDiv.classList.add('bot-message');
            messageDiv.innerHTML = `
                <div class="message-avatar"><i class="fa-solid fa-cloud"></i></div>
                <div class="message-content">
                    ${text}
                </div>
            `;
        }
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function appendLoadingMessage(id, modelName) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        messageDiv.id = id;
        messageDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid fa-cloud fa-spin"></i></div>
            <div class="message-content" style="color: var(--text-muted);">
                جارٍ المعالجة الآمنة عبر ${modelName}...
            </div>
        `;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function updateBotMessage(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.querySelector('.message-content').innerHTML = text;
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
});
