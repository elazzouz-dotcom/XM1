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

        // إضافة رسالة المستخدم للدردشة
        appendMessage(text, 'user');
        userInput.value = '';
        
        // محاكاة رد الذكاء الاصطناعي بناءً على النموذج المحدد
        showTypingIndicator(selectedModel);
    }

    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (sender === 'user') {
            messageDiv.style.alignSelf = 'flex-end';
            messageDiv.innerHTML = `
                <div class="message-content" style="background-color: #0284c7; color: white; padding: 12px 16px; border-radius: 12px; max-width: 100%;">
                    ${escapeHtml(text)}
                </div>
            `;
        } else {
            messageDiv.classList.add('bot-message');
            messageDiv.style.alignSelf = 'flex-start';
            messageDiv.innerHTML = `
                <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-content">
                    ${text}
                </div>
            `;
        }
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showTypingIndicator(modelName) {
        const typingId = 'typing-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot-message');
        messageDiv.id = typingId;
        messageDiv.style.alignSelf = 'flex-start';
        messageDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-content" style="color: #94a3b8;">
                جاري التوليد باستخدام ${modelName}...
            </div>
        `;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        setTimeout(() => {
            const typingElement = document.getElementById(typingId);
            if (typingElement) {
                typingElement.remove();
            }
            appendMessage(`أهلاً بك. أنا نموذج الذكاء الاصطناعي في منصة <strong>MXAI</strong>. لقد تلقيت استفسارك بنجاح وأنا هنا لمساعدتك بكفاءة عالية!`, 'bot');
        }, 1200);
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
});
