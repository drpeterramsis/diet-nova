

export type Language = 'en' | 'ar';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'patient';
}

export interface SavedMeal {
  id: string;
  name: string;
  created_at: string;
  data: any; // JSON data of the meal plan
  tool_type: 'meal-planner' | 'meal-creator';
  user_id: string;
}

export interface Client {
  id: string;
  doctor_id: string;
  client_code?: string;
  full_name: string;
  visit_date: string;
  dob?: string;
  clinic: string;
  phone?: string;
  notes?: string;
  nfpe_data?: any; // New: JSON for NFPE checklist state
  age?: number;
  gender?: 'male' | 'female';
  marital_status?: string;
  kids_count?: number;
  job?: string;
  // Latest anthropometrics snapshot
  weight?: number;
  height?: number;
  waist?: number;
  hip?: number; // New
  miac?: number; // New
  bmi?: number; // New
  created_at: string;
}

export interface ClientVisit {
  id: string;
  client_id: string;
  visit_date: string;
  weight?: number;
  height?: number; // New
  waist?: number; // New
  hip?: number; // New
  miac?: number; // New
  bmi?: number; // New
  notes?: string;
  kcal_data?: any; // JSON for saved calculator state
  meal_plan_data?: any; // JSON for saved meal plan state
  created_at: string;
}

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
    save: string;
    load: string;
    delete: string;
    edit: string;
    saveSuccess: string;
    loadSuccess: string;
    logout: string;
    loginRequired: string;
    locked: string;
    search: string;
    cancel: string;
    actions: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    email: string;
    password: string;
    fullName: string;
    role: string;
    doctor: string;
    patient: string;
    submitLogin: string;
    submitSignup: string;
    switchSignup: string;
    switchLogin: string;
    errorGeneric: string;
    successSignup: string;
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
    clients: {
      title: string;
      desc: string;
    };
    nfpe: {
      title: string;
      desc: string;
    };
  };
  clients: {
    title: string;
    addClient: string;
    editClient: string;
    clientProfile: string;
    name: string;
    visitDate: string;
    clinic: string;
    phone: string;
    notes: string;
    age: string;
    gender: string;
    noClients: string;
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
    ageMode: string;
    manual: string;
    auto: string;
    dob: string;
    reportDate: string;
    calcAge: string;
    pediatricStatus: string;
    adultStatus: string;
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