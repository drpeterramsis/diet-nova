
/**
 * Diet Template Data Structure
 * v2.0.225 - Data migrated to Supabase 'diet_templates' table.
 * Local fallback removed.
 */

export interface DietPlanRow {
    kcal: number;
    exchanges: {
        starch: number;
        veg: number;
        fruit: number;
        legumes: number;
        milkLow: number;
        milkMed: number;
        milkFull: number;
        meatLow: number;
        meatMed: number;
        meatHigh: number;
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

// Previously held local dietTemplates array. 
// Now managed via fetch in MealPlanner.tsx from 'diet_templates' table.
