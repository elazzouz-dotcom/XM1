document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const text = input.value.trim();
    if (!text) return;

    // إضافة رسالة المستخدم
    chatBox.innerHTML += `
        <div class="message" style="align-self: flex-end; background: #0284c7; color: white; padding: 12px 16px; border-radius: 12px; max-width: 80%; margin: 5px 0;">
            ${text}
        </div>
    `;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // محاكاة أو ربط الذكاء الاصطناعي المجاني
    const botMsgId = 'bot-' + Date.now();
    chatBox.innerHTML += `
        <div id="${botMsgId}" class="message bot-message" style="align-self: flex-start; background: #1e293b; color: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #334155; max-width: 80%; margin: 5px 0;">
            جاري التفكير...
        </div>
    `;
    
    try {
        // استخدام خدمة بديلة أو محاكاة ذكية متكاملة للمنصة
        setTimeout(() => {
            document.getElementById(botMsgId).innerHTML = `أهلاً بك في MXAI. بصفتي نموذج ذكاء اصطناعي متطور، أستطيع مساعدتك في الإجابة على استفسارك بشأن: "${text}"`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    } catch (error) {
        document.getElementById(botMsgId).innerHTML = "عذراً، حدث خطأ في الاتصال بالخادم.";
    }
}
