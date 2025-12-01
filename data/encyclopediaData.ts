
export interface EncyclopediaItem {
  id: string;
  name: string;
  category: 'Vitamin' | 'Mineral';
  function: string;
  sources: string;
  deficiency: string;
}

export const encyclopediaData: EncyclopediaItem[] = [
  // VITAMINS
  {
    id: 'vit_a',
    name: 'Vitamin A (beta carotene)',
    category: 'Vitamin',
    function: 'Helps to keep eyesight and promote the growth of skin, hair, bones, and teeth. Carotenoids act as antioxidants that prevent some cancers and fight heart disease.',
    sources: 'Beef, liver, lean ham and pork chops, eggs, shrimp, fish, fortified milk, cheddar cheese, Swiss cheese, darkly colored orange or green vegetables (carrots, sweet potatoes, pumpkin, turnip greens and spinach), orange fruits (cantaloupe, apricots, peaches, mangoes)',
    deficiency: 'Night blindness, dry, rough skin, poor bone and teeth growth and development, a susceptibility to infectious diseases'
  },
  {
    id: 'vit_b1',
    name: 'Vitamin B1 (thiamine)',
    category: 'Vitamin',
    function: 'Thiamin helps the body convert carbohydrates into energy and is necessary for the heart, muscles, and nervous system to function properly.',
    sources: 'Lean pork, legumes, bananas, most fish, liver, nuts and seeds, potatoes, peas, watermelon, avocado, poultry, whole grain and fortified cereals',
    deficiency: 'Early symptoms include fatigue, weak muscles, anorexia, weight loss and mental changes (confusion or irritability), sensitivity of teeth/cheeks/gums, cracks in lips. Severe deficiencies can result in anemia, paralysis, muscular atrophy.'
  },
  {
    id: 'vit_b2',
    name: 'Vitamin B2 (riboflavin)',
    category: 'Vitamin',
    function: 'Helps convert food into energy. Needed for skin, hair, blood and brain. Helps to prevent sores and swelling of the mouth and lips.',
    sources: 'Milk, yogurt, cheese, eggs, fish and shellfish, fortified cereals, meat, poultry, kiwi, avocado, broccoli, turnip greens, asparagus',
    deficiency: 'Itching and irritation of lips, eyes, skin and mucous membranes, and can cause eyes to be light sensitive.'
  },
  {
    id: 'vit_b3',
    name: 'Vitamin B3 (niacin)',
    category: 'Vitamin',
    function: 'Helps to release energy from carbohydrates. It is important in the maintenance of healthy skin, nerves, and the digestive system.',
    sources: 'Meat, poultry, fish, fortified and whole grains, mushrooms, potatoes, mango, lentils, peanuts',
    deficiency: 'Depression, diarrhea, dizziness, fatigue, halitosis, headaches, indigestion, insomnia, limb pains, loss of appetite, low blood sugar, muscular weakness, skin eruptions, and inflammation'
  },
  {
    id: 'vit_b6',
    name: 'Vitamin B6',
    category: 'Vitamin',
    function: 'May reduce the risk of heart disease. Regulates the metabolism of amino acids and carbohydrates. Aids healthy nervous system function and in the production of red blood cells. Important for normal brain function.',
    sources: 'Bananas, watermelon, Brewer’s yeast, wheat bran, walnuts, brown rice, meat, fish, poultry, potatoes, soy',
    deficiency: 'Can cause skin disorders, an abnormal nervous system, confusion, poor coordination and insomnia.'
  },
  {
    id: 'vit_b9',
    name: 'Vitamin B9 (Folate/Folic Acid)',
    category: 'Vitamin',
    function: 'Vital for new cell creation. Helps prevent brain and spine birth defects when taken early in pregnancy. Essential for mental and emotional health as it helps to maintain normal brain functions.',
    sources: 'Dark green vegetables, dry beans, peas, lentils, enriched grain products, fortified cereals, liver, orange juice, wheat germ, yeast',
    deficiency: 'Anemia and a reduction in growth rates. Digestive disorders (diarrhea, loss of appetite, weight loss), weakness, sore tongue, headaches, heart palpitations, irritability, forgetfulness, and behavioral disorders'
  },
  {
    id: 'vit_b12',
    name: 'Vitamin B12',
    category: 'Vitamin',
    function: 'May lower the risk of heart disease. Assists in making new cells and breaking down some fatty acids and amino acids. Protects nerve cells and encourages their normal growth. Helps make red blood cells',
    sources: 'Meat, poultry, fish, milk, cheese, eggs, fortified cereals, fortified soymilk',
    deficiency: 'Demyelination and irreversible nerve cell death. Symptoms include numbness or tingling of the extremities and an abnormal gait.'
  },
  {
    id: 'vit_c',
    name: 'Vitamin C (ascorbic acid)',
    category: 'Vitamin',
    function: 'Needed to form collagen (holds cells together). Essential for healthy bones, teeth, gums, and blood vessels. Helps absorb iron, aids in wound healing, contributes to brain function. May lower risk for some cancers.',
    sources: 'Fruits and fruit juices (especially citrus), potatoes, broccoli, bell peppers, spinach, strawberries, tomatoes, Brussels sprouts',
    deficiency: 'Bleeding and inflamed gums, loose teeth, poor wound healing, and anemia.'
  },
  {
    id: 'vit_d',
    name: 'Vitamin D',
    category: 'Vitamin',
    function: 'Helps maintain normal blood levels of calcium and phosphorus, which strengthen bones. Helps form teeth and bones. Supplements can reduce the number of non-spinal fractures',
    sources: 'Fortified milk or margarine, fortified cereals, fatty fish, liver, eggs and sunlight',
    deficiency: 'Weak, soft bones and skeletal deformities'
  },
  {
    id: 'vit_e',
    name: 'Vitamin E',
    category: 'Vitamin',
    function: 'Acts as an antioxidant, neutralizing unstable molecules that can damage cells. Helps the healing of skins and prevents scarring. Diets rich in vitamin E may help prevent Alzheimer’s disease. Supplements may protect against prostate cancer.',
    sources: 'Vegetable oils, nuts and seeds, peanuts and peanut butter, wheat germ, whole-grain and fortified cereals',
    deficiency: 'Deficiency is rare and is mostly found in premature or low weight babies who do not absorb fat properly.'
  },
  {
    id: 'vit_k',
    name: 'Vitamin K',
    category: 'Vitamin',
    function: 'Activates proteins and calcium essential to blood clotting. May help prevent hip fractures.',
    sources: 'Cabbage, liver, eggs, milk, spinach, broccoli, sprouts, kale, collards, and other green vegetables',
    deficiency: 'A shortage of this vitamin may result in nosebleeds, internal hemorrhaging.'
  },
  // MINERALS
  {
    id: 'min_calcium',
    name: 'Calcium',
    category: 'Mineral',
    function: 'Builds and protects bones and teeth. Helps with muscle contractions and relaxation, blood clotting, and nerve impulse transmission. Plays a role in hormone secretion and enzyme activation. Helps maintain healthy blood pressure',
    sources: 'Yogurt, cheese, milk, tofu, sardines, salmon, fortified juices, leafy green vegetables (broccoli, kale)',
    deficiency: 'Muscle cramps, brain function, rickets in children (soft bones) and osteoporosis in adults.'
  },
  {
    id: 'min_chromium',
    name: 'Chromium',
    category: 'Mineral',
    function: 'Enhances the activity of insulin, helps maintain normal blood glucose levels, and is needed to free energy from glucose',
    sources: 'Meat, poultry, fish, some cereals, nuts, cheese',
    deficiency: 'Can affect the potency of insulin in regulating sugar balance.'
  },
  {
    id: 'min_copper',
    name: 'Copper',
    category: 'Mineral',
    function: 'Plays an important role in iron metabolism. Helps make red blood cells',
    sources: 'Liver, shellfish, nuts, seeds, whole-grain products, beans, prunes',
    deficiency: 'Anemia, hair problems, dry skin, vitamin C deficiency'
  },
  {
    id: 'min_fluoride',
    name: 'Fluoride (Fluorine)',
    category: 'Mineral',
    function: 'Encourages strong bone formation. Keeps dental cavities from starting or worsening',
    sources: 'Water that is fluoridated, toothpaste with fluoride, marine fish, teas',
    deficiency: 'Weak teeth and bones'
  },
  {
    id: 'min_iodine',
    name: 'Iodine',
    category: 'Mineral',
    function: 'Part of thyroid hormone, which helps set body temperature and influences nerve and muscle function, reproduction, and growth. Prevents goiter and a congenital thyroid disorder',
    sources: 'Seafood, seaweed, dairy products, iodized salt',
    deficiency: 'Enlargement of the thyroid gland (Goiter).'
  },
  {
    id: 'min_iron',
    name: 'Iron',
    category: 'Mineral',
    function: 'Helps the blood and muscles carry oxygen to the body.',
    sources: 'Liver, red meat, egg yolk, legumes, whole / enriched grains, dark green vegetables',
    deficiency: 'Tiredness and lethargy, feelings of weakness, insomnia, palpitations, headaches, shortness of breath, difficulty concentrating, brittle nails, cracked lips'
  },
  {
    id: 'min_magnesium',
    name: 'Magnesium',
    category: 'Mineral',
    function: 'Helps muscles work, aids metabolism and aids bone growth.',
    sources: 'Green vegetables such as spinach and broccoli, legumes, cashews, sunflower seeds and other seeds, halibut, whole-wheat bread, milk',
    deficiency: 'Fatigue, numbness, poor memory, muscle twitching and irritability, tingling, rapid heartbeat.'
  },
  {
    id: 'min_manganese',
    name: 'Manganese',
    category: 'Mineral',
    function: 'Helps bone growth and cell production. Helps metabolize amino acids, cholesterol, and carbohydrates',
    sources: 'Nuts, legumes, whole grains, tea',
    deficiency: 'Deficiency is rare but could include dermatitis, problems metabolizing carbohydrates, poor memory, nervous irritability, fatigue, blood sugar problems, heavy menstrual periods, fragile bones'
  },
  {
    id: 'min_phosphorus',
    name: 'Phosphorus',
    category: 'Mineral',
    function: 'With calcium builds bones and teeth. Needed for metabolism, body chemistry, nerve and muscle function',
    sources: 'Chicken Breast, Milk, Lentils, Egg Yolks, Nuts, Cheese',
    deficiency: 'Deficiency is rare but could include weakness, bone pain, anorexia'
  },
  {
    id: 'min_potassium',
    name: 'Potassium',
    category: 'Mineral',
    function: 'Balances fluids in the body. Helps maintain steady heartbeat and send nerve impulses. Needed for muscle contractions. A diet rich in potassium seems to lower blood pressure. Getting enough potassium from your diet may benefit bones',
    sources: 'Peanuts, Bananas, Orange Juice, Green Beans, Mushrooms, Oranges, Broccoli, Sunflower Seeds.',
    deficiency: 'Nausea, anorexia, muscle weakness, irritability, depression, fatigue, hypertension, decreased heart rate.'
  },
  {
    id: 'min_sodium',
    name: 'Sodium',
    category: 'Mineral',
    function: 'Balances fluids in the body. Helps send nerve impulses. Needed for muscle contractions. Impacts blood pressure; even modest reductions in salt consumption can lower blood pressure',
    sources: 'Salt, soy sauce, processed foods',
    deficiency: 'Fatigue, apathy, and nausea as well as cramps in the muscles of the extremities'
  },
  {
    id: 'min_zinc',
    name: 'Zinc',
    category: 'Mineral',
    function: 'Helps wounds to heal and aids taste and smell sensory.',
    sources: 'Red meat, poultry, oysters and some other seafood, fortified cereals, beans, nuts',
    deficiency: 'Slow healing of wounds; loss of taste; retarded growth and delayed sexual development in children'
  }
];
