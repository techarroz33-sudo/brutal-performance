'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Home,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  SkipForward,
  Youtube,
} from 'lucide-react';
import {
  ExerciseItem,
  FitnessGoal,
  SplitId,
  WorkoutEnvironment,
  WorkoutPlanResult,
} from '../types';
import { buildExerciseYoutubeUrl, GOAL_LABELS } from '../utils/fitnessEngine';

interface WorkoutTableViewProps {
  plan: WorkoutPlanResult;
  activeGoal: FitnessGoal;
  onChangeGoal: (goal: FitnessGoal) => void;
  environment: WorkoutEnvironment;
  onChangeEnvironment: (env: WorkoutEnvironment) => void;
  activeSplitId: SplitId;
  onSelectSplit: (id: SplitId) => void;
  showRestView: boolean;
  onToggleRestView: (show: boolean) => void;
  exercises: ExerciseItem[];
  onToggleSetDone: (exerciseId: string, setNum: number) => void;
  onUpdateSetField: (
    exerciseId: string,
    setNum: number,
    field: 'loadKg' | 'reps' | 'rpe',
    value: number
  ) => void;
  onResetWorkoutProgress: () => void;
  completedRestIds: Record<string, boolean>;
  onToggleRestActivity: (activityId: string) => void;
}

export const WorkoutTableView: React.FC<WorkoutTableViewProps> = ({
  plan,
  activeGoal,
  environment,
  onChangeEnvironment,
  activeSplitId,
  onSelectSplit,
  showRestView,
  onToggleRestView,
  exercises,
  onToggleSetDone,
  onUpdateSetField,
  onResetWorkoutProgress,
  completedRestIds,
  onToggleRestActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Rest timer state (seconds)
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerInitial, setTimerInitial] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>('Selecione um tempo ou conclua uma série');

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const splitMeta =
    plan.splits.find((s) => s.id === activeSplitId) ?? plan.splits[0];

  const splitExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exercises
      .filter((ex) => ex.splitId === activeSplitId)
      .filter(
        (ex) =>
          !q ||
          ex.name.toLowerCase().includes(q) ||
          ex.muscleGroup.toLowerCase().includes(q)
      );
  }, [exercises, activeSplitId, searchQuery]);

  const totalTonnage = useMemo(() => {
    return splitExercises.reduce((sum, ex) => {
      const doneSum = ex.sets
        .filter((s) => s.done)
        .reduce((acc, s) => acc + s.loadKg * s.reps, 0);
      return sum + doneSum;
    }, 0);
  }, [splitExercises]);

  const totalSets = splitExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = splitExercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.done).length,
    0
  );
  const sessionPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const startRestTimer = (seconds: number, label: string) => {
    const target = Math.max(15, seconds || 45);
    setTimerInitial(target);
    setTimerSeconds(target);
    setTimerLabel(label);
    setTimerRunning(true);
  };

  // 1-click toggle all sets for an exercise
  const handleQuickCompleteExercise = (
    e: React.MouseEvent,
    ex: ExerciseItem
  ) => {
    e.stopPropagation();
    const allDone = ex.sets.every((s) => s.done);
    ex.sets.forEach((s) => {
      if (allDone && s.done) {
        onToggleSetDone(ex.id, s.setNum);
      } else if (!allDone && !s.done) {
        onToggleSetDone(ex.id, s.setNum);
      }
    });
    if (!allDone && ex.restSeconds > 0) {
      startRestTimer(ex.restSeconds, ex.name);
    }
  };

  const handleSetCheck = (ex: ExerciseItem, setNum: number, wasDone: boolean) => {
    onToggleSetDone(ex.id, setNum);
    if (!wasDone && ex.restSeconds > 0) {
      startRestTimer(ex.restSeconds, `${ex.name} · Série ${setNum}`);
    }
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleExportCsv = () => {
    const headers = [
      'Objetivo',
      'Ambiente',
      'Ficha',
      'Exercicio',
      'Musculo',
      'Series',
      'Repeticoes',
      'Descanso(s)',
      'Carga(kg)',
    ];
    const rows = splitExercises.map((ex) => [
      GOAL_LABELS[activeGoal],
      environment === 'academia' ? 'Academia' : 'Casa',
      `Ficha ${ex.splitId}`,
      `"${ex.name}"`,
      `"${ex.muscleGroup}"`,
      ex.setsCount,
      `"${ex.repsRange}"`,
      ex.restSeconds,
      ex.suggestedLoadKg,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `apexfit_${activeGoal}_${environment}_ficha_${activeSplitId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Compact Header & Controls */}
      <div className="apex-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#A3E635]">
            {GOAL_LABELS[activeGoal]}
          </div>
          <h2 className="font-display text-xl font-bold text-white mt-0.5">
            {showRestView ? plan.restRecovery.headline : splitMeta.fullTitle}
          </h2>
          <p className="text-xs text-[#9CA9A2] mt-0.5">
            {showRestView
              ? plan.restRecovery.frequencyNote
              : `${splitMeta.subtitle} · ~${splitMeta.estimatedMinutes} min${
                  environment === 'casa' ? ' · Peso corporal (sem equipamentos)' : ''
                }`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-[#0E1310] border border-white/10">
            <button
              type="button"
              onClick={() => onChangeEnvironment('academia')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                environment === 'academia'
                  ? 'bg-[#A3E635] text-[#0A0F0D]'
                  : 'text-[#9CA9A2] hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Academia</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeEnvironment('casa')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                environment === 'casa'
                  ? 'bg-[#A3E635] text-[#0A0F0D]'
                  : 'text-[#9CA9A2] hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Em Casa</span>
            </button>
          </div>

          {!showRestView && (
            <>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18201C] hover:bg-[#1F2A24] border border-white/10 text-xs font-medium text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={onResetWorkoutProgress}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18201C] hover:bg-[#1F2A24] border border-white/10 text-xs font-medium text-[#C8D3CD] cursor-pointer"
                title="Desmarcar exercícios concluídos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Split Selector Pills + Rest Tab + Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {plan.splits.map((s) => {
            const active = !showRestView && s.id === activeSplitId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onToggleRestView(false);
                  onSelectSplit(s.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#A3E635] text-[#0A0F0D]'
                    : 'bg-[#131916] border border-white/8 text-[#9CA9A2] hover:text-white'
                }`}
              >
                {s.shortTitle}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onToggleRestView(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showRestView
                ? 'bg-[#14B8A6] text-[#061311]'
                : 'bg-[#121C19] border border-[#14B8A6]/35 text-[#14B8A6] hover:bg-[#162622]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Descanso Ativo</span>
          </button>
        </div>

        {!showRestView && (
          <div className="relative w-full xl:w-60 shrink-0">
            <Search className="w-4 h-4 text-[#6B7871] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar exercício..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#131916] border border-white/10 text-xs text-white placeholder-[#6B7871] focus:outline-none focus:border-[#A3E635]"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {showRestView ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 apex-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                Atividades Recomendadas para o Dia de Descanso
              </span>
              <span className="text-xs font-mono text-[#14B8A6]">
                {plan.restRecovery.heartRateTarget}
              </span>
            </div>
            <div className="divide-y divide-white/6">
              {plan.restRecovery.activities.map((act, idx) => {
                const done = Boolean(completedRestIds[act.id]);
                return (
                  <div
                    key={act.id}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      done ? 'bg-[#13201B]' : 'hover:bg-[#171F1B]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#14B8A6]">
                          0{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white">{act.title}</h4>
                        <span className="text-xs font-mono text-[#A3E635]">
                          · {act.duration}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA9A2]">{act.description}</p>
                      <p className="text-[11px] text-[#22C55E]">{act.benefit}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={buildExerciseYoutubeUrl(act.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Ver vídeo de como fazer ${act.title} no YouTube`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs font-semibold text-red-300 transition-colors whitespace-nowrap"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                        <span>Vídeo</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onToggleRestActivity(act.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                          done
                            ? 'bg-[#22C55E] text-[#0A0F0D]'
                            : 'bg-[#18201C] border border-white/10 text-white hover:border-[#14B8A6]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{done ? 'Feito' : 'Marcar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 apex-card p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white">
              Alimentação &amp; Sono no Descanso
            </h3>
            <p className="text-xs text-[#A9B5AE] leading-relaxed">
              {plan.restRecovery.sleepAndNutritionTip}
            </p>
            <button
              type="button"
              onClick={() => onToggleRestView(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold cursor-pointer"
            >
              Voltar para Ficha {activeSplitId}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Exercise Table (8 cols) */}
          <div className="lg:col-span-8 apex-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">
                Exercícios da Ficha {activeSplitId} ({splitExercises.length})
              </span>
              <span className="text-xs text-[#8C9992]">
                Clique em &ldquo;Concluir&rdquo; ou abra a linha para editar cargas
              </span>
            </div>

            {splitExercises.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8C9992]">
                Nenhum exercício encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/8 bg-[#101513] text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
                      <th className="py-3 px-4 w-10">#</th>
                      <th className="py-3 px-3">Exercício</th>
                      <th className="py-3 px-3 text-right">Séries × Reps</th>
                      <th className="py-3 px-3 text-right">Descanso</th>
                      <th className="py-3 px-3 text-right">Carga Sug.</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 text-xs">
                    {splitExercises.map((ex) => {
                      const isExpanded = expandedExerciseId === ex.id;
                      const allDone = ex.sets.every((s) => s.done);
                      return (
                        <React.Fragment key={ex.id}>
                          <tr
                            onClick={() =>
                              setExpandedExerciseId(isExpanded ? null : ex.id)
                            }
                            className={`transition-colors cursor-pointer ${
                              allDone
                                ? 'bg-[#122019]/70'
                                : isExpanded
                                  ? 'bg-[#1A241E]'
                                  : 'hover:bg-[#171F1B]'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-[#A3E635] tabular-nums">
                              {String(ex.order).padStart(2, '0')}
                            </td>
                            <td className="py-3.5 px-3">
                              <div
                                className={`font-semibold text-sm ${
                                  allDone ? 'text-[#A9B5AE] line-through' : 'text-white'
                                }`}
                              >
                                {ex.name}
                              </div>
                              <div className="text-[11px] text-[#8C9992] mt-0.5">
                                {ex.muscleGroup} · {ex.equipment}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-semibold text-white tabular-nums whitespace-nowrap">
                              {ex.setsCount} × {ex.repsRange}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#14B8A6] tabular-nums whitespace-nowrap">
                              {ex.restSeconds > 0 ? `${ex.restSeconds}s` : 'Contínuo'}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-[#A3E635] tabular-nums whitespace-nowrap">
                              {ex.suggestedLoadKg > 0
                                ? `${ex.suggestedLoadKg} kg`
                                : 'Peso Corp.'}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <a
                                  href={ex.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Ver vídeo no YouTube explicando como fazer ${ex.name}`}
                                  aria-label={`Ver vídeo no YouTube de ${ex.name}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-[11px] font-semibold text-red-300 transition-colors"
                                >
                                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                                  <span>Vídeo</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickCompleteExercise(e, ex)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                    allDone
                                      ? 'bg-[#22C55E] text-[#0A0F0D]'
                                      : 'bg-[#18201C] border border-white/12 text-white hover:border-[#A3E635]'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{allDone ? 'Feito' : 'Concluir'}</span>
                                </button>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#A3E635]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[#6B7871]" />
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-[#101613]">
                              <td colSpan={6} className="p-4 border-t border-white/6">
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="text-[#A9B5AE]">
                                      <strong className="text-white">Dica:</strong>{' '}
                                      {ex.techniqueNote}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-3">
                                      {ex.alternativeName && (
                                        <span className="text-[#14B8A6]">
                                          Alternativa: {ex.alternativeName}
                                        </span>
                                      )}
                                      <a
                                        href={ex.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/12 hover:bg-red-500/20 border border-red-500/30 text-[11px] font-semibold text-red-300 transition-colors"
                                      >
                                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                                        <span>Como fazer no YouTube</span>
                                        <ExternalLink className="w-3 h-3 opacity-80" />
                                      </a>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-[#6B7871] border-b border-white/6">
                                          <th className="py-1.5 pr-3">Série</th>
                                          <th className="py-1.5 px-2">Carga (kg)</th>
                                          <th className="py-1.5 px-2">Reps</th>
                                          <th className="py-1.5 pl-2 text-right">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {ex.sets.map((s) => (
                                          <tr key={s.setNum}>
                                            <td className="py-2 pr-3 font-medium text-white">
                                              {s.label}
                                            </td>
                                            <td className="py-2 px-2">
                                              <input
                                                type="number"
                                                min={0}
                                                value={s.loadKg}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) =>
                                                  onUpdateSetField(
                                                    ex.id,
                                                    s.setNum,
                                                    'loadKg',
                                                    Number(e.target.value) || 0
                                                  )
                                                }
                                                className="w-20 h-8 px-2.5 rounded-lg bg-[#161E1A] border border-white/10 text-white font-mono tabular-nums"
                                              />
                                            </td>
                                            <td className="py-2 px-2">
                                              <input
                                                type="number"
                                                min={1}
                                                value={s.reps}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) =>
                                                  onUpdateSetField(
                                                    ex.id,
                                                    s.setNum,
                                                    'reps',
                                                    Number(e.target.value) || 1
                                                  )
                                                }
                                                className="w-16 h-8 px-2.5 rounded-lg bg-[#161E1A] border border-white/10 text-white font-mono tabular-nums"
                                              />
                                            </td>
                                            <td className="py-2 pl-2 text-right">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSetCheck(ex, s.setNum, s.done);
                                                }}
                                                className={`w-8 h-8 rounded-lg inline-flex items-center justify-center border cursor-pointer ${
                                                  s.done
                                                    ? 'bg-[#A3E635] border-[#A3E635] text-[#0A0F0D]'
                                                    : 'bg-[#161E1A] border-white/12 text-[#6B7871]'
                                                }`}
                                              >
                                                <Check className="w-4 h-4 stroke-[2.5]" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar: Timer + Session Progress + Quick Rest Tip */}
          <div className="lg:col-span-4 space-y-5">
            <div className="apex-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A3E635]">
                  <Clock className="w-4 h-4" />
                  <span>Cronômetro de Descanso</span>
                </div>
                <div className="flex items-center gap-1">
                  {[45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => startRestTimer(sec, `Descanso ${sec}s`)}
                      className="px-2 py-0.5 rounded-md bg-[#18201C] hover:bg-[#222D27] text-[11px] font-mono text-[#C8D3CD] cursor-pointer"
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <div className="font-mono text-4xl font-extrabold text-[#A3E635] tabular-nums">
                  {formatClock(timerSeconds)}
                </div>
                <div className="text-[11px] text-[#8C9992] truncate mt-0.5">
                  {timerLabel}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTimerSeconds((s) => s + 30);
                    setTimerInitial((i) => Math.max(i, timerSeconds + 30));
                  }}
                  className="py-2 rounded-xl bg-[#18201C] border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  +30s
                </button>
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="py-2 rounded-xl bg-[#A3E635] text-[#0A0F0D] text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="py-2 rounded-xl bg-[#18201C] border border-white/10 text-xs font-semibold text-[#FCA5A5] inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Zerar</span>
                </button>
              </div>
            </div>

            <div className="apex-card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Progresso da Ficha {activeSplitId}</span>
                <span className="font-mono text-[#A3E635] font-bold tabular-nums">
                  {sessionPct}%
                </span>
              </div>
              <div className="h-2 bg-[#1B241F] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#A3E635] rounded-full transition-all duration-300"
                  style={{ width: `${sessionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#8C9992] tabular-nums">
                <span>Séries: {completedSets}/{totalSets}</span>
                <span>Carga erguida: {totalTonnage.toLocaleString('pt-BR')} kg</span>
              </div>
            </div>

            <div className="apex-card p-5 space-y-2.5 border-[#14B8A6]/25">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#14B8A6] flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Para Dias de Descanso</span>
                </span>
                <button
                  type="button"
                  onClick={() => onToggleRestView(true)}
                  className="text-xs text-[#14B8A6] font-semibold hover:underline cursor-pointer"
                >
                  Abrir plano →
                </button>
              </div>
              <div className="text-xs font-semibold text-white">
                {plan.restRecovery.activities[0]?.title} ({plan.restRecovery.activities[0]?.duration})
              </div>
              <p className="text-[11px] text-[#8C9992]">
                {plan.restRecovery.activities[0]?.benefit}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
