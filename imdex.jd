<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>منصة MXAI - الذكاء الاصطناعي المتقدم</title>
    <!-- روابط التنسيق والخطوط -->
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>

    <div class="app-container">
        <!-- الشريط الجانبي (Sidebar) -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2><i class="fa-solid fa-brain"></i> MXAI Studio</h2>
                <button class="new-chat-btn" id="newChatBtn">
                    <i class="fa-solid fa-plus"></i> محادثة جديدة
                </button>
            </div>

            <div class="conversations-list" id="conversationsList">
                <!-- يتم حقن المحادثات السابقة هنا برمجياً -->
                <div class="conversation-item active">
                    <i class="fa-regular fa-message"></i>
                    <span>محادثة افتراضية أولى</span>
                </div>
            </div>

            <div class="sidebar-footer">
                <div class="user-profile">
                    <i class="fa-solid fa-user-circle"></i>
                    <span>حساب المستخدم</span>
                </div>
            </div>
        </aside>

        <!-- منطقة الدردشة الرئيسية (Main Chat Area) -->
        <main class="chat-main">
            <!-- شريط علوي -->
            <header class="chat-header">
                <button class="menu-toggle" id="menuToggle">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div class="model-selector-container">
                    <label for="modelSelect"><i class="fa-solid fa-microchip"></i> النموذج:</label>
                    <select id="modelSelect" class="model-select">
                        <option value="gpt-4">GPT-4 Turbo (متقدم)</option>
                        <option value="claude-3">Claude 3 Opus (تحليلي)</option>
                        <option value="gemini-pro">Gemini Pro (متعدد الوسائط)</option>
                    </select>
                </div>
                <div class="header-actions">
                    <button title="إعدادات متقدمة"><i class="fa-solid fa-gear"></i></button>
                </div>
            </header>

            <!-- صندوق عرض الرسائل -->
            <div class="chat-box" id="chatBox">
                <div class="bot-message message">
                    <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="message-content">
                        مرحباً بك في منصة <strong>MXAI</strong> الذكية. كيف يمكنني مساعدتك اليوم؟
                    </div>
                </div>
            </div>

            <!-- حقل الإدخال والتحكم -->
            <div class="chat-input-container">
                <div class="input-wrapper">
                    <textarea id="userInput" placeholder="اكتب رسالتك أو استفسارك هنا..." rows="1"></textarea>
                    <div class="input-actions">
                        <button type="button" title="إرفاق ملف"><i class="fa-solid fa-paperclip"></i></button>
                        <button type="button" title="تسجيل صوتي"><i class="fa-solid fa-microphone"></i></button>
                        <button id="sendBtn" type="button" title="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
                <div class="disclaimer">منصة MXAI للذكاء الاصطناعي - قد تتولد معلومات غير دقيقة أحياناً، يرجى التحقق من النتائج المهمة.</div>
            </div>
        </main>
    </div>

    <!-- ملف السكريبت الخارجي -->
    <script src="script.js"></script>
</body>
</html>
