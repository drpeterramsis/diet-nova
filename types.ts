
export type Language = 'en' | 'ar';

export interface Translation {
  common: {
    backHome: string;
    backToCalculator: string;
    explore: string;
    comingSoon: string;
    calculate: string;
    reset: string;
    close: string;
    open: string;
    viewAll: string;
    resetView: string;
    copyright: string;
  };
  header: {
    home: string;
    tools: string;
    login: string;
  };
  home: {
    welcome: string;
    subtitle: string;
  };
  tools: {
    bmi: {
      title: string;
      desc: string;
    };
    kcal: {
      title: string;
      desc: string;
    };
    mealCreator: {
      title: string;
      desc: string;
    };
    exchangeSimple: {
      title: string;
      desc: string;
    };
    exchangePro: {
      title: string;
      desc: string;
    };
    mealPlanner: {
      title: string;
      desc: string;
    };
    bmr: {
      title: string;
      desc: string;
    };
  };
  kcal: {
    title: string;
    subtitle: string;
    personalInfo: string;
    weightInfo: string;
    methods: string;
    summary: string;
    weightAnalysis: string;
    quickActions: string;
    gender: string;
    male: string;
    female: string;
    age: string;
    height: string;
    waist: string;
    activity: string;
    selectActivity: string;
    currentWeight: string;
    selectedWeight: string;
    usualWeight: string;
    specialConditions: string;
    showConditions: string;
    hideConditions: string;
    duration: string;
    ascites: string;
    edema: string;
    method1: string;
    method2: string;
    method3: string;
    method1Desc: string;
    method2Desc: string;
    method3Desc: string;
    weightLoss: string;
    dryWeight: string;
    idealWeightSimple: string;
    idealWeightAccurate: string;
    adjustedWeight: string;
    deficit: string;
    kcalRequired: string;
    planMeals: string;
    activityLevels: {
      sedentary: string;
      mild: string;
      moderate: string;
      heavy: string;
      veryActive: string;
    };
    status: {
      underweight: string;
      normal: string;
      overweight: string;
      obese: string;
    };
  };
  mealCreator: {
    searchPlaceholder: string;
    resetCreator: string;
    mealSummary: string;
    clear: string;
    foodName: string;
    group: string;
    serves: string;
    kcal: string;
    total: string;
    percentage: string;
    totalCalories: string;
    gm: string;
  };
  mealPlannerTool: {
    modeCalculator: string;
    modePlanner: string;
    modeBoth: string;
    addTotalKcalFirst: string;
    foodGroup: string;
    serves: string;
    cho: string;
    pro: string;
    fat: string;
    kcal: string;
    totals: string;
    targetKcal: string;
    remainKcal: string;
    calcKcal: string;
    manualTargetGm: string;
    manualTargetPerc: string;
    remainManual: string;
    targetGm: string;
    targetPerc: string;
    meals: {
      snack1: string;
      breakfast: string;
      snack2: string;
      lunch: string;
      snack3: string;
      dinner: string;
      snack4: string;
      remain: string;
    };
    groups: {
      starch: string;
      veg: string;
      fruit: string;
      meatLean: string;
      meatMed: string;
      meatHigh: string;
      milkSkim: string;
      milkLow: string;
      milkWhole: string;
      legumes: string;
      fats: string;
      sugar: string;
    }
  };
}
