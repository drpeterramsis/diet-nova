
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
    }
];
