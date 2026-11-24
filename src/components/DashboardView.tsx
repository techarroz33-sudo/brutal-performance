import React from 'react';
import {
  Activity,
  ArrowRight,
  Calculator,
  Check,
  Droplets,
  Dumbbell,
  Flame,
  Moon,
  Plus,
  Scale,
  Utensils,
} from 'lucide-react';
import {
  AppTab,
  BiometricAnalysis,
  DailyHabit,
  ExerciseItem,
  PlannedMeal,
  RestRecoveryPlan,
  UserProfile,
  WorkoutSplitMeta,
} from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface DashboardViewProps {
  profile: UserProfile;
  analysis: BiometricAnalysis;
  waterMl: number;
  onAddWater: (amountMl: number) => void;
  meals: PlannedMeal[];
  todaySplit: WorkoutSplitMeta;
  todayExercises: ExerciseItem[];
  restRecovery: RestRecoveryPlan;
  habits: DailyHabit[];
  onToggleHabit: (habitId: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onOpenRestPlan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  analysis,
  waterMl,
  onAddWater,
  meals,
  todaySplit,
  todayExercises,
  restRecovery,
  habits,
  onToggleHabit,
  onNavigateTab,
  onOpenRestPlan,
}) => {
  const firstName = profile.name.split(' ')[0];

  const consumedKcal = meals
    .filter((m) => m.confirmed)
    .reduce((acc, m) => acc + m.kcal, 0);
  const consumedProtein = meals
    .filter((m) => m.confirmed)
    .reduce((acc, m) => acc + m.proteinG, 0);
  const consumedCarbs = meals
    .filter((m) => m.confirmed)
    .reduce((acc, m) => acc + m.carbsG, 0);
  const consumedFat = meals
    .filter((m) => m.confirmed)
    .reduce((acc, m) => acc + m.fatG, 0);

  const kcalRemaining = Math.max(0, analysis.targetCalories - consumedKcal);
  const kcalPct = Math.min(100, Math.round((consumedKcal / analysis.targetCalories) * 100));
  const proteinPct = Math.min(100, Math.round((consumedProtein / analysis.proteinGrams) * 100));
  const carbsPct = Math.min(100, Math.round((consumedCarbs / analysis.carbsGrams) * 100));
  const fatPct = Math.min(100, Math.round((consumedFat / analysis.fatGrams) * 100));
  const waterPct = Math.min(100, Math.round((waterMl / analysis.waterMl) * 100));

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (kcalPct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Clean Hero Banner */}
      <section className="apex-hero-glow p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs font-semibold text-[#A3E635]">
            {GOAL_LABELS[profile.goal]} · {profile.daysPerWeek} dias/semana
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Olá, {firstName}! Tudo pronto para hoje.
          </h2>
          <p className="text-sm text-[#A9B5AE] leading-relaxed">
            {analysis.metabolicDiagnostic}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onAddWater(250)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161F1B] hover:bg-[#1E2A24] border border-white/10 text-xs font-semibold text-white cursor-pointer"
          >
            <Droplets className="w-4 h-4 text-[#14B8A6]" />
            <span>+ 250ml Água</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('food_analyzer')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161F1B] hover:bg-[#1E2A24] border border-white/10 text-xs font-semibold text-white cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-[#FB923C]" />
            <span>Analisar Alimento</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('foods')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161F1B] hover:bg-[#1E2A24] border border-white/10 text-xs font-semibold text-white cursor-pointer"
          >
            <Utensils className="w-4 h-4 text-[#A3E635]" />
            <span>Ver Alimentos</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('workouts')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold cursor-pointer"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Abrir Treino</span>
          </button>
        </div>
      </section>

      {/* 4 Clear Biometric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apex-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>Seu IMC</span>
            <Scale className="w-4 h-4 text-[#A3E635]" />
          </div>
          <div className="font-display text-2xl font-bold text-white tabular-nums">
            {analysis.bmi}
          </div>
          <div className="text-xs text-[#22C55E]">{analysis.bmiCategory}</div>
        </div>

        <div className="apex-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>Meta de Calorias</span>
            <Flame className="w-4 h-4 text-[#FB923C]" />
          </div>
          <div className="font-display text-2xl font-bold text-white tabular-nums">
            {analysis.targetCalories.toLocaleString('pt-BR')}{' '}
            <span className="text-xs font-normal text-[#8C9992]">kcal</span>
          </div>
          <div className="text-xs text-[#9CA9A2]">TMB: {analysis.tmb} kcal</div>
        </div>

        <div className="apex-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>Gordura Est.</span>
            <Activity className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="font-display text-2xl font-bold text-white tabular-nums">
            {analysis.estimatedBfPercent}%
          </div>
          <div className="text-xs text-[#A3E635]">
            Massa magra: {analysis.leanMassKg} kg
          </div>
        </div>

        <div className="apex-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>Água Hoje</span>
            <Droplets className="w-4 h-4 text-[#14B8A6]" />
          </div>
          <div className="font-display text-2xl font-bold text-white tabular-nums">
            {(waterMl / 1000).toFixed(2)}L{' '}
            <span className="text-xs font-normal text-[#8C9992]">
              / {(analysis.waterMl / 1000).toFixed(1)}L
            </span>
          </div>
          <div className="text-xs text-[#14B8A6]">{waterPct}% da meta</div>
        </div>
      </section>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Today's Workout + Rest-Day Card + Habits */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Workout Shortcut */}
          <div className="apex-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A3E635]">
                TREINO SUGERIDO · {todaySplit.shortTitle}
              </span>
              <span className="text-xs text-[#8C9992]">
                {todayExercises.length} exercícios · ~{todaySplit.estimatedMinutes} min
              </span>
            </div>

            <div>
              <h3 className="font-display text-xl font-bold text-white">
                {todaySplit.fullTitle}
              </h3>
              <p className="text-xs text-[#9CA9A2] mt-1">{todaySplit.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/8">
              <div className="text-xs text-[#C8D3CD]">
                Primeiro exercício:{' '}
                <strong className="text-white">{todayExercises[0]?.name}</strong>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('workouts')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold cursor-pointer"
              >
                <span>Ver Todas as Fichas (A–E)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rest-Day Recommendation Shortcut */}
          <div className="apex-card p-6 space-y-3 border-[#14B8A6]/25">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#14B8A6]">
                <Moon className="w-4 h-4" />
                <span>ATIVIDADE PARA DIAS DE DESCANSO</span>
              </div>
              <button
                type="button"
                onClick={onOpenRestPlan}
                className="text-xs font-semibold text-[#14B8A6] hover:underline cursor-pointer"
              >
                Ver todas as atividades →
              </button>
            </div>

            <h3 className="font-display text-lg font-bold text-white">
              {restRecovery.headline}
            </h3>
            <p className="text-xs text-[#9CA9A2]">
              Recomendação principal:{' '}
              <strong className="text-white">
                {restRecovery.activities[0]?.title} ({restRecovery.activities[0]?.duration})
              </strong>{' '}
              — {restRecovery.activities[0]?.benefit}
            </p>
          </div>

          {/* Simple Daily Checklist */}
          <div className="apex-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-white">
                Hábitos de Hoje
              </h3>
              <span className="text-xs font-mono text-[#A3E635] tabular-nums">
                {habits.filter((h) => h.completed).length}/{habits.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => onToggleHabit(habit.id)}
                  className={`text-left p-3 rounded-xl border transition-colors flex items-center gap-3 cursor-pointer ${
                    habit.completed
                      ? 'bg-[#17211C] border-[#22C55E]/35 text-white'
                      : 'bg-[#18201C] border-white/6 text-[#9CA9A2] hover:border-white/20'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      habit.completed
                        ? 'bg-[#A3E635] border-[#A3E635] text-[#0A0F0D]'
                        : 'border-white/20 bg-[#101513]'
                    }`}
                  >
                    {habit.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </span>
                  <span
                    className={`text-xs font-semibold truncate ${
                      habit.completed ? 'line-through text-[#9CA9A2]' : 'text-white'
                    }`}
                  >
                    {habit.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Caloric Balance & Macros */}
        <div className="lg:col-span-5 space-y-6">
          <div className="apex-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">
                Resumo Alimentar de Hoje
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('nutrition')}
                className="text-xs font-semibold text-[#A3E635] hover:underline cursor-pointer"
              >
                Abrir diário →
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#1D2621"
                    strokeWidth="10"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#A3E635"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-xl font-extrabold text-white tabular-nums">
                    {kcalRemaining}
                  </span>
                  <span className="text-[10px] text-[#8C9992]">RESTAM</span>
                </div>
              </div>

              <div className="space-y-2 text-xs flex-1 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#8C9992]">Consumidas</span>
                  <span className="font-mono font-bold text-white">{consumedKcal} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C9992]">Meta diária</span>
                  <span className="font-mono font-bold text-[#A3E635]">
                    {analysis.targetCalories} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C9992]">Gasto estimado</span>
                  <span className="font-mono text-[#C8D3CD]">{analysis.get} kcal</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/8">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#C8D3CD]">Proteínas</span>
                  <span className="font-mono text-[#A3E635] tabular-nums">
                    {consumedProtein}g / {analysis.proteinGrams}g
                  </span>
                </div>
                <div className="h-1.5 bg-[#1B241F] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A3E635] rounded-full"
                    style={{ width: `${proteinPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#C8D3CD]">Carboidratos</span>
                  <span className="font-mono text-[#14B8A6] tabular-nums">
                    {consumedCarbs}g / {analysis.carbsGrams}g
                  </span>
                </div>
                <div className="h-1.5 bg-[#1B241F] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#14B8A6] rounded-full"
                    style={{ width: `${carbsPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#C8D3CD]">Gorduras Boas</span>
                  <span className="font-mono text-[#FB923C] tabular-nums">
                    {consumedFat}g / {analysis.fatGrams}g
                  </span>
                </div>
                <div className="h-1.5 bg-[#1B241F] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FB923C] rounded-full"
                    style={{ width: `${fatPct}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddWater(250)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#182420] hover:bg-[#1F302A] border border-[#14B8A6]/35 text-xs font-semibold text-[#14B8A6] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar +250ml de Água</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
