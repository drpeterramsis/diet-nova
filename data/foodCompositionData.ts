
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
    vitA: number; // IU or mcg
    vitC: number; // mg
    code: number;
    refuse: number; // %
}

// Sample Data derived from common Egyptian Food Composition sources (similar to provided PDF structure)
export const foodCompositionData: FoodCompositionItem[] = [
    {
        id: '1', food: 'Barley (Grains) / شعير (حبوب)', category: 'Cereals',
        water: 8.8, energy: 335, protein: 10.7, fat: 1.5, carb: 69.6, fiber: 6.5, ash: 2.9,
        calcium: 104, iron: 4.63, sodium: 55, potassium: 299, phosphorus: 184, vitA: 0, vitC: 0, code: 1, refuse: 0
    },
    {
        id: '2', food: 'Corn, White / ذرة بيضاء', category: 'Cereals',
        water: 10.7, energy: 364, protein: 10.2, fat: 4, carb: 71.9, fiber: 1.9, ash: 1.3,
        calcium: 27, iron: 2.42, sodium: 8, potassium: 125, phosphorus: 254, vitA: 0, vitC: 0, code: 2, refuse: 0
    },
    {
        id: '3', food: 'Corn, Yellow / ذرة صفراء', category: 'Cereals',
        water: 10.1, energy: 368, protein: 12.7, fat: 5.5, carb: 67, fiber: 2.9, ash: 1.8,
        calcium: 26, iron: 2.6, sodium: 10, potassium: 161, phosphorus: 239, vitA: 120, vitC: 0, code: 3, refuse: 0
    },
    {
        id: '4', food: 'Corn Flakes / كورن فليكس', category: 'Cereals',
        water: 5, energy: 373, protein: 6.2, fat: 2.1, carb: 82.3, fiber: 2, ash: 2.4,
        calcium: 15, iron: 1.4, sodium: 464, potassium: 139, phosphorus: 44, vitA: 0, vitC: 0, code: 4, refuse: 0
    },
    {
        id: '5', food: 'Corn Flour / دقيق ذرة', category: 'Cereals',
        water: 11.1, energy: 359, protein: 8.9, fat: 2.5, carb: 75.2, fiber: 1, ash: 1.3,
        calcium: 22, iron: 2.3, sodium: 6, potassium: 95, phosphorus: 183, vitA: 0, vitC: 0, code: 5, refuse: 0
    },
    {
        id: '6', food: 'Bread, Balady (100g) / خبز بلدي', category: 'Bakery',
        water: 35.3, energy: 254, protein: 8.8, fat: 1, carb: 52.5, fiber: 1.3, ash: 1.1,
        calcium: 42, iron: 2.89, sodium: 338, potassium: 236, phosphorus: 134, vitA: 0, vitC: 0, code: 51, refuse: 0
    },
    {
        id: '7', food: 'Rice, White (Cooked) / أرز أبيض مطهي', category: 'Cereals',
        water: 70, energy: 129, protein: 3.3, fat: 2.6, carb: 23.1, fiber: 0.5, ash: 0.5,
        calcium: 125, iron: 0.05, sodium: 25, potassium: 125, phosphorus: 58, vitA: 0, vitC: 0, code: 24, refuse: 0
    },
    {
        id: '8', food: 'Macaroni (Boiled) / مكرونة مسلوقة', category: 'Cereals',
        water: 70.8, energy: 111, protein: 3.6, fat: 0.6, carb: 22.1, fiber: 3.1, ash: 0.4,
        calcium: 40, iron: 4.4, sodium: 10, potassium: 131, phosphorus: 250, vitA: 0, vitC: 0, code: 11, refuse: 0
    },
    {
        id: '9', food: 'Beans, Fava (Cooked) / فول مدمس مطهي', category: 'Legumes',
        water: 73.7, energy: 98, protein: 5.6, fat: 0.7, carb: 17.2, fiber: 2, ash: 0.8,
        calcium: 37, iron: 2.4, sodium: 24, potassium: 218, phosphorus: 183, vitA: 0, vitC: 0, code: 109, refuse: 0
    },
    {
        id: '10', food: 'Lentils (Cooked) / عدس بجبة مطهي', category: 'Legumes',
        water: 65, energy: 151, protein: 5.8, fat: 0.7, carb: 19.3, fiber: 2.3, ash: 2,
        calcium: 43, iron: 3.1, sodium: 440, potassium: 372, phosphorus: 164, vitA: 15, vitC: 0, code: 126, refuse: 0
    },
    {
        id: '11', food: 'Potatoes (Boiled) / بطاطس مسلوقة', category: 'Vegetables',
        water: 77, energy: 87, protein: 1.9, fat: 0.1, carb: 20.1, fiber: 1.8, ash: 0.9,
        calcium: 5, iron: 0.31, sodium: 240, potassium: 328, phosphorus: 44, vitA: 0, vitC: 7.2, code: 97, refuse: 0
    },
    {
        id: '12', food: 'Tomato / طماطم', category: 'Vegetables',
        water: 94.3, energy: 20, protein: 1.1, fat: 0.3, carb: 3.1, fiber: 0.6, ash: 0.6,
        calcium: 15, iron: 0.5, sodium: 10, potassium: 328, phosphorus: 30, vitA: 95, vitC: 21, code: 222, refuse: 3
    },
    {
        id: '13', food: 'Cucumber / خيار', category: 'Vegetables',
        water: 95, energy: 16, protein: 0.7, fat: 0.1, carb: 4.5, fiber: 0.4, ash: 0.4,
        calcium: 18, iron: 0.8, sodium: 5, potassium: 130, phosphorus: 31, vitA: 4, vitC: 9, code: 168, refuse: 10
    },
    {
        id: '14', food: 'Apple / تفاح', category: 'Fruits',
        water: 84.5, energy: 57, protein: 0.4, fat: 0.2, carb: 13.5, fiber: 0.8, ash: 0.6,
        calcium: 5, iron: 0.3, sodium: 5, potassium: 125, phosphorus: 12, vitA: 5, vitC: 7, code: 227, refuse: 11
    },
    {
        id: '15', food: 'Banana / موز', category: 'Fruits',
        water: 75.2, energy: 95, protein: 1.3, fat: 0.3, carb: 21.7, fiber: 0.6, ash: 0.9,
        calcium: 10, iron: 0.6, sodium: 3, potassium: 350, phosphorus: 25, vitA: 28, vitC: 8, code: 231, refuse: 33
    },
    {
        id: '16', food: 'Orange / برتقال', category: 'Fruits',
        water: 85.5, energy: 56, protein: 1.1, fat: 0.3, carb: 12.1, fiber: 0.6, ash: 0.4,
        calcium: 37, iron: 0.3, sodium: 3, potassium: 181, phosphorus: 28, vitA: 8, vitC: 55, code: 252, refuse: 28
    },
    {
        id: '17', food: 'Dates, Dried / بلح', category: 'Fruits',
        water: 20, energy: 282, protein: 2.5, fat: 0.4, carb: 72.9, fiber: 2.3, ash: 1.9,
        calcium: 62, iron: 3, sodium: 3, potassium: 652, phosphorus: 55, vitA: 0, vitC: 0, code: 234, refuse: 13
    },
    {
        id: '18', food: 'Milk, Whole / لبن كامل الدسم', category: 'Dairy',
        water: 87.8, energy: 64, protein: 3.3, fat: 3.5, carb: 4.7, fiber: 0, ash: 0.7,
        calcium: 120, iron: 0.06, sodium: 48, potassium: 142, phosphorus: 92, vitA: 37, vitC: 0, code: 415, refuse: 0
    },
    {
        id: '19', food: 'Egg, Whole (Chicken) / بيض دجاج كامل', category: 'Dairy',
        water: 75.2, energy: 149, protein: 12.6, fat: 10.8, carb: 0.3, fiber: 0, ash: 1.1,
        calcium: 62, iron: 2.5, sodium: 155, potassium: 130, phosphorus: 218, vitA: 128, vitC: 0, code: 360, refuse: 12
    },
    {
        id: '20', food: 'Chicken Meat (Raw) / لحم دجاج', category: 'Meats',
        water: 75.1, energy: 121, protein: 19, fat: 3, carb: 0, fiber: 0, ash: 0.9,
        calcium: 12, iron: 1.6, sodium: 67, potassium: 250, phosphorus: 186, vitA: 0, vitC: 0, code: 343, refuse: 0
    },
    {
        id: '21', food: 'Beef, Lean (Raw) / لحم بقري', category: 'Meats',
        water: 70.5, energy: 132, protein: 19.5, fat: 4, carb: 4.4, fiber: 0, ash: 1.6,
        calcium: 10, iron: 7.8, sodium: 88, potassium: 303, phosphorus: 352, vitA: 12121, vitC: 25, code: 317, refuse: 0
    },
    {
        id: '22', food: 'Fish, Bolti (Raw) / سمك بلطي', category: 'Meats',
        water: 77.8, energy: 94, protein: 19, fat: 2, carb: 0, fiber: 0, ash: 1.2,
        calcium: 92, iron: 1.9, sodium: 85, potassium: 290, phosphorus: 197, vitA: 0, vitC: 0, code: 389, refuse: 44
    },
    {
        id: '23', food: 'Sugar / سكر قصب', category: 'Sugars',
        water: 0.5, energy: 398, protein: 0, fat: 0, carb: 99.5, fiber: 0, ash: 0,
        calcium: 0, iron: 0, sodium: 0, potassium: 0, phosphorus: 0, vitA: 0, vitC: 0, code: 301, refuse: 0
    },
    {
        id: '24', food: 'Oil, Vegetable / زيت نباتي', category: 'Fats',
        water: 0, energy: 899, protein: 0, fat: 99.9, carb: 0, fiber: 0, ash: 0,
        calcium: 0, iron: 0, sodium: 5, potassium: 0, phosphorus: 0, vitA: 0, vitC: 0, code: 466, refuse: 0
    }
];
