
// Diet Templates Definitions
// Note: Primary data now loads from Supabase table 'diet_templates'
// Mapping documented in README.md

export interface DietPlanRow {
    kcal: number;
    exchanges: {
        starch: number;
        veg: number;
        fruit: number;
        legumes: number;
        milkSkim: number; // Mapped from milk_skimmed_low
        milkLow: number;  // Mapped from milk_medium
        milkWhole: number; // CORRECTED: Mapped from milk_high_whole to match calculator state
        meatLean: number;  // CORRECTED: Mapped from meat_lean_low to match calculator state
        meatMed: number;  // Mapped from meat_medium
        meatHigh: number; // Mapped from meat_high
        fatsSat: number; 
        fatsMufa: number; 
        fatsPufa: number; 
        sugar: number; 
    };
}

export interface DietDistribution {
    id: string;
    label: string; 
    rows: DietPlanRow[];
}

export interface DietType {
    id: string;
    name: string; 
    distributions: DietDistribution[];
}

/**
 * Maps raw database rows to the DietPlanRow interface.
 * Logic: Ensure keys here match the keys used in MealPlanner.tsx GROUP_FACTORS
 */
export const mapDBRowToTemplate = (row: any): DietPlanRow => ({
    kcal: Number(row.kcal),
    exchanges: {
        starch: Number(row.starch || 0),
        veg: Number(row.vegetables || 0),
        fruit: Number(row.fruits || 0),
        legumes: Number(row.legumes || 0),
        milkSkim: Number(row.milk_skimmed_low || 0),
        milkLow: Number(row.milk_medium || 0),
        milkWhole: Number(row.milk_high_whole || 0),
        meatLean: Number(row.meat_lean_low || 0),
        meatMed: Number(row.meat_medium || 0),
        meatHigh: Number(row.meat_high || 0),
        fatsSat: Number(row.fat_sat || 0),
        fatsMufa: Number(row.fat_mufa || 0),
        fatsPufa: Number(row.fat_pufa || 0),
        sugar: Number(row.sugar || 0),
    }
});

// Fallback Static Data (used if DB fetch fails or is empty)
export const fallbackTemplates: DietType[] = [
    {
        id: 'balanced',
        name: 'Balanced Diet (Local Fallback)',
        distributions: [
            {
                id: 'balanced_50_20_30',
                label: '50% Carb - 20% protein - 30% fat',
                rows: [
                    { kcal: 1200, exchanges: { starch: 4, veg: 6, fruit: 2, legumes: 1, milkSkim: 0, milkLow: 1, milkWhole: 0, meatLean: 1, meatMed: 2, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 1.5, sugar: 0 } },
                    { kcal: 2000, exchanges: { starch: 6, veg: 6, fruit: 4, legumes: 2, milkSkim: 0, milkLow: 1, milkWhole: 1, meatLean: 3, meatMed: 3, meatHigh: 0, fatsSat: 0, fatsMufa: 3, fatsPufa: 2, sugar: 1 } }
                ]
            }
        ]
    }
];
