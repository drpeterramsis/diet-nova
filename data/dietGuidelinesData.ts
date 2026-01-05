
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
        name: "1. DASH Diet (Master Integration)",
        focus: "Blood pressure control, Sodium reduction, High Mineral Intake.",
        macronutrients: {
            carb: "45 – 55% (Focus on complex)",
            protein: "18% (Lean focus)",
            fat: "Total variable (Healthy Fats)",
            sfa: "6-9% (Minimize)",
            pufa: "Up to 10%",
            mufa: "Up to 20%"
        },
        micronutrients: {
            sodium: "Standard < 2300 mg | Low < 1500 mg",
            fiber: "25 – 30 g (High Priority)",
            cholesterol: "150 mg",
            minerals: "K: 4700mg | Ca: 1250mg | Mg: 500mg"
        },
        characteristics: [
            "✅ Essential: Hydration ➔ 8 Servings (glasses) daily.",
            "🧘 Control: Lifestyle ➔ Daily stress control & limit alcohol.",
            "🌾 High Fiber: Grains ➔ 6–8 Servings (Focus on Whole Grains).",
            "🥦 High Priority: Vegetables ➔ 4–5 Servings (Rich in Potassium, Mg).",
            "🍎 High Priority: Fruits ➔ 4–5 Servings (Rich in Potassium, Mg, Vit C).",
            "🍗 Lean Focus: Meat & Fish ➔ ≤ 6 Servings daily (Fish 2x/week).",
            "🥛 Calcium Goal: Low-fat Dairy ➔ 2–3 Servings (Skim milk, yogurt).",
            "🥜 Plant Power: Nuts & Seeds ➔ 4–5 Times/week (Energy, Mg).",
            "🥑 Healthy Fats: Oils ➔ 2–3 Servings (Prioritize MUFA/PUFA)."
        ],
        notes: [
            "🛑 Strict Limit: Red Meat ➔ Never exceed once per week.",
            "⚠️ Warning: Eggs ➔ Max 4 yolks per week (Swap: 2 whites = 1 oz meat).",
            "🛑 Limit: Sweets ➔ Use sparingly (Avoid soda, sugar).",
            "💡 Dressing Rule: 1 Tbsp regular = 1 sv; Low-fat = 1/2 sv; Fat-free = 0 sv.",
            "🧂 Reference: 0.5 tsp salt = 1150 mg sodium."
        ]
    },
    {
        id: "tlc",
        name: "2. TLC Diet (Therapeutic Lifestyle Changes)",
        focus: "Lowering LDL-Cholesterol and Cardiovascular risk management.",
        macronutrients: {
            carb: "50 – 55% (Low GI)",
            protein: "15 – 20% (Soy emphasis)",
            fat: "25 – 35%",
            sfa: "< 7% (Strict Limit)",
            pufa: "Up to 10%",
            mufa: "Up to 20%"
        },
        micronutrients: {
            cholesterol: "< 200 mg / day",
            fiber: "20 – 30 g (10-25g Viscous/Soluble)",
            sodium: "< 2400 mg"
        },
        characteristics: [
            "📉 LDL Lowering Portfolio Components:",
            "• Plant Sterols/Stanols ➔ 2g daily (1g/1000kcal).",
            "• Soy Protein ➔ 50g daily (22.5g/1000kcal).",
            "• Almonds ➔ 50g daily (23g/1000kcal).",
            "• Soluble Fiber ➔ 10–25g daily (Oats, psyllium, okra).",
            "🏃 Physical Activity ➔ 30 mins moderate daily."
        ],
        notes: [
            "🩸 Hypertriglyceridemia (High TG) Mgmt:",
            "• Borderline (150-199): Wt loss <5%.",
            "• High (200-499): Wt loss 5-10%, Added Sugar <10%, Fructose <100g.",
            "• Very High (>500): SFA <5%, Added Sugar <5%, Fructose <50g, Omega-3 >2g.",
            "🛑 Avoid: Butter, red meat, coconut oil, organ meats (brain)."
        ]
    },
    {
        id: "mediterranean",
        name: "3. Mediterranean & Nordic Diets",
        focus: "CVD Prevention, Diabetes, Fatty Liver, Longevity.",
        macronutrients: {
            carb: "40 – 55% (High Fiber 27-37g)",
            protein: "15 – 20% (Plant/Fish emphasis)",
            fat: "25 – 40% (High Healthy Fat)",
            sfa: "9 – 10% (Low)",
            mufa: "Should be 1/2 of total fat"
        },
        micronutrients: {
            fiber: "27 - 37 g"
        },
        characteristics: [
            "✅ Base: Starches ➔ 3–6 Servings/day (Whole grains).",
            "✅ Base: Produce ➔ 3 Veg + 3 Fruit Servings/day.",
            "🫒 Healthy Fats ➔ 1–4 Tbsp Olive Oil/day (Principal fat).",
            "🐟 Seafood ➔ 3 Servings/week (High Omega-3).",
            "🥜 Plant Protein ➔ Legumes/Nuts 3 Servings/week.",
            "⚠️ Moderate: Dairy ➔ 3 Servings/week (Cheese/Yogurt).",
            "⚠️ Moderate: Poultry ➔ 3 Servings/week."
        ],
        notes: [
            "🛑 Strict Limit: Red Meat ➔ < 2 servings/week.",
            "⚠️ Moderate: Eggs ➔ 4–6 per week (1/day max).",
            "🍬 Limit: Sweets & Sugar ➔ Minimal / Very little.",
            "🧠 Protection: Reduced risk of Stroke, Dementia, Alzheimer's."
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
        name: "10. Balanced Diet (Standard Options)",
        focus: "General health maintenance and metabolic balance. Flexible Models.",
        macronutrients: {
            carb: "40% – 55%",
            protein: "15% – 20%",
            fat: "25% – 40%"
        },
        micronutrients: {
            sodium: "< 2300 mg"
        },
        characteristics: [
            "The Plate Method: 1/2 Veg, 1/4 Lean Protein, 1/4 Whole Grains",
            "Hydration: 2–3 Liters of water daily",
            "Big 3 Elements: Every main meal includes Cereal, Veg, Fruit"
        ],
        notes: [
            "Option 1: 40% C / 20% P / 40% F (Lower Carb).",
            "Option 2: 50-55% C / 20% P / 25-30% F (Higher Carb).",
            "Option 3: 50% C / 15% P / 35% F (Moderate).",
            "Option 4: 45% C / 15% P / 40% F (Higher Fat).",
            "Healthy Swaps: Replace butter/margarine with Olive/Canola oil."
        ]
    }
];