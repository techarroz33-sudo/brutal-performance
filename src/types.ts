export type FitnessGoal = 'crescimento_muscular' | 'perda_peso' | 'manter_forma';

export type Sex = 'masculino' | 'feminino';

export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'atleta';

export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado';

export type AppTab =
  | 'dashboard'
  | 'workouts'
  | 'foods'
  | 'food_analyzer'
  | 'nutrition'
  | 'evolution';

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  waistCm: number;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  experience: ExperienceLevel;
  daysPerWeek: number;
}

export interface BiometricAnalysis {
  bmi: number;
  bmiCategory: string;
  bmiStatusTone: 'optimal' | 'attention' | 'alert';
  tmb: number;
  get: number;
  targetCalories: number;
  caloricDelta: number;
  caloricStrategyLabel: string;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterMl: number;
  estimatedBfPercent: number;
  bfClassification: string;
  leanMassKg: number;
  fatMassKg: number;
  idealWeightMin: number;
  idealWeightMax: number;
  maxHeartRate: number;
  fatBurnZone: string;
  cardioZone: string;
  trainingFocusLabel: string;
  metabolicDiagnostic: string;
  weeklyProjectedChangeKg: string;
}

export interface ExerciseSetLog {
  setNum: number;
  label: string;
  targetReps: string;
  loadKg: number;
  reps: number;
  rpe: number;
  done: boolean;
}

export type SplitId = 'A' | 'B' | 'C' | 'D' | 'E';

export type WorkoutEnvironment = 'academia' | 'casa';

export interface ExerciseItem {
  id: string;
  splitId: SplitId;
  order: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  alternativeName?: string;
  setsCount: number;
  repsRange: string;
  restSeconds: number;
  targetRpe: string;
  tempo: string;
  suggestedLoadKg: number;
  techniqueNote: string;
  sets: ExerciseSetLog[];
}

export interface WorkoutSplitMeta {
  id: SplitId;
  shortTitle: string;
  fullTitle: string;
  subtitle: string;
  estimatedMinutes: number;
  targetRir: string;
  focusTag: string;
}

export interface RestActivityOption {
  id: string;
  title: string;
  duration: string;
  intensity: string;
  description: string;
  benefit: string;
}

export interface RestRecoveryPlan {
  headline: string;
  frequencyNote: string;
  heartRateTarget: string;
  sleepAndNutritionTip: string;
  activities: RestActivityOption[];
}

export interface WorkoutPlanResult {
  goal: FitnessGoal;
  environment: WorkoutEnvironment;
  goalTitle: string;
  protocolSummary: string;
  coachGuidelines: string[];
  splits: WorkoutSplitMeta[];
  exercises: ExerciseItem[];
  restRecovery: RestRecoveryPlan;
}

export type FoodCategory =
  | 'Proteínas'
  | 'Carboidratos'
  | 'Gorduras Boas'
  | 'Vegetais & Fibras'
  | 'Lácteos & Suplementos';

export interface RecommendedFood {
  id: string;
  name: string;
  category: FoodCategory;
  profiles: FitnessGoal[];
  primaryProfile: FitnessGoal;
  servingSize: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  mealTiming: string;
  glycemicProfile: 'Baixo' | 'Moderado' | 'Alto';
  satietyIndex: string;
  benefit: string;
}

export interface PlannedMeal {
  id: string;
  order: string;
  time: string;
  title: string;
  description: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  tag: string;
  confirmed: boolean;
}

export interface DailyHabit {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
}

export interface DailySupplement {
  id: string;
  name: string;
  dose: string;
  done: boolean;
}

export interface WeightEntry {
  label: string;
  weightKg: number;
  volumeKg: number;
  bfPercent: number;
}

export interface FoodAnalysisItem {
  name: string;
  portion: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface ExerciseBurnEquivalent {
  activity: string;
  minutes: number;
  intensity: string;
}

export interface FoodAnalysisEntry {
  id: string;
  comment: string;
  createdAt: string;
  items: FoodAnalysisItem[];
  totalKcal: number;
  caloriesToLose: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fatGainGrams: number;
  scaleRetentionGrams: number;
  burnEquivalents: ExerciseBurnEquivalent[];
  recoveryPlanNote: string;
  compensated: boolean;
}
