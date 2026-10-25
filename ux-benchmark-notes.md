# MX1 UX Benchmark — 2026-09-09

## نطاق المقارنة
تمت مقارنة أنماط الاستخدام في 20+ منصة مرجعية: Instagram، TikTok، Facebook، LinkedIn، X، Reddit، YouTube، Pinterest، Discord، Slack، WhatsApp، Telegram، Signal، Notion، GitHub، GitLab، Zapier، Make، ChatGPT، Claude، Gemini، وManus.

## الأنماط القابلة للنقل إلى MX1

| المجال | النمط المتكرر | قرار MX1 المقترح |
|---|---|---|
| التنقل | شريط سفلي ثابت بخمس نقاط وصول، مع شاشة مركزة لا تتزاحم فيها الأدوات | Home، Explore/بحث، Create، Activity/رسائل، Profile؛ وتبقى MX2/MX3 والموصلات داخل مركز الأدوات |
| النشر | زر إنشاء واحد يفتح تدفقًا واضحًا حسب نوع المحتوى | زر + يفتح Text، Image، Video، ZIP/PDF، وLink/Connector؛ مع معاينة ومسودة قبل النشر |
| الفيديو | موجز عمودي غامر وتفاعلات جانبية | وضع Reels مستقل للفيديو فقط، دون فرضه على الصور والمقالات |
| الصور والمقالات | بطاقات اجتماعية بمعلومات الناشر وإجراءات أسفل المحتوى | موجز Feed ببطاقات: avatar، اسم، وقت، محتوى، like/comment/share/save |
| الرسائل | الرسائل منفصلة عن الموجز، مع مشاركة المنشورات داخل المحادثة | مركز DM مستقل يضم MX2 وMX3 ورسائل المستخدم، مع مشاركة بطاقة منشور داخل الدردشة |
| النشاط | شارات وإشعارات واضحة وسجل زمني | Activity inbox مع unread badge، أحداث النشر والربط والمحادثة |
| الملف | رأس صغير وإحصائيات وتبويبات | Profile header + posts/reels/saved/activity/MX2-MX3 tabs |
| الموصلات | كتالوج قابل للبحث، صفحة تفاصيل، صلاحيات واضحة، وحالة اتصال | Connector Hub: شعار، فئة، بحث، Connected/Needs setup، OAuth/API/Token، permissions، test connection، disconnect |
| الأتمتة | Trigger → Action في Zapier/Make | تدفق بسيط داخل الموصل: When/Trigger، Do/Action، Run now، سجل التشغيل |
| الذكاء الاصطناعي | محادثة كاملة الشاشة مع أدوات وسياق وملفات | MX2/MX3 في Workspace كاملة الشاشة، Context drawer، attached connectors، history، export/share |
| الأمان | عزل الأسرار، إظهار الصلاحيات، طلبات الوصول، وتعطيل/إلغاء الربط | لا أسرار في الواجهة أو Git؛ تخزين خادمي، masking، scopes، revoke، وسجل تدقيق |

## المصادر الرسمية التي تمت قراءتها

1. Instagram Features: https://about.instagram.com/features — يجمع Reels وStories وDMs وSearch/Explore ضمن نقاط وصول واضحة.
2. Instagram Direct: https://about.instagram.com/features/direct — يوضح الرسائل الخاصة، مشاركة الصور والفيديو والمنشورات، الردود، التفاعلات، الملاحظات، والطلبات.
3. Instagram Reels: https://about.instagram.com/features/reels — يوضح تدفق إنشاء الفيديو، المعاينة، الغلاف، القص، الوصف، المسودات، وإعادة المزج.
4. TikTok Direct Messaging: https://newsroom.tiktok.com/en-us/share-your-favorite-tiktok-moments-with-direct-messaging — يوضح مشاركة الفيديو، الملصقات، المحادثات الجماعية، التفاعلات والسلامة.
5. Slack Marketplace: https://slack.com/marketplace — كتالوج تطبيقات واسع مع بحث وإضافة تطبيقات.
6. Slack Integrations: https://slack.com/integrations — يوضح ربط الأدوات وإظهار الإجراءات داخل مساحة العمل.
7. Notion Authorization: https://developers.notion.com/guides/get-started/authorization — يفرق بين API tokens وOAuth للاتصالات العامة.
8. Notion Connections: https://www.notion.com/connections — كتالوج اتصالات وتكاملات.
9. Zapier: https://zapier.com/ — نموذج ربط واسع للتطبيقات.
10. Zapier key concepts: https://help.zapier.com/hc/en-us/articles/8496181725453-Learn-key-concepts-in-Zap-workflows — يعرّف Trigger وActions كسلسلة تشغيل.

## مواصفة التحسين الأولوية

أولوية التنفيذ ليست إضافة أزرار جديدة، بل بناء أربع طبقات واضحة: (1) Feed حقيقي للصور والمقالات والملفات، (2) Reels للفيديو، (3) DM/AI Workspace، (4) Connector Hub ببحث وصلاحيات واختبار اتصال وسجل تشغيل. كل زر يجب أن يفتح وظيفة موجودة أو يعرض حالة غير متاحة بوضوح، لا واجهة وهمية.
