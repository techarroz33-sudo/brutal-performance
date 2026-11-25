import { supabase } from '../lib/supabase';
import {
  ActivityLevel,
  DailyHabit,
  DailySupplement,
  ExerciseBurnEquivalent,
  ExerciseSetLog,
  ExperienceLevel,
  FitnessGoal,
  FoodAnalysisEntry,
  FoodAnalysisItem,
  PlannedMeal,
  Sex,
  SplitId,
  UserProfile,
  WeightEntry,
  WorkoutEnvironment,
} from '../types';

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface StoredProfileRecord {
  profile: UserProfile;
  workoutEnvironment: WorkoutEnvironment;
  activeSplitId: SplitId;
}

export async function fetchUserProfile(
  userId: string
): Promise<StoredProfileRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    profile: {
      name: String(data.name),
      email: String(data.email),
      age: Number(data.age),
      sex: data.sex as Sex,
      weightKg: Number(data.weight_kg),
      heightCm: Number(data.height_cm),
      waistCm: Number(data.waist_cm),
      goal: data.goal as FitnessGoal,
      activityLevel: data.activity_level as ActivityLevel,
      experience: data.experience as ExperienceLevel,
      daysPerWeek: Number(data.days_per_week),
    },
    workoutEnvironment:
      data.workout_environment === 'casa' ? 'casa' : 'academia',
    activeSplitId: (['A', 'B', 'C', 'D', 'E'].includes(data.active_split_id)
      ? data.active_split_id
      : 'A') as SplitId,
  };
}

export async function upsertUserProfile(
  userId: string,
  profile: UserProfile,
  workoutEnvironment: WorkoutEnvironment,
  activeSplitId: SplitId
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: userId,
      name: profile.name.trim(),
      email: profile.email.trim(),
      age: Math.min(95, Math.max(14, Math.round(profile.age))),
      sex: profile.sex,
      weight_kg: Math.min(250, Math.max(35, Number(profile.weightKg))),
      height_cm: Math.min(230, Math.max(120, Math.round(profile.heightCm))),
      waist_cm: Math.min(180, Math.max(50, Math.round(profile.waistCm))),
      goal: profile.goal,
      activity_level: profile.activityLevel,
      experience: profile.experience,
      days_per_week: Math.min(7, Math.max(1, Math.round(profile.daysPerWeek))),
      workout_environment: workoutEnvironment,
      active_split_id: activeSplitId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export async function fetchWorkoutExerciseLogs(
  userId: string,
  goal: FitnessGoal,
  environment: WorkoutEnvironment
): Promise<Record<string, ExerciseSetLog[]>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('workout_exercise_logs')
    .select('exercise_id, sets')
    .eq('user_id', userId)
    .eq('goal', goal)
    .eq('environment', environment);

  if (error) throw error;
  const map: Record<string, ExerciseSetLog[]> = {};
  for (const row of data ?? []) {
    if (Array.isArray(row.sets)) {
      map[String(row.exercise_id)] = row.sets as ExerciseSetLog[];
    }
  }
  return map;
}

export async function upsertWorkoutExerciseLog(
  userId: string,
  goal: FitnessGoal,
  environment: WorkoutEnvironment,
  exerciseId: string,
  sets: ExerciseSetLog[]
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('workout_exercise_logs').upsert(
    {
      user_id: userId,
      goal,
      environment,
      exercise_id: exerciseId,
      sets,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,goal,environment,exercise_id' }
  );
  if (error) throw error;
}

export async function clearWorkoutExerciseLogs(
  userId: string,
  goal: FitnessGoal,
  environment: WorkoutEnvironment
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('workout_exercise_logs')
    .delete()
    .eq('user_id', userId)
    .eq('goal', goal)
    .eq('environment', environment);
  if (error) throw error;
}

export async function fetchDailyMeals(
  userId: string,
  mealDate = getTodayIsoDate()
): Promise<PlannedMeal[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('daily_meals')
    .select('*')
    .eq('user_id', userId)
    .eq('meal_date', mealDate)
    .order('meal_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    order: String(row.meal_order),
    time: String(row.time),
    title: String(row.title),
    description: String(row.description),
    kcal: Number(row.kcal),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    fiberG: Number(row.fiber_g),
    tag: String(row.tag),
    confirmed: Boolean(row.confirmed),
  }));
}

export async function upsertDailyMeal(
  userId: string,
  meal: PlannedMeal,
  mealDate = getTodayIsoDate()
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('daily_meals').upsert(
    {
      id: meal.id,
      user_id: userId,
      meal_date: mealDate,
      meal_order: meal.order,
      time: meal.time,
      title: meal.title,
      description: meal.description,
      kcal: Math.round(meal.kcal),
      protein_g: Math.round(meal.proteinG),
      carbs_g: Math.round(meal.carbsG),
      fat_g: Math.round(meal.fatG),
      fiber_g: Math.round(meal.fiberG),
      tag: meal.tag,
      confirmed: meal.confirmed,
    },
    { onConflict: 'user_id,meal_date,id' }
  );
  if (error) throw error;
}

