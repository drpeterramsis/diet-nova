

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
            { age: 5, p3: 100, p15: 104, p50: 109, p85: 115, p97: 119 },
            { age: 7, p3: 111, p15: 116, p50: 121, p85: 127, p97: 132 },
            { age: 9, p3: 122, p15: 127, p50: 133, p85: 139, p97: 145 },
            { age: 11, p3: 133, p15: 139, p50: 145, p85: 152, p97: 158 },
            { age: 13, p3: 144, p15: 150, p50: 156, p85: 163, p97: 169 },
            { age: 15, p3: 151, p15: 156, p50: 162, p85: 168, p97: 173 },
            { age: 17, p3: 152, p15: 157, p50: 163, p85: 169, p97: 174 },
            { age: 19, p3: 152, p15: 157, p50: 163, p85: 169, p97: 174 }
        ]
    },
    who_weight: {
        id: 'who_weight',
        label: 'Weight-for-Age (WHO 2007)',
        type: 'WHO',
        ageRange: '5-19y',
        xLabel: 'Age (Years)',
        yLabel: 'Weight (kg)',
        male: [
            { age: 5, p3: 14, p15: 16, p50: 18, p85: 21, p97: 24 },
            { age: 6, p3: 16, p15: 18, p50: 20, p85: 24, p97: 27 },
            { age: 7, p3: 18, p15: 20, p50: 23, p85: 27, p97: 31 },
            { age: 8, p3: 20, p15: 23, p50: 26, p85: 31, p97: 36 },
            { age: 9, p3: 23, p15: 25, p50: 29, p85: 35, p97: 41 },
            { age: 10, p3: 25, p15: 28, p50: 32, p85: 40, p97: 47 }
        ],
        female: [
            { age: 5, p3: 14, p15: 15, p50: 18, p85: 21, p97: 25 },
            { age: 6, p3: 15, p15: 17, p50: 20, p85: 24, p97: 28 },
            { age: 7, p3: 17, p15: 19, p50: 22, p85: 27, p97: 32 },
            { age: 8, p3: 19, p15: 22, p50: 25, p85: 31, p97: 37 },
            { age: 9, p3: 21, p15: 24, p50: 29, p85: 36, p97: 43 },
            { age: 10, p3: 24, p15: 27, p50: 33, p85: 41, p97: 50 }
        ]
    },
    // --- CDC 2000 (0-36 Months) ---
    cdc_infant_weight: {
        id: 'cdc_infant_weight',
        label: 'Weight-for-Age (CDC 0-36m)',
        type: 'CDC',
        ageRange: '0-36m',
        xLabel: 'Age (Months)',
        yLabel: 'Weight (kg)',
        male: [
            { age: 0, p3: 2.5, p15: 2.9, p50: 3.5, p85: 4.1, p97: 4.5 },
            { age: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.6 },
            { age: 12, p3: 8.4, p15: 9.2, p50: 10.2, p85: 11.3, p97: 12.3 },
            { age: 24, p3: 10.6, p15: 11.5, p50: 12.7, p85: 14.0, p97: 15.3 },
            { age: 36, p3: 12.3, p15: 13.3, p50: 14.7, p85: 16.3, p97: 17.8 }
        ],
        female: [
            { age: 0, p3: 2.4, p15: 2.8, p50: 3.4, p85: 3.9, p97: 4.3 },
            { age: 6, p3: 5.8, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.0 },
            { age: 12, p3: 7.8, p15: 8.6, p50: 9.5, p85: 10.6, p97: 11.6 },
            { age: 24, p3: 10.0, p15: 10.9, p50: 12.2, p85: 13.6, p97: 14.9 },
            { age: 36, p3: 11.8, p15: 12.9, p50: 14.3, p85: 16.0, p97: 17.6 }
        ]
    },
    cdc_infant_length: {
        id: 'cdc_infant_length',
        label: 'Length-for-Age (CDC 0-36m)',
        type: 'CDC',
        ageRange: '0-36m',
        xLabel: 'Age (Months)',
        yLabel: 'Length (cm)',
        male: [
            { age: 0, p3: 46, p50: 50, p97: 54 },
            { age: 6, p3: 63, p50: 67, p97: 71 },
            { age: 12, p3: 71, p50: 76, p97: 81 },
            { age: 24, p3: 81, p50: 87, p97: 93 },
            { age: 36, p3: 88, p50: 95, p97: 102 }
        ],
        female: [
            { age: 0, p3: 45, p50: 49, p97: 53 },
            { age: 6, p3: 61, p50: 65, p97: 69 },
            { age: 12, p3: 69, p50: 74, p97: 79 },
            { age: 24, p3: 80, p50: 86, p97: 92 },
            { age: 36, p3: 87, p50: 94, p97: 101 }
        ]
    },
    cdc_infant_head: {
        id: 'cdc_infant_head',
        label: 'Head Circ-for-Age (CDC 0-36m)',
        type: 'CDC',
        ageRange: '0-36m',
        xLabel: 'Age (Months)',
        yLabel: 'Head Circ (cm)',
        male: [
            { age: 0, p3: 32, p50: 35, p97: 38 },
            { age: 6, p3: 41, p50: 44, p97: 47 },
            { age: 12, p3: 44, p50: 47, p97: 50 },
            { age: 24, p3: 46, p50: 49, p97: 52 },
            { age: 36, p3: 48, p50: 50, p97: 53 }
        ],
        female: [
            { age: 0, p3: 31, p50: 34, p97: 37 },
            { age: 6, p3: 40, p50: 43, p97: 46 },
            { age: 12, p3: 43, p50: 46, p97: 49 },
            { age: 24, p3: 45, p50: 48, p97: 51 },
            { age: 36, p3: 47, p50: 49, p97: 52 }
        ]
    },
    // --- CDC 2000 (2-20 Years) ---
    cdc_child_bmi: {
        id: 'cdc_child_bmi',
        label: 'BMI-for-Age (CDC 2-20y)',
        type: 'CDC',
        ageRange: '2-20y',
        xLabel: 'Age (Years)',
        yLabel: 'BMI (kg/m²)',
        male: [
            { age: 2, p3: 14.5, p15: 15.2, p50: 16.4, p85: 18.0, p97: 19.2 },
            { age: 5, p3: 13.5, p15: 14.1, p50: 15.3, p85: 16.8, p97: 18.3 },
            { age: 10, p3: 13.9, p15: 14.8, p50: 16.6, p85: 19.5, p97: 23.5 },
            { age: 15, p3: 16.0, p15: 17.5, p50: 20.0, p85: 24.0, p97: 28.5 },
            { age: 20, p3: 18.8, p15: 20.5, p50: 24.0, p85: 28.5, p97: 33.5 }
        ],
        female: [
            { age: 2, p3: 14.2, p15: 15.0, p50: 16.2, p85: 17.8, p97: 19.0 },
            { age: 5, p3: 13.3, p15: 14.0, p50: 15.2, p85: 17.0, p97: 19.0 },
            { age: 10, p3: 13.8, p15: 14.8, p50: 17.0, p85: 20.5, p97: 24.5 },
            { age: 15, p3: 16.5, p15: 18.0, p50: 20.5, p85: 24.5, p97: 29.5 },
            { age: 20, p3: 17.8, p15: 19.5, p50: 23.0, p85: 28.0, p97: 34.0 }
        ]
    },
    cdc_child_height: {
        id: 'cdc_child_height',
        label: 'Height-for-Age (CDC 2-20y)',
        type: 'CDC',
        ageRange: '2-20y',
        xLabel: 'Age (Years)',
        yLabel: 'Height (cm)',
        male: [
            { age: 2, p3: 81, p50: 87, p97: 93 },
            { age: 5, p3: 102, p50: 109, p97: 116 },
            { age: 10, p3: 130, p50: 138, p97: 146 },
            { age: 15, p3: 160, p50: 170, p97: 180 },
            { age: 20, p3: 165, p50: 177, p97: 190 }
        ],
        female: [
            { age: 2, p3: 80, p50: 86, p97: 92 },
            { age: 5, p3: 101, p50: 108, p97: 115 },
            { age: 10, p3: 129, p50: 138, p97: 147 },
            { age: 15, p3: 153, p50: 163, p97: 173 },
            { age: 20, p3: 153, p50: 163, p97: 173 }
        ]
    },
    cdc_child_weight: {
        id: 'cdc_child_weight',
        label: 'Weight-for-Age (CDC 2-20y)',
        type: 'CDC',
        ageRange: '2-20y',
        xLabel: 'Age (Years)',
        yLabel: 'Weight (kg)',
        male: [
            { age: 2, p3: 10, p50: 13, p97: 16 },
            { age: 5, p3: 15, p50: 19, p97: 24 },
            { age: 10, p3: 25, p50: 32, p97: 45 },
            { age: 15, p3: 45, p50: 57, p97: 85 },
            { age: 20, p3: 55, p50: 70, p97: 100 }
        ],
        female: [
            { age: 2, p3: 10, p50: 12, p97: 15 },
            { age: 5, p3: 14, p50: 18, p97: 23 },
            { age: 10, p3: 25, p50: 33, p97: 47 },
            { age: 15, p3: 43, p50: 53, p97: 78 },
            { age: 20, p3: 47, p50: 58, p97: 90 }
        ]
    }
};