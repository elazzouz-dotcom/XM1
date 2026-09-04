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

        const selectedModel = modelSelect ? modelSelect.options[modelSelect.selectedIndex].text : 'MXAI Model';

        appendMessage(text, 'user');
        userInput.value = '';
        
        const botMsgId = 'bot-' + Date.now();
        appendLoadingMessage(botMsgId, selectedModel);

        setTimeout(() => {
            let reply = generateSmartReply(text);
            updateBotMessage(botMsgId, reply);
        }, 1000);
    }

    function generateSmartReply(query) {
        const q = query.toLowerCase();
        if (q.includes('تاريخ') || q.includes('اليوم') || q.includes('وقت')) {
            return `اليوم هو الجمعة، 4 سبتمبر 2026. الوقت الحالي هو المساء. كيف يمكنني مساعدتك أكثر؟`;
        } else if (q.includes('من أنت') || q.includes('اسمك')) {
            return `أنا نموذج الذكاء الاصطناعي المطور لمنصة **MXAI**، مصمم لمساعدتك في البرمجة، الإجابة على الأسئلة، وإدارة المهام بكفاءة عالية.`;
        } else {
            return `بناءً على استفسارك حول ("${query}")، تقدم لك منصة **MXAI** تحليلاً متكاملاً. هذا استجابة تجريبية ذكية ومستقرة تماماً للعمل مباشرة على صفحتك في GitHub Pages.`;
        }
    }

    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (sender === 'user') {
            messageDiv.style.alignSelf = 'flex-end';
            messageDiv.innerHTML = `<div class="message-content" style="background-color: #0284c7; color: white; padding: 12px 16px; border-radius: 12px; max-width: 100%;">${escapeHtml(text)}</div>`;
        } else {
            messageDiv.classList.add('bot-message');
            messageDiv.style.alignSelf = 'flex-start';
            messageDiv.innerHTML = `<div class="message-avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content">${text}</div>`;
        }
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function appendLoadingMessage(id, modelName) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        messageDiv.id = id;
        messageDiv.style.alignSelf = 'flex-start';
        messageDiv.innerHTML = `<div class="message-avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content" style="color: #94a3b8;">جاري المعالجة باستخدام ${modelName}...</div>`;
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
