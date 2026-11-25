'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { DashboardView } from './components/DashboardView';
import { EvolutionView } from './components/EvolutionView';
import { FoodAnalyzerView } from './components/FoodAnalyzerView';
import { LoginOnboarding } from './components/LoginOnboarding';
import { NutritionView } from './components/NutritionView';
import { RecommendedFoodsView } from './components/RecommendedFoodsView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WorkoutTableView } from './components/WorkoutTableView';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  clearWorkoutExerciseLogs,
  deleteDailyMeal,
  deleteFoodAnalysisEntry,
  fetchDailyMeals,
  fetchDailyWellness,
  fetchFoodAnalysisEntries,
  fetchUserProfile,
  fetchWeightEntries,
  fetchWorkoutExerciseLogs,
  insertWeightEntry,
  replaceDailyMeals,
  seedWeightEntries,
  upsertDailyMeal,
  upsertDailyWellness,
  upsertFoodAnalysisEntry,
  upsertUserProfile,
  upsertWorkoutExerciseLog,
} from './services/supabaseData';
import {
  AppTab,
  DailyHabit,
  DailySupplement,
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
import { calculateExerciseBurnEquivalents } from './utils/foodAnalyzer';

const DEFAULT_HABITS: DailyHabit[] = [
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
];

const DEFAULT_SUPPLEMENTS: DailySupplement[] = [
  { id: 'sup-1', name: 'Creatina Monohidratada', dose: '5g (Manhã)', done: true },
  { id: 'sup-2', name: 'Vitamina D3 + K2', dose: '2.000 UI', done: true },
  { id: 'sup-3', name: 'Magnésio Bisglicinato', dose: '350mg (21:30)', done: false },
];

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [syncWarning, setSyncWarning] = useState<string>('');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [workoutEnvironment, setWorkoutEnvironment] =
    useState<WorkoutEnvironment>('academia');
  const [showRestView, setShowRestView] = useState<boolean>(false);
  const [activeSplitId, setActiveSplitId] = useState<SplitId>('A');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);

  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [waterMl, setWaterMl] = useState<number>(0);
  const [habits, setHabits] = useState<DailyHabit[]>(DEFAULT_HABITS);
  const [supplements, setSupplements] = useState<DailySupplement[]>(DEFAULT_SUPPLEMENTS);
  const [completedRestIds, setCompletedRestIds] = useState<Record<string, boolean>>({});
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [foodAnalysisEntries, setFoodAnalysisEntries] = useState<
    FoodAnalysisEntry[]
  >([]);

  const analysis = useMemo(
    () => (profile ? calculateBiometrics(profile) : null),
    [profile]
  );

  const workoutPlan = useMemo(
    () =>
      profile
        ? generateWorkoutPlan(profile, profile.goal, workoutEnvironment)
        : null,
    [profile, workoutEnvironment]
  );

  const resetLocalSessionState = useCallback(() => {
    setProfile(null);
    setIsEditingProfile(false);
    setActiveTab('dashboard');
    setWorkoutEnvironment('academia');
    setActiveSplitId('A');
    setExercises([]);
    setMeals([]);
    setWaterMl(0);
    setHabits(DEFAULT_HABITS);
    setSupplements(DEFAULT_SUPPLEMENTS);
    setCompletedRestIds({});
    setWeightHistory([]);
    setFoodAnalysisEntries([]);
    setSyncWarning('');
  }, []);

  const hydrateUserFromSupabase = useCallback(async (user: User) => {
    setDataLoading(true);
    setSyncWarning('');
    try {
      let stored = await fetchUserProfile(user.id);

      // Se o usuário confirmou o e-mail após o cadastro, cria o perfil automaticamente a partir dos metadados
      if (!stored && user.user_metadata?.fitnessProfile) {
        const metaProfile = user.user_metadata.fitnessProfile as UserProfile;
        const normalizedProfile: UserProfile = {
          ...metaProfile,
          email: user.email ?? metaProfile.email,
        };
        await upsertUserProfile(user.id, normalizedProfile, 'academia', 'A');
        stored = {
          profile: normalizedProfile,
          workoutEnvironment: 'academia',
          activeSplitId: 'A',
        };
      }

      if (!stored) {
        setProfile(null);
        return;
      }

      const loadedProfile = stored.profile;
      const loadedEnv = stored.workoutEnvironment;
      const loadedSplit = stored.activeSplitId;
      const loadedAnalysis = calculateBiometrics(loadedProfile);

      setProfile(loadedProfile);
      setWorkoutEnvironment(loadedEnv);
      setActiveSplitId(loadedSplit);

      const [remoteMeals, remoteWellness, remoteWeights, remoteFoodLogs] =
        await Promise.all([
          fetchDailyMeals(user.id),
          fetchDailyWellness(user.id),
          fetchWeightEntries(user.id),
          fetchFoodAnalysisEntries(user.id),
        ]);

      if (remoteMeals.length > 0) {
        setMeals(remoteMeals);
      } else {
        const seededMeals = generatePlannedMeals(loadedProfile, loadedAnalysis);
        setMeals(seededMeals);
        await replaceDailyMeals(user.id, seededMeals);
      }

      if (remoteWellness) {
        setWaterMl(remoteWellness.waterMl);
        setHabits(
          remoteWellness.habits.length > 0
            ? remoteWellness.habits
            : DEFAULT_HABITS
        );
        setSupplements(
          remoteWellness.supplements.length > 0
            ? remoteWellness.supplements
            : DEFAULT_SUPPLEMENTS
        );
        setCompletedRestIds(remoteWellness.completedRestIds);
      } else {
        const initialWater = Math.min(
          1750,
          Math.round(loadedAnalysis.waterMl * 0.55)
        );
        setWaterMl(initialWater);
        setHabits(DEFAULT_HABITS);
        setSupplements(DEFAULT_SUPPLEMENTS);
        setCompletedRestIds({});
        await upsertDailyWellness(
          user.id,
          initialWater,
          DEFAULT_HABITS,
          DEFAULT_SUPPLEMENTS,
          {}
        );
      }

      if (remoteWeights.length > 0) {
        setWeightHistory(remoteWeights);
      } else {
        const seededWeights = generateWeightHistory(
          loadedProfile,
          loadedAnalysis
        );
        setWeightHistory(seededWeights);
        await seedWeightEntries(user.id, seededWeights, loadedProfile.waistCm);
      }

      setFoodAnalysisEntries(remoteFoodLogs);
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
      setSyncWarning(
        'Não foi possível sincronizar todos os dados com o Supabase. Verifique se o script supabase/schema.sql foi executado.'
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Autenticação inicial e listener do Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthChecking(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const user = session?.user ?? null;
        setAuthUser(user);
        setAuthChecking(false);
        if (user) {
          void hydrateUserFromSupabase(user);
        }
      })
      .catch(() => {
        if (mounted) setAuthChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setAuthUser(nextUser);

      if (event === 'SIGNED_OUT' || !nextUser) {
        resetLocalSessionState();
        return;
      }

      if (event === 'SIGNED_IN') {
        void hydrateUserFromSupabase(nextUser);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUserFromSupabase, resetLocalSessionState]);

  // Sincroniza a tabela de exercícios com os logs salvos no Supabase para o objetivo + ambiente ativo
  useEffect(() => {
    if (!workoutPlan) {
      setExercises([]);
      return;
    }

    if (!authUser) {
      setExercises(workoutPlan.exercises);
      return;
    }

    let cancelled = false;
    setExercises(workoutPlan.exercises);

    fetchWorkoutExerciseLogs(
      authUser.id,
      workoutPlan.goal,
      workoutPlan.environment
    )
      .then((logsMap) => {
        if (cancelled) return;
        setExercises(
          workoutPlan.exercises.map((ex) => {
            const savedSets = logsMap[ex.id];
            if (!savedSets || savedSets.length === 0) return ex;
            return { ...ex, sets: savedSets };
          })
        );
      })
      .catch((err) => {
        console.error('Erro ao carregar progresso de treino:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [authUser, workoutPlan]);

  const handleCompleteProfile = async (newProfile: UserProfile) => {
    let activeUser = authUser;
    if (!activeUser && supabase) {
      const { data } = await supabase.auth.getUser();
      activeUser = data.user;
      if (activeUser) setAuthUser(activeUser);
    }
    if (!activeUser) return;

    const normalizedProfile: UserProfile = {
      ...newProfile,
      email: activeUser.email ?? newProfile.email,
    };

    await upsertUserProfile(
      activeUser.id,
      normalizedProfile,
      workoutEnvironment,
      activeSplitId
    );

    const newAnalysis = calculateBiometrics(normalizedProfile);
    const isFirstProfileSetup = !profile;
    const goalOrWeightChanged =
      profile &&
      (profile.goal !== normalizedProfile.goal ||
        Math.abs(profile.weightKg - normalizedProfile.weightKg) >= 1);

    setProfile(normalizedProfile);
    setIsEditingProfile(false);
    setActiveTab('dashboard');

    if (isFirstProfileSetup) {
      const seededMeals = generatePlannedMeals(normalizedProfile, newAnalysis);
      const initialWater = Math.min(
        1750,
        Math.round(newAnalysis.waterMl * 0.55)
      );
      const seededWeights = generateWeightHistory(
        normalizedProfile,
        newAnalysis
      );

      setMeals(seededMeals);
      setWaterMl(initialWater);
      setHabits(DEFAULT_HABITS);
      setSupplements(DEFAULT_SUPPLEMENTS);
      setCompletedRestIds({});
      setWeightHistory(seededWeights);

      await Promise.all([
        replaceDailyMeals(activeUser.id, seededMeals),
        upsertDailyWellness(
          activeUser.id,
          initialWater,
          DEFAULT_HABITS,
          DEFAULT_SUPPLEMENTS,
          {}
        ),
        seedWeightEntries(
          activeUser.id,
          seededWeights,
          normalizedProfile.waistCm
        ),
      ]).catch((err) => {
        console.error('Erro ao inicializar registros no Supabase:', err);
      });
    } else if (goalOrWeightChanged) {
      const updatedMeals = generatePlannedMeals(normalizedProfile, newAnalysis);
      setMeals(updatedMeals);
      await replaceDailyMeals(activeUser.id, updatedMeals).catch((err) => {
        console.error('Erro ao atualizar refeições no Supabase:', err);
      });
    }
  };

  const handleChangeGoal = (goal: FitnessGoal) => {
    if (!profile || !authUser) return;
    const updated = { ...profile, goal };
    const updatedAnalysis = calculateBiometrics(updated);
    const updatedMeals = generatePlannedMeals(updated, updatedAnalysis);

    setProfile(updated);
    setMeals(updatedMeals);

    void upsertUserProfile(
      authUser.id,
      updated,
      workoutEnvironment,
      activeSplitId
    ).catch((err) => console.error('Erro ao atualizar objetivo:', err));

    void replaceDailyMeals(authUser.id, updatedMeals).catch((err) =>
      console.error('Erro ao atualizar refeições para o objetivo:', err)
    );
  };

  const handleChangeEnvironment = (env: WorkoutEnvironment) => {
    setWorkoutEnvironment(env);
    if (profile && authUser) {
      void upsertUserProfile(
        authUser.id,
        profile,
        env,
        activeSplitId
      ).catch((err) => console.error('Erro ao salvar ambiente:', err));
    }
  };

  const handleSelectSplit = (splitId: SplitId) => {
    setActiveSplitId(splitId);
    if (profile && authUser) {
      void upsertUserProfile(
        authUser.id,
        profile,
        workoutEnvironment,
        splitId
      ).catch((err) => console.error('Erro ao salvar ficha ativa:', err));
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    resetLocalSessionState();
    setAuthUser(null);
  };

  const handleToggleSetDone = (exerciseId: string, setNum: number) => {
    let updatedSets: ExerciseItem['sets'] | null = null;
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextSets = ex.sets.map((s) =>
          s.setNum === setNum ? { ...s, done: !s.done } : s
        );
        updatedSets = nextSets;
        return { ...ex, sets: nextSets };
      })
    );

    if (authUser && profile && updatedSets) {
      void upsertWorkoutExerciseLog(
        authUser.id,
        profile.goal,
        workoutEnvironment,
        exerciseId,
        updatedSets
      ).catch((err) => console.error('Erro ao salvar série:', err));
    }
  };

  const handleUpdateSetField = (
    exerciseId: string,
    setNum: number,
    field: 'loadKg' | 'reps' | 'rpe',
    value: number
  ) => {
    let updatedSets: ExerciseItem['sets'] | null = null;
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextSets = ex.sets.map((s) =>
          s.setNum === setNum ? { ...s, [field]: value } : s
        );
        updatedSets = nextSets;
        return { ...ex, sets: nextSets };
      })
    );

    if (authUser && profile && updatedSets) {
      void upsertWorkoutExerciseLog(
        authUser.id,
        profile.goal,
        workoutEnvironment,
        exerciseId,
        updatedSets
      ).catch((err) => console.error('Erro ao atualizar carga/reps:', err));
    }
  };

  const handleResetWorkoutProgress = () => {
    if (!workoutPlan) return;
    setExercises(workoutPlan.exercises);
    if (authUser && profile) {
      void clearWorkoutExerciseLogs(
        authUser.id,
        profile.goal,
        workoutEnvironment
      ).catch((err) => console.error('Erro ao reiniciar treino:', err));
    }
  };

  const handleToggleMeal = (mealId: string) => {
    let targetMeal: PlannedMeal | undefined;
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== mealId) return m;
        targetMeal = { ...m, confirmed: !m.confirmed };
        return targetMeal;
      })
    );
    if (authUser && targetMeal) {
      void upsertDailyMeal(authUser.id, targetMeal).catch((err) =>
        console.error('Erro ao atualizar refeição:', err)
      );
    }
  };

  const handleAddCustomMeal = (newMeal: Omit<PlannedMeal, 'id' | 'order'>) => {
    const created: PlannedMeal = {
      ...newMeal,
      id: `custom-${Date.now()}`,
      order: String(meals.length + 1).padStart(2, '0'),
    };
    setMeals((prev) => [...prev, created]);
    if (authUser) {
      void upsertDailyMeal(authUser.id, created).catch((err) =>
        console.error('Erro ao salvar nova refeição:', err)
      );
    }
  };

  const handleRemoveMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
    if (authUser) {
      void deleteDailyMeal(authUser.id, mealId).catch((err) =>
        console.error('Erro ao remover refeição:', err)
      );
    }
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
    const nextWater = waterMl + amountMl;
    let nextHabits = habits;
    if (analysis && nextWater >= analysis.waterMl) {
      nextHabits = habits.map((item) =>
        item.id === 'hab-3' ? { ...item, completed: true } : item
      );
      setHabits(nextHabits);
    }
    setWaterMl(nextWater);

    if (authUser) {
      void upsertDailyWellness(
        authUser.id,
        nextWater,
        nextHabits,
        supplements,
        completedRestIds
      ).catch((err) => console.error('Erro ao salvar hidratação:', err));
    }
  };

  const handleToggleHabit = (habitId: string) => {
    const nextHabits = habits.map((h) =>
      h.id === habitId ? { ...h, completed: !h.completed } : h
    );
    setHabits(nextHabits);

    if (authUser) {
      void upsertDailyWellness(
        authUser.id,
        waterMl,
        nextHabits,
        supplements,
        completedRestIds
      ).catch((err) => console.error('Erro ao salvar hábito:', err));
    }
  };

  const handleToggleSupplement = (supplementId: string) => {
    const nextSupplements = supplements.map((s) =>
      s.id === supplementId ? { ...s, done: !s.done } : s
    );
    setSupplements(nextSupplements);

    if (authUser) {
      void upsertDailyWellness(
        authUser.id,
        waterMl,
        habits,
        nextSupplements,
        completedRestIds
      ).catch((err) => console.error('Erro ao salvar suplemento:', err));
    }
  };

  const handleToggleRestActivity = (activityId: string) => {
    const nextRest = {
      ...completedRestIds,
      [activityId]: !completedRestIds[activityId],
    };
    setCompletedRestIds(nextRest);

    if (authUser) {
      void upsertDailyWellness(
        authUser.id,
        waterMl,
        habits,
        supplements,
        nextRest
      ).catch((err) =>
        console.error('Erro ao salvar atividade de descanso:', err)
      );
    }
  };

  const handleLogNewWeight = (newWeightKg: number, newWaistCm: number) => {
    if (!profile || !authUser) return;
    const updated = { ...profile, weightKg: newWeightKg, waistCm: newWaistCm };
    const updatedAnalysis = calculateBiometrics(updated);
    const totalVolume = exercises.reduce(
      (sum, ex) =>
        sum +
        ex.sets
          .filter((s) => s.done)
          .reduce((acc, s) => acc + s.loadKg * s.reps, 0),
      0
    );
    const entry: WeightEntry = {
      label: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      weightKg: newWeightKg,
      volumeKg: totalVolume || Math.round(newWeightKg * 420),
      bfPercent: updatedAnalysis.estimatedBfPercent,
    };

    setProfile(updated);
    setWeightHistory((prev) => [...prev, entry]);

    void upsertUserProfile(
      authUser.id,
      updated,
      workoutEnvironment,
      activeSplitId
    ).catch((err) => console.error('Erro ao atualizar peso no perfil:', err));

    void insertWeightEntry(authUser.id, entry, newWaistCm).catch((err) =>
      console.error('Erro ao registrar histórico de peso:', err)
    );
  };

  const handleAddFoodAnalysis = (entry: FoodAnalysisEntry) => {
    setFoodAnalysisEntries((prev) => [entry, ...prev]);
    if (authUser) {
      void upsertFoodAnalysisEntry(authUser.id, entry).catch((err) =>
        console.error('Erro ao salvar análise de alimento:', err)
      );
    }
  };

  const handleToggleFoodCompensated = (id: string) => {
    let updatedEntry: FoodAnalysisEntry | undefined;
    setFoodAnalysisEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        updatedEntry = { ...e, compensated: !e.compensated };
        return updatedEntry;
      })
    );
    if (authUser && updatedEntry) {
      void upsertFoodAnalysisEntry(authUser.id, updatedEntry).catch((err) =>
        console.error('Erro ao atualizar compensação:', err)
      );
    }
  };

  const handleRemoveFoodAnalysis = (id: string) => {
    setFoodAnalysisEntries((prev) => prev.filter((e) => e.id !== id));
    if (authUser) {
      void deleteFoodAnalysisEntry(authUser.id, id).catch((err) =>
        console.error('Erro ao remover análise:', err)
      );
    }
  };

  const handleUpdateFoodAnalysisKcal = (id: string, newKcal: number) => {
    if (!profile) return;
    let updatedEntry: FoodAnalysisEntry | undefined;
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
        updatedEntry = {
          ...e,
          totalKcal: newKcal,
          caloriesToLose: newKcal,
          fatGainGrams,
          scaleRetentionGrams,
          burnEquivalents,
          recoveryPlanNote: `Para voltar ao peso anterior (${profile.weightKg} kg), você precisa gastar ou reduzir ${newKcal} kcal — ex.: ${burnEquivalents[3].minutes} min de corrida leve hoje ou reduzir ${twoDaySplit} kcal/dia por 2 dias.`,
        };
        return updatedEntry;
      })
    );
    if (authUser && updatedEntry) {
      void upsertFoodAnalysisEntry(authUser.id, updatedEntry).catch((err) =>
        console.error('Erro ao atualizar calorias da análise:', err)
      );
    }
  };

  if (authChecking || dataLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F0D] text-[#F1F5F3] flex flex-col items-center justify-center gap-4 px-4">
        <img
          src="/assets/aistudio/Gemini_Generated_Image_ouqeatouqeatouqe_e431381e.jpg"
          alt="Brutal Performance"
          className="w-20 h-14 rounded-xl object-cover border border-white/10"
        />
        <div className="flex items-center gap-2.5 text-sm text-[#A9B5AE]">
          <Loader2 className="w-4 h-4 text-[#A3E635] animate-spin" />
          <span>
            {authChecking
              ? 'Verificando sua sessão...'
              : 'Carregando seus dados do Supabase...'}
          </span>
        </div>
      </div>
    );
  }

  // Tela de Login/Cadastro por E-mail ou Edição/Conclusão de Perfil
  if (!authUser || !profile || !analysis || !workoutPlan || isEditingProfile) {
    return (
      <LoginOnboarding
        authenticatedUserId={authUser?.id ?? null}
        authenticatedEmail={authUser?.email ?? null}
        initialProfile={profile}
        isEditingProfile={isEditingProfile}
        onCompleteProfile={handleCompleteProfile}
        onCancelEdit={() => setIsEditingProfile(false)}
        onSignOut={handleLogout}
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

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-7 max-w-[1440px] w-full mx-auto space-y-4">
          {syncWarning && (
            <div
              role="alert"
              className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-200 flex items-center justify-between gap-3"
            >
              <span>{syncWarning}</span>
              <button
                type="button"
                onClick={() => setSyncWarning('')}
                className="text-amber-100 underline shrink-0 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}

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
              onChangeEnvironment={handleChangeEnvironment}
              activeSplitId={activeSplitId}
              onSelectSplit={handleSelectSplit}
              showRestView={showRestView}
              onToggleRestView={setShowRestView}
              exercises={exercises}
              onToggleSetDone={handleToggleSetDone}
              onUpdateSetField={handleUpdateSetField}
              onResetWorkoutProgress={handleResetWorkoutProgress}
              completedRestIds={completedRestIds}
              onToggleRestActivity={handleToggleRestActivity}
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
              supplements={supplements}
              onToggleSupplement={handleToggleSupplement}
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
