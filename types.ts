export type Language = 'en' | 'ar';

export interface Translation {
  common: {
    backHome: string;
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
}
