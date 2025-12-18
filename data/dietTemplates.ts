
// Diet Templates Definitions
// Note: Data is now EXCLUSIVELY loaded from Supabase table 'diet_templates'
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
        milkWhole: number; // Mapped from milk_high_whole to match calculator state
        meatLean: number;  // Mapped from meat_lean_low to match calculator state
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
 * Verified Mapping for v2.0.228
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

/**
 * Fallback Templates are removed in v2.0.228 to ensure strict database sync.
 * If Supabase is empty, the UI will reflect no data.
 */
export const fallbackTemplates: DietType[] = [];
