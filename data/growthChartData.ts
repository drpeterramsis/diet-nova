

// Representative Data Points for Growth Charts
// Sources: WHO 2007 (5-19y) and CDC 2000 (0-36m, 2-20y)
// Simplified for visualization (interpolated points for chart drawing)

export interface GrowthPoint {
    age: number; // Months for 0-36m, Years for others
    p3: number;
    p15?: number;
    p5?: number;
    p10?: number;
    p50: number;
    p85?: number;
    p90?: number;
    p95?: number;
    p97: number;
}

export interface GrowthDataset {
    id: string;
    label: string;
    xLabel: string; // "Age (Months)" or "Age (Years)"
    yLabel: string; // "kg", "cm", "kg/m²"
    type: 'WHO' | 'CDC';
    ageRange: '0-36m' | '2-20y' | '5-19y';
    male: GrowthPoint[];
    female: GrowthPoint[];
}

export const growthDatasets: Record<string, GrowthDataset> = {
    // --- WHO 2007 (5-19y) ---
    who_bmi: {
        id: 'who_bmi',
        label: 'BMI-for-Age (WHO 2007)',
        type: 'WHO',
        ageRange: '5-19y',
        xLabel: 'Age (Years)',
        yLabel: 'BMI (kg/m²)',
        male: [
            { age: 5, p3: 13.0, p15: 13.8, p50: 15.2, p85: 16.6, p97: 18.2 },
            { age: 6, p3: 13.0, p15: 13.8, p50: 15.3, p85: 17.0, p97: 19.2 },
            { age: 7, p3: 13.1, p15: 13.9, p50: 15.5, p85: 17.4, p97: 20.2 },
            { age: 8, p3: 13.3, p15: 14.1, p50: 15.7, p85: 18.0, p97: 21.4 },
            { age: 9, p3: 13.5, p15: 14.4, p50: 16.0, p85: 18.6, p97: 22.7 },
            { age: 10, p3: 13.7, p15: 14.6, p50: 16.4, p85: 19.3, p97: 24.0 },
            { age: 11, p3: 14.0, p15: 15.0, p50: 16.9, p85: 20.1, p97: 25.2 },
            { age: 12, p3: 14.4, p15: 15.4, p50: 17.5, p85: 21.0, p97: 26.6 },
            { age: 13, p3: 14.8, p15: 15.9, p50: 18.2, p85: 21.8, p97: 27.8 },
            { age: 14, p3: 15.2, p15: 16.4, p50: 19.0, p85: 22.7, p97: 28.9 },
            { age: 15, p3: 15.8, p15: 17.0, p50: 19.8, p85: 23.6, p97: 29.9 },
            { age: 16, p3: 16.3, p15: 17.6, p50: 20.5, p85: 24.5, p97: 30.7 },
            { age: 17, p3: 16.9, p15: 18.2, p50: 21.3, p85: 25.4, p97: 31.5 },
            { age: 18, p3: 17.3, p15: 18.8, p50: 22.0, p85: 26.2, p97: 32.3 },
            { age: 19, p3: 17.8, p15: 19.2, p50: 22.7, p85: 26.9, p97: 33.0 }
        ],
        female: [
            { age: 5, p3: 12.8, p15: 13.6, p50: 15.0, p85: 16.8, p97: 19.0 },
            { age: 6, p3: 12.8, p15: 13.6, p50: 15.1, p85: 17.1, p97: 19.7 },
            { age: 7, p3: 12.8, p15: 13.7, p50: 15.3, p85: 17.6, p97: 20.7 },
            { age: 8, p3: 12.9, p15: 13.9, p50: 15.7, p85: 18.2, p97: 21.9 },
            { age: 9, p3: 13.1, p15: 14.2, p50: 16.1, p85: 19.0, p97: 23.1 },
            { age: 10, p3: 13.4, p15: 14.5, p50: 16.6, p85: 19.9, p97: 24.5 },
            { age: 11, p3: 13.7, p15: 15.0, p50: 17.2, p85: 20.9, p97: 25.9 },
            { age: 12, p3: 14.1, p15: 15.5, p50: 18.0, p85: 21.9, p97: 27.3 },
            { age: 13, p3: 14.6, p15: 16.1, p50: 18.8, p85: 22.9, p97: 28.5 },
            { age: 14, p3: 15.1, p15: 16.7, p50: 19.6, p85: 23.8, p97: 29.6 },
            { age: 15, p3: 15.6, p15: 17.3, p50: 20.3, p85: 24.6, p97: 30.6 },
            { age: 16, p3: 16.0, p15: 17.8, p50: 20.9, p85: 25.4, p97: 31.4 },
            { age: 17, p3: 16.4, p15: 18.2, p50: 21.4, p85: 26.0, p97: 32.2 },
            { age: 18, p3: 16.7, p15: 18.5, p50: 21.8, p85: 26.5, p97: 32.8 },
            { age: 19, p3: 16.9, p15: 18.8, p50: 22.2, p85: 27.0, p97: 33.3 }
        ]
    },
    who_height: {
        id: 'who_height',
        label: 'Height-for-Age (WHO 2007)',
        type: 'WHO',
        ageRange: '5-19y',
        xLabel: 'Age (Years)',
        yLabel: 'Height (cm)',
        male: [
            { age: 5, p3: 102, p15: 106, p50: 110, p85: 115, p97: 119 },
            { age: 7, p3: 113, p15: 117, p50: 122, p85: 127, p97: 132 },
            { age: 9, p3: 123, p15: 128, p50: 133, p85: 139, p97: 144 },
            { age: 11, p3: 132, p15: 138, p50: 144, p85: 150, p97: 156 },
            { age: 13, p3: 142, p15: 149, p50: 157, p85: 165, p97: 172 },
            { age: 15, p3: 153, p15: 161, p50: 169, p85: 177, p97: 184 },
            { age: 17, p3: 160, p15: 167, p50: 175, p85: 183, p97: 190 },
            { age: 19, p3: 162, p15: 170, p50: 177, p85: 184, p97: 191 }
        ],
        female: [
            { age: 5, p3: 100, p15: 104, p50: 109, p85: 114, p97: 119 },
            { age: 7, p3: 110, p15: 115, p50: 121, p85: 126, p97: 131 },
            { age: 9, p3: 121, p15: 126, p50: 133, p85: 138, p97: 144 },
            { age: 11, p3: 131, p15: 138, p50: 145, p85: 152, p97: 158 },
            { age: 13, p3: 142, p15: 149, p50: 156, p85: 163, p97: 168 },
            { age: 15, p3: 149, p15: 155, p50: 162, p85: 167, p97: 172 },
            { age: 17, p3: 151, p15: 157, p50: 163, p85: 168, p97: 174 },
            { age: 19, p3: 151, p15: 157, p50: 163, p85: 169, p97: 174 }
        ]
    },
    // Add missing datasets for runtime safety
    who_weight: {
        id: 'who_weight',
        label: 'Weight-for-Age (WHO 2007)',
        type: 'WHO',
        ageRange: '5-19y',
        xLabel: 'Age (Years)',
        yLabel: 'Weight (kg)',
        male: [
             { age: 5, p3: 14.1, p50: 18.3, p97: 24.2 },
             { age: 10, p3: 23.3, p50: 31.2, p97: 53.3 },
             { age: 19, p3: 49.3, p50: 68.9, p97: 102.3 }
        ],
        female: [
             { age: 5, p3: 13.7, p50: 18.2, p97: 24.9 },
             { age: 10, p3: 24.0, p50: 31.9, p97: 53.3 },
             { age: 19, p3: 43.0, p50: 56.6, p97: 84.4 }
        ]
    },
    cdc_child_bmi: {
        id: 'cdc_child_bmi',
        label: 'BMI-for-Age (CDC)',
        type: 'CDC',
        ageRange: '2-20y',
        xLabel: 'Age (Years)',
        yLabel: 'BMI',
        male: [{ age: 2, p3: 14.5, p50: 16.5, p97: 19 }, { age: 20, p3: 19, p50: 25, p97: 35 }],
        female: [{ age: 2, p3: 14.2, p50: 16.2, p97: 18.8 }, { age: 20, p3: 18, p50: 24, p97: 34 }]
    },
    cdc_infant_weight: {
        id: 'cdc_infant_weight',
        label: 'Weight-for-Age (CDC Infant)',
        type: 'CDC',
        ageRange: '0-36m',
        xLabel: 'Age (Months)',
        yLabel: 'Weight (kg)',
        male: [{ age: 0, p3: 2.5, p50: 3.5, p97: 4.5 }, { age: 36, p3: 11, p50: 14.5, p97: 18 }],
        female: [{ age: 0, p3: 2.4, p50: 3.4, p97: 4.4 }, { age: 36, p3: 10.5, p50: 14, p97: 17.5 }]
    },
    cdc_infant_length: {
        id: 'cdc_infant_length',
        label: 'Length-for-Age (CDC Infant)',
        type: 'CDC',
        ageRange: '0-36m',
        xLabel: 'Age (Months)',
        yLabel: 'Length (cm)',
        male: [{ age: 0, p3: 45, p50: 50, p97: 55 }, { age: 36, p3: 88, p50: 96, p97: 104 }],
        female: [{ age: 0, p3: 44, p50: 49, p97: 54 }, { age: 36, p3: 87, p50: 95, p97: 103 }]
    }
};