export async function replaceDailyMeals(
  userId: string,
  meals: PlannedMeal[],
  mealDate = getTodayIsoDate()
): Promise<void> {
  if (!supabase) return;
  const { error: delError } = await supabase
    .from('daily_meals')
    .delete()
    .eq('user_id', userId)
    .eq('meal_date', mealDate);
  if (delError) throw delError;

  if (meals.length === 0) return;
  const rows = meals.map((meal) => ({
    id: meal.id,
    user_id: userId,
    meal_date: mealDate,
    meal_order: meal.order,
    time: meal.time,
    title: meal.title,
    description: meal.description,
    kcal: Math.round(meal.kcal),
    protein_g: Math.round(meal.proteinG),
    carbs_g: Math.round(meal.carbsG),
    fat_g: Math.round(meal.fatG),
    fiber_g: Math.round(meal.fiberG),
    tag: meal.tag,
    confirmed: meal.confirmed,
  }));
  const { error: insError } = await supabase.from('daily_meals').insert(rows);
  if (insError) throw insError;
}

export async function deleteDailyMeal(
  userId: string,
  mealId: string,
  mealDate = getTodayIsoDate()
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('daily_meals')
    .delete()
    .eq('user_id', userId)
    .eq('meal_date', mealDate)
    .eq('id', mealId);
  if (error) throw error;
}

export async function fetchDailyWellness(
  userId: string,
  logDate = getTodayIsoDate()
): Promise<{
  waterMl: number;
  habits: DailyHabit[];
  supplements: DailySupplement[];
  completedRestIds: Record<string, boolean>;
} | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('daily_wellness_logs')
    .select('water_ml, habits, supplements, rest_activity_ids')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const restList = Array.isArray(data.rest_activity_ids)
    ? (data.rest_activity_ids as string[])
    : [];
  const completedRestIds: Record<string, boolean> = {};
  for (const id of restList) {
    completedRestIds[String(id)] = true;
  }

  return {
    waterMl: Number(data.water_ml),
    habits: Array.isArray(data.habits) ? (data.habits as DailyHabit[]) : [],
    supplements: Array.isArray(data.supplements)
      ? (data.supplements as DailySupplement[])
      : [],
    completedRestIds,
  };
}

export async function upsertDailyWellness(
  userId: string,
  waterMl: number,
  habits: DailyHabit[],
  supplements: DailySupplement[],
  completedRestIds: Record<string, boolean>,
  logDate = getTodayIsoDate()
): Promise<void> {
  if (!supabase) return;
  const restActivityIds = Object.keys(completedRestIds).filter(
    (id) => completedRestIds[id]
  );
  const { error } = await supabase.from('daily_wellness_logs').upsert(
    {
      user_id: userId,
      log_date: logDate,
      water_ml: Math.max(0, Math.round(waterMl)),
      habits,
      supplements,
      rest_activity_ids: restActivityIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,log_date' }
  );
  if (error) throw error;
}

export async function fetchWeightEntries(
  userId: string
): Promise<WeightEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('weight_entries')
    .select('label, weight_kg, volume_kg, bf_percent')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    label: String(row.label),
    weightKg: Number(row.weight_kg),
    volumeKg: Number(row.volume_kg),
    bfPercent: Number(row.bf_percent),
  }));
}

export async function seedWeightEntries(
  userId: string,
  entries: WeightEntry[],
  waistCm: number
): Promise<void> {
  if (!supabase || entries.length === 0) return;
  const baseTime = Date.now() - entries.length * 7 * 24 * 60 * 60 * 1000;
  const rows = entries.map((e, idx) => ({
    user_id: userId,
    label: e.label,
    weight_kg: e.weightKg,
    waist_cm: waistCm,
    volume_kg: e.volumeKg,
    bf_percent: e.bfPercent,
    recorded_at: new Date(
      baseTime + idx * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
  const { error } = await supabase.from('weight_entries').insert(rows);
  if (error) throw error;
}

export async function insertWeightEntry(
  userId: string,
  entry: WeightEntry,
  waistCm: number
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('weight_entries').insert({
    user_id: userId,
    label: entry.label,
    weight_kg: entry.weightKg,
    waist_cm: waistCm,
    volume_kg: entry.volumeKg,
    bf_percent: entry.bfPercent,
    recorded_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchFoodAnalysisEntries(
  userId: string
): Promise<FoodAnalysisEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('food_analysis_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    comment: String(row.comment),
    createdAt: String(row.created_at),
    items: (Array.isArray(row.items) ? row.items : []) as FoodAnalysisItem[],
    totalKcal: Number(row.total_kcal),
    caloriesToLose: Number(row.calories_to_lose),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    fatGainGrams: Number(row.fat_gain_grams),
    scaleRetentionGrams: Number(row.scale_retention_grams),
    burnEquivalents: (Array.isArray(row.burn_equivalents)
      ? row.burn_equivalents
      : []) as ExerciseBurnEquivalent[],
    recoveryPlanNote: String(row.recovery_plan_note),
    compensated: Boolean(row.compensated),
  }));
}

export async function upsertFoodAnalysisEntry(
  userId: string,
  entry: FoodAnalysisEntry
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('food_analysis_entries').upsert(
    {
      id: entry.id,
      user_id: userId,
      comment: entry.comment,
      items: entry.items,
      total_kcal: Math.round(entry.totalKcal),
      calories_to_lose: Math.round(entry.caloriesToLose),
      protein_g: Math.round(entry.proteinG),
      carbs_g: Math.round(entry.carbsG),
      fat_g: Math.round(entry.fatG),
      fat_gain_grams: Math.round(entry.fatGainGrams),
      scale_retention_grams: Math.round(entry.scaleRetentionGrams),
      burn_equivalents: entry.burnEquivalents,
      recovery_plan_note: entry.recoveryPlanNote,
      compensated: entry.compensated,
      created_at: entry.createdAt,
    },
    { onConflict: 'user_id,id' }
  );
  if (error) throw error;
}

export async function deleteFoodAnalysisEntry(
  userId: string,
  id: string
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('food_analysis_entries')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
