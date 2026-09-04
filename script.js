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

        // عرض رسالة المستخدم
        appendMessage(text, 'user');
        userInput.value = '';
        
        const botMsgId = 'bot-' + Date.now();
        appendLoadingMessage(botMsgId, selectedModel);

        // محاكاة معالجة ذكية ومتغيرة بناءً على نص السؤال الفعلي
        setTimeout(() => {
            let dynamicReply = generateDynamicReply(text);
            updateBotMessage(botMsgId, dynamicReply);
        }, 1200);
    }

    function generateDynamicReply(query) {
        const q = query.toLowerCase();
        
        if (q.includes('تاريخ') || q.includes('اليوم') || q.includes('يوم')) {
            return `اليوم هو **الجمعة، 4 سبتمبر 2026**. أتمنى لك يوماً موفقاً ورائعاً!`;
        } else if (q.includes('ساعة') || q.includes('وقت') || q.includes('الساعة')) {
            return `الوقت الحالي هو المساء بتوقيت منصة MXAI. كيف يمكنني مساعدتك في جدول أعمالك؟`;
        } else if (q.includes('من أنت') || q.includes('ما هو أنت') || q.includes('اسمك')) {
            return `أنا النظام الذكي المتطور لمنصة **MXAI**، ومهمتي هي تحليل نصوصك، مساعدتك في البرمجة، والرد على استفساراتك بكفاءة ودقة عالية.`;
        } else if (q.includes('برمجة') || q.includes('كود') || q.includes('html') || q.includes('javascript')) {
            return `بصفتي مساعداً برمجياً في منصة **MXAI**، أنا جاهز لمراجعة الأكواد البرمجية، اكتشاف الأخطاء، أو كتابة سكربتات جديدة ومتقدمة لك. ما اللغة التي تعمل عليها حالياً؟`;
        } else {
            // رد ذكي ومتغير لكل سؤال عشوائي يتم إدخاله لمنع تكرار نفس الرسالة
            return `لقد استلمت استفسارك بعناية: <br><q style="color: #38bdf8;">${escapeHtml(query)}</q><br><br>بناءً على تحليل البيانات في منصة **MXAI**، هذا الموضوع يحمل جوانب متعددة تتطلب التخطيط السليم والتنفيذ الفعال. هل ترغب في أن أساعدك في تفصيل النقاط الأساسية الخاصة به؟`;
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
