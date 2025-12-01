
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
    id: "eyes",
    name: "Eyes",
    nameAr: "العيون",
    icon: "👁️",
    items: [
      { 
          id: "eye_conjunctiva", 
          sign: "Dry conjunctiva (Xerosis)", 
          signAr: "جفاف الملتحمة", 
          deficiency: "Vitamin A", 
          deficiencyAr: "فيتامين أ",
          food: "Liver, sweet potato, carrots, dark leafy greens",
          foodAr: "الكبد، البطاطا الحلوة، الجزر، الخضروات الورقية الداكنة"
      },
      { 
          id: "eye_bitot", 
          sign: "Bitot’s spots", 
          signAr: "بقع بيتو", 
          deficiency: "Vitamin A", 
          deficiencyAr: "فيتامين أ",
          food: "Liver, fish oil, dairy, eggs",
          foodAr: "الكبد، زيت السمك، منتجات الألبان، البيض"
      },
      { 
          id: "eye_night", 
          sign: "Night blindness", 
          signAr: "العشى الليلي", 
          deficiency: "Vitamin A", 
          deficiencyAr: "فيتامين أ",
          food: "Carrots, spinach, kale, apricots",
          foodAr: "الجزر، السبانخ، الكرنب، المشمش"
      },
      { 
          id: "eye_redness", 
          sign: "Redness & vascularization", 
          signAr: "احمرار الأوعية الدموية", 
          deficiency: "Riboflavin (B2)", 
          deficiencyAr: "فيتامين ب2",
          food: "Milk, yogurt, almonds, organ meats",
          foodAr: "الحليب، الزبادي، اللوز، لحوم الأعضاء"
      },
      { 
          id: "eye_pale", 
          sign: "Pale conjunctiva", 
          signAr: "شحوب الملتحمة", 
          deficiency: "Iron, Folate, B12", 
          deficiencyAr: "الحديد، الفولات، فيتامين ب12",
          food: "Red meat, beans, lentils, spinach (Iron)",
          foodAr: "اللحوم الحمراء، الفاصوليا، العدس، السبانخ (للحديد)"
      }
    ]
  },
  {
    id: "mouth",
    name: "Mouth",
    nameAr: "الفم",
    icon: "👄",
    items: [
      { 
          id: "mouth_cheilitis", 
          sign: "Angular cheilitis (cracked corners)", 
          signAr: "تشقق زوايا الفم", 
          deficiency: "B2, B3, B6, Iron", 
          deficiencyAr: "ب2، ب3، ب6، الحديد",
          food: "Eggs, meat, poultry, legumes",
          foodAr: "البيض، اللحوم، الدواجن، البقوليات"
      },
      { 
          id: "mouth_tongue_swollen", 
          sign: "Swollen red tongue (Glossitis)", 
          signAr: "تورم اللسان (التهاب اللسان)", 
          deficiency: "B3, Folate, B12", 
          deficiencyAr: "ب3، الفولات، ب12",
          food: "Fish, poultry, peanuts, enriched grains",
          foodAr: "السمك، الدواجن، الفول السوداني، الحبوب المدعمة"
      },
      { 
          id: "mouth_tongue_smooth", 
          sign: "Smooth, shiny tongue", 
          signAr: "لسان أملس ولامع", 
          deficiency: "Iron, Folate, B12", 
          deficiencyAr: "الحديد، الفولات، ب12",
          food: "Meat, eggs, leafy greens, fortified cereals",
          foodAr: "اللحوم، البيض، الخضروات الورقية، الحبوب المدعمة"
      },
      { 
          id: "mouth_gums", 
          sign: "Bleeding/Spongy gums", 
          signAr: "نزيف أو تورم اللثة", 
          deficiency: "Vitamin C", 
          deficiencyAr: "فيتامين سي",
          food: "Citrus fruits, strawberries, peppers, broccoli",
          foodAr: "الحمضيات، الفراولة، الفلفل، البروكلي"
      },
      { 
          id: "mouth_taste", 
          sign: "Loss of taste (Hypogeusia)", 
          signAr: "فقدان حاسة التذوق", 
          deficiency: "Zinc", 
          deficiencyAr: "الزنك",
          food: "Oysters, beef, pumpkin seeds, cashews",
          foodAr: "المحار، اللحم البقري، بذور اليقطين، الكاجو"
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
          id: "skin_dry", 
          sign: "Dry, rough texture", 
          signAr: "جلد جاف وخشن", 
          deficiency: "Vitamin A, EFA", 
          deficiencyAr: "فيتامين أ، الأحماض الدهنية",
          food: "Fish, nuts, seeds, avocado",
          foodAr: "السمك، المكسرات، البذور، الأفوكادو"
      },
      { 
          id: "skin_rash", 
          sign: "Eczema-like rash", 
          signAr: "طفح جلدي (يشبه الإكزيما)", 
          deficiency: "Zinc, EFA", 
          deficiencyAr: "الزنك، الأحماض الدهنية",
          food: "Shellfish, meat, legumes, seeds",
          foodAr: "المأكولات البحرية، اللحوم، البقوليات، البذور"
      },
      { 
          id: "skin_pellagra", 
          sign: "Hyperpigmentation (Pellagra)", 
          signAr: "تصبغ الجلد (البلاجرا)", 
          deficiency: "Niacin (B3)", 
          deficiencyAr: "النياسين (ب3)",
          food: "Chicken, tuna, turkey, peanuts",
          foodAr: "الدجاج، التونة، الديك الرومي، الفول السوداني"
      },
      { 
          id: "skin_petechiae", 
          sign: "Easy bruising / Petechiae", 
          signAr: "سهولة الكدمات / نمشات دموية", 
          deficiency: "Vitamin C, Vitamin K", 
          deficiencyAr: "فيتامين سي، فيتامين ك",
          food: "Leafy greens (Vit K), Citrus (Vit C)",
          foodAr: "الخضروات الورقية (فيتامين ك)، الحمضيات (فيتامين سي)"
      },
      { 
          id: "skin_healing", 
          sign: "Poor wound healing", 
          signAr: "بطء التئام الجروح", 
          deficiency: "Protein, Vitamin C, Zinc", 
          deficiencyAr: "البروتين، فيتامين سي، الزنك",
          food: "Meat, citrus, nuts, beans",
          foodAr: "اللحوم، الحمضيات، المكسرات، الفاصوليا"
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
          id: "hair_brittle", 
          sign: "Dry, brittle hair", 
          signAr: "شعر جاف ومتقصف", 
          deficiency: "Protein, Zinc, Biotin", 
          deficiencyAr: "البروتين، الزنك، البيوتين",
          food: "Eggs, almonds, sweet potato, meat",
          foodAr: "البيض، اللوز، البطاطا الحلوة، اللحوم"
      },
      { 
          id: "hair_loss", 
          sign: "Hair loss (Alopecia)", 
          signAr: "تساقط الشعر", 
          deficiency: "Zinc, Protein, Iron", 
          deficiencyAr: "الزنك، البروتين، الحديد",
          food: "Red meat, lentils, pumpkin seeds",
          foodAr: "اللحوم الحمراء، العدس، بذور اليقطين"
      },
      { 
          id: "hair_color", 
          sign: "Depigmentation (Flag sign)", 
          signAr: "تغير لون الشعر (علامة العلم)", 
          deficiency: "Protein, Copper", 
          deficiencyAr: "البروتين، النحاس",
          food: "Liver, oysters, spirulina, dark chocolate",
          foodAr: "الكبد، المحار، السبيرولينا، الشوكولاتة الداكنة"
      },
      { 
          id: "hair_corkscrew", 
          sign: "Corkscrew hair", 
          signAr: "شعر لولبي", 
          deficiency: "Vitamin C", 
          deficiencyAr: "فيتامين سي",
          food: "Peppers, kiwi, strawberries, oranges",
          foodAr: "الفلفل، الكيوي، الفراولة، البرتقال"
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
          id: "nails_beau", 
          sign: "Beau’s lines (ridges)", 
          signAr: "خطوط بو (نتوءات أفقية)", 
          deficiency: "Protein, Zinc", 
          deficiencyAr: "البروتين، الزنك",
          food: "Meat, dairy, legumes, nuts",
          foodAr: "اللحوم، الألبان، البقوليات، المكسرات"
      },
      { 
          id: "nails_spoon", 
          sign: "Spoon-shaped (Koilonychia)", 
          signAr: "أظافر ملعقية", 
          deficiency: "Iron", 
          deficiencyAr: "الحديد",
          food: "Red meat, spinach, liver, fortified cereals",
          foodAr: "اللحوم الحمراء، السبانخ، الكبد، الحبوب المدعمة"
      },
      { 
          id: "nails_white", 
          sign: "White spots (Leukonychia)", 
          signAr: "بقع بيضاء", 
          deficiency: "Zinc", 
          deficiencyAr: "الزنك",
          food: "Oysters, beef, pumpkin seeds",
          foodAr: "المحار، اللحم البقري، بذور اليقطين"
      }
    ]
  },
  {
    id: "muscle",
    name: "Muscles",
    nameAr: "العضلات",
    icon: "💪",
    items: [
      { 
          id: "muscle_wasting", 
          sign: "Muscle wasting", 
          signAr: "هزال العضلات", 
          deficiency: "Protein, Calories", 
          deficiencyAr: "البروتين، السعرات الحرارية",
          food: "High protein foods, balanced meals",
          foodAr: "أطعمة عالية البروتين، وجبات متوازنة"
      },
      { 
          id: "muscle_cramps", 
          sign: "Muscle cramps/Tetany", 
          signAr: "تشنجات عضلية", 
          deficiency: "Magnesium, Calcium, Vit D", 
          deficiencyAr: "المغنيسيوم، الكالسيوم، فيتامين د",
          food: "Bananas, almonds, yogurt, leafy greens",
          foodAr: "الموز، اللوز، الزبادي، الخضروات الورقية"
      }
    ]
  },
  {
    id: "nervous",
    name: "Nervous System",
    nameAr: "الجهاز العصبي",
    icon: "🧠",
    items: [
      { 
          id: "neuro_tingling", 
          sign: "Numbness/Tingling", 
          signAr: "تنميل / وخز", 
          deficiency: "B12, B6, B1", 
          deficiencyAr: "ب12، ب6، ب1",
          food: "Meat, fish, poultry, fortified yeast",
          foodAr: "اللحوم، الأسماك، الدواجن، الخميرة المدعمة"
      },
      { 
          id: "neuro_conf", 
          sign: "Confusion/Memory loss", 
          signAr: "الارتباك / فقدان الذاكرة", 
          deficiency: "B1, B3, B12", 
          deficiencyAr: "ب1، ب3، ب12",
          food: "Whole grains, meat, dairy",
          foodAr: "الحبوب الكاملة، اللحوم، الألبان"
      }
    ]
  },
  {
    id: "bones",
    name: "Bones",
    nameAr: "العظام",
    icon: "🦴",
    items: [
      { 
          id: "bone_soft", 
          sign: "Rickets / Osteomalacia", 
          signAr: "الكساح / لين العظام", 
          deficiency: "Vitamin D, Calcium", 
          deficiencyAr: "فيتامين د، الكالسيوم",
          food: "Fatty fish, dairy, sunlight, egg yolks",
          foodAr: "الأسماك الدهنية، الألبان، أشعة الشمس، صفار البيض"
      },
      { 
          id: "bone_joint", 
          sign: "Joint pain", 
          signAr: "آلام المفاصل", 
          deficiency: "Vitamin C, Vitamin D", 
          deficiencyAr: "فيتامين سي، فيتامين د",
          food: "Citrus fruits, peppers, fortified milk",
          foodAr: "الحمضيات، الفلفل، الحليب المدعم"
      }
    ]
  },
  {
    id: "general",
    name: "General",
    nameAr: "عام",
    icon: "🌡️",
    items: [
      { 
          id: "gen_fatigue", 
          sign: "Chronic Fatigue", 
          signAr: "تعب مزمن", 
          deficiency: "Iron, B12, Vit D", 
          deficiencyAr: "الحديد، ب12، فيتامين د",
          food: "Red meat, eggs, fish, fortified foods",
          foodAr: "اللحوم الحمراء، البيض، الأسماك، الأطعمة المدعمة"
      },
      { 
          id: "gen_cold", 
          sign: "Cold intolerance", 
          signAr: "عدم تحمل البرد", 
          deficiency: "Iron, Iodine", 
          deficiencyAr: "الحديد، اليود",
          food: "Seafood, iodized salt, red meat",
          foodAr: "المأكولات البحرية، الملح اليودي، اللحوم الحمراء"
      }
    ]
  }
];
