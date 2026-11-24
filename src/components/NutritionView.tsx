import React, { useState } from 'react';
import {
  Apple,
  Check,
  Droplets,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react';
import {
  AppTab,
  BiometricAnalysis,
  PlannedMeal,
  UserProfile,
} from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface NutritionViewProps {
  profile: UserProfile;
  analysis: BiometricAnalysis;
  meals: PlannedMeal[];
  onToggleMeal: (mealId: string) => void;
  onAddCustomMeal: (meal: Omit<PlannedMeal, 'id' | 'order'>) => void;
  onRemoveMeal: (mealId: string) => void;
  waterMl: number;
  onAddWater: (amountMl: number) => void;
  onNavigateTab: (tab: AppTab) => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
  analysis,
  meals,
  onToggleMeal,
  onAddCustomMeal,
  onRemoveMeal,
  waterMl,
  onAddWater,
  onNavigateTab,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [kcal, setKcal] = useState(320);
  const [proteinG, setProteinG] = useState(28);
  const [carbsG, setCarbsG] = useState(32);
  const [fatG, setFatG] = useState(8);

  const [supplements, setSupplements] = useState([
    { id: 'sup-1', name: 'Creatina Monohidratada', dose: '5g (Manhã)', done: true },
    { id: 'sup-2', name: 'Vitamina D3 + K2', dose: '2.000 UI', done: true },
    { id: 'sup-3', name: 'Magnésio Bisglicinato', dose: '350mg (21:30)', done: false },
  ]);

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
  const consumedFiber = meals
    .filter((m) => m.confirmed)
    .reduce((acc, m) => acc + m.fiberG, 0);

  const kcalRemaining = Math.max(0, analysis.targetCalories - consumedKcal);
  const kcalPct = Math.min(100, Math.round((consumedKcal / analysis.targetCalories) * 100));
  const proteinPct = Math.min(100, Math.round((consumedProtein / analysis.proteinGrams) * 100));
  const carbsPct = Math.min(100, Math.round((consumedCarbs / analysis.carbsGrams) * 100));
  const fatPct = Math.min(100, Math.round((consumedFat / analysis.fatGrams) * 100));

  const waterCupsTarget = Math.max(8, Math.ceil(analysis.waterMl / 250));
  const waterCupsFilled = Math.min(waterCupsTarget, Math.floor(waterMl / 250));
  const waterPct = Math.min(100, Math.round((waterMl / analysis.waterMl) * 100));

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (kcalPct / 100) * circumference;

  const handleCreateMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCustomMeal({
      time,
      title: title.trim(),
      description: 'Refeição personalizada registrada no diário nutricional.',
      kcal: Math.max(0, kcal),
      proteinG: Math.max(0, proteinG),
      carbsG: Math.max(0, carbsG),
      fatG: Math.max(0, fatG),
      fiberG: 4,
      tag: 'Registro Manual',
      confirmed: true,
    });
    setTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#A3E635] font-semibold uppercase tracking-wider">
            Protocolo {GOAL_LABELS[profile.goal]}
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Diário Nutricional &amp; Metas de Macro
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('foods')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18201C] hover:bg-[#1F2A24] border border-white/10 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Apple className="w-4 h-4 text-[#A3E635]" />
            <span>Tabela de Alimentos por Perfil</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Refeição</span>
          </button>
        </div>
      </div>

      {/* Inline Custom Meal Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateMeal}
          className="apex-card p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
        >
          <label className="sm:col-span-2 block space-y-1">
            <span className="text-xs text-[#9CA9A2]">Nome da refeição</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Shake pós-treino com banana"
              className="w-full h-9 px-3 rounded-lg bg-[#0E1310] border border-white/10 text-xs text-white focus:outline-none focus:border-[#A3E635]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-[#9CA9A2]">Horário</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-[#0E1310] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#A3E635]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-[#9CA9A2]">Kcal</span>
            <input
              type="number"
              min={0}
              value={kcal}
              onChange={(e) => setKcal(Number(e.target.value) || 0)}
              className="w-full h-9 px-2.5 rounded-lg bg-[#0E1310] border border-white/10 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
            />
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <label className="block space-y-1">
              <span className="text-[10px] text-[#A3E635]">Prot(g)</span>
              <input
                type="number"
                min={0}
                value={proteinG}
                onChange={(e) => setProteinG(Number(e.target.value) || 0)}
                className="w-full h-9 px-2 rounded-lg bg-[#0E1310] border border-white/10 text-xs text-white font-mono tabular-nums"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-[#14B8A6]">Carb(g)</span>
              <input
                type="number"
                min={0}
                value={carbsG}
                onChange={(e) => setCarbsG(Number(e.target.value) || 0)}
                className="w-full h-9 px-2 rounded-lg bg-[#0E1310] border border-white/10 text-xs text-white font-mono tabular-nums"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] text-[#FB923C]">Gord(g)</span>
              <input
                type="number"
                min={0}
                value={fatG}
                onChange={(e) => setFatG(Number(e.target.value) || 0)}
                className="w-full h-9 px-2 rounded-lg bg-[#0E1310] border border-white/10 text-xs text-white font-mono tabular-nums"
              />
            </label>
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold cursor-pointer"
          >
            Salvar
          </button>
        </form>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Caloric Balance Card */}
        <div className="lg:col-span-5 apex-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
              Balanço Energético Diário
            </span>
            <span className="text-xs font-mono font-semibold text-[#22C55E] tabular-nums">
              {kcalPct}% da Meta
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-white tabular-nums">
              {consumedKcal.toLocaleString('pt-BR')}
            </span>
            <span className="text-sm text-[#8C9992] tabular-nums">
              / {analysis.targetCalories.toLocaleString('pt-BR')} kcal
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="#1C2520"
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="#A3E635"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-xl font-bold text-white tabular-nums">
                  {kcalRemaining}
                </span>
                <span className="text-[10px] text-[#8C9992]">KCAL REST.</span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA9A2]">Ingeridas</span>
                <span className="font-mono font-semibold text-white tabular-nums">
                  {consumedKcal} kcal
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA9A2]">GET Estimado</span>
                <span className="font-mono font-semibold text-[#22C55E] tabular-nums">
                  {analysis.get} kcal
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA9A2]">Taxa Basal (TMB)</span>
                <span className="font-mono font-semibold text-[#14B8A6] tabular-nums">
                  {analysis.tmb} kcal
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/8 flex items-center justify-between text-xs">
            <span className="text-[#22C55E] font-medium">{analysis.caloricStrategyLabel}</span>
            <span className="text-[#8C9992]">{GOAL_LABELS[profile.goal]}</span>
          </div>
        </div>

        {/* Macro Breakdown Card */}
        <div className="lg:col-span-7 apex-card p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
                Repartição de Macronutrientes
              </div>
              <h3 className="font-display text-xl font-bold text-white mt-0.5">
                Metas de Construção &amp; Energia
              </h3>
            </div>
            <span className="text-xs text-[#9CA9A2] tabular-nums">
              Fibras: <strong className="text-white">{consumedFiber}g</strong> / {analysis.fiberGrams}g
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="apex-subcard p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A3E635] font-semibold">Proteína</span>
                <span className="font-mono text-[#A3E635] tabular-nums">{proteinPct}%</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                {consumedProtein}
                <span className="text-xs font-normal text-[#8C9992]"> / {analysis.proteinGrams}g</span>
              </div>
              <div className="h-1.5 bg-[#101513] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#A3E635] rounded-full transition-all"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
              <div className="text-[11px] text-[#8C9992]">
                Faltam {Math.max(0, analysis.proteinGrams - consumedProtein)}g para síntese
              </div>
            </div>

            <div className="apex-subcard p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#14B8A6] font-semibold">Carboidratos</span>
                <span className="font-mono text-[#14B8A6] tabular-nums">{carbsPct}%</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                {consumedCarbs}
                <span className="text-xs font-normal text-[#8C9992]"> / {analysis.carbsGrams}g</span>
              </div>
              <div className="h-1.5 bg-[#101513] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#14B8A6] rounded-full transition-all"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
              <div className="text-[11px] text-[#8C9992]">
                Faltam {Math.max(0, analysis.carbsGrams - consumedCarbs)}g de energia
              </div>
            </div>

            <div className="apex-subcard p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#FB923C] font-semibold">Gorduras</span>
                <span className="font-mono text-[#FB923C] tabular-nums">{fatPct}%</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                {consumedFat}
                <span className="text-xs font-normal text-[#8C9992]"> / {analysis.fatGrams}g</span>
              </div>
              <div className="h-1.5 bg-[#101513] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FB923C] rounded-full transition-all"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
              <div className="text-[11px] text-[#8C9992]">
                Faltam {Math.max(0, analysis.fatGrams - consumedFat)}g hormonais
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Planned Meals & Right Hydration/Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#A3E635]" />
              <h3 className="font-display text-lg font-bold text-white">
                Refeições Planejadas &amp; Consumo
              </h3>
            </div>
            <span className="text-xs text-[#8C9992] tabular-nums">
              {meals.filter((m) => m.confirmed).length} concluídas ·{' '}
              {meals.filter((m) => !m.confirmed).length} pendentes
            </span>
          </div>

          <div className="space-y-3">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`apex-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  meal.confirmed ? 'border-[#22C55E]/25' : ''
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#18201C] border border-white/8 flex items-center justify-center font-mono text-xs font-bold text-[#A3E635] shrink-0">
                    {meal.order}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base font-bold text-white">
                        {meal.title}
                      </h4>
                      <span className="text-xs font-mono text-[#22C55E] tabular-nums">
                        {meal.time}
                      </span>
                      <span className="text-[11px] text-[#8C9992]">· {meal.tag}</span>
                    </div>
                    <p className="text-xs text-[#9CA9A2] leading-relaxed">
                      {meal.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono tabular-nums">
                      <span className="text-[#A3E635]">PROT {meal.proteinG}g</span>
                      <span className="text-[#14B8A6]">CARB {meal.carbsG}g</span>
                      <span className="text-[#FB923C]">GORD {meal.fatG}g</span>
                      <span className="text-[#C8D3CD]">FIB {meal.fiberG}g</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-display text-xl font-extrabold text-white tabular-nums">
                      {meal.kcal}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[#8C9992]">
                      Kcal
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleMeal(meal.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        meal.confirmed
                          ? 'bg-[#17261E] border border-[#22C55E]/40 text-[#22C55E]'
                          : 'bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{meal.confirmed ? 'Confirmada' : 'Confirmar Consumo'}</span>
                    </button>

                    {meal.id.startsWith('custom-') && (
                      <button
                        type="button"
                        onClick={() => onRemoveMeal(meal.id)}
                        aria-label="Remover refeição"
                        className="p-2 rounded-lg bg-[#18201C] text-[#9CA9A2] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Columns: Hydration Grid & Supplements */}
        <div className="lg:col-span-4 space-y-6">
          <div className="apex-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#14B8A6]" />
                <h3 className="font-display text-base font-bold text-white">Hidratação</h3>
              </div>
              <span className="font-mono text-xs text-[#14B8A6] tabular-nums">
                {(waterMl / 1000).toFixed(2)}L / {(analysis.waterMl / 1000).toFixed(2)}L ({waterPct}%)
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: Math.min(12, waterCupsTarget) }, (_, idx) => {
                const filled = idx < waterCupsFilled;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAddWater(250)}
                    className={`h-10 rounded-lg border flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
                      filled
                        ? 'bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6]'
                        : 'bg-[#18201C] border-white/10 text-[#6B7871] hover:border-white/25'
                    }`}
                  >
                    {filled ? '✓' : '+'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#8C9992] tabular-nums">
                {waterMl >= analysis.waterMl
                  ? 'Meta diária atingida!'
                  : `Restam ${analysis.waterMl - waterMl} ml`}
              </span>
              <button
                type="button"
                onClick={() => onAddWater(250)}
                className="text-[#14B8A6] font-semibold hover:underline cursor-pointer"
              >
                + 250ml
              </button>
            </div>
          </div>

          <div className="apex-card p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white">
              Timing de Suplementos
            </h3>
            <div className="space-y-2.5">
              {supplements.map((sup) => (
                <button
                  key={sup.id}
                  type="button"
                  onClick={() =>
                    setSupplements((prev) =>
                      prev.map((s) =>
                        s.id === sup.id ? { ...s, done: !s.done } : s
                      )
                    )
                  }
                  className="w-full p-3 rounded-xl bg-[#18201C] border border-white/6 hover:border-white/15 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        sup.done
                          ? 'bg-[#A3E635] border-[#A3E635] text-[#0A0F0D]'
                          : 'border-white/20 bg-[#101513]'
                      }`}
                    >
                      {sup.done && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </span>
                    <span className="text-xs font-medium text-white truncate">
                      {sup.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A3E635] shrink-0">
                    {sup.dose}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
