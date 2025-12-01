
export interface NFPEItem {
  id: string;
  sign: string;
  signAr: string;
  deficiency: string;
  deficiencyAr: string;
  food: string;
  foodAr: string;
}

export interface NFPESystem {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  items: NFPEItem[];
}

export const nfpeData: NFPESystem[] = [
  {
    id: "general_cns",
    name: "General & CNS",
    nameAr: "العام والجهاز العصبي",
    icon: "🧠",
    items: [
      { 
          id: "gen_fatigue", 
          sign: "Chronic Fatigue / Lethargy", 
          signAr: "تعب مزمن / خمول", 
          deficiency: "Iron, B12, Vit D, Protein", 
          deficiencyAr: "الحديد، ب12، فيتامين د، البروتين",
          food: "Red meat, eggs, fish, fortified foods",
          foodAr: "اللحوم الحمراء، البيض، الأسماك، الأطعمة المدعمة"
      },
      { 
          id: "neuro_conf", 
          sign: "Mental Confusion / Dementia", 
          signAr: "ارتباك عقلي / خرف", 
          deficiency: "Niacin (B3), B12, Thiamin (B1)", 
          deficiencyAr: "النياسين، ب12، الثيامين",
          food: "Whole grains, meat, dairy, yeast",
          foodAr: "الحبوب الكاملة، اللحوم، الألبان، الخميرة"
      },
      {
          id: "neuro_psychomotor",
          sign: "Psychomotor changes (Listless)",
          signAr: "تغيرات نفسية حركية (فتور)",
          deficiency: "Protein, Energy",
          deficiencyAr: "البروتين، الطاقة",
          food: "High calorie-protein diet",
          foodAr: "نظام غذائي عالي السعرات والبروتين"
      },
      { 
          id: "neuro_tingling", 
          sign: "Paresthesia (Tingling/Numbness)", 
          signAr: "تنميل / وخز", 
          deficiency: "B12, B6, Thiamin (B1), Calcium", 
          deficiencyAr: "ب12، ب6، ب1، الكالسيوم",
          food: "Meat, fish, poultry, fortified yeast, dairy",
          foodAr: "اللحوم، الأسماك، الدواجن، الخميرة المدعمة، الألبان"
      },
      {
          id: "neuro_tetany",
          sign: "Tetany (Involuntary contraction)",
          signAr: "تيتاني (تشنج لا إرادي)",
          deficiency: "Calcium, Magnesium",
          deficiencyAr: "الكالسيوم، المغنيسيوم",
          food: "Dairy, nuts, seeds, leafy greens",
          foodAr: "الألبان، المكسرات، البذور، الخضروات الورقية"
      },
      { 
          id: "gen_cold", 
          sign: "Cold Intolerance", 
          signAr: "عدم تحمل البرد", 
          deficiency: "Iron, Iodine, Energy", 
          deficiencyAr: "الحديد، اليود، الطاقة",
          food: "Seafood, iodized salt, red meat",
          foodAr: "المأكولات البحرية، الملح اليودي، اللحوم الحمراء"
      }
    ]
  },
  {
    id: "hair",
    name: "Hair",
    nameAr: "الشعر",
    icon: "💇",
    items: [
      { 
          id: "hair_lusterless", 
          sign: "Dull / Lusterless / Easily Plucked", 
          signAr: "باهت / فاقد للمعان / سهل الاقتلاع", 
          deficiency: "Protein, Zinc", 
          deficiencyAr: "البروتين، الزنك",
          food: "Eggs, meat, legumes, nuts",
          foodAr: "البيض، اللحوم، البقوليات، المكسرات"
      },
      {
          id: "hair_thin_sparse",
          sign: "Thin, Sparse, Silky",
          signAr: "خفيف، متناثر، حريري جداً",
          deficiency: "Protein, Biotin",
          deficiencyAr: "البروتين، البيوتين",
          food: "High biological value protein, eggs",
          foodAr: "بروتين عالي القيمة البيولوجية، البيض"
      },
      { 
          id: "hair_flag_sign", 
          sign: "Flag Sign (Light banding)", 
          signAr: "علامة العلم (شرائط فاتحة)", 
          deficiency: "Protein, Copper", 
          deficiencyAr: "البروتين، النحاس",
          food: "Liver, shellfish, nuts, seeds, meat",
          foodAr: "الكبد، المحار، المكسرات، البذور، اللحوم"
      },
      { 
          id: "hair_corkscrew", 
          sign: "Corkscrew Hair / Coiled", 
          signAr: "شعر لولبي / ملفوف", 
          deficiency: "Vitamin C", 
          deficiencyAr: "فيتامين سي",
          food: "Citrus fruits, peppers, kiwi, strawberries",
          foodAr: "الحمضيات، الفلفل، الكيوي، الفراولة"
      },
      { 
          id: "hair_loss_alopecia", 
          sign: "Alopecia / Hair Loss", 
          signAr: "ثعلبة / تساقط شعر", 
          deficiency: "Zinc, EFA, Biotin, Protein", 
          deficiencyAr: "الزنك، الأحماض الدهنية، البيوتين",
          food: "Oysters, beef, flaxseeds, eggs",
          foodAr: "المحار، اللحم البقري، بذور الكتان، البيض"
      },
      {
          id: "hair_scaly",
          sign: "Scaly / Flaky Scalp", 
          signAr: "فروة رأس قشرية",
          deficiency: "Essential Fatty Acids (EFA)",
          deficiencyAr: "الأحماض الدهنية الأساسية",
          food: "Fish oil, walnuts, flaxseeds",
          foodAr: "زيت السمك، الجوز، بذور الكتان"
      }
    ]
  },
  {
    id: "face_eyes",
    name: "Face & Eyes",
    nameAr: "الوجه والعيون",
    icon: "👁️",
    items: [
       {
          id: "face_moon",
          sign: "Moon Face / Depigmentation",
          signAr: "وجه قمري / نقص تصبغ",
          deficiency: "Protein (Kwashiorkor)",
          deficiencyAr: "البروتين",
          food: "High protein diet",
          foodAr: "نظام غذائي عالي البروتين"
      },
      {
          id: "face_wasting",
          sign: "Temporal Wasting",
          signAr: "هزال الصدغين",
          deficiency: "Protein-Calorie Malnutrition",
          deficiencyAr: "سوء تغذية البروتين والسعرات",
          food: "High calorie, high protein support",
          foodAr: "دعم عالي السعرات والبروتين"
      },
      { 
          id: "eye_pale", 
          sign: "Pale Conjunctiva", 
          signAr: "شحوب الملتحمة", 
          deficiency: "Iron, Folate, B12", 
          deficiencyAr: "الحديد، الفولات، ب12",
          food: "Red meat, liver, spinach, beans",
          foodAr: "اللحوم الحمراء، الكبد، السبانخ، الفاصوليا"
      },
      { 
          id: "eye_bitot", 
          sign: "Bitot’s Spots", 
          signAr: "بقع بيتو", 
          deficiency: "Vitamin A", 
          deficiencyAr: "فيتامين أ",
          food: "Liver, sweet potato, carrots, dairy",
          foodAr: "الكبد، البطاطا الحلوة، الجزر، الألبان"
      },
      { 
          id: "eye_night", 
          sign: "Night Blindness", 
          signAr: "العشى الليلي", 
          deficiency: "Vitamin A", 
          deficiencyAr: "فيتامين أ",
          food: "Carrots, spinach, kale, apricots",
          foodAr: "الجزر، السبانخ، الكرنب، المشمش"
      },
      { 
          id: "eye_xanthelasma", 
          sign: "Xanthelasma (Fat deposits)", 
          signAr: "لويحات صفراء", 
          deficiency: "Hyperlipidemia (Excess)", 
          deficiencyAr: "فرط دهون الدم",
          food: "Reduce saturated fats, increase fiber",
          foodAr: "تقليل الدهون المشبعة، زيادة الألياف"
      },
      { 
          id: "eye_angular", 
          sign: "Angular Blepharitis", 
          signAr: "التهاب زوايا الجفن", 
          deficiency: "Riboflavin (B2), B6", 
          deficiencyAr: "ريبوفلافين، ب6",
          food: "Milk, yogurt, organ meats",
          foodAr: "الحليب، الزبادي، لحوم الأعضاء"
      }
    ]
  },
  {
    id: "oral",
    name: "Oral Cavity",
    nameAr: "تجويف الفم",
    icon: "👄",
    items: [
      { 
          id: "mouth_cheilitis", 
          sign: "Angular Cheilitis / Stomatitis", 
          signAr: "تشقق زوايا الفم / التهاب الفم", 
          deficiency: "B2, B3, B6, Iron", 
          deficiencyAr: "ب2، ب3، ب6، الحديد",
          food: "Dairy, eggs, meat, fortified cereals",
          foodAr: "الألبان، البيض، اللحوم، الحبوب المدعمة"
      },
      { 
          id: "mouth_glossitis", 
          sign: "Glossitis (Beefy Red Tongue)", 
          signAr: "التهاب اللسان (لسان أحمر غامق)", 
          deficiency: "Niacin (B3), Folate, B12, B2", 
          deficiencyAr: "ب3، الفولات، ب12، ب2",
          food: "Meat, fish, enriched grains, peanuts",
          foodAr: "اللحوم، الأسماك، الحبوب المدعمة، الفول السوداني"
      },
      { 
          id: "mouth_magenta", 
          sign: "Magenta Tongue", 
          signAr: "لسان أرجواني", 
          deficiency: "Riboflavin (B2)", 
          deficiencyAr: "ريبوفلافين (ب2)",
          food: "Milk, yogurt, almonds, mushrooms",
          foodAr: "الحليب، الزبادي، اللوز، المشروم"
      },
      { 
          id: "mouth_atrophic", 
          sign: "Atrophic Papillae (Smooth)", 
          signAr: "ضمور الحليمات (لسان أملس)", 
          deficiency: "Iron, Folate, B12, Niacin", 
          deficiencyAr: "الحديد، الفولات، ب12، النياسين",
          food: "Red meat, liver, leafy greens",
          foodAr: "اللحوم الحمراء، الكبد، الخضروات الورقية"
      },
      { 
          id: "mouth_gums", 
          sign: "Spongy / Bleeding Gums", 
          signAr: "لثة إسفنجية / نازفة", 
          deficiency: "Vitamin C", 
          deficiencyAr: "فيتامين سي",
          food: "Citrus, peppers, broccoli, strawberries",
          foodAr: "الحمضيات، الفلفل، البروكلي، الفراولة"
      },
      { 
          id: "mouth_taste", 
          sign: "Dysgeusia (Taste loss)", 
          signAr: "خلل التذوق", 
          deficiency: "Zinc", 
          deficiencyAr: "الزنك",
          food: "Shellfish, beef, pumpkin seeds",
          foodAr: "المحار، اللحم البقري، بذور اليقطين"
      }
    ]
  },
  {
    id: "skin",
    name: "Skin",
    nameAr: "الجلد",
    icon: "✋",
    items: [
      { 
          id: "skin_pellagra", 
          sign: "Pellagra (Dermatitis on sun areas)", 
          signAr: "بلاجرا (التهاب جلدي في المناطق المعرضة للشمس)", 
          deficiency: "Niacin (B3)", 
          deficiencyAr: "النياسين (ب3)",
          food: "Poultry, tuna, peanuts, whole grains",
          foodAr: "الدواجن، التونة، الفول السوداني، الحبوب الكاملة"
      },
      { 
          id: "skin_petechiae", 
          sign: "Petechiae / Ecchymosis", 
          signAr: "نمشات دموية / كدمات", 
          deficiency: "Vitamin C, Vitamin K", 
          deficiencyAr: "فيتامين سي، فيتامين ك",
          food: "Leafy greens (K), Citrus (C)",
          foodAr: "الخضروات الورقية (ك)، الحمضيات (سي)"
      },
      { 
          id: "skin_follicular", 
          sign: "Follicular Hyperkeratosis (Gooseflesh)", 
          signAr: "فرط التقرن الجريبي (جلد الوزة)", 
          deficiency: "Vitamin A, Vitamin C, EFA", 
          deficiencyAr: "فيتامين أ، سي، الأحماض الدهنية",
          food: "Carrots, sweet potato, citrus, healthy oils",
          foodAr: "الجزر، البطاطا، الحمضيات، الزيوت الصحية"
      },
      { 
          id: "skin_seborrhea", 
          sign: "Nasolabial Seborrhea", 
          signAr: "دهنية حول الأنف", 
          deficiency: "B2 (Riboflavin), B6, Zinc", 
          deficiencyAr: "ب2، ب6، الزنك",
          food: "Dairy, eggs, meat, whole grains",
          foodAr: "الألبان، البيض، اللحوم، الحبوب الكاملة"
      },
      { 
          id: "skin_healing", 
          sign: "Delayed Wound Healing", 
          signAr: "تأخر التئام الجروح", 
          deficiency: "Protein, Zinc, Vitamin C", 
          deficiencyAr: "البروتين، الزنك، فيتامين سي",
          food: "High protein, citrus, shellfish",
          foodAr: "بروتين عالي، حمضيات، مأكولات بحرية"
      },
       { 
          id: "skin_pallor", 
          sign: "Pallor / Paleness", 
          signAr: "شحوب", 
          deficiency: "Iron, B12, Folate", 
          deficiencyAr: "الحديد، ب12، الفولات",
          food: "Red meat, spinach, beans",
          foodAr: "اللحوم الحمراء، السبانخ، الفاصوليا"
      }
    ]
  },
  {
    id: "nails",
    name: "Nails",
    nameAr: "الأظافر",
    icon: "💅",
    items: [
      { 
          id: "nails_koilonychia", 
          sign: "Koilonychia (Spoon Nails)", 
          signAr: "تأقر الأظافر (أظافر ملعقية)", 
          deficiency: "Iron (Severe)", 
          deficiencyAr: "الحديد (شديد)",
          food: "Red meat, liver, clams, fortified cereals",
          foodAr: "اللحوم الحمراء، الكبد، المحار، الحبوب المدعمة"
      },
      { 
          id: "nails_beau", 
          sign: "Beau’s Lines (Transverse Ridges)", 
          signAr: "خطوط بو (نتوءات عرضية)", 
          deficiency: "Protein, Zinc (Acute stress)", 
          deficiencyAr: "البروتين، الزنك",
          food: "Adequate protein intake",
          foodAr: "تناول بروتين كافٍ"
      },
      { 
          id: "nails_splinter", 
          sign: "Splinter Hemorrhages", 
          signAr: "نزيف شظوي", 
          deficiency: "Vitamin C", 
          deficiencyAr: "فيتامين سي",
          food: "Citrus, peppers, broccoli",
          foodAr: "الحمضيات، الفلفل، البروكلي"
      },
      { 
          id: "nails_leukonychia", 
          sign: "Leukonychia (White spots)", 
          signAr: "بقع بيضاء", 
          deficiency: "Zinc, Selenium", 
          deficiencyAr: "الزنك، السيلينيوم",
          food: "Oysters, brazil nuts, meat",
          foodAr: "المحار، المكسرات البرازيلية، اللحوم"
      }
    ]
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal",
    nameAr: "الجهاز العضلي الهيكلي",
    icon: "🦴",
    items: [
      { 
          id: "bone_rickets", 
          sign: "Rickets (Bow legs / Beading ribs)", 
          signAr: "الكساح (تقوس الساقين / سبحة ضلعية)", 
          deficiency: "Vitamin D, Calcium", 
          deficiencyAr: "فيتامين د، الكالسيوم",
          food: "Sunlight, fortified milk, fatty fish",
          foodAr: "الشمس، الحليب المدعم، الأسماك الدهنية"
      },
      { 
          id: "muscle_wasting", 
          sign: "Muscle Wasting (Sarcopenia)", 
          signAr: "هزال العضلات", 
          deficiency: "Protein, Energy", 
          deficiencyAr: "البروتين، الطاقة",
          food: "High protein, resistance exercise",
          foodAr: "بروتين عالي، تمارين المقاومة"
      },
      { 
          id: "muscle_calf_pain", 
          sign: "Calf Tenderness / Pain", 
          signAr: "ألم بطة الساق", 
          deficiency: "Thiamin (B1), Selenium", 
          deficiencyAr: "الثيامين، السيلينيوم",
          food: "Whole grains, pork, brazil nuts",
          foodAr: "الحبوب الكاملة، لحم الخنزير (بدائل)، المكسرات"
      },
      { 
          id: "joint_pain", 
          sign: "Joint Pain / Swelling", 
          signAr: "ألم / تورم المفاصل", 
          deficiency: "Vitamin C (Scurvy)", 
          deficiencyAr: "فيتامين سي (الاسقربوط)",
          food: "Citrus fruits, fresh vegetables",
          foodAr: "الحمضيات، الخضروات الطازجة"
      }
    ]
  }
];