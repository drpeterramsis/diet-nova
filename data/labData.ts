
export interface LabPanel {
    id: string;
    title: string;
    titleAr: string;
    tests: string[];
}

export const labPanels: LabPanel[] = [
    {
        id: 'initial',
        title: 'Initial / General Assessment',
        titleAr: 'التحاليل المبدئية',
        tests: [
            'CBC (Complete Blood Count)',
            'Serum Ferritin',
            'FBS (Fasting Blood Sugar)',
            'PP (Post Prandial Glucose)',
            'Lipid Profile',
            'Liver Enzymes (ALT, AST)',
            'Kidney Function (Creatinine, Urea)',
            'TSH',
            'Serum 25 OH Vit D'
        ]
    },
    {
        id: 'underweight',
        title: 'Underweight / Malnutrition',
        titleAr: 'حالات النحافة',
        tests: [
            'CBC',
            'Serum Ferritin',
            'Stool Analysis',
            'Albumin',
            '25 OH Vit D',
            'Total & Ionized Calcium (Ca+)',
            'H. Pylori in Stool',
            'Free T3 & TSH'
        ]
    },
    {
        id: 'digestive',
        title: 'Digestive Issues / GIT',
        titleAr: 'مشاكل الجهاز الهضمي',
        tests: [
            'CBC',
            'Serum Ferritin',
            'Stool Analysis',
            'Fecal H. Pylori Antigen',
            'Fecal Elastase',
            'Fecal Calprotectin',
            'Fecal Occult Blood'
        ]
    }
];

export interface ReferenceTable {
    title: string;
    headers: string[];
    rows: string[][];
}

export const labReferences: ReferenceTable[] = [
    {
        title: 'Vitals & General',
        headers: ['Parameter', 'Value'],
        rows: [
            ['Heart Rate', '60-90 beat/min'],
            ['Respiratory Rate', '12-15 breath/min'],
            ['Blood Pressure', '120/80 mmHg'],
            ['Temperature', '37 C'],
            ['pH', '7.35-7.45'],
            ['Osmolarity', '285-300 mOsm/kg'],
            ['Plasma COP', '25 mmHg']
        ]
    },
    {
        title: 'Electrolytes',
        headers: ['Electrolyte', 'ECF', 'ICF'],
        rows: [
            ['Cation Na+', '135-145', '10'],
            ['K+', '3.5-5', '150'],
            ['Anion Cl-', '98-108', '2'],
            ['HCO3-', '22-28', '10'],
            ['HPO4-', '1.5-2.5', '140'],
            ['Total', '155', '202']
        ]
    },
    {
        title: 'Blood Glucose',
        headers: ['State', 'Normal', 'Pre-Diabetic', 'Diabetic'],
        rows: [
            ['Post-prandial', '< 140 mg/dl', '140-199', '> 200'],
            ['Fasting (mmol/L)', '3.5-6', 'IFG 6.1-6.9', '≥ 7'],
            ['Random (mmol/dl)', '< 7.8', 'IGT 7.8-11.1', '≥ 11.1'],
            ['HbA1C (mmol)', '4-5.6', '5.6-6.4', '≥ 6.5']
        ]
    },
    {
        title: 'Plasma Protein',
        headers: ['Type', 'Value (Total 6-8 gm/dl)'],
        rows: [
            ['Albumin', '3.5-5 gm/dl'],
            ['Globulin', '2.5-3.5 gm/dl'],
            ['A:G Ratio', '1.2:1 - 2.5:1'],
            ['Fibrinogen', '0.3 gm/dl'],
            ['Prothrombin', '0.1 gm/dl']
        ]
    },
    {
        title: 'Lipid Profile',
        headers: ['Parameter', 'Value'],
        rows: [
            ['Total Cholesterol', '150-200 mg/dl'],
            ['HDL Cholesterol', '40-59 mg/dl'],
            ['LDL Cholesterol', '< 130 mg/dl'],
            ['TAG (Triglycerides)', '< 150 mg/dl']
        ]
    },
    {
        title: 'Blood Cells (CBC)',
        headers: ['Cell', 'Value'],
        rows: [
            ['RBC (Male)', '5-5.5 millions/mm3'],
            ['RBC (Female)', '4-5 millions/mm3'],
            ['WBC', '4000-11000 /mm3'],
            ['Platelets', '1.5-4 lakhs/mm3']
        ]
    },
    {
        title: 'WBC Differential',
        headers: ['Type', 'Absolute', '%'],
        rows: [
            ['Neutrophils', '3000-600', '50-70%'],
            ['Eosinophils', '150-300', '1-4%'],
            ['Basophils', '0-100', '0.4%'],
            ['Lymphocytes', '1500-4000', '20-40%'],
            ['Monocytes', '300-600', '2-8%']
        ]
    },
    {
        title: 'Red Cell Indices',
        headers: ['Index', 'Value'],
        rows: [
            ['MCV', '76-96 femto liter'],
            ['MCH', '27-32 pico gram'],
            ['MCHC', '31-35 gm/dl'],
            ['Hematocrit (M)', '38-48%'],
            ['Hematocrit (F)', '33-43%']
        ]
    },
    {
        title: 'Thyroid Profile',
        headers: ['Hormone', 'Range'],
        rows: [
            ['T3 Total', '1.2-3 nmol/L'],
            ['T3 Free', '3-9 pmol/L'],
            ['T4 Total', '60-150 nmol/L'],
            ['T4 Free', '10-30 pmol/L'],
            ['TSH', '0.3-5 mIU/L']
        ]
    },
    {
        title: 'Coagulation',
        headers: ['Test', 'Time'],
        rows: [
            ['BT (Bleeding Time)', '2-6 min'],
            ['CT (Clotting Time)', '6-12 min'],
            ['PT', '12-14 sec'],
            ['aPTT', '30-40 sec']
        ]
    },
    {
        title: 'Blood Chemistry',
        headers: ['Analyte', 'Value'],
        rows: [
            ['Ammonia', '30-60 µgm/dl'],
            ['Bilirubin Total', '0.2-1.2 mg/dl'],
            ['BUN', '7-18.6 mg/dl'],
            ['Ferritin', '20-200 µgm/L'],
            ['Iron', '50-150 µgm/dl'],
            ['Ketone Body', '< 1 mg/dl'],
            ['Creatinine (M)', '0.9-1.3 mg/dl'],
            ['Creatinine (F)', '0.6-1.1 mg/dl'],
            ['Uric Acid (M)', '3-7 mg/dl'],
            ['Uric Acid (F)', '2-6 mg/dl']
        ]
    },
    {
        title: 'Blood Gases',
        headers: ['Parameter', 'Value'],
        rows: [
            ['PaCO2', '35-45 mmHg'],
            ['PaO2', '85-100 mmHg'],
            ['Plasma Anion Gap', '8-16 meq/L'],
            ['TCO2', '26 mmol/L']
        ]
    }
];
