
// Types for Diet Templates
export interface DietPlanRow {
    kcal: number;
    exchanges: {
        starch: number;
        veg: number;
        fruit: number;
        legumes: number;
        milkSkim: number; // Mapped from milk_skimmed_low
        milkLow: number;  // Mapped from milk_medium
        milkWhole: number; // Mapped from milk_high_whole
        meatLean: number; // Mapped from meat_lean_low
        meatMed: number;
        meatHigh: number;
        fatsSat: number;  // SFA
        fatsMufa: number; // MUFA
        fatsPufa: number; // PUFA
        sugar: number;    // Mapped from sugar
    };
}

export interface DietDistribution {
    id: string;
    label: string; // e.g. "50% Carb - 20% protein - 30% fat"
    rows: DietPlanRow[];
}

export interface DietType {
    id: string;
    name: string; // e.g. "Balanced", "DASH"
    distributions: DietDistribution[];
}

/**
 * Data Transcription from User Provided CSV
 * Columns: starch, vegetables, fruits, legumes, milk_skimmed_low, milk_medium, milk_high_whole, 
 * meat_lean_low, meat_medium, meat_high, fat_sat, fat_mufa, fat_pufa, sugar
 */

export const dietTemplates: DietType[] = [
    {
        id: 'balanced',
        name: 'Balanced Diet',
        distributions: [
            {
                id: 'balanced_50_20_30',
                label: '50% Carb - 20% Protein - 30% Fat',
                rows: [
                    { kcal: 1200, exchanges: { starch: 4, veg: 6, fruit: 2, legumes: 1, milkSkim: 0, milkLow: 1, milkWhole: 0, meatLean: 1, meatMed: 2, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 1.5, sugar: 0 } },
                    { kcal: 1400, exchanges: { starch: 5, veg: 5, fruit: 2, legumes: 1, milkSkim: 1, milkLow: 0, milkWhole: 0, meatLean: 1, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 2, sugar: 1 } },
                    { kcal: 1600, exchanges: { starch: 6, veg: 6, fruit: 2, legumes: 1.5, milkSkim: 1, milkLow: 0, milkWhole: 0, meatLean: 1.5, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 4, fatsPufa: 2, sugar: 1 } },
                    { kcal: 1800, exchanges: { starch: 6, veg: 4, fruit: 3, legumes: 2, milkSkim: 0, milkLow: 1, milkWhole: 1, meatLean: 1.5, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 4, fatsPufa: 1, sugar: 1 } },
                    { kcal: 2000, exchanges: { starch: 6, veg: 6, fruit: 4, legumes: 2, milkSkim: 0, milkLow: 1, milkWhole: 1, meatLean: 3, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 2, sugar: 1 } },
                    { kcal: 2200, exchanges: { starch: 7, veg: 5, fruit: 4, legumes: 2, milkSkim: 0, milkLow: 2, milkWhole: 1, meatLean: 2, meatMed: 4, meatHigh: 0, fatsSat: 1, fatsMufa: 3, fatsPufa: 1, sugar: 1 } },
                    { kcal: 2400, exchanges: { starch: 8, veg: 7, fruit: 4, legumes: 2, milkSkim: 0, milkLow: 2, milkWhole: 1, meatLean: 2, meatMed: 5, meatHigh: 0, fatsSat: 1, fatsMufa: 3, fatsPufa: 1, sugar: 1 } }
                ]
            },
            {
                id: 'balanced_45_20_35',
                label: '45% Carb - 20% Protein - 35% Fat',
                rows: [
                    { kcal: 1200, exchanges: { starch: 4, veg: 3, fruit: 2, legumes: 1, milkSkim: 0, milkLow: 0, milkWhole: 1, meatLean: 2, meatMed: 2, meatHigh: 0, fatsSat: 1, fatsMufa: 2, fatsPufa: 1, sugar: 0 } },
                    { kcal: 1400, exchanges: { starch: 5, veg: 3, fruit: 2.5, legumes: 1, milkSkim: 0, milkLow: 1, milkWhole: 0, meatLean: 2, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 2, sugar: 0 } },
                    { kcal: 1600, exchanges: { starch: 5, veg: 4, fruit: 3, legumes: 1, milkSkim: 0, milkLow: 1, milkWhole: 1, meatLean: 2, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 2, sugar: 0 } },
                    { kcal: 1800, exchanges: { starch: 5, veg: 4, fruit: 3, legumes: 1.5, milkSkim: 0, milkLow: 0, milkWhole: 2, meatLean: 2, meatMed: 3, meatHigh: 0, fatsSat: 1, fatsMufa: 3, fatsPufa: 2, sugar: 1 } },
                    { kcal: 2000, exchanges: { starch: 6, veg: 4, fruit: 3, legumes: 2, milkSkim: 0, milkLow: 0, milkWhole: 2, meatLean: 2, meatMed: 4, meatHigh: 0, fatsSat: 1, fatsMufa: 3, fatsPufa: 2, sugar: 1 } },
                    { kcal: 2200, exchanges: { starch: 6, veg: 6, fruit: 3, legumes: 2, milkSkim: 0, milkLow: 0, milkWhole: 3, meatLean: 2, meatMed: 4, meatHigh: 0, fatsSat: 1, fatsMufa: 3, fatsPufa: 2, sugar: 1 } },
                    { kcal: 2400, exchanges: { starch: 7, veg: 5, fruit: 4, legumes: 2, milkSkim: 0, milkLow: 0, milkWhole: 3, meatLean: 2, meatMed: 4, meatHigh: 1, fatsSat: 1, fatsMufa: 3, fatsPufa: 2, sugar: 1 } }
                ]
            }
        ]
    }
];
