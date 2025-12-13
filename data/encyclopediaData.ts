
export interface EncyclopediaItem {
  id: string;
  name: string;
  category: 'Vitamin' | 'Mineral' | 'Definition';
  function: string;
  sources: string;
  deficiency: string;
}

export interface MiscTopicItem {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const miscTopicsData: MiscTopicItem[] = [
  {
    id: 'misc_assessment_macros',
    title: 'Assessment of Macronutrients',
    category: 'Guidelines',
    content: `The fat, protein, carbohydrate, fiber, and water content of the diet can be assessed by analyzing multiple days of food records or 24-hour recalls.

**Standards:**
• **DRIs (Dietary Reference Intakes):** Standards for healthy individuals.
• **AI (Adequate Intake):** Used when research is limited (e.g., Total Fiber, Linoleic acid, Water).
• **RDA (Recommended Dietary Allowance):** Meets needs of **97-98%** of population (e.g., Carbohydrates, Protein). Lower boundary to prevent deficiency.
• **AMDR (Acceptable Macronutrient Distribution Ranges):** Percentages of total calories associated with reduced risk of chronic disease.

**Specific Limits (AHA/Dietary Guidelines):**
• **Saturated Fat:** **<10%** (Dietary Guidelines) or **<5-6%** (AHA).
• **Trans Fat:** As low as possible.
• **Added Sugars:** **<25 g/d** (Females), **<38 g/d** (Males) or **<10%** of kcal.

**Note:** DRIs are for healthy people. In trauma, surgery, or malnutrition, specific standards based on health status should be used.`
  },
  {
    id: 'misc_usda_dist',
    title: 'USDA Balanced Diet Distribution',
    category: 'Guidelines',
    content: `**Macronutrient Distribution (AMDR):**

**1. Carbohydrates:** **45 - 65 %**

**2. Fats:** **20 - 25 %**
   • Saturated Fatty Acids (SFA): **< 10%**
   • Polyunsaturated (PUFA): Up to **10%**
   • Monounsaturated (MUFA): Up to **20%**

**3. Protein:** **15 - 20 %**
   • Range: **0.8 - 1.2 g/kg**
   • High Biological Value (HBV): **50%**
   • Low Biological Value (LBV): **50%**

**⚠️ Clinical Note:**
In pathological conditions or Obesity (Grade 1, 2, 3), protein should be calculated based on **Ideal Body Weight (IBW)**.`
  },
  {
    id: 'misc_obesity_def',
    title: 'Definition of Obesity',
    category: 'Obesity',
    content: `**Obesity** is a chronic, progressive, and relapsing disease characterized by an abnormal or excessive accumulation of body fat that impairs health. It arises from a complex interaction of genetic, metabolic, environmental, behavioral, and neurohormonal factors.

• **General population:** Obesity is defined as BMI ≥ **30 kg/m²**.
• **Ethnic-specific cut-offs:** In South Asian, Chinese, Middle Eastern, Black African, or African-Caribbean individuals → Obesity = BMI ≥ **27.5 kg/m²**.
• **Central adiposity:** Waist-to-height ratio (WHtR ≥ **0.5**) or waist circumference are strong indicators (> **94cm** Male, > **80cm** Female).
• Or excessive accumulation of body fat more than **25%** (Men) or **32%** (Women).`
  },
  {
    id: 'misc_fat_types',
    title: 'Types of Fat (Adipose Tissue)',
    category: 'Obesity',
    content: `• **White Adipose Tissue (WAT):** Energy storage, endocrine signaling (leptin, adiponectin), insulation, protection.
• **Brown Adipose Tissue (BAT):** Thermogenic, burns fat via UCP-1, abundant in newborns and present in adults (neck, supraclavicular, perirenal).
• **Beige Fat:** Intermediate between white and brown, inducible thermogenic activity.`
  },
  {
    id: 'misc_obesity_phenotypes',
    title: 'Classical Obesity Phenotypes',
    category: 'Obesity',
    content: `**Classifications:**
• Metabolically Healthy Obesity (MHO)
• Metabolically Unhealthy Obesity (MUO)
• Sarcopenic Obesity (Low muscle mass + High fat)
• Normal Weight Obesity (NWO)

**Behavioral/Metabolic Phenotypes:**
1. **Hungry Brain:** Defective satiation → more calories per meal. (Prevalence: 40%)
2. **Hungry Gut:** Defective satiety → appetite returns quickly. (Prevalence: 18%)
3. **Emotional Hunger:** Eating to cope with emotions. (Prevalence: 30%)
4. **Slow Burn:** Low energy expenditure / metabolic rate. (Prevalence: 12%)`
  },
  {
    id: 'misc_pathophysiology',
    title: 'Pathophysiology of Obesity',
    category: 'Obesity',
    content: `• **Adipose tissue dysfunction:** ↑ pro-inflammatory adipokines (TNF-α, IL-6), ↓ adiponectin.
• **Insulin resistance & lipotoxicity:** Excess fatty acids → ectopic fat deposition in liver, pancreas, muscle.
• **Neuroendocrine dysregulation:** Leptin resistance, ↑ Ghrelin, ↓ GLP-1/PYY/CCK, overactive dopamine reward pathways.
• **Gut microbiota:** Dysbiosis influences energy harvest, bile acids, inflammation.
• **Genetics & epigenetics:** MC4R mutations, leptin deficiency, maternal influences.
• **Adaptive thermogenesis:** Metabolic rate reduction during weight loss → difficulty maintaining results.`
  },
  {
    id: 'misc_body_types',
    title: 'Three Body Types (Somatotypes)',
    category: 'Anthropometry',
    content: `**1. Ectomorph:**
• Narrow hips and clavicles
• Small joints (wrist/ankles)
• Thin build
• Stringy muscle bellies
• Long limbs

**2. Mesomorph:**
• Wide clavicles
• Narrow waist
• Thinner joints
• Long and round muscle bellies

**3. Endomorph:**
• Blocky
• Thick rib cage
• Wide/thicker joints
• Hips as wide (or wider) than clavicles
• Shorter limbs`
  },
  {
    id: 'misc_counseling',
    title: 'Plan Counseling & Education',
    category: 'Management',
    content: `Translate assessment data into strategies, activities, or interventions that will enable the patient or client to meet established objectives. (What... When... Where... How)

**Counseling:**
1. **Lifestyle Modification:**
   • Weight reduction by **10-15%** in people without diabetes (1 to 2 pound per week).
   • Weight reduction by **5-10%** in people with diabetes.
   • Following dietary program as a lifestyle.
   
2. **Physical Activity:**
   • **150 min/week** endurance exercise.
   • Encourage adherence to resistance exercise as well (**150 min/week**).`
  },
  {
    id: 'misc_nutrition_facts',
    title: 'Reading Nutrition Facts',
    category: 'Education',
    content: `**Guide to reading labels:**
1. **Serving Info:** Check "Servings per container" and "Serving size" first.
2. **Calories:** Check total calories per serving.
3. **Nutrients to Limit (Get Less):** Saturated Fat, Trans Fat, Sodium, Added Sugars.
4. **Nutrients to Increase (Get More):** Dietary Fiber, Vitamin D, Calcium, Iron, Potassium.
5. **% Daily Value (%DV):**
   • **5% or less** is considered **LOW**.
   • **20% or more** is considered **HIGH**.
   
*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet (based on 2000 calories).*`
  },
  {
    id: 'misc_energy_balance',
    title: 'Energy Balance',
    category: 'Metabolism',
    content: `**Energy Balance Equation:**
Relationship between Energy In (calories consumed) vs Energy Out (calories burned).

**1. Isocaloric Balance (Weight Maintained):**
• Energy In = Energy Out
• Intake matches expenditure. Weight remains stable.

**2. Negative Caloric Balance (Weight Loss):**
• Energy In < Energy Out
• Deficit created. Body uses stored energy (fat/muscle).

**3. Positive Caloric Balance (Weight Gain):**
• Energy In > Energy Out
• Surplus created. Excess energy stored as fat.

**Components:**
• **Energy In:** Alcohol (7 kcal/g), Fat (9 kcal/g), Protein (4 kcal/g), Carbohydrates (4 kcal/g).
• **Energy Out:**
  - **BMR (Basal Metabolic Rate):** Energy for basic life functions (breathing, circulation). Largest component (~60-75%).
  - **TEF (Thermic Effect of Food):** Energy used to digest/absorb food (~10%).
  - **TEE (Thermic Effect of Exercise):** Energy burned during physical activity (Variable).`
  }
];

export const encyclopediaData: EncyclopediaItem[] = [
  // DEFINITIONS
  {
    id: 'def_bm',
    name: 'Basal Metabolism',
    category: 'Definition',
    function: 'The amount of energy required by an individual in the resting state, for such functions as breathing and circulation of the blood.',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_bmr',
    name: 'Basal Metabolic Rate (BMR)',
    category: 'Definition',
    function: 'The minimum caloric requirement needed to sustain life in a resting individual. It can be looked at as being the amount of energy (measured in calories) expended by the body to remain in bed asleep all day.',
    sources: '60–80% of Total Energy Expenditure (TEE)',
    deficiency: '-'
  },
  {
    id: 'def_tee',
    name: 'Total Energy Expenditure (TEE)',
    category: 'Definition',
    function: 'Is the amount of calories burned by the human body in one day adjusted to the amount of activity.\n\nTotal energy expenditure (TEE) is composed of the energy costs of the processes essential for life (basal metabolic rate (BMR), 60–80% of TEE)\n+ the energy expended in order to digest, absorb, and convert food (diet-induced thermogenesis, ~10%)\n+ The energy expended during physical activities (activity energy expenditure, ~15–30%)',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_rda',
    name: 'Recommended Dietary Allowances (RDA)',
    category: 'Definition',
    function: 'Adequacy (Population)\nThe average daily dietary nutrient intake level sufficient to meet the nutrient requirements of nearly all (97%–98%) healthy individuals in a particular life stage and gender group.',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_ai',
    name: 'Adequate Intakes (AI)',
    category: 'Definition',
    function: 'Adequacy (Specific Case)\nThe recommended average daily intake level based on observed or experimentally determined approximations or estimates of nutrient intake by a group (or groups) of apparently healthy people that are assumed to be adequate - used when an RDA cannot be determined.',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_cdrr',
    name: 'Chronic Disease Risk Reduction Intakes (CDRR)',
    category: 'Definition',
    function: 'Risk Reduction\nA set of values utilized to characterize the reduction of risk for chronic disease.',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_ul',
    name: 'Tolerable Upper Intake Levels (UL)',
    category: 'Definition',
    function: 'Safety\nThe highest average daily nutrient intake level that is likely to pose no risk of adverse health effects to almost all individuals in the general population. As intake increases above the UL, the potential risk of adverse effects may increase.',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_ear',
    name: 'Estimated Average Requirements (EAR)',
    category: 'Definition',
    function: 'Research and Policy\nThe average daily nutrient intake level estimated to meet the requirement of half the healthy individuals in a particular life stage and gender group.',
    sources: '-',
    deficiency: '-'
  },
  {
    id: 'def_amdr',
    name: 'Acceptable Macronutrient Distribution Ranges (AMDR)',
    category: 'Definition',
    function: 'Healthful ranges for energy yielding nutrient\nA range of intakes for a particular energy source that is associated with reduced risk of chronic disease while providing adequate intakes of essential nutrients.',
    sources: '-',
    deficiency: '-'
  },
  // VITAMINS
  {
    id: 'vit_a',
    name: 'Vitamin A (beta carotene)',
    category: 'Vitamin',
    function: '👀 Helps eyesight\n✨ Promotes growth of skin, hair, bones, and teeth\n🛡️ Carotenoids act as antioxidants preventing cancer/heart disease',
    sources: '🥩 Beef, liver, lean ham\n🍳 Eggs, shrimp, fish\n🥛 Fortified milk, cheese\n🥕 Orange/Green veg (carrots, spinach)\n🍑 Orange fruits (cantaloupe, apricots)',
    deficiency: '🌑 Night blindness\n🏜️ Dry, rough skin\n🦴 Poor bone/teeth growth\n🦠 Susceptibility to infectious diseases'
  },
  {
    id: 'vit_b1',
    name: 'Vitamin B1 (thiamine)',
    category: 'Vitamin',
    function: '⚡ Converts carbohydrates into energy\n❤️ Necessary for heart, muscles, and nervous system function',
    sources: '🍖 Lean pork, liver, poultry\n🍌 Legumes, bananas, watermelon\n🐟 Most fish\n🥜 Nuts and seeds\n🍞 Whole grain and fortified cereals',
    deficiency: '🥱 Fatigue, weak muscles\n📉 Anorexia, weight loss\n🧠 Mental confusion, irritability\n🥴 Sensitivity of gums/lips'
  },
  {
    id: 'vit_b2',
    name: 'Vitamin B2 (riboflavin)',
    category: 'Vitamin',
    function: '⚡ Converts food into energy\n💇 Needed for skin, hair, blood, and brain\n👄 Prevents sores/swelling of mouth',
    sources: '🥛 Milk, yogurt, cheese\n🍳 Eggs\n🦞 Fish and shellfish\n🥦 Broccoli, asparagus, turnip greens\n🥣 Fortified cereals',
    deficiency: '👄 Itching/irritation of lips & skin\n👁️ Light sensitivity in eyes\n🔴 Swelling of mucous membranes'
  },
  {
    id: 'vit_b3',
    name: 'Vitamin B3 (niacin)',
    category: 'Vitamin',
    function: '⚡ Releases energy from carbohydrates\n🧖 Maintains healthy skin\n🧠 Supports nervous & digestive systems',
    sources: '🍗 Meat, poultry, fish\n🍄 Mushrooms, potatoes\n🥜 Peanuts, lentils\n🥭 Mango\n🍞 Fortified/whole grains',
    deficiency: '😞 Depression, dizziness, fatigue\n💩 Diarrhea, indigestion\n🤕 Headaches, insomnia\n🩹 Skin eruptions & inflammation'
  },
  {
    id: 'vit_b6',
    name: 'Vitamin B6',
    category: 'Vitamin',
    function: '❤️ May reduce heart disease risk\n🧬 Regulates amino acid/carb metabolism\n🧠 Aids nervous system & brain function\n🩸 Helps produce red blood cells',
    sources: '🍌 Bananas, watermelon\n🥔 Potatoes, brown rice\n🐟 Fish, poultry, meat\n🥜 Walnuts, wheat bran',
    deficiency: '🤒 Skin disorders\n😵 Confusion, poor coordination\n😴 Insomnia\n🧠 Abnormal nervous system function'
  },
  {
    id: 'vit_b9',
    name: 'Vitamin B9 (Folate/Folic Acid)',
    category: 'Vitamin',
    function: '🧬 Vital for new cell creation\n👶 Prevents birth defects (brain/spine)\n🧠 Essential for mental/emotional health',
    sources: '🥦 Dark green vegetables (spinach)\n🫘 Dry beans, peas, lentils\n🍞 Enriched grain products\n🍊 Orange juice, liver',
    deficiency: '🩸 Anemia\n📉 Reduced growth rates\n🤢 Digestive disorders\n🤕 Headaches, weakness, palpitations'
  },
  {
    id: 'vit_b12',
    name: 'Vitamin B12',
    category: 'Vitamin',
    function: '❤️ May lower heart disease risk\n🧬 Assists in making new cells\n🧠 Protects nerve cells\n🩸 Helps make red blood cells',
    sources: '🍗 Meat, poultry, fish\n🥛 Milk, cheese, eggs\n🥣 Fortified cereals, soymilk',
    deficiency: '🦶 Numbness/tingling of extremities\n🚶 Abnormal gait\n🧠 Nerve cell death (irreversible)'
  },
  {
    id: 'vit_c',
    name: 'Vitamin C (ascorbic acid)',
    category: 'Vitamin',
    function: '🧬 Forms collagen (holds cells together)\n🦷 Healthy bones, teeth, gums\n🛡️ Aids wound healing & iron absorption\n🧠 Contributes to brain function',
    sources: '🍊 Citrus fruits/juices\n🍓 Strawberries, tomatoes\n🫑 Bell peppers, broccoli, spinach\n🥔 Potatoes',
    deficiency: '🩸 Bleeding/inflamed gums\n🦷 Loose teeth\n🩹 Poor wound healing\n🩸 Anemia'
  },
  {
    id: 'vit_d',
    name: 'Vitamin D',
    category: 'Vitamin',
    function: '🦴 Maintains calcium/phosphorus levels\n💪 Strengthens bones and teeth\n🛡️ Reduces fracture risk',
    sources: '☀️ Sunlight\n🐟 Fatty fish, liver\n🍳 Eggs\n🥛 Fortified milk, margarine, cereals',
    deficiency: '🦴 Weak, soft bones\n🦴 Rickets/Skeletal deformities'
  },
  {
    id: 'vit_e',
    name: 'Vitamin E',
    category: 'Vitamin',
    function: '🛡️ Antioxidant (neutralizes unstable molecules)\n🩹 Helps skin healing & prevents scarring\n🧠 May help prevent Alzheimer’s',
    sources: '🌻 Vegetable oils\n🥜 Nuts, seeds, peanut butter\n🌾 Wheat germ\n🍞 Whole-grain cereals',
    deficiency: 'Rare (mostly in premature babies)\n📉 Fat malabsorption issues'
  },
  {
    id: 'vit_k',
    name: 'Vitamin K',
    category: 'Vitamin',
    function: '🩸 Activates proteins for blood clotting\n🦴 Essential for calcium activation\n🦵 May prevent hip fractures',
    sources: '🥬 Cabbage, spinach, kale, collards\n🥦 Broccoli, sprouts\n🐄 Liver, eggs, milk',
    deficiency: '🩸 Nosebleeds\n🛑 Internal hemorrhaging'
  },
  // MINERALS
  {
    id: 'min_calcium',
    name: 'Calcium',
    category: 'Mineral',
    function: '🦴 Builds/protects bones and teeth\n💪 Muscle contraction & relaxation\n🩸 Blood clotting & nerve transmission\n💓 Maintains healthy blood pressure',
    sources: '🥛 Yogurt, cheese, milk\n🐟 Sardines, salmon\n🥦 Leafy greens (kale, broccoli)\n🫘 Tofu',
    deficiency: '😫 Muscle cramps\n🦴 Rickets (children)\n👵 Osteoporosis (adults)'
  },
  {
    id: 'min_chromium',
    name: 'Chromium',
    category: 'Mineral',
    function: '💉 Enhances insulin activity\n🩸 Maintains normal blood glucose\n⚡ Frees energy from glucose',
    sources: '🍗 Meat, poultry, fish\n🥜 Nuts, cheese\n🍞 Some cereals',
    deficiency: '🍭 Impaired sugar regulation (Insulin potency)'
  },
  {
    id: 'min_copper',
    name: 'Copper',
    category: 'Mineral',
    function: '⚙️ Role in iron metabolism\n🩸 Helps make red blood cells',
    sources: '🐄 Liver, shellfish\n🥜 Nuts, seeds, beans\n🍞 Whole-grain products, prunes',
    deficiency: '🩸 Anemia\n💇 Hair problems\n🌵 Dry skin'
  },
  {
    id: 'min_fluoride',
    name: 'Fluoride (Fluorine)',
    category: 'Mineral',
    function: '🦴 Encourages strong bone formation\n🦷 Prevents dental cavities',
    sources: '💧 Fluoridated water\n🦷 Fluoride toothpaste\n🐟 Marine fish, teas',
    deficiency: '🦷 Weak teeth\n🦴 Weak bones'
  },
  {
    id: 'min_iodine',
    name: 'Iodine',
    category: 'Mineral',
    function: '🦋 Part of thyroid hormone\n🌡️ Sets body temperature\n🧠 Influences nerve/muscle function & growth',
    sources: '🦐 Seafood, seaweed\n🧂 Iodized salt\n🥛 Dairy products',
    deficiency: '🦋 Goiter (Enlarged thyroid)'
  },
  {
    id: 'min_iron',
    name: 'Iron',
    category: 'Mineral',
    function: '🩸 Carries oxygen to body (Hemoglobin)',
    sources: '🐄 Liver, red meat\n🍳 Egg yolk\n🫘 Legumes, dark green veg\n🍞 Enriched grains',
    deficiency: '😴 Tiredness, lethargy\n💓 Palpitations, shortness of breath\n💅 Brittle nails, cracked lips'
  },
  {
    id: 'min_magnesium',
    name: 'Magnesium',
    category: 'Mineral',
    function: '💪 Helps muscles work\n⚙️ Aids metabolism & bone growth',
    sources: '🥬 Spinach, broccoli\n🥜 Cashews, sunflower seeds\n🐟 Halibut\n🍞 Whole-wheat bread, milk',
    deficiency: '😴 Fatigue, numbness\n🧠 Poor memory\n⚡ Muscle twitching/irritability\n💓 Rapid heartbeat'
  },
  {
    id: 'min_manganese',
    name: 'Manganese',
    category: 'Mineral',
    function: '🦴 Helps bone growth\n🧬 Cell production\n⚙️ Metabolizes amino acids & carbs',
    sources: '🥜 Nuts, legumes\n🍵 Tea\n🍞 Whole grains',
    deficiency: '🤒 Dermatitis\n🧠 Poor memory\n😠 Nervous irritability\n🦴 Fragile bones'
  },
  {
    id: 'min_phosphorus',
    name: 'Phosphorus',
    category: 'Mineral',
    function: '🦴 Builds bones/teeth (with Calcium)\n⚙️ Needed for metabolism & body chemistry',
    sources: '🍗 Chicken breast\n🥛 Milk, cheese\n🫘 Lentils, nuts\n🍳 Egg yolks',
    deficiency: '💪 Weakness\n🦴 Bone pain\n📉 Anorexia'
  },
  {
    id: 'min_potassium',
    name: 'Potassium',
    category: 'Mineral',
    function: '💧 Balances body fluids\n💓 Maintains heartbeat\n⚡ Sends nerve impulses\n🩸 Lowers blood pressure',
    sources: '🍌 Bananas, oranges\n🥔 Potatoes, mushrooms\n🥜 Peanuts, sunflower seeds\n🥦 Broccoli, green beans',
    deficiency: '🤢 Nausea, anorexia\n💪 Muscle weakness\n😠 Irritability, depression\n🩸 Hypertension'
  },
  {
    id: 'min_sodium',
    name: 'Sodium',
    category: 'Mineral',
    function: '💧 Balances body fluids\n⚡ Sends nerve impulses\n💪 Needed for muscle contractions',
    sources: '🧂 Salt, soy sauce\n🍔 Processed foods',
    deficiency: '😴 Fatigue, apathy\n🤢 Nausea\n💪 Muscle cramps'
  },
  {
    id: 'min_zinc',
    name: 'Zinc',
    category: 'Mineral',
    function: '🩹 Helps wounds heal\n👅 Aids taste and smell sensory',
    sources: '🥩 Red meat, poultry\n🦪 Oysters, seafood\n🥣 Fortified cereals\n🫘 Beans, nuts',
    deficiency: '🩹 Slow wound healing\n👅 Loss of taste\n📏 Retarded growth (children)'
  }
];