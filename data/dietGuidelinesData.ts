
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
            carb: "45 – 55%",
            protein: "18%",
            fat: "Total not specified (Low SFA)",
            sfa: "6-9%",
            pufa: "Up to 10%",
            mufa: "Up to 20%"
        },
        micronutrients: {
            sodium: "Standard <2300 mg | Low <1500 mg",
            fiber: "25 - 30 g (High Priority)",
            cholesterol: "150 mg",
            minerals: "K: 4700mg, Ca: 1250mg, Mg: 500mg"
        },
        characteristics: [
            "Hydration: 8 servings (glasses) daily [Essential]",
            "Grains: 6-8 servings (Focus on Whole Grains)",
            "Vegetables: 4-5 servings (High Potassium, Mg, Fiber)",
            "Fruits: 4-5 servings (High Potassium, Mg, Vit C)",
            "Lean Protein: ≤ 6 servings (Poultry, Fish, Plant)",
            "Low-fat Dairy: 2-3 servings (Calcium goal)",
            "Nuts & Seeds: 4-5 times per week (Mg, Energy)",
            "Oils & Fats: 2-3 servings (Prioritize MUFA/PUFA)"
        ],
        notes: [
            "Red Meat: Strict Limit (Never exceed once per week)",
            "Eggs: Max 4 yolks per week (Swap: 2 whites = 1 oz meat)",
            "Sweets: Use sparingly (Avoid soda, white sugar)",
            "Dressing Rule: 1 Tbsp regular = 1 sv; Low-fat = 1/2 sv; Fat-free = 0 sv",
            "Lifestyle: Daily stress control and limit alcohol",
            "Salt: 0.5 tsp = 1150mg sodium. Use herbs/spices instead."
        ]
    },
    {
        id: "tlc",
        name: "2. TLC Diet (Therapeutic Lifestyle Changes)",
        focus: "Lowering LDL-Cholesterol and Cardiovascular risk management.",
        macronutrients: {
            carb: "50 – 55%",
            protein: "15 – 20%",
            fat: "25 – 35%",
            sfa: "< 7% of total calories",
            pufa: "Up to 10%",
            mufa: "Up to 20%"
        },
        micronutrients: {
            cholesterol: "< 200 mg per day",
            fiber: "20 – 30 g (10-25g Soluble/Viscous)",
            sodium: "< 2400 mg"
        },
        characteristics: [
            "Plant Sterols/Stanols: 2g/day (Spreads/Capsules)",
            "Soy Protein: 50g daily (22.5g per 1000 kcal)",
            "Almonds: 50g daily (23g per 1000 kcal)",
            "Soluble Fiber: Oats, barley, psyllium, okra, eggplant",
            "Exercise: 30 minutes moderate activity daily"
        ],
        notes: [
            "Hypertriglyceridemia (High TG): Weight loss, limit added sugar <10%, limit fructose <100g.",
            "Very High TG (>500mg/dl): Strict fat control, SFA <5%, Omega-3 >2g.",
            "Glycemic Index: Always choose Low-GI carbs.",
            "Avoid: Butter, red meat, coconut oil, organ meats (brain)."
        ]
    },
    {
        id: "mediterranean",
        name: "3. Mediterranean & Nordic Diets",
        focus: "CVD Prevention, Diabetes, Fatty Liver, Longevity.",
        macronutrients: {
            carb: "40 – 55% (High Fiber 27-37g)",
            protein: "15 – 20% (Plant/Fish emphasis)",
            fat: "25 – 40%",
            sfa: "9 – 10% (Low)",
            mufa: "Should be 1/2 of total fat"
        },
        micronutrients: {
            fiber: "27 - 37 g"
        },
        characteristics: [
            "Starches: 3-6 Servings/day (Whole grains base)",
            "Produce: 3 Veg + 3 Fruit Servings/day (Antioxidant boost)",
            "Healthy Fats: 1-4 Tbsp Extra Virgin Olive Oil/day",
            "Plant Protein: Legumes, Nuts & Seeds 3 Servings/week",
            "Seafood: 3 Servings/week (High Omega-3)",
            "Dairy: 3 Servings/week (Cheese/Yogurt preferred)"
        ],
        notes: [
            "Red Meat: < 2 servings per week (Limit strictly).",
            "Eggs: 4-6 per week (Moderate).",
            "Sweets & Sugar: Minimal / Very little.",
            "Protection: Reduced risk of Stroke, Dementia, Alzheimer's."
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
            "Model A: 40% C / 20% P / 40% F (Lower Carb)",
            "Model B: 50-55% C / 20% P / 25-30% F (Higher Carb)",
            "Model C: 50% C / 15% P / 35% F (Moderate)",
            "Model D: 45% C / 15% P / 40% F (Higher Fat)",
            "Healthy Swaps: Replace butter/margarine with Olive/Canola oil."
        ]
    }
];