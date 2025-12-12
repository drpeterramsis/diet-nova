
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

1. **Fasting:** Do not eat for at least **2 hours** before the measurement.
2. **Exercise:** Avoid vigorous exercise for **4 hours** prior to the test.
3. **Caffeine:** Do not consume coffee or caffeine on the day of the measurement.
4. **Diuretics:** Stop taking diuretics (water pills) on the day before the measurement.
5. **Hydration:** Drink sufficient water on the day before and 2 hours prior to the test.
6. **Menstruation:** Measurement should not be taken during the menstrual cycle.
7. **Post-Exercise:** Do not measure immediately after a workout.
8. **Consistency:** Results are affected by hydration levels and protein intake (surplus/deficit).

---
**نسخة عربية:**

**لازم نحط في اعتبارنا شروط قياس الـ InBody:**

1. **ممنوع الاكل:** في خلال ساعتين قبل القياس.
2. **ممنوع التمرين:** في خلال 4 ساعات قبل القياس.
3. **ممنوع القهوة:** عدم تناول القهوة أو الكافيين في يوم القياس.
4. **مدرات البول:** ممنوع تناول مدرات البول حتى اليوم السابق.
5. **الماء:** شرب ماء كافي قبل القياس بساعتين وحتى يوم سابق.
6. **الدورة الشهرية:** ممنوع القياس أثناء الدورة الشهرية للسيدات.
7. **بعد التمرين:** ممنوع القياس بعد التمرين مباشرة.
8. **ملاحظة:** عندما تكون نسبة الماء مرتفعة أو منخفضة، سوف تؤثر علي نتيجة نسبة البروتين بالزيادة أو النقص.
`
    },
    {
        id: 'healthy_eating_gen',
        title: 'General Healthy Eating Guidelines',
        titleAr: 'إرشادات عامة للتغذية الصحية',
        category: 'Lifestyle',
        content: `**Core Principles of Healthy Eating:**

1. **Hydration:** Drink at least 8-10 cups of water daily.
2. **Vegetables:** Include a variety of colorful vegetables in every meal.
3. **Protein:** Choose lean protein sources (chicken breast, fish, legumes).
4. **Fats:** Limit saturated fats; choose healthy fats like olive oil and nuts in moderation.
5. **Sugar:** Minimize added sugars found in sodas, sweets, and processed snacks.
6. **Timing:** Try to eat at regular intervals to maintain steady energy levels.

---
**نسخة عربية:**

**المبادئ الأساسية للتغذية الصحية:**

1. **شرب الماء:** شرب ما لا يقل عن 8-10 أكواب يومياً.
2. **الخضروات:** تناول خضروات متنوعة الألوان في كل وجبة.
3. **البروتين:** اختر مصادر بروتين قليلة الدسم (صدور دجاج، سمك، بقوليات).
4. **الدهون:** قلل من الدهون المشبعة؛ استبدلها بدهون صحية مثل زيت الزيتون والمكسرات باعتدال.
5. **السكر:** قلل من السكريات المضافة الموجودة في المشروبات الغازية والحلويات.
6. **التوقيت:** حاول تنظيم مواعيد الوجبات للحفاظ على مستوى طاقة ثابت.
`
    }
];
