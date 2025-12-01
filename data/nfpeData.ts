
export interface NFPEItem {
  id: string;
  sign: string;
  deficiency: string;
}

export interface NFPESystem {
  id: string;
  name: string;
  icon: string;
  items: NFPEItem[];
}

export const nfpeData: NFPESystem[] = [
  {
    id: "eyes",
    name: "Eyes",
    icon: "👁️",
    items: [
      { id: "eye_conjunctiva", sign: "Dry conjunctiva (Xerosis)", deficiency: "Vitamin A" },
      { id: "eye_bitot", sign: "Bitot’s spots", deficiency: "Vitamin A" },
      { id: "eye_night", sign: "Night blindness", deficiency: "Vitamin A" },
      { id: "eye_redness", sign: "Redness & vascularization", deficiency: "Riboflavin (B2)" },
      { id: "eye_pale", sign: "Pale conjunctiva", deficiency: "Iron, Folate, B12" },
      { id: "eye_clouding", sign: "Corneal clouding", deficiency: "Vitamin A or Protein" }
    ]
  },
  {
    id: "mouth",
    name: "Mouth",
    icon: "👄",
    items: [
      { id: "mouth_cheilitis", sign: "Angular cheilitis (cracked corners)", deficiency: "Riboflavin (B2), Niacin (B3), B6, Iron" },
      { id: "mouth_tongue_swollen", sign: "Swollen red tongue (Glossitis)", deficiency: "Niacin (B3), Folate, B12" },
      { id: "mouth_tongue_smooth", sign: "Smooth, shiny tongue", deficiency: "Iron, Folate, B12" },
      { id: "mouth_gums", sign: "Bleeding/Spongy gums", deficiency: "Vitamin C" },
      { id: "mouth_dry", sign: "Dry mouth (Xerostomia)", deficiency: "Dehydration or Vitamin A" },
      { id: "mouth_taste", sign: "Loss of taste (Hypogeusia)", deficiency: "Zinc" }
    ]
  },
  {
    id: "skin",
    name: "Skin",
    icon: "✋",
    items: [
      { id: "skin_dry", sign: "Dry, rough texture (Follicular Hyperkeratosis)", deficiency: "Vitamin A, Essential Fatty Acids (EFA)" },
      { id: "skin_rash", sign: "Eczema-like rash", deficiency: "Zinc, EFA" },
      { id: "skin_pellagra", sign: "Hyperpigmentation / cracked skin (Pellagra)", deficiency: "Niacin (B3)" },
      { id: "skin_petechiae", sign: "Petechiae / Easy bruising", deficiency: "Vitamin C, Vitamin K" },
      { id: "skin_healing", sign: "Poor wound healing", deficiency: "Protein, Vitamin C, Zinc" },
      { id: "skin_pallor", sign: "Pallor (Pale skin)", deficiency: "Iron, Folate, B12" }
    ]
  },
  {
    id: "hair",
    name: "Hair",
    icon: "💇",
    items: [
      { id: "hair_brittle", sign: "Dry, brittle hair", deficiency: "Protein, Zinc, Biotin" },
      { id: "hair_loss", sign: "Hair loss (Alopecia)", deficiency: "Zinc, Protein, Iron" },
      { id: "hair_color", sign: "Color change (Depigmentation/Flag sign)", deficiency: "Protein, Copper" },
      { id: "hair_corkscrew", sign: "Corkscrew hair", deficiency: "Vitamin C" }
    ]
  },
  {
    id: "nails",
    name: "Nails",
    icon: "💅",
    items: [
      { id: "nails_beau", sign: "Beau’s lines (horizontal ridges)", deficiency: "Protein, Zinc" },
      { id: "nails_brittle", sign: "Brittle nails", deficiency: "Protein, Iron" },
      { id: "nails_spoon", sign: "Spoon-shaped nails (Koilonychia)", deficiency: "Iron" }
    ]
  },
  {
    id: "muscle",
    name: "Muscles / Hands",
    icon: "💪",
    items: [
      { id: "muscle_wasting", sign: "Muscle wasting (Temporalis, Clavicle, Hands)", deficiency: "Protein, Energy (calorie) deficit" },
      { id: "muscle_cramps", sign: "Muscle cramps/Tetany", deficiency: "Magnesium, Calcium, Vitamin D" }
    ]
  },
  {
    id: "nervous",
    name: "Nervous System",
    icon: "🧠",
    items: [
      { id: "neuro_tingling", sign: "Numbness, tingling (Peripheral Neuropathy)", deficiency: "B12, B6, Thiamine (B1)" },
      { id: "neuro_conf", sign: "Memory loss, confusion", deficiency: "Thiamine (B1), Niacin (B3), B12" },
      { id: "neuro_ataxia", sign: "Ataxia (loss of coordination)", deficiency: "B12, Copper, Vitamin E" }
    ]
  },
  {
    id: "cardio",
    name: "Cardiovascular",
    icon: "❤️",
    items: [
      { id: "cardio_heart", sign: "Enlarged heart (Cardiomegaly)", deficiency: "Thiamine (B1) - Wet Beriberi" },
      { id: "cardio_bp", sign: "Low blood pressure", deficiency: "Fluid or Sodium deficiency" }
    ]
  },
  {
    id: "gi",
    name: "Gastrointestinal",
    icon: "🤢",
    items: [
      { id: "gi_diarrhea", sign: "Chronic diarrhea", deficiency: "Niacin (B3), Zinc, Protein" },
      { id: "gi_appetite", sign: "Loss of appetite", deficiency: "Zinc, Vitamin A, Thiamine (B1)" }
    ]
  },
  {
    id: "bones",
    name: "Bones / Joints",
    icon: "🦴",
    items: [
      { id: "bone_rickets", sign: "Rickets / osteomalacia (soft bones)", deficiency: "Vitamin D, Calcium, Phosphorus" },
      { id: "bone_joint", sign: "Joint pain", deficiency: "Vitamin C, Vitamin D" }
    ]
  },
  {
    id: "edema",
    name: "Edema / Fluid",
    icon: "💧",
    items: [
      { id: "edema_swelling", sign: "Swelling of feet/legs (Pitting Edema)", deficiency: "Protein (Hypoalbuminemia), Thiamine (B1)" },
      { id: "edema_ascites", sign: "Ascites", deficiency: "Protein, Liver dysfunction" }
    ]
  },
  {
    id: "neck",
    name: "Neck / Thyroid",
    icon: "🧣",
    items: [
        { id: "neck_goiter", sign: "Enlarged Thyroid (Goiter)", deficiency: "Iodine" }
    ]
  },
  {
      id: "general",
      name: "Constitutional",
      icon: "🌡️",
      items: [
          { id: "gen_fatigue", sign: "Chronic Fatigue", deficiency: "Iron, B12, Vitamin D, Calories" }
      ]
  }
];
