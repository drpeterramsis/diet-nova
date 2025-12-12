
export interface InstructionItem {
    id: string;
    title: string;
    titleAr: string;
    category: string;
    content: string; // Markdown supported
}

export const instructionsDatabase: InstructionItem[] = [
    {
        id: 'inbody_pre',
        title: 'InBody Measurement Instructions',
        titleAr: 'شروط قياس InBody',
        category: 'Preparation',
        content: `**To ensure accurate results, please adhere to the following conditions:**

1. 🚫 **Fasting:** Do not eat for at least **2 hours** before the measurement.
2. 🏃 **Exercise:** Avoid vigorous exercise for **4 hours** prior to the test.
3. ☕ **Caffeine:** Do not consume coffee or caffeine on the day of the measurement.
4. 💊 **Diuretics:** Stop taking diuretics (water pills) on the day before the measurement.
5. 💧 **Hydration:** Drink sufficient water on the day before and 2 hours prior to the test.
6. 🚺 **Menstruation:** Measurement should not be taken during the menstrual cycle.
7. 🛀 **Cleanliness:** Hands and feet should be clean (no lotion) for conductivity.
8. ⚖️ **Consistency:** Wear light clothing and remove heavy jewelry/accessories.

---

**نسخة عربية:**

**⚠️ شروط هامة لضمان دقة قياس جهاز الـ InBody:**

1. 🚫 **ممنوع الأكل:** الصيام لمدة ساعتين على الأقل قبل القياس.
2. 🏃 **ممنوع التمرين:** تجنب الرياضة العنيفة قبل القياس بـ 4 ساعات.
3. ☕ **ممنوع الكافيين:** تجنب الشاي والقهوة في يوم القياس.
4. 💊 **مدرات البول:** يفضل توقف مدرات البول قبل القياس بيوم (بعد استشارة الطبيب).
5. 💧 **الماء:** شرب كميات كافية من الماء في اليوم السابق، وكوبين قبل القياس بساعتين.
6. 🚺 **الدورة الشهرية:** لا يفضل القياس للسيدات أثناء الدورة الشهرية لاحتباس السوائل.
7. 🚿 **النظافة:** يفضل أن تكون اليدين والقدمين نظيفة وجافة (بدون كريمات) لتوصيل الكهرباء بدقة.
8. ⚖️ **الملابس:** ارتداء ملابس خفيفة ونزع الإكسسوارات المعدنية الثقيلة.
`
    },
    {
        id: 'healthy_eating_gen',
        title: 'General Healthy Eating Guidelines',
        titleAr: 'إرشادات عامة للتغذية الصحية',
        category: 'Lifestyle',
        content: `**Core Principles of Healthy Eating:**

1. 💧 **Hydration:** Drink at least 8-10 cups of water daily.
2. 🥦 **Vegetables:** Include a variety of colorful vegetables in every meal.
3. 🍗 **Protein:** Choose lean protein sources (chicken breast, fish, legumes).
4. 🥑 **Fats:** Limit saturated fats; choose healthy fats like olive oil and nuts in moderation.
5. 🍬 **Sugar:** Minimize added sugars found in sodas, sweets, and processed snacks.
6. ⏰ **Timing:** Try to eat at regular intervals to maintain steady energy levels.
7. 🧂 **Sodium:** Reduce salt intake; use herbs and spices for flavor instead.

---

**نسخة عربية:**

**المبادئ الأساسية للتغذية الصحية:**

1. 💧 **شرب الماء:** شرب ما لا يقل عن 8-10 أكواب يومياً للحفاظ على النشاط والحرق.
2. 🥦 **الخضروات:** تناول خضروات متنوعة الألوان (سلطة أو مطبوخة) في كل وجبة.
3. 🍗 **البروتين:** اختر مصادر بروتين قليلة الدسم (صدور دجاج، سمك، بقوليات، بيض).
4. 🥑 **الدهون الصحية:** قلل من الدهون المشبعة والمقلية؛ استبدلها بزيت الزيتون والمكسرات (باعتدال).
5. 🍬 **السكريات:** قلل من السكريات المضافة الموجودة في المشروبات الغازية والحلويات.
6. ⏰ **توقيت الوجبات:** حاول تنظيم مواعيد الوجبات (فطار - غداء - عشاء) للحفاظ على مستوى طاقة ثابت.
7. 🧂 **الملح:** قلل من الملح واستخدم الليمون والبهارات والأعشاب لإضافة نكهة للطعام.
`
    }
];
