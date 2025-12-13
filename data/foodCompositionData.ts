
export interface FoodCompositionItem {
    id: string;
    food: string; // Arabic/English Name
    category: string;
    water: number;
    energy: number; // Kcal
    protein: number;
    fat: number;
    carb: number;
    fiber: number;
    ash: number;
    calcium: number; // mg
    iron: number; // mg
    sodium: number; // mg
    potassium: number; // mg
    phosphorus: number; // mg
    vitA: number; // ugRE
    vitC: number; // mg
    code: number;
    refuse: number; // %
    // Extended Nutrients
    magnesium: number; // mg
    zinc: number; // mg
    copper: number; // mg
    thiamin: number; // mg
    riboflavin: number; // mg
}

// Data derived from provided CSV
export const foodCompositionData: FoodCompositionItem[] = [
  {
    id: "1", code: 1, category: "Cereals / الحبوب ومنتجاتها", food: "Barley (Grains) / شعير (حبوب)", water: 10.7, energy: 335, protein: 8.8, refuse: 0, ash: 2.9, fat: 1.5, fiber: 6.5, carb: 69.6, sodium: 55, potassium: 184, calcium: 299, magnesium: 104, phosphorus: 26, iron: 4.63, zinc: 2.25, copper: 0.41, thiamin: 0, riboflavin: 0.11, vitA: 0, vitC: 0.3
  },
  {
    id: "2", code: 2, category: "Cereals / الحبوب ومنتجاتها", food: "Corn, White / ذرة بيضاء", water: 10.7, energy: 364, protein: 10.2, refuse: 0, ash: 1.9, fat: 1.3, fiber: 2.42, carb: 71.9, sodium: 4, potassium: 125, calcium: 254, magnesium: 27, phosphorus: 25, iron: 1.7, zinc: 0.37, copper: 0.21, thiamin: 0, riboflavin: 0.12, vitA: 0, vitC: 0
  },
  {
    id: "3", code: 3, category: "Cereals / الحبوب ومنتجاتها", food: "Corn, Yellow / ذرة صفراء", water: 10.1, energy: 368, protein: 12.7, refuse: 0, ash: 2.6, fat: 1.8, fiber: 5.5, carb: 67, sodium: 67, potassium: 161, calcium: 239, magnesium: 30, phosphorus: 26, iron: 2.9, zinc: 1.5, copper: 0.19, thiamin: 0.39, riboflavin: 0.11, vitA: 5.5, vitC: 0
  },
  {
    id: "4", code: 4, category: "Cereals / الحبوب ومنتجاتها", food: "Corn Flakes / كورن فليكس", water: 6.2, energy: 373, protein: 5, refuse: 0, ash: 1, fat: 2, fiber: 2.4, carb: 82.3, sodium: 1, potassium: 15, calcium: 139, magnesium: 44, phosphorus: 464, iron: 2.4, zinc: 2.1, copper: 0.5, thiamin: 0.23, riboflavin: 0.09, vitA: 0, vitC: 0
  },
  {
    id: "5", code: 5, category: "Cereals / الحبوب ومنتجاتها", food: "Corn Flour / دقيق ذرة", water: 11.1, energy: 359, protein: 8.9, refuse: 0, ash: 1, fat: 0, fiber: 2.3, carb: 75.2, sodium: 1, potassium: 22, calcium: 20, magnesium: 1.3, phosphorus: 95, iron: 2.3, zinc: 1.05, copper: 0.19, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "6", code: 6, category: "Cereals / الحبوب ومنتجاتها", food: "Corn, Canned / ذرة معلبة", water: 74.5, energy: 100, protein: 2.8, refuse: 0, ash: 0.8, fat: 0.9, fiber: 0.65, carb: 20.1, sodium: 5, potassium: 82, calcium: 301, magnesium: 25, phosphorus: 7, iron: 0.9, zinc: 0.5, copper: 0.05, thiamin: 0.04, riboflavin: 0.03, vitA: 65, vitC: 7
  },
  {
    id: "7", code: 7, category: "Cereals / الحبوب ومنتجاتها", food: "Corn, Grilled (Cob) / ذرة مشوي (كوز)", water: 56.9, energy: 161, protein: 4, refuse: 39, ash: 1, fat: 3, fiber: 0, carb: 34.1, sodium: 1, potassium: 69, calcium: 7, magnesium: 8, phosphorus: 4, iron: 1.2, zinc: 0.14, copper: 1.02, thiamin: 0, riboflavin: 1, vitA: 1, vitC: 1
  },
  {
    id: "8", code: 8, category: "Cereals / الحبوب ومنتجاتها", food: "Popcorn / فشار", water: 9.1, energy: 451, protein: 1.8, refuse: 0, ash: 1.5, fat: 3.9, fiber: 2.5, carb: 706, sodium: 66, potassium: 293, calcium: 158, magnesium: 20, phosphorus: 16.7, iron: 1.8, zinc: 2.2, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "9", code: 9, category: "Cereals / الحبوب ومنتجاتها", food: "Corn Snacks (Karate) / سناكس ذرة (كاراتيه)", water: 7.8, energy: 503, protein: 2.7, refuse: 0, ash: 2, fat: 32, fiber: 1.5, carb: 60.1, sodium: 2, potassium: 687, calcium: 231, magnesium: 190, phosphorus: 30, iron: 25.7, zinc: 2.2, copper: 1.3, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "10", code: 10, category: "Cereals / الحبوب ومنتجاتها", food: "Corn Starch / نشا ذرة", water: 0.2, energy: 380, protein: 5, refuse: 0, ash: 0, fat: 0, fiber: 0, carb: 94.5, sodium: 7, potassium: 0, calcium: 0, magnesium: 0, phosphorus: 0, iron: 2.3, zinc: 1.05, copper: 0.1, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "11", code: 11, category: "Cereals / الحبوب ومنتجاتها", food: "Macaroni / مكرونة", water: 9.9, energy: 361, protein: 12, refuse: 0, ash: 0.8, fat: 1.4, fiber: 1.65, carb: 75.8, sodium: 22, potassium: 108, calcium: 176, magnesium: 35, phosphorus: 128, iron: 1.3, zinc: 0.77, copper: 0.15, thiamin: 0.17, riboflavin: 0.4, vitA: 0, vitC: 0
  },
  {
    id: "12", code: 12, category: "Cereals / الحبوب ومنتجاتها", food: "Macaroni with Sauce / مكرونة بالصلصة", water: 59.3, energy: 169, protein: 5, refuse: 0, ash: 0.7, fat: 3, fiber: 1.05, carb: 30.5, sodium: 0, potassium: 3, calcium: 0, magnesium: 15, phosphorus: 66, iron: 5.6, zinc: 1.6, copper: 0.6, thiamin: 0.3, riboflavin: 0.7, vitA: 0, vitC: 0
  },
  {
    id: "13", code: 13, category: "Cereals / الحبوب ومنتجاتها", food: "Macaroni with Sauce & Meat / مكرونة بالصلصة واللحم", water: 61, energy: 175, protein: 6.8, refuse: 0, ash: 1.6, fat: 24.4, fiber: 0.6, carb: 2.42, sodium: 5.6, potassium: 130, calcium: 184, magnesium: 30, phosphorus: 6, iron: 1.1, zinc: 1.05, copper: 0.7, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "14", code: 14, category: "Cereals / الحبوب ومنتجاتها", food: "Fried Vermicelli / شعرية محمرة", water: 52, energy: 218, protein: 5.1, refuse: 0, ash: 0.6, fat: 6, fiber: 0.3, carb: 0.6, sodium: 36, potassium: 6, calcium: 18, magnesium: 0.3, phosphorus: 250, iron: 1.2, zinc: 0.7, copper: 0.6, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "15", code: 15, category: "Cereals / الحبوب ومنتجاتها", food: "Rice (Long Grain) / ارز (طويل الحبة)", water: 8.7, energy: 357, protein: 11.2, refuse: 0, ash: 0.3, fat: 0.8, fiber: 0.09, carb: 78.7, sodium: 13, potassium: 108, calcium: 108, magnesium: 22, phosphorus: 15, iron: 0.77, zinc: 1.3, copper: 0.23, thiamin: 0.15, riboflavin: 0.04, vitA: 0, vitC: 0
  },
  {
    id: "16", code: 16, category: "Cereals / الحبوب ومنتجاتها", food: "Rice (Short Grain) / ارز (قصير الحبة)", water: 7.3, energy: 351, protein: 12.5, refuse: 0, ash: 0.7, fat: 0.4, fiber: 0.69, carb: 78.8, sodium: 11, potassium: 30, calcium: 93, magnesium: 98, phosphorus: 23, iron: 0.3, zinc: 1.05, copper: 0.31, thiamin: 0.4, riboflavin: 0.03, vitA: 0, vitC: 0
  },
  {
    id: "17", code: 17, category: "Cereals / الحبوب ومنتجاتها", food: "Rice Flour / دقيق ارز", water: 7.3, energy: 354, protein: 11.6, refuse: 0, ash: 0.5, fat: 0.3, fiber: 0.76, carb: 80, sodium: 10, potassium: 106, calcium: 13, magnesium: 80, phosphorus: 13, iron: 0.5, zinc: 0.3, copper: 0.2, thiamin: 0.3, riboflavin: 0.05, vitA: 0, vitC: 0
  },
  {
    id: "18", code: 18, category: "Cereals / الحبوب ومنتجاتها", food: "Fried Rice / ارز محمر", water: 49.8, energy: 214, protein: 3.6, refuse: 0, ash: 0.7, fat: 3.9, fiber: 1.3, carb: 41.1, sodium: 7, potassium: 278, calcium: 67, magnesium: 43, phosphorus: 0.25, iron: 3.9, zinc: 0.3, copper: 0.43, thiamin: 0.43, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "19", code: 19, category: "Cereals / الحبوب ومنتجاتها", food: "Rice with Vermicelli / ارز بالشعرية", water: 49.4, energy: 219, protein: 3.5, refuse: 0, ash: 0.7, fat: 4.5, fiber: 1.2, carb: 41.1, sodium: 75, potassium: 18, calcium: 299, magnesium: 52, phosphorus: 0.7, iron: 4.5, zinc: 0.3, copper: 0.45, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "20", code: 20, category: "Cereals / الحبوب ومنتجاتها", food: "Rice with Onion / ارز بالبصل", water: 53.7, energy: 203, protein: 3.1, refuse: 0, ash: 0.8, fat: 4.6, fiber: 0.8, carb: 37.2, sodium: 15, potassium: 62, calcium: 42, magnesium: 4.6, phosphorus: 0.6, iron: 1, zinc: 0.8, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "21", code: 21, category: "Cereals / الحبوب ومنتجاتها", food: "Fortified Rice (Baby) / ارز معزز (للأطفال)", water: 4.2, energy: 369, protein: 16.2, refuse: 0, ash: 4, fat: 7.8, fiber: 5.55, carb: 66.4, sodium: 460, potassium: 10, calcium: 13, magnesium: 5.6, phosphorus: 7, iron: 2.2, zinc: 375, copper: 0.6, thiamin: 0.4, riboflavin: 0.6, vitA: 40, vitC: 2.2
  },
  {
    id: "22", code: 22, category: "Cereals / الحبوب ومنتجاتها", food: "Koshary (Home) / كشري (بيت)", water: 61, energy: 172, protein: 6.5, refuse: 0, ash: 1.1, fat: 1.4, fiber: 1.5, carb: 24.7, sodium: 228, potassium: 324, calcium: 10, magnesium: 1.4, phosphorus: 228, iron: 5.2, zinc: 1.1, copper: 0.2, thiamin: 1.3, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "23", code: 23, category: "Cereals / الحبوب ومنتجاتها", food: "Koshary (Shop) / كشري (محلات)", water: 63, energy: 157, protein: 4.5, refuse: 0, ash: 1.6, fat: 0.82, fiber: 3.7, carb: 26.3, sodium: 8, potassium: 185, calcium: 401, magnesium: 27, phosphorus: 0.9, iron: 1.6, zinc: 0.12, copper: 1.11, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "24", code: 24, category: "Cereals / الحبوب ومنتجاتها", food: "Rice Pudding / ارز باللبن", water: 70, energy: 129, protein: 3.3, refuse: 0, ash: 0.5, fat: 2.5, fiber: 0.05, carb: 23.1, sodium: 25, potassium: 125, calcium: 58, magnesium: 0.5, phosphorus: 2.6, iron: 0.05, zinc: 0.5, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "25", code: 25, category: "Cereals / الحبوب ومنتجاتها", food: "Rice Crispy / ارز (كرسبي)", water: 5, energy: 379, protein: 9, refuse: 0, ash: 0.7, fat: 1.15, fiber: 1.01, carb: 84.2, sodium: 105, potassium: 14, calcium: 141, magnesium: 13, phosphorus: 0.8, iron: 0.3, zinc: 0.7, copper: 0.23, thiamin: 0.98, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "26", code: 26, category: "Cereals / الحبوب ومنتجاتها", food: "Semolina / سميد (سيمولينا)", water: 11, energy: 360, protein: 12, refuse: 0, ash: 0.4, fat: 2.5, fiber: 2.02, carb: 74, sodium: 114, potassium: 5, calcium: 208, magnesium: 26, phosphorus: 74, iron: 1.8, zinc: 0.1, copper: 0.2, thiamin: 0.15, riboflavin: 1.9, vitA: 0, vitC: 0
  },
  {
    id: "27", code: 27, category: "Cereals / الحبوب ومنتجاتها", food: "Sorghum / ذرة عويجه", water: 8.9, energy: 366, protein: 10.9, refuse: 0, ash: 2.2, fat: 10, fiber: 4.4, carb: 72.6, sodium: 23, potassium: 250, calcium: 40, magnesium: 131, phosphorus: 3.6, iron: 1.8, zinc: 3.06, copper: 0.41, thiamin: 0.21, riboflavin: 0.1, vitA: 0, vitC: 0
  },
  {
    id: "28", code: 28, category: "Cereals / الحبوب ومنتجاتها", food: "Bran / ردة", water: 10.2, energy: 313, protein: 14.4, refuse: 0, ash: 3.9, fat: 12.51, fiber: 6.5, carb: 10, sodium: 60, potassium: 91, calcium: 105, magnesium: 55, phosphorus: 997, iron: 3.9, zinc: 6.5, copper: 0.75, thiamin: 0.95, riboflavin: 0.3, vitA: 0, vitC: 8
  },
  {
    id: "29", code: 29, category: "Cereals / الحبوب ومنتجاتها", food: "Wheat (Grain) / قمح (حبوب)", water: 12.1, energy: 344, protein: 12, refuse: 0, ash: 1.6, fat: 10, fiber: 3.1, carb: 70.3, sodium: 412, potassium: 88, calcium: 35, magnesium: 315, phosphorus: 2.4, iron: 1.6, zinc: 1.6, copper: 0.33, thiamin: 0.61, riboflavin: 0.12, vitA: 0, vitC: 0
  },
  {
    id: "30", code: 30, category: "Cereals / الحبوب ومنتجاتها", food: "Belila (Canned Wheat) / قمح (معلب، بليلة)", water: 95, energy: 75.9, protein: 2.4, refuse: 2.4, ash: 0.6, fat: 0.5, fiber: 0.6, carb: 0.87, sodium: 12, potassium: 72, calcium: 79, magnesium: 15, phosphorus: 20, iron: 0.5, zinc: 0.48, copper: 0.05, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "31", code: 31, category: "Cereals / الحبوب ومنتجاتها", food: "Flour, Brown / دقيق اسمر", water: 12.1, energy: 350, protein: 11.8, refuse: 0, ash: 1.1, fat: 1.3, fiber: 2.6, carb: 72.7, sodium: 27, potassium: 1, calcium: 28, magnesium: 8, phosphorus: 118, iron: 1.9, zinc: 2.1, copper: 0.3, thiamin: 0.5, riboflavin: 0.11, vitA: 0, vitC: 0
  },
  {
    id: "32", code: 32, category: "Cereals / الحبوب ومنتجاتها", food: "Flour, White / دقيق ابيض", water: 10, energy: 354, protein: 11.8, refuse: 0, ash: 0.4, fat: 1, fiber: 0.55, carb: 76.3, sodium: 120, potassium: 18, calcium: 6, magnesium: 92, phosphorus: 0.5, iron: 0.4, zinc: 0.05, copper: 1.5, thiamin: 0.13, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "33", code: 33, category: "Cereals / الحبوب ومنتجاتها", food: "Fortified Wheat Flour (Baby) / دقيق قمح معزز (للأطفال)", water: 17, energy: 413, protein: 3.5, refuse: 0, ash: 2.1, fat: 8.25, fiber: 3.5, carb: 63.8, sodium: 10, potassium: 550, calcium: 850, magnesium: 460, phosphorus: 135, iron: 2.2, zinc: 375, copper: 0.5, thiamin: 0.6, riboflavin: 0, vitA: 40, vitC: 2.5
  },
  {
    id: "34", code: 34, category: "Cereals / الحبوب ومنتجاتها", food: "Couscous / كسكسی", water: 5.8, energy: 213, protein: 47, refuse: 0, ash: 0.3, fat: 0.7, fiber: 0.4, carb: 45.8, sodium: 17, potassium: 62, calcium: 4, magnesium: 0.4, phosphorus: 0.7, iron: 0.41, zinc: 0.06, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "35", code: 35, category: "Cereals / الحبوب ومنتجاتها", food: "Couscous with Sugar / كسكسي بالسكر", water: 5.8, energy: 283, protein: 40.6, refuse: 0, ash: 0.4, fat: 9.8, fiber: 0.5, carb: 42.9, sodium: 7, potassium: 65, calcium: 15, magnesium: 0.4, phosphorus: 92, iron: 0.4, zinc: 0.58, copper: 0.06, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "36", code: 36, category: "Cereals / الحبوب ومنتجاتها", food: "Bulgur / برغل", water: 11.8, energy: 352, protein: 12.5, refuse: 0, ash: 1.8, fat: 1, fiber: 3.2, carb: 71.4, sodium: 1, potassium: 37, calcium: 350, magnesium: 43, phosphorus: 405, iron: 4.2, zinc: 0.31, copper: 0.14, thiamin: 0.35, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "37", code: 37, category: "Cereals / الحبوب ومنتجاتها", food: "Freekeh / فريك", water: 11.6, energy: 351, protein: 10.8, refuse: 0, ash: 1.7, fat: 2.1, fiber: 1.4, carb: 72.4, sodium: 56, potassium: 41, calcium: 3, magnesium: 3.5, phosphorus: 300, iron: 3, zinc: 0.3, copper: 0, thiamin: 0.57, riboflavin: 0.12, vitA: 320, vitC: 0
  },
  {
    id: "38", code: 38, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Cooked Freekeh / فريك مطهي", water: 53.5, energy: 199, protein: 5.3, refuse: 0, ash: 0.8, fat: 4, fiber: 1.4, carb: 35.4, sodium: 1, potassium: 309, calcium: 15, magnesium: 115, phosphorus: 1.6, iron: 120, zinc: 0.7, copper: 0.8, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "39", code: 39, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Freekeh with Meat / فريك باللحم", water: 53, energy: 213, protein: 7.8, refuse: 0, ash: 1.2, fat: 31, fiber: 0.6, carb: 1.87, sodium: 154, potassium: 35, calcium: 188, magnesium: 354, phosphorus: 6.4, iron: 1.2, zinc: 0.6, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "40", code: 40, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Chocolate Coated / بسكوت مغطى بالشكولاتة", water: 2.7, energy: 517, protein: 10.5, refuse: 1, ash: 1.5, fat: 27.5, fiber: 0, carb: 56.8, sodium: 235, potassium: 0, calcium: 200, magnesium: 110, phosphorus: 1.95, iron: 0.78, zinc: 0.04, copper: 0.13, thiamin: 0, riboflavin: 200, vitA: 0, vitC: 0
  },
  {
    id: "41", code: 41, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Cream Filled / بسكوت محشو كريمة", water: 0.9, energy: 63.6, protein: 7.3, refuse: 25, ash: 2.6, fat: 509, fiber: 0.6, carb: 1.6, sodium: 168, potassium: 62, calcium: 123, magnesium: 130, phosphorus: 0.5, iron: 1.6, zinc: 0.14, copper: 0.15, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "42", code: 42, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Date / بسكوت بالتمر", water: 15.8, energy: 453, protein: 6.4, refuse: 1, ash: 1.1, fat: 146, fiber: 4.5, carb: 71.2, sodium: 85, potassium: 8, calcium: 167, magnesium: 0.53, phosphorus: 2.85, iron: 0.15, zinc: 0.2, copper: 0.18, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "43", code: 43, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Digestive / بسكوت دايجستيف", water: 1.9, energy: 64.6, protein: 7.5, refuse: 3, ash: 3, fat: 468, fiber: 20, carb: 3.2, sodium: 78, potassium: 0, calcium: 32, magnesium: 500, phosphorus: 0.7, iron: 1.4, zinc: 0.2, copper: 0.15, thiamin: 0.09, riboflavin: 0, vitA: 200, vitC: 0
  },
  {
    id: "44", code: 44, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Nice / بسكوت نايس", water: 9.8, energy: 454, protein: 3.1, refuse: 15, ash: 1.2, fat: 70, fiber: 0.9, carb: 1.86, sodium: 120, potassium: 0, calcium: 137, magnesium: 162, phosphorus: 0.77, iron: 0, zinc: 0.03, copper: 0.1, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "45", code: 45, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Plain / بسكوت سادة", water: 3.5, energy: 438, protein: 9.6, refuse: 1, ash: 0.8, fat: 11.8, fiber: 0, carb: 73.3, sodium: 173, potassium: 2, calcium: 109, magnesium: 129, phosphorus: 0.7, iron: 0, zinc: 0.08, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "46", code: 46, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Biscuit, Plain (Iron Fortified) / بسكوت سادة معزز بالحديد", water: 3.3, energy: 440, protein: 9.4, refuse: 12, ash: 0.8, fat: 127, fiber: 0, carb: 73.5, sodium: 135, potassium: 182, calcium: 12, magnesium: 4.6, phosphorus: 114, iron: 0.8, zinc: 0.22, copper: 0.07, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "47", code: 47, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Salted Biscuit (TUC) / بسكوت مملح (TUC)", water: 3.9, energy: 438, protein: 10.1, refuse: 0, ash: 3.4, fat: 13.7, fiber: 0, carb: 68.6, sodium: 1, potassium: 123, calcium: 25, magnesium: 123, phosphorus: 0.05, iron: 1.41, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "48", code: 48, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Pretzels / بسكوت مملح (PRETZEL)", water: 2, energy: 398, protein: 9.8, refuse: 0, ash: 3, fat: 2, fiber: 0, carb: 82.9, sodium: 27, potassium: 123, calcium: 1.1, magnesium: 1.5, phosphorus: 138, iron: 0.3, zinc: 0.03, copper: 765, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "49", code: 49, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Wafer, Chocolate Coated / بسكوت ويفر مغطى بالشكولاتة", water: 0.6, energy: 29.8, protein: 0.9, refuse: 0, ash: 1.9, fat: 6.4, fiber: 1.9, carb: 60.4, sodium: 0, potassium: 160, calcium: 103, magnesium: 0.1, phosphorus: 180, iron: 2.1, zinc: 0.6, copper: 0.12, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "50", code: 50, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Wafer, Cream Filled / بسكوت ويفر محشو كريمة", water: 6.3, energy: 515, protein: 6.5, refuse: 2, ash: 0.5, fat: 25.4, fiber: 0.5, carb: 65.2, sodium: 83, potassium: 0, calcium: 150, magnesium: 93, phosphorus: 45, iron: 1.5, zinc: 0.51, copper: 0.16, thiamin: 0.09, riboflavin: 0.08, vitA: 0, vitC: 0
  },
  {
    id: "51", code: 51, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Balady / خبز بلدي", water: 35.3, energy: 254, protein: 8.8, refuse: 1, ash: 1.75, fat: 1.3, fiber: 2.89, carb: 52.5, sodium: 236, potassium: 14, calcium: 134, magnesium: 2.89, phosphorus: 1.75, iron: 0.14, zinc: 0.29, copper: 0.1, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "52", code: 52, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Balady (Corn/Wheat) / خبز بلدي (۱ذرة ٤ قمح)", water: 52, energy: 35.1, protein: 9, refuse: 1, ash: 1.3, fat: 256, fiber: 0, carb: 35.1, sodium: 13, potassium: 3, calcium: 208, magnesium: 47, phosphorus: 197, iron: 0.19, zinc: 0.13, copper: 0.12, thiamin: 369, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "53", code: 53, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Sun / خبز سن", water: 17, energy: 369, protein: 12.3, refuse: 0, ash: 3.3, fat: 2.1, fiber: 4.5, carb: 75.2, sodium: 5, potassium: 42, calcium: 449, magnesium: 2.9, phosphorus: 430, iron: 2.1, zinc: 0.4, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "54", code: 54, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Kaiser with Sesame / كايزر بالسمسم", water: 32.8, energy: 273, protein: 12.5, refuse: 0, ash: 1.6, fat: 1.1, fiber: 0.7, carb: 50.7, sodium: 3, potassium: 49, calcium: 330, magnesium: 60, phosphorus: 2.1, iron: 0.85, zinc: 0.52, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "55", code: 55, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Falahi (1:1) / خبز فلاحي (۱ذرة 1 قمح)", water: 12, energy: 355, protein: 9.9, refuse: 0, ash: 2.5, fat: 1.1, fiber: 1.3, carb: 73.2, sodium: 452, potassium: 53, calcium: 2.4, magnesium: 2.4, phosphorus: 0, iron: 0, zinc: 0.29, copper: 0.12, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "56", code: 56, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Falahi (1:2) / خبز فلاحي (۱ذرة ۲ قمح)", water: 10, energy: 360, protein: 10.1, refuse: 0, ash: 1.9, fat: 2.8, fiber: 1.5, carb: 73.7, sodium: 234, potassium: 147, calcium: 65, magnesium: 483, phosphorus: 3.2, iron: 1.8, zinc: 0.18, copper: 0.28, thiamin: 0.12, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "57", code: 57, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Falahi (2:1) / خبز فلاحي (۲ذرة 1 قمح)", water: 12.5, energy: 351, protein: 9.8, refuse: 0, ash: 2, fat: 2.9, fiber: 1.5, carb: 71.3, sodium: 55, potassium: 474, calcium: 2.5, magnesium: 2.5, phosphorus: 0, iron: 0, zinc: 0.28, copper: 0.11, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "58", code: 58, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Breadcrumbs / بقسماط ناعم (مطحون)", water: 7.9, energy: 356, protein: 10.3, refuse: 0, ash: 2, fat: 2, fiber: 1.8, carb: 74.2, sodium: 200, potassium: 115, calcium: 501, magnesium: 15, phosphorus: 76, iron: 1.53, zinc: 0.38, copper: 0.2, thiamin: 0.12, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "59", code: 59, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, French / خبز فرنسي", water: 28.8, energy: 285, protein: 8.7, refuse: 0, ash: 1, fat: 0.9, fiber: 0.3, carb: 60.3, sodium: 125, potassium: 296, calcium: 14, magnesium: 94, phosphorus: 1.1, iron: 0.7, zinc: 0.12, copper: 0.1, thiamin: 0.05, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "60", code: 60, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Lebanese / خبز لبناني", water: 22, energy: 331, protein: 9.2, refuse: 0, ash: 0.7, fat: 0.9, fiber: 0.3, carb: 66.3, sodium: 15, potassium: 307, calcium: 85, magnesium: 104, phosphorus: 1.2, iron: 0.72, zinc: 0.1, copper: 0.11, thiamin: 0.05, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "61", code: 61, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Lebanese Brown / خبز لبناني اسمر", water: 25.8, energy: 293, protein: 9.4, refuse: 0, ash: 2.5, fat: 1.1, fiber: 2.1, carb: 59.1, sodium: 186, potassium: 2, calcium: 336, magnesium: 27, phosphorus: 3.94, iron: 0.44, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "62", code: 62, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Shami / خبز شامي", water: 27.2, energy: 292, protein: 8.6, refuse: 0, ash: 0.9, fat: 0.8, fiber: 0.2, carb: 62.3, sodium: 120, potassium: 82, calcium: 350, magnesium: 16, phosphorus: 0.7, iron: 1, zinc: 0.1, copper: 0.05, thiamin: 0.1, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "63", code: 63, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Bread, Shamsi / خبز شمسي", water: 35, energy: 259, protein: 9.2, refuse: 0, ash: 1.1, fat: 1.9, fiber: 0.6, carb: 53.1, sodium: 375, potassium: 175, calcium: 14, magnesium: 2.1, phosphorus: 1.9, iron: 0.1, zinc: 0.27, copper: 0.11, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "64", code: 64, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Toast, Brown / توست اسمر", water: 34.5, energy: 257, protein: 8.9, refuse: 0, ash: 1.9, fat: 2.4, fiber: 1.2, carb: 51.1, sodium: 405, potassium: 201, calcium: 185, magnesium: 49, phosphorus: 2.86, iron: 1.1, zinc: 0.59, copper: 0.2, thiamin: 0.08, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "65", code: 65, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Toast, White / توست ابيض", water: 33, energy: 270, protein: 8.4, refuse: 0, ash: 1, fat: 1.5, fiber: 0.5, carb: 55.6, sodium: 400, potassium: 152, calcium: 30, magnesium: 0.9, phosphorus: 1, iron: 0.05, zinc: 0.18, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "66", code: 66, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Breadsticks, Sesame / بقسماط بالسمسم (أصابع)", water: 6.1, energy: 379, protein: 11.7, refuse: 0, ash: 2.9, fat: 1.5, fiber: 1.3, carb: 76.5, sodium: 203, potassium: 410, calcium: 79, magnesium: 2.15, phosphorus: 1.99, iron: 0.42, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "67", code: 67, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Fayesh / فایش", water: 8.1, energy: 398, protein: 12, refuse: 0, ash: 7.5, fat: 0.9, fiber: 0.9, carb: 70.6, sodium: 85, potassium: 188, calcium: 150, magnesium: 3.8, phosphorus: 1.5, iron: 0.9, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "68", code: 68, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Cake / كيك", water: 26.8, energy: 379, protein: 7, refuse: 0, ash: 18.4, fat: 1.2, fiber: 0.3, carb: 46.3, sodium: 83, potassium: 58, calcium: 53, magnesium: 350, phosphorus: 0.5, iron: 100, zinc: 0, copper: 0.02, thiamin: 0.08, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "69", code: 69, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sponge Cake / كيك إسفنجي", water: 32, energy: 290, protein: 7.5, refuse: 0, ash: 4.2, fat: 0.5, fiber: 0.2, carb: 55.6, sodium: 1, potassium: 25, calcium: 90, magnesium: 120, phosphorus: 93, iron: 1.19, zinc: 159, copper: 0.1, thiamin: 0.12, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "70", code: 70, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Croissant / كرواسون", water: 22, energy: 476, protein: 5.5, refuse: 0, ash: 34, fat: 1.1, fiber: 0.3, carb: 37.1, sodium: 372, potassium: 0.2, calcium: 201, magnesium: 90, phosphorus: 1.05, iron: 0.8, zinc: 14, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "71", code: 71, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Date Pie (School Meal) / فطيرة بالعجوة (تغذية مدرسية)", water: 21, energy: 361, protein: 9.5, refuse: 0, ash: 1.3, fat: 56.1, fiber: 1.2, carb: 10.9, sodium: 297, potassium: 32, calcium: 0.18, magnesium: 2.11, phosphorus: 59, iron: 285, zinc: 8, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "72", code: 72, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Feteer Meshaltet / فطير مشلتت", water: 35.5, energy: 402, protein: 6.7, refuse: 0, ash: 30, fat: 1.1, fiber: 0.5, carb: 26.2, sodium: 402, potassium: 25, calcium: 300, magnesium: 0.45, phosphorus: 0.4, iron: 0.5, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "73", code: 73, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Patty with Sugar / قرص بسكر", water: 28.6, energy: 341, protein: 7.6, refuse: 0, ash: 0.7, fat: 50.7, fiber: 0.4, carb: 12, sodium: 256, potassium: 15, calcium: 0.6, magnesium: 0.6, phosphorus: 0.64, iron: 0.64, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "74", code: 74, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Roqaq with Meat / رقاق باللحم", water: 51.4, energy: 279, protein: 8.5, refuse: 1, ash: 19.4, fat: 8.5, fiber: 1.1, carb: 18.6, sodium: 72, potassium: 75, calcium: 102, magnesium: 1.2, phosphorus: 0.64, iron: 0.64, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "75", code: 75, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Pizza, Cheese / بيتزا بالجبن", water: 48.5, energy: 243, protein: 9.9, refuse: 1, ash: 2.1, fat: 26.5, fiber: 1.2, carb: 12, sodium: 583, potassium: 124, calcium: 231, magnesium: 1.6, phosphorus: 0.1, iron: 0.1, zinc: 0.1, copper: 0.1, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "76", code: 76, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Pizza, Sausage / بيتزا باللحم السجق", water: 41.5, energy: 267, protein: 9.3, refuse: 1, ash: 32.4, fat: 13.4, fiber: 1.5, carb: 2.4, sodium: 598, potassium: 157, calcium: 160, magnesium: 1.1, phosphorus: 0.12, iron: 0.12, zinc: 0.12, copper: 0.12, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "77", code: 77, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Pizza, Seafood / بيتزا سي فود", water: 44, energy: 252, protein: 10, refuse: 8, ash: 2.1, fat: 35.1, fiber: 0.8, carb: 1.15, sodium: 498, potassium: 201, calcium: 130, magnesium: 1.15, phosphorus: 0.99, iron: 0.19, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "78", code: 78, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Pizza, Vegetable / بيتزا بالخضار", water: 47.8, energy: 230, protein: 7.1, refuse: 1, ash: 2.6, fat: 35.6, fiber: 5.9, carb: 1.15, sodium: 476, potassium: 192, calcium: 154, magnesium: 1.15, phosphorus: 0.95, iron: 0.8, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "79", code: 79, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, White Cheese / سندوتش جبنة بيضاء", water: 57, energy: 180, protein: 7.5, refuse: 2, ash: 1, fat: 4, fiber: 28.5, carb: 7.5, sodium: 496, potassium: 190, calcium: 196, magnesium: 17, phosphorus: 1.1, iron: 0.04, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "80", code: 80, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Yellow Cheese / سندوتش جبنة ناعمة (صفراء)", water: 40, energy: 262, protein: 10.5, refuse: 7, ash: 2, fat: 1.2, fiber: 39.3, carb: 10.5, sodium: 684, potassium: 202, calcium: 183, magnesium: 0.99, phosphorus: 1.3, iron: 0.01, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "81", code: 81, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Fried Brain / سندوتش مخ مقلى", water: 55, energy: 232, protein: 10.1, refuse: 11.5, ash: 1.2, fat: 0.3, fiber: 21.9, carb: 10.1, sodium: 403, potassium: 286, calcium: 21, magnesium: 2.16, phosphorus: 0.87, iron: 0.21, zinc: 63, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "82", code: 82, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Fried Chicken / سندوتش فراخ مقلية", water: 45, energy: 259, protein: 9.6, refuse: 1, ash: 1.7, fat: 10, fiber: 32.7, carb: 9.6, sodium: 590, potassium: 280, calcium: 20, magnesium: 1.93, phosphorus: 1, iron: 0.2, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "83", code: 83, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Fried Eggplant / سندوتش باذنجان مقلی", water: 56, energy: 123, protein: 5.5, refuse: 4, ash: 0.8, fat: 1.8, fiber: 31.9, carb: 5.5, sodium: 615, potassium: 27, calcium: 386, magnesium: 1.35, phosphorus: 0.96, iron: 0.06, zinc: 12, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "84", code: 84, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Fried Liver / سندوتش كبدة مقلية", water: 46.7, energy: 238, protein: 29.7, refuse: 14.4, ash: 6.8, fat: 1.8, fiber: 0.6, carb: 29.7, sodium: 599, potassium: 270, calcium: 53, magnesium: 5.6, phosphorus: 2.3, iron: 1.87, zinc: 50, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "85", code: 85, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Fried Shrimp / سندوتش جمبري مقلى", water: 47.5, energy: 252, protein: 10.5, refuse: 2, ash: 1.6, fat: 5.8, fiber: 29.1, carb: 10.5, sodium: 525, potassium: 285, calcium: 54, magnesium: 2.82, phosphorus: 1.36, iron: 1.1, zinc: 0.14, copper: 0.19, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "86", code: 86, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Falafel / سندوتش طعمية", water: 53, energy: 205, protein: 6.1, refuse: 1.3, ash: 32.2, fat: 1.6, fiber: 2, carb: 10.2, sodium: 587, potassium: 273, calcium: 33, magnesium: 30, phosphorus: 2.6, iron: 0, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "87", code: 87, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Grilled Chicken / سندوتش فراخ مشوية", water: 51.5, energy: 223, protein: 11.4, refuse: 8, ash: 0.9, fat: 1.8, fiber: 26.4, carb: 11.4, sodium: 522, potassium: 316, calcium: 28, magnesium: 1.83, phosphorus: 1.4, iron: 0.15, zinc: 34, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "88", code: 88, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Kofta / سندوتش كفتة مشوية", water: 50.9, energy: 224, protein: 12, refuse: 7.5, ash: 1.8, fat: 0.6, fiber: 27.2, carb: 12, sodium: 491, potassium: 226, calcium: 23, magnesium: 2.86, phosphorus: 1.03, iron: 0.18, zinc: 30, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "89", code: 89, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Beef Burger / سندوتش بيف برجر", water: 52.8, energy: 216, protein: 8.8, refuse: 7.5, ash: 1.7, fat: 0.8, fiber: 28.4, carb: 8.8, sodium: 689, potassium: 307, calcium: 24, magnesium: 2, phosphorus: 1.63, iron: 0.11, zinc: 38, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "90", code: 90, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Hot Dog / سندوتش سجق هوت دوج", water: 50.2, energy: 221, protein: 8.8, refuse: 6.5, ash: 2.1, fat: 0.5, fiber: 31.9, carb: 8.8, sodium: 615, potassium: 250, calcium: 31, magnesium: 1.58, phosphorus: 1, iron: 0.21, zinc: 20, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "91", code: 91, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Meat Shawarma / سندوتش شاورمة لحم", water: 51.1, energy: 220, protein: 7, refuse: 10.7, ash: 1.9, fat: 0.7, fiber: 28.6, carb: 7, sodium: 698, potassium: 273, calcium: 46, magnesium: 2.9, phosphorus: 1.91, iron: 0.33, zinc: 32, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "92", code: 92, category: "Bakery and Pastry / المخبوزات والمعجنات ومنتجاتها", food: "Sandwich, Foul / سندوتش فول", water: 56.2, energy: 173, protein: 5, refuse: 33.3, ash: 1.5, fat: 1.8, fiber: 2.2, carb: 43, sodium: 669, potassium: 300, calcium: 0, magnesium: 29, phosphorus: 2.05, iron: 1.24, zinc: 0.12, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "93", code: 93, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Tiger Nut / حب العزيز", water: 61.1, energy: 51, protein: 5.3, refuse: 0, ash: 2.4, fat: 9.3, fiber: 16.2, carb: 5.7, sodium: 413, potassium: 5.3, calcium: 61.1, magnesium: 27, phosphorus: 2.19, iron: 5.8, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "94", code: 94, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Tiger Nut (Soaked) / حب العزيز (منقوع)", water: 44.6, energy: 278, protein: 9.3, refuse: 0, ash: 35.6, fat: 1.5, fiber: 0, carb: 0, sodium: 4, potassium: 5, calcium: 278, magnesium: 35.6, phosphorus: 0, iron: 9.3, zinc: 1.5, copper: 1.32, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "95", code: 95, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Taro / قلقاس", water: 79.1, energy: 77, protein: 1.2, refuse: 23, ash: 0.8, fat: 16.6, fiber: 0.2, carb: 1.2, sodium: 495, potassium: 14, calcium: 7, magnesium: 11, phosphorus: 13, iron: 0.08, zinc: 0.5, copper: 60, thiamin: 6, riboflavin: 0.05, vitA: 0.15, vitC: 0
  },
  {
    id: "96", code: 96, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Taro, Cooked / قلقاس مطهي", water: 80.5, energy: 62, protein: 1.2, refuse: 1, ash: 0.6, fat: 0.8, fiber: 0.1, carb: 16.4, sodium: 80.5, potassium: 1, calcium: 340, magnesium: 91, phosphorus: 2.5, iron: 375, zinc: 81, copper: 0.32, thiamin: 0.09, riboflavin: 0.04, vitA: 18, vitC: 0.6
  },
  {
    id: "97", code: 97, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Sweet Potato / بطاطا (درنات)", water: 73.1, energy: 105, protein: 1.4, refuse: 10, ash: 0.8, fat: 0.1, fiber: 2.8, carb: 23.3, sodium: 12, potassium: 330, calcium: 30, magnesium: 25, phosphorus: 0.8, iron: 0.7, zinc: 0.3, copper: 1100, thiamin: 24, riboflavin: 0.06, vitA: 0.03, vitC: 0
  },
  {
    id: "98", code: 98, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Potato / بطاطس", water: 78.3, energy: 86, protein: 2.3, refuse: 1.3, ash: 0.6, fat: 0.1, fiber: 2.5, carb: 18.8, sodium: 6, potassium: 379, calcium: 12, magnesium: 12, phosphorus: 0.9, iron: 0.7, zinc: 0.3, copper: 5, thiamin: 19, riboflavin: 0.07, vitA: 0.03, vitC: 0.01
  },
  {
    id: "99", code: 99, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Potato, Boiled / بطاطس (مسلوق بقشر)", water: 79.3, energy: 86, protein: 2.1, refuse: 0, ash: 0.6, fat: 0.1, fiber: 2.1, carb: 18.3, sodium: 5, potassium: 420, calcium: 10, magnesium: 25, phosphorus: 0.7, iron: 0.7, zinc: 0.3, copper: 5, thiamin: 19, riboflavin: 0.08, vitA: 0.04, vitC: 0.01
  },
  {
    id: "100", code: 100, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Potato, Fried / بطاطس (مقلي)", water: 55, energy: 274, protein: 4.2, refuse: 0, ash: 0.9, fat: 15, fiber: 0.9, carb: 25.8, sodium: 3, potassium: 21, calcium: 120, magnesium: 41, phosphorus: 1.1, iron: 0.3, zinc: 0.3, copper: 0.06, thiamin: 0.08, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "101", code: 101, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Potato with Sauce / بطاطس (بالصلصة)", water: 75.4, energy: 88, protein: 2, refuse: 0, ash: 1, fat: 1.1, fiber: 1.5, carb: 19.9, sodium: 1.1, potassium: 3, calcium: 17, magnesium: 0.3, phosphorus: 0.9, iron: 0.6, zinc: 0.2, copper: 0.3, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "102", code: 102, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Potato with Meat / بطاطس (محمرة باللحم)", water: 68.9, energy: 132, protein: 4.8, refuse: 0, ash: 0.8, fat: 3.2, fiber: 0.9, carb: 20.5, sodium: 0.8, potassium: 1.2, calcium: 1.8, magnesium: 0.8, phosphorus: 0.8, iron: 0.5, zinc: 0.4, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "103", code: 103, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Mashed Potato with Milk / بطاطس (مهروسة باللبن)", water: 77.5, energy: 91, protein: 2.2, refuse: 0, ash: 0.8, fat: 1.3, fiber: 0.5, carb: 18.2, sodium: 1.3, potassium: 1, calcium: 14, magnesium: 0.9, phosphorus: 1.3, iron: 0.6, zinc: 0.2, copper: 0.1, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "104", code: 104, category: "Roots and Tubers / الدرنات ومنتجاتها", food: "Stuffed Potato / بطاطس (محشوة باللحم)", water: 68.7, energy: 137, protein: 4.3, refuse: 0, ash: 1.2, fat: 2.7, fiber: 0.9, carb: 21.8, sodium: 0.9, potassium: 0.9, calcium: 1.7, magnesium: 0.8, phosphorus: 0.7, iron: 0.5, zinc: 0.4, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "105", code: 105, category: "Legumes / البقوليات ومنتجاتها", food: "Fava Beans, Dry (Whole) / فول جاف (كامل الحبة)", water: 10.7, energy: 341, protein: 27.1, refuse: 0, ash: 2.8, fat: 1.3, fiber: 5.9, carb: 52.2, sodium: 60, potassium: 1117, calcium: 100, magnesium: 206, phosphorus: 4.6, iron: 3.6, zinc: 1.45, copper: 0.66, thiamin: 0.42, riboflavin: 0.18, vitA: 0, vitC: 0
  },
  {
    id: "106", code: 106, category: "Legumes / البقوليات ومنتجاتها", food: "Fava Beans, Dry (Split?) / فول جاف (غير كامل الحبة)", water: 10.2, energy: 342, protein: 26.7, refuse: 0, ash: 2.6, fat: 1.1, fiber: 5.6, carb: 53.8, sodium: 66, potassium: 950, calcium: 96, magnesium: 206, phosphorus: 4.4, iron: 4.5, zinc: 1.52, copper: 0.68, thiamin: 0.42, riboflavin: 0.2, vitA: 0, vitC: 0
  },
  {
    id: "107", code: 107, category: "Legumes / البقوليات ومنتجاتها", food: "Fava Beans, Dry (Split) / فول جاف (مدشوش)", water: 10.4, energy: 346, protein: 25.9, refuse: 0, ash: 2.8, fat: 2.7, fiber: 1.7, carb: 56.2, sodium: 39, potassium: 640, calcium: 92, magnesium: 2, phosphorus: 13, iron: 2.9, zinc: 159, copper: 0.18, thiamin: 0.41, riboflavin: 4.8, vitA: 126, vitC: 0.13
  },
  {
    id: "108", code: 108, category: "Legumes / البقوليات ومنتجاتها", food: "Fava Beans, Canned / فول مدمس (معلب)", water: 70, energy: 132, protein: 6.1, refuse: 5, ash: 2.1, fat: 1.1, fiber: 0.9, carb: 15.7, sodium: 275, potassium: 333, calcium: 175, magnesium: 0, phosphorus: 2.7, iron: 44, zinc: 0, copper: 0.12, thiamin: 0.08, riboflavin: 49, vitA: 0.9, vitC: 0
  },
  {
    id: "109", code: 109, category: "Legumes / البقوليات ومنتجاتها", food: "Fava Beans, Pot / فول مدمس (إدرة)", water: 73.7, energy: 98, protein: 5.6, refuse: 2, ash: 0.7, fat: 0.8, fiber: 0.7, carb: 17.2, sodium: 218, potassium: 24, calcium: 183, magnesium: 1, phosphorus: 37, iron: 2.4, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "110", code: 110, category: "Legumes / البقوليات ومنتجاتها", food: "Sprouted Beans / فول منبت", water: 61, energy: 145, protein: 10.4, refuse: 0, ash: 2.9, fat: 0.7, fiber: 0.8, carb: 24.2, sodium: 290, potassium: 154, calcium: 34, magnesium: 2.3, phosphorus: 1.05, iron: 5, zinc: 59, copper: 0.2, thiamin: 0.22, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "111", code: 111, category: "Legumes / البقوليات ومنتجاتها", food: "Cooked Sprouted Beans / قول نابت مطهى", water: 70, energy: 114, protein: 8.8, refuse: 1, ash: 1.2, fat: 0.6, fiber: 1, carb: 18.4, sodium: 218, potassium: 330, calcium: 166, magnesium: 1, phosphorus: 37, iron: 2.4, zinc: 0, copper: 0.4, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "112", code: 112, category: "Legumes / البقوليات ومنتجاتها", food: "Chickpea / حمص", water: 11.5, energy: 339, protein: 19.2, refuse: 0, ash: 2.7, fat: 5.3, fiber: 1.6, carb: 60.8, sodium: 32, potassium: 326, calcium: 200, magnesium: 43, phosphorus: 184, iron: 3.2, zinc: 3.32, copper: 0.5, thiamin: 0.3, riboflavin: 0.24, vitA: 0, vitC: 0
  },
  {
    id: "113", code: 113, category: "Legumes / البقوليات ومنتجاتها", food: "Chickpea Cooked with Meat / حمص مطبوخ باللحم", water: 63, energy: 148, protein: 8.8, refuse: 0, ash: 0.9, fat: 2.8, fiber: 1, carb: 21.8, sodium: 290, potassium: 121, calcium: 241, magnesium: 31, phosphorus: 0.5, iron: 1.8, zinc: 0.2, copper: 0.3, thiamin: 0.15, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "114", code: 114, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Yellow / عدس اصفر", water: 10, energy: 347, protein: 24, refuse: 0, ash: 2.1, fat: 1.2, fiber: 0.3, carb: 62.4, sodium: 5, potassium: 448, calcium: 51, magnesium: 33, phosphorus: 4.9, iron: 3.8, zinc: 0.6, copper: 0.5, thiamin: 0.47, riboflavin: 0.22, vitA: 0, vitC: 0
  },
  {
    id: "115", code: 115, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Yellow Cooked / عدس اصفر مطهى", water: 70.5, energy: 103, protein: 7.2, refuse: 0, ash: 0.6, fat: 1.4, fiber: 0.1, carb: 19.5, sodium: 23, potassium: 103, calcium: 42, magnesium: 48, phosphorus: 2.2, iron: 0.9, zinc: 0.2, copper: 0.05, thiamin: 0.07, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "116", code: 116, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Brown / عدس بجبة", water: 9.5, energy: 340, protein: 24.2, refuse: 0, ash: 2.6, fat: 1.4, fiber: 1.4, carb: 61, sodium: 10, potassium: 650, calcium: 56, magnesium: 47, phosphorus: 4.8, iron: 3.2, zinc: 1.3, copper: 0.51, thiamin: 0.48, riboflavin: 0.22, vitA: 0, vitC: 0
  },
  {
    id: "117", code: 117, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Brown Cooked / عدس بجبة مطهى", water: 65, energy: 151, protein: 5.8, refuse: 2, ash: 5.6, fat: 2.3, fiber: 1.5, carb: 19.3, sodium: 372, potassium: 440, calcium: 43, magnesium: 164, phosphorus: 3.1, iron: 1.5, zinc: 0.5, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "118", code: 118, category: "Legumes / البقوليات ومنتجاتها", food: "Cowpea / لوبيا", water: 10.7, energy: 342, protein: 23.3, refuse: 0, ash: 4.2, fat: 1.3, fiber: 1.2, carb: 60.8, sodium: 12, potassium: 1200, calcium: 88, magnesium: 274, phosphorus: 3.1, iron: 4.4, zinc: 1.3, copper: 0.36, thiamin: 0.39, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "119", code: 119, category: "Legumes / البقوليات ومنتجاتها", food: "Lupin / ترمس", water: 10, energy: 364, protein: 14.6, refuse: 0, ash: 1.8, fat: 1.3, fiber: 0.5, carb: 69.5, sodium: 35, potassium: 487, calcium: 41, magnesium: 200, phosphorus: 1.9, iron: 1.5, zinc: 0.21, copper: 0.26, thiamin: 0.25, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "120", code: 120, category: "Legumes / البقوليات ومنتجاتها", food: "Chickpeas, Yellow Dry / حمص اصفر جاف", water: 5, energy: 354, protein: 19.6, refuse: 0, ash: 3.1, fat: 4.4, fiber: 3.4, carb: 59.4, sodium: 855, potassium: 30, calcium: 155, magnesium: 5.8, phosphorus: 430, iron: 1.3, zinc: 0.46, copper: 0.48, thiamin: 0.21, riboflavin: 2, vitA: 19, vitC: 0
  },
  {
    id: "121", code: 121, category: "Legumes / البقوليات ومنتجاتها", food: "Cowpea, Dry / لوبيا جافة", water: 11.3, energy: 330, protein: 23, refuse: 0, ash: 3.1, fat: 1.2, fiber: 4.7, carb: 56.7, sodium: 1217, potassium: 30, calcium: 84, magnesium: 6.8, phosphorus: 347, iron: 3.22, zinc: 0.46, copper: 0.75, thiamin: 0.21, riboflavin: 3, vitA: 2, vitC: 0
  },
  {
    id: "122", code: 122, category: "Legumes / البقوليات ومنتجاتها", food: "Cowpea, Cooked / لوبيا مطهية", water: 68, energy: 131, protein: 8.5, refuse: 0, ash: 1.6, fat: 3.5, fiber: 2, carb: 16.4, sodium: 343, potassium: 579, calcium: 37, magnesium: 3.4, phosphorus: 96, iron: 1.07, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "123", code: 123, category: "Legumes / البقوليات ومنتجاتها", food: "Cowpea with Meat / لوبيا مطهية باللحم", water: 66, energy: 146, protein: 11, refuse: 0, ash: 2.5, fat: 5.5, fiber: 2, carb: 13, sodium: 456, potassium: 317, calcium: 42, magnesium: 3.54, phosphorus: 142, iron: 1.54, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "124", code: 124, category: "Legumes / البقوليات ومنتجاتها", food: "Fenugreek, Dry / حلبة جافة", water: 9.4, energy: 156, protein: 25.6, refuse: 0, ash: 3.5, fat: 6.7, fiber: 6.5, carb: 48.3, sodium: 966, potassium: 93, calcium: 194, magnesium: 115, phosphorus: 365, iron: 14, zinc: 4.6, copper: 0.4, thiamin: 0.27, riboflavin: 0.52, vitA: 4, vitC: 132
  },
  {
    id: "125", code: 125, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Dry / عدس جاف", water: 10, energy: 340, protein: 22.4, refuse: 0, ash: 2.7, fat: 1.1, fiber: 3.8, carb: 60, sodium: 725, potassium: 30, calcium: 86, magnesium: 86, phosphorus: 327, iron: 4.2, zinc: 0.25, copper: 0.22, thiamin: 0.4, riboflavin: 0, vitA: 12, vitC: 0
  },
  {
    id: "126", code: 126, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Brown Canned / عدس بجبة معلب", water: 5.6, energy: 151, protein: 5.8, refuse: 0, ash: 2, fat: 2.3, fiber: 2, carb: 19.3, sodium: 440, potassium: 164, calcium: 43, magnesium: 164, phosphorus: 372, iron: 3.1, zinc: 1.5, copper: 0, thiamin: 0, riboflavin: 0.18, vitA: 0, vitC: 0
  },
  {
    id: "127", code: 127, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Yellow Dry (2) / عدس أصفر جاف", water: 11.5, energy: 340, protein: 7.3, refuse: 0, ash: 2.3, fat: 2.2, fiber: 0.7, carb: 65, sodium: 41, potassium: 330, calcium: 50, magnesium: 3.2, phosphorus: 765, iron: 279, zinc: 1.5, copper: 0.35, thiamin: 0.41, riboflavin: 0.18, vitA: 0, vitC: 15
  },
  {
    id: "128", code: 128, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil, Yellow Cooked / عدس أصفر مطهي", water: 68.9, energy: 140, protein: 6.2, refuse: 0, ash: 1.4, fat: 5.2, fiber: 1.2, carb: 17.1, sodium: 312, potassium: 384, calcium: 57, magnesium: 1.1, phosphorus: 12, iron: 0.8, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0.08, vitA: 0, vitC: 0
  },
  {
    id: "129", code: 129, category: "Legumes / البقوليات ومنتجاتها", food: "Lentil Soup / شوربة عدس", water: 82.5, energy: 68, protein: 4.8, refuse: 0, ash: 1.7, fat: 1.5, fiber: 0.7, carb: 8.8, sodium: 318, potassium: 245, calcium: 76, magnesium: 1.8, phosphorus: 0, iron: 0.6, zinc: 0, copper: 0, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "130", code: 130, category: "Legumes / البقوليات ومنتجاتها", food: "Lupin, Dry / ترمس جاف", water: 8, energy: 355, protein: 9, refuse: 0, ash: 3.5, fat: 3.8, fiber: 1.7, carb: 7.5, sodium: 355, potassium: 279, calcium: 24, magnesium: 279, phosphorus: 49, iron: 490, zinc: 1.7, copper: 0, thiamin: 5.87, riboflavin: 0.41, vitA: 0.48, vitC: 0
  },
  {
    id: "131", code: 131, category: "Legumes / البقوليات ومنتجاتها", food: "Lupin, Soaked / ترمس منقوع", water: 70.7, energy: 111, protein: 9.6, refuse: 3, ash: 3, fat: 2.7, fiber: 2, carb: 12, sodium: 580, potassium: 200, calcium: 89, magnesium: 53, phosphorus: 128, iron: 1.58, zinc: 0.53, copper: 0.24, thiamin: 0.15, riboflavin: 0.1, vitA: 0, vitC: 0
  },
  {
    id: "132", code: 132, category: "Legumes / البقوليات ومنتجاتها", food: "Peas, Dry / بسلة جافة", water: 10, energy: 345, protein: 22.1, refuse: 0, ash: 2.5, fat: 2.1, fiber: 3.9, carb: 59.4, sodium: 32, potassium: 928, calcium: 82, magnesium: 125, phosphorus: 352, iron: 5.8, zinc: 3.15, copper: 0.75, thiamin: 0.84, riboflavin: 0.25, vitA: 4, vitC: 34
  },
  {
    id: "133", code: 133, category: "Legumes / البقوليات ومنتجاتها", food: "Soybean / فول صويا", water: 9.3, energy: 426, protein: 31.7, refuse: 0, ash: 4.7, fat: 19.9, fiber: 1.7, carb: 30.1, sodium: 30, potassium: 1618, calcium: 305, magnesium: 563, phosphorus: 258, iron: 7.5, zinc: 2, copper: 0, thiamin: 0.41, riboflavin: 0.32, vitA: 0, vitC: 0
  },
  {
    id: "134", code: 134, category: "Legumes / البقوليات ومنتجاتها", food: "Soybean Flour / دقيق فول صويا", water: 7.5, energy: 362, protein: 44.5, refuse: 0, ash: 4.2, fat: 3.9, fiber: 2.8, carb: 37.1, sodium: 28, potassium: 1870, calcium: 268, magnesium: 833, phosphorus: 424, iron: 1.2, zinc: 2, copper: 0.83, thiamin: 0.29, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "135", code: 135, category: "Nuts & Seeds / المكسرات", food: "Almonds / لوز جاف مقشر", water: 4, energy: 640, protein: 17.6, refuse: 0, ash: 2.7, fat: 55.8, fiber: 2.5, carb: 16.8, sodium: 793, potassium: 215, calcium: 485, magnesium: 3.2, phosphorus: 230, iron: 4.5, zinc: 0.21, copper: 0.26, thiamin: 0.72, riboflavin: 21, vitA: 0, vitC: 0
  },
  {
    id: "136", code: 136, category: "Nuts & Seeds / المكسرات", food: "Coconut, Shredded / جوز هند جاف مبشور", water: 3, energy: 689, protein: 6, refuse: 0, ash: 2, fat: 65, fiber: 4, carb: 2, sodium: 23, potassium: 560, calcium: 20, magnesium: 44, phosphorus: 176, iron: 1.5, zinc: 2.9, copper: 0.4, thiamin: 0.07, riboflavin: 0.04, vitA: 0, vitC: 0
  },
  {
    id: "137", code: 137, category: "Nuts & Seeds / المكسرات", food: "Hazelnuts / بندق جاف مقشر", water: 5, energy: 633, protein: 18.6, refuse: 0, ash: 2.6, fat: 5.7, fiber: 3.7, carb: 14.4, sodium: 600, potassium: 180, calcium: 300, magnesium: 2.5, phosphorus: 13, iron: 3.5, zinc: 0.45, copper: 0.24, thiamin: 0.14, riboflavin: 24, vitA: 0, vitC: 0
  },
  {
    id: "138", code: 138, category: "Nuts & Seeds / المكسرات", food: "Peanuts / فول سوداني مقشر", water: 4.6, energy: 585, protein: 26.4, refuse: 30, ash: 2.4, fat: 44.9, fiber: 2.9, carb: 18.8, sodium: 670, potassium: 380, calcium: 55, magnesium: 1.8, phosphorus: 180, iron: 2.5, zinc: 0.26, copper: 0.85, thiamin: 0.14, riboflavin: 84, vitA: 0, vitC: 0
  },
  {
    id: "139", code: 139, category: "Nuts & Seeds / المكسرات", food: "Pine Nuts / صنوبر جاف حبوب", water: 4.6, energy: 614, protein: 30.2, refuse: 0, ash: 1, fat: 50.2, fiber: 3.7, carb: 10.3, sodium: 888, potassium: 500, calcium: 240, magnesium: 4.9, phosphorus: 2.4, iron: 1.4, zinc: 0.4, copper: 0.22, thiamin: 0, riboflavin: 5, vitA: 0, vitC: 0
  },
  {
    id: "140", code: 140, category: "Nuts & Seeds / المكسرات", food: "Pistachios / فستق جاف مقشر", water: 5.5, energy: 631, protein: 8.8, refuse: 44, ash: 2.6, fat: 54.1, fiber: 1.8, carb: 15.1, sodium: 850, potassium: 503, calcium: 122, magnesium: 1.9, phosphorus: 150, iron: 6.9, zinc: 0.73, copper: 0.39, thiamin: 0, riboflavin: 54, vitA: 0, vitC: 0
  },
  {
    id: "141", code: 141, category: "Nuts & Seeds / المكسرات", food: "Pumpkin Seeds / لب قزح مملح", water: 4.3, energy: 591, protein: 23.9, refuse: 0, ash: 3.5, fat: 48, fiber: 4.8, carb: 15.8, sodium: 695, potassium: 1027, calcium: 5.5, magnesium: 0, phosphorus: 9.5, iron: 0, zinc: 0.3, copper: 0.19, thiamin: 0, riboflavin: 0, vitA: 0, vitC: 0
  },
  {
    id: "142", code: 142, category: "Nuts & Seeds / المكسرات", food: "Sesame Seeds / حبوب سمسم جافة", water: 4.6, energy: 600, protein: 19, refuse: 0, ash: 5.5, fat: 51.8, fiber: 4.6, carb: 18, sodium: 506, potassium: 515, calcium: 887, magnesium: 10.2, phosphorus: 174, iron: 12.3, zinc: 8.6, copper: 1.1, thiamin: 0.32, riboflavin: 4, vitA: 132, vitC: 0
  }
];
