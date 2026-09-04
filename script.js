document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');

    // مفتاح API مجاني (يمكنك استبداله بمفتاحك الخاص لاحقاً)
    const API_KEY = "YOUR_GEMINI_API_KEY"; 

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

    async function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        userInput.value = '';
        
        const botMsgId = 'bot-' + Date.now();
        appendLoadingMessage(botMsgId);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: text }] }]
                })
            });

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من معالجة الطلب.";
            
            updateBotMessage(botMsgId, reply);
        } catch (error) {
            updateBotMessage(botMsgId, "حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.");
        }
    }

    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (sender === 'user') {
            messageDiv.style.alignSelf = 'flex-end';
            messageDiv.innerHTML = `<div class="message-content" style="background-color: #0284c7; color: white; padding: 12px 16px; border-radius: 12px;">${escapeHtml(text)}</div>`;
        } else {
            messageDiv.classList.add('bot-message');
            messageDiv.style.alignSelf = 'flex-start';
            messageDiv.innerHTML = `<div class="message-avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content">${text}</div>`;
        }
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function appendLoadingMessage(id) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        messageDiv.id = id;
        messageDiv.style.alignSelf = 'flex-start';
        messageDiv.innerHTML = `<div class="message-avatar"><i class="fa-solid fa-robot"></i></div><div class="message-content" style="color: #94a3b8;">جاري التفكير...</div>`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function updateBotMessage(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.querySelector('.message-content').innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
});
