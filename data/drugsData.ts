
export interface DrugItem {
    id: string;
    group: string;
    category: string;
    mechanism: string;
    notes: string;
    examples: string;
}

export const drugsData: DrugItem[] = [
    // Group A
    {
        id: 'a1',
        group: 'A',
        category: 'Anti-Depressants',
        mechanism: '1. Tricyclic antidepressants: Block H1, 5 HT receptors → change in regulation of body fat stores\n2. (SSRIs): alternation in 5HT receptors, and Carbohydrate craving. But SSRIs not cause weight gain except if treatment > 6-8 month\n3. (MAOIs): cause weight gain as TCAs in both short & long term',
        notes: 'NB: - Bupropion cause weight loss. it has no antihistaminic effect',
        examples: 'Amitriptyline (Tryptizol)\nClomipramine (Anafranil)\nPhenelzine'
    },
    {
        id: 'a2',
        group: 'A',
        category: 'Anti-Psychotics',
        mechanism: '- Block of D2 & 5HT receptors → Induction of Fos Gene → ↑ Food intake\n- Some preparation Cause Hyperprolactinemia → ↑ appetite',
        notes: '',
        examples: '1. Phenothiazine e.g. Chlorpromazine (largactil)\n2. Butyrophenones e.g. Haloperidol (Haladol)\n3. Clozapine (Leponex), Olanzapine (Zyprexa)'
    },
    {
        id: 'a3',
        group: 'A',
        category: 'Anti-Convulsant',
        mechanism: 'All ↑ Insulin → ↑ appetite → ↑ weight gain',
        notes: '',
        examples: '1. Carbamazepine (Tegretol)\n2. Gabapentin (Neurontin)\n3. Lamotrigine (Lamictal)'
    },
    {
        id: 'a4',
        group: 'A',
        category: 'Anti-Inflammatory',
        mechanism: 'Act by inhibition of Prostaglandins (PGs E1, E2, I2) ↑ Na & fluid retention',
        notes: '',
        examples: ''
    },
    // Group B
    {
        id: 'b1',
        group: 'B',
        category: 'B - Blockers',
        mechanism: '↓ Basal Metabolic Rate.\n↓ Energy Expenditure by 100 – 200 Cal/day.\n↓ Lipolysis by blocking B3 Receptor\n↓ Thermogenic effect of Food',
        notes: 'B blockers Increases Abdominal fat',
        examples: ''
    },
    {
        id: 'b2',
        group: 'B',
        category: 'Breast Cancer Medications',
        mechanism: 'Fluid retention and Edema',
        notes: '',
        examples: 'Tamoxifen (Nolvadex)'
    },
    // Group C
    {
        id: 'c1',
        group: 'C',
        category: 'Corticosteroids',
        mechanism: '- CHO: Hyperglycemia → Increase Appetite\n- Fat: Redistribution from extremities to trunk → ↑ Visceral Deposition\n- Protein: Catabolic effect → Muscle wasting',
        notes: '',
        examples: ''
    },
    {
        id: 'c2',
        group: 'C',
        category: 'Contraceptives',
        mechanism: '↑ appetite\n↑ fat deposition\n↑ Insulin secretion\n↑ glycogen storage',
        notes: '',
        examples: ''
    },
    {
        id: 'c3',
        group: 'C',
        category: 'Cannabinoids',
        mechanism: '++ CB 1 rec. in CNS → ↑ appetite\n++ CB 1 rec. in GIT → ↑ gut peptides\n++ CB 1 rec. in Liver → ↑ lipogenesis',
        notes: '',
        examples: 'Dronabinol .. antiemetic\nL-nantradol .. Analgesic'
    },
    // Group D
    {
        id: 'd1',
        group: 'D',
        category: 'Diabetic Medication (Insulin)',
        mechanism: '1. ↑ lipoprotein lipase → hydrolyze TGs from lipoproteins\n2. ↓ Intracellular lipase.\n3. ↑ glucose transport → glycerol phosphate → esterification of Fatty Acids',
        notes: '',
        examples: ''
    },
    {
        id: 'd2',
        group: 'D',
        category: 'Diabetic Medication (Sulphonyl Urea)',
        mechanism: 'Insulin Release',
        notes: '',
        examples: 'glyburide (Micronase)\nglimepiride (Amaryl)\nchlorpropamide (Diabinese)\nglipizide (Glucotrol)\ntolazamide (Tolinase)\nGliclazide\nglibenclamide'
    },
    {
        id: 'd3',
        group: 'D',
        category: 'Diabetic Medication (Glitazones)',
        mechanism: '1. ↑ Insulin signal transduction\n2. ↑ glucose uptake\n3. Fluid retention',
        notes: '',
        examples: 'rosiglitazone (Avandia)\npioglitazone (Actos)'
    }
];
