import React, { useEffect, useMemo, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { EvolutionView } from './components/EvolutionView';
import { FoodAnalyzerView } from './components/FoodAnalyzerView';
import { LoginOnboarding } from './components/LoginOnboarding';
import { NutritionView } from './components/NutritionView';
import { RecommendedFoodsView } from './components/RecommendedFoodsView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WorkoutTableView } from './components/WorkoutTableView';
import {
  AppTab,
  DailyHabit,
  ExerciseItem,
  FitnessGoal,
  FoodAnalysisEntry,
  PlannedMeal,
  RecommendedFood,
  SplitId,
  UserProfile,
  WeightEntry,
  WorkoutEnvironment,
} from './types';
import {
  calculateBiometrics,
  generatePlannedMeals,
  generateWeightHistory,
  generateWorkoutPlan,
} from './utils/fitnessEngine';
import {
  analyzeFoodComment,
  calculateExerciseBurnEquivalents,
} from './utils/foodAnalyzer';

const STORAGE_KEY = 'apexfit_user_profile_v1';
const FOOD_ANALYSIS_KEY = 'apexfit_food_analysis_v1';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      return null;
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Derived biometric analysis from logged-in profile
  const analysis = useMemo(
    () => (profile ? calculateBiometrics(profile) : null),
    [profile]
  );

  const [workoutEnvironment, setWorkoutEnvironment] =
    useState<WorkoutEnvironment>('academia');
  const [showRestView, setShowRestView] = useState<boolean>(false);

  // Workout Plan state (regenerates automatically whenever goal, environment or biometric profile changes)
  const workoutPlan = useMemo(
    () =>
      profile
        ? generateWorkoutPlan(profile, profile.goal, workoutEnvironment)
        : null,
    [profile, workoutEnvironment]
  );

  const [activeSplitId, setActiveSplitId] = useState<SplitId>('A');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);

  useEffect(() => {
    if (workoutPlan) {
      setExercises(workoutPlan.exercises);
    }
  }, [workoutPlan]);

  // Meals & Hydration state
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [waterMl, setWaterMl] = useState<number>(1500);

  useEffect(() => {
    if (profile && analysis) {
      setMeals(generatePlannedMeals(profile, analysis));
      setWaterMl(Math.min(1750, Math.round(analysis.waterMl * 0.55)));
    }
  }, [profile, analysis]);

  // Weight History state
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  useEffect(() => {
    if (profile && analysis) {
      setWeightHistory(generateWeightHistory(profile, analysis));
    }
  }, [profile, analysis]);

  // Food Analysis history state
  const [foodAnalysisEntries, setFoodAnalysisEntries] = useState<FoodAnalysisEntry[]>(
    () => {
      try {
        const saved = window.localStorage.getItem(FOOD_ANALYSIS_KEY);
        if (saved) return JSON.parse(saved) as FoodAnalysisEntry[];
      } catch {
        // Ignore storage errors
      }
      return [];
    }
  );

  useEffect(() => {
    if (profile && foodAnalysisEntries.length === 0) {
      const demoEntry = analyzeFoodComment(
        'comi um hamburguer de queijo e bacon',
        profile
      );
      setFoodAnalysisEntries([demoEntry]);
    }
  }, [profile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FOOD_ANALYSIS_KEY,
        JSON.stringify(foodAnalysisEntries)
      );
    } catch {
      // Ignore storage errors
    }
  }, [foodAnalysisEntries]);

  const handleAddFoodAnalysis = (entry: FoodAnalysisEntry) => {
    setFoodAnalysisEntries((prev) => [entry, ...prev]);
  };

  const handleToggleFoodCompensated = (id: string) => {
    setFoodAnalysisEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, compensated: !e.compensated } : e
      )
    );
  };

  const handleRemoveFoodAnalysis = (id: string) => {
    setFoodAnalysisEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateFoodAnalysisKcal = (id: string, newKcal: number) => {
    if (!profile) return;
    setFoodAnalysisEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const burnEquivalents = calculateExerciseBurnEquivalents(
          newKcal,
          profile.weightKg
        );
        const fatGainGrams = Math.round(newKcal / 7.7);
        const scaleRetentionGrams = Math.round(
          fatGainGrams + e.carbsG * 2.5 + 80
        );
        const twoDaySplit = Math.round(newKcal / 2);
        return {
          ...e,
          totalKcal: newKcal,
          caloriesToLose: newKcal,
          fatGainGrams,
          scaleRetentionGrams,
          burnEquivalents,
          recoveryPlanNote: `Para voltar ao peso anterior (${profile.weightKg} kg), você precisa gastar ou reduzir ${newKcal} kcal — ex.: ${burnEquivalents[3].minutes} min de corrida leve hoje ou reduzir ${twoDaySplit} kcal/dia por 2 dias.`,
        };
      })
    );
  };

  // Daily habits
  const [habits, setHabits] = useState<DailyHabit[]>([
    {
      id: 'hab-1',
      title: 'Creatina Monohidratada 5g',
      subtitle: 'Suporte de força e ressíntese de ATP',
      completed: true,
    },
    {
      id: 'hab-2',
      title: 'Sono Reparador (7.5h – 8h)',
      subtitle: 'Recuperação neuromuscular e hormonal',
      completed: true,
    },
    {
      id: 'hab-3',
      title: 'Atingir Meta Diária de Água',
      subtitle: '35 ml por kg corporal',
      completed: false,
    },
    {
      id: 'hab-4',
      title: 'Mobilidade / Alongamento Pós-Treino',
      subtitle: '10 minutos após a sessão principal',
      completed: false,
    },
  ]);

  const handleCompleteLogin = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsEditingProfile(false);
    setActiveTab('dashboard');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleChangeGoal = (goal: FitnessGoal) => {
    if (!profile) return;
    const updated = { ...profile, goal };
    setProfile(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleLogout = () => {
    setIsEditingProfile(true);
  };

  const handleToggleSetDone = (exerciseId: string, setNum: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) =>
            s.setNum === setNum ? { ...s, done: !s.done } : s
          ),
        };
      })
    );
  };

  const handleUpdateSetField = (
    exerciseId: string,
    setNum: number,
    field: 'loadKg' | 'reps' | 'rpe',
    value: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) =>
            s.setNum === setNum ? { ...s, [field]: value } : s
          ),
        };
      })
    );
  };

  const handleResetWorkoutProgress = () => {
    if (!workoutPlan) return;
    setExercises(workoutPlan.exercises);
  };

  const handleToggleMeal = (mealId: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, confirmed: !m.confirmed } : m))
    );
  };

  const handleAddCustomMeal = (newMeal: Omit<PlannedMeal, 'id' | 'order'>) => {
    setMeals((prev) => [
      ...prev,
      {
        ...newMeal,
        id: `custom-${Date.now()}`,
        order: String(prev.length + 1).padStart(2, '0'),
      },
    ]);
  };

  const handleRemoveMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  const handleAddFoodToDay = (food: RecommendedFood) => {
    handleAddCustomMeal({
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: `${food.name} (${food.servingSize})`,
      description: food.benefit,
      kcal: food.kcal,
      proteinG: Math.round(food.proteinG),
      carbsG: Math.round(food.carbsG),
      fatG: Math.round(food.fatG),
      fiberG: Math.round(food.fiberG),
      tag: food.category,
      confirmed: true,
    });
  };

  const handleAddWater = (amountMl: number) => {
    setWaterMl((prev) => {
      const next = prev + amountMl;
      if (analysis && next >= analysis.waterMl) {
        setHabits((h) =>
          h.map((item) =>
            item.id === 'hab-3' ? { ...item, completed: true } : item
          )
        );
      }
      return next;
    });
  };

  const handleToggleHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId ? { ...h, completed: !h.completed } : h
      )
    );
  };

  const handleLogNewWeight = (newWeightKg: number, newWaistCm: number) => {
    if (!profile) return;
    const updated = { ...profile, weightKg: newWeightKg, waistCm: newWaistCm };
    setProfile(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  };

  // Show Login & Biometric Intake screen when not logged in or editing profile
  if (!profile || !analysis || !workoutPlan || isEditingProfile) {
    return (
      <LoginOnboarding
        initialProfile={profile}
        onCompleteLogin={handleCompleteLogin}
      />
    );
  }

  const todaySplit =
    workoutPlan.splits.find((s) => s.id === activeSplitId) ??
    workoutPlan.splits[0];
  const todayExercises = exercises.filter((e) => e.splitId === activeSplitId);
  const totalSets = todayExercises.reduce((acc, e) => acc + e.sets.length, 0);
  const completedSets = todayExercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.done).length,
    0
  );
  const workoutCompletionPct =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F0D] text-[#F1F5F3] flex">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profile={profile}
        analysis={analysis}
        workoutCompletionPct={workoutCompletionPct}
        onEditProfile={() => setIsEditingProfile(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          profile={profile}
          onChangeGoal={handleChangeGoal}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-7 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              analysis={analysis}
              waterMl={waterMl}
              onAddWater={handleAddWater}
              meals={meals}
              todaySplit={todaySplit}
              todayExercises={todayExercises}
              restRecovery={workoutPlan.restRecovery}
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onNavigateTab={(tab) => {
                if (tab === 'workouts') setShowRestView(false);
                setActiveTab(tab);
              }}
              onOpenRestPlan={() => {
                setShowRestView(true);
                setActiveTab('workouts');
              }}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutTableView
              plan={workoutPlan}
              activeGoal={profile.goal}
              onChangeGoal={handleChangeGoal}
              environment={workoutEnvironment}
              onChangeEnvironment={setWorkoutEnvironment}
              activeSplitId={activeSplitId}
              onSelectSplit={setActiveSplitId}
              showRestView={showRestView}
              onToggleRestView={setShowRestView}
              exercises={exercises}
              onToggleSetDone={handleToggleSetDone}
              onUpdateSetField={handleUpdateSetField}
              onResetWorkoutProgress={handleResetWorkoutProgress}
            />
          )}

          {activeTab === 'foods' && (
            <RecommendedFoodsView
              userProfile={profile}
              onAddFoodToDay={handleAddFoodToDay}
            />
          )}

          {activeTab === 'food_analyzer' && (
            <FoodAnalyzerView
              profile={profile}
              entries={foodAnalysisEntries}
              onAddEntry={handleAddFoodAnalysis}
              onToggleCompensated={handleToggleFoodCompensated}
              onRemoveEntry={handleRemoveFoodAnalysis}
              onUpdateEntryKcal={handleUpdateFoodAnalysisKcal}
            />
          )}

          {activeTab === 'nutrition' && (
            <NutritionView
              profile={profile}
              analysis={analysis}
              meals={meals}
              onToggleMeal={handleToggleMeal}
              onAddCustomMeal={handleAddCustomMeal}
              onRemoveMeal={handleRemoveMeal}
              waterMl={waterMl}
              onAddWater={handleAddWater}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'evolution' && (
            <EvolutionView
              profile={profile}
              analysis={analysis}
              history={weightHistory}
              onLogNewWeight={handleLogNewWeight}
            />
          )}
        </main>
      </div>
    </div>
  );
}
