
/**
 * Diet Template Data Structure
 * v2.0.237 - Added dietNotes to support rich formatted plan-specific instructions.
 */

export interface DietPlanRow {
    kcal: number;
    dietName?: string; // Field for specific label in database
    dietNotes?: string; // v2.0.237: Field for rich notes (using ";" as separator)
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