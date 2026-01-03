
export interface DietGuideline {
    id: string;
    name: string;
    focus: string;
    macronutrients: {
        carb?: string;
        protein?: string;
        fat?: string;
        sfa?: string;
        pufa?: string;
        mufa?: string;
    };
    micronutrients: {
        sodium?: string;
        fiber?: string;
        cholesterol?: string;
        minerals?: string; // K, Mg, Ca
    };
    characteristics: string[];
    notes: string[];
}

export const dietGuidelinesData: DietGuideline[] = [
    {
        id: "dash",
        name: "1. DASH Diet (Dietary Approaches to Stop Hypertension)",
        focus: "Blood pressure control and sodium reduction.",
        macronutrients: {
            carb: "45 – 55%",
            protein: "18%",
            fat: "Total not specified (Low SFA)",
            sfa: "6-9%",
            pufa: "Up to 10%",
            mufa: "Up to 20%"
        },
        micronutrients: {
            sodium: "2300 mg or less (Lower: 1500 mg)",
            fiber: "25 - 30 g",
            cholesterol: "150 mg",
            minerals: "K: 4700mg, Ca: 1250mg, Mg: 500mg"
        },
        characteristics: [
            "Whole grain: Depend on whole grains",
            "Fibers: Increase fiber intake",
            "Legumes: 4 to 5 Serving per week",
            "Protein Source: Fish, legumes, nuts, poultry (Limit red meat)",
            "Fats: Very limited fats",
            "Dairy: Low fat dairy 2-3 serving/day (Milk + Cheese)",
            "Vegetables: Fresh vegetables 4 to 5 serving per day (Source of K)",
            "Fruits: Fresh fruits 4 to 5 serving per day (Source of K)"
        ],
        notes: [
            "Alcohol & Caffeine: Reduction required (due to xanthine)",
            "Lower Sodium option: 1500 mg/day for high risk",
            "Avoid: Pickled foods, canned goods, processed meats (Pastrami, sausage, burger)",
            "ممنوع الأطعمة المخللة والمعلبة واللحوم المصنعة",
            "زيادة البوتاسيوم والكالسيوم والمغنيسيوم يساعد في استرخاء الأوعية الدموية"
        ]
    },
    {
        id: "tlc",
        name: "2. TLC Diet (Therapeutic Lifestyle Changes)",
        focus: "Lowering LDL-Cholesterol and Cardiovascular risk.",
        macronutrients: {
            fat: "25 – 35%",
            sfa: "< 7% of total calories"
        },
        micronutrients: {
            cholesterol: "< 200 mg per day",
            fiber: "10g – 25g (Soluble)"
        },
        characteristics: [
            "Plant Sterols: 2g/day to block cholesterol absorption",
            "Exercise: 30 minutes of moderate activity daily",
            "Focus on MUFA/PUFA fats"
        ],
        notes: [
            "Designed by the NIH for cholesterol management."
        ]
    },
    {
        id: "mediterranean",
        name: "3. Mediterranean & Nordic Diets",
        focus: "Longevity and healthy fats.",
        macronutrients: {
            // General balanced ratios usually apply
        },
        micronutrients: {},
        characteristics: [
            "Primary Fat: Extra Virgin Olive Oil (Med) / Canola Oil (Nordic)",
            "Carbs: Ancient grains (Farro/Bulgur), Rye, Barley, Oats",
            "Protein: Seafood, Legumes, Cold-water fish, Wild Game",
            "Phytochemicals: High intake of seasonal fruits and vegetables (6+ servings)",
            "Red List: Red meat and sweets limited to few times per month"
        ],
        notes: [
            "Alcohol: Moderate red wine consumption acceptable in Mediterranean version."
        ]
    },
    {
        id: "anti_inflammatory",
        name: "4. Anti-Inflammatory Diet",
        focus: "Reducing systemic inflammation (CRP levels) and autoimmune support.",
        macronutrients: {
            carb: "Low Glycemic Load only"
        },
        micronutrients: {},
        characteristics: [
            "Omega Ratio: High Omega-3 / Low Omega-6",
            "Beverages: Green/White tea (Catechins)",
            "Spices: Turmeric (Curcumin) and Ginger",
            "The Rainbow Rule: Diverse vegetable colors"
        ],
        notes: [
            "Avoid: Refined sugars, trans fats, commercial veg oils (soy/corn)."
        ]
    },
    {
        id: "mind",
        name: "5. MIND Diet",
        focus: "Brain health and Alzheimer’s prevention.",
        macronutrients: {},
        micronutrients: {},
        characteristics: [
            "Hybrid: Combines Mediterranean and DASH",
            "Brain-Healthy: Berries (2+/week), Leafy Greens (6+/week)",
            "Brain-Unhealthy: Red Meats, Butter, Cheese, Pastries, Fried Food"
        ],
        notes: [
            "Prioritizes BERRIES specifically over other fruits unlike other diets."
        ]
    },
    {
        id: "fodmap",
        name: "6. Low FODMAP Diet",
        focus: "Management of IBS and digestive distress.",
        macronutrients: {},
        micronutrients: {},
        characteristics: [
            "Avoid High FODMAP: Garlic, Onion, Wheat, Milk, Honey, Apples",
            "Enjoy Low FODMAP: Chives, Quinoa, Lactose-free dairy, Strawberries, Grapes",
            "Phases: 1. Elimination (2-6 wks), 2. Reintroduction, 3. Personalization"
        ],
        notes: [
            "This is a diagnostic tool, not a forever diet."
        ]
    },
    {
        id: "gluten_free",
        name: "7. Gluten-Free Diet (GF)",
        focus: "Celiac Disease and Non-Celiac Gluten Sensitivity.",
        macronutrients: {},
        micronutrients: {},
        characteristics: [
            "Strict Exclusion: Wheat, Barley, Rye (Gliadin protein)",
            "Safe Grains: Rice, Corn, Buckwheat, Millet, Teff, Quinoa"
        ],
        notes: [
            "Hidden Sources: Soy sauce, malt, brewer's yeast, cross-contamination."
        ]
    },
    {
        id: "lactose_free",
        name: "8. Lactose-Free Diet",
        focus: "Lactase enzyme deficiency and dairy intolerance.",
        macronutrients: {},
        micronutrients: {},
        characteristics: [
            "Alternatives: Almond, Soy, Rice, Oat milks",
            "Naturally Low Lactose: Hard aged cheeses (Cheddar, Parmesan), High-quality butter"
        ],
        notes: [
            "Supplementation: Use exogenous lactase enzymes (pills) when consuming dairy."
        ]
    },
    {
        id: "low_gi",
        name: "9. Low Glycemic Index & Load Diet",
        focus: "Blood glucose stability, Diabetes, and PCOS.",
        macronutrients: {},
        micronutrients: {},
        characteristics: [
            "Low GI (<55): Beans, Lentils, Whole Oats",
            "Moderate GI (56-69): Brown rice, Sweet potato",
            "High GI (70+): White bread, Corn flakes",
            "The Pair Rule: Always combine carbs with protein/fat"
        ],
        notes: [
            "Processing: The more processed, the higher the GI."
        ]
    },
    {
        id: "balanced",
        name: "10. Balanced Diet",
        focus: "General health maintenance and metabolic balance.",
        macronutrients: {
            carb: "45% – 65%",
            protein: "10% – 35%",
            fat: "20% – 35%"
        },
        micronutrients: {
            sodium: "< 2300 mg"
        },
        characteristics: [
            "The Plate Method: 1/2 Veg, 1/4 Lean Protein, 1/4 Whole Grains",
            "Hydration: 2–3 Liters of water daily"
        ],
        notes: []
    }
];
