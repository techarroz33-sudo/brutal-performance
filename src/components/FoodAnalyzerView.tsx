import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  Flame,
  MessageSquarePlus,
  RotateCcw,
  Scale,
  Timer,
  Trash2,
} from 'lucide-react';
import { FoodAnalysisEntry, UserProfile } from '../types';
import { analyzeFoodComment } from '../utils/foodAnalyzer';

interface FoodAnalyzerViewProps {
  profile: UserProfile;
  entries: FoodAnalysisEntry[];
  onAddEntry: (entry: FoodAnalysisEntry) => void;
  onToggleCompensated: (id: string) => void;
  onRemoveEntry: (id: string) => void;
  onUpdateEntryKcal: (id: string, newKcal: number) => void;
}

const EXAMPLE_COMMENTS = [
  'comi um hamburguer de queijo e bacon',
  '2 fatias de pizza e 1 refrigerante',
  'acai com leite condensado e granola',
  '1 coxinha e 2 brigadeiros',
  'batata frita grande com cheddar',
];

export const FoodAnalyzerView: React.FC<FoodAnalyzerViewProps> = ({
  profile,
  entries,
  onAddEntry,
  onToggleCompensated,
  onRemoveEntry,
  onUpdateEntryKcal,
}) => {
  const [comment, setComment] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    entries[0]?.id ?? null
  );
  const [editingKcal, setEditingKcal] = useState<string>('');

  const activeEntry = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries[0] ?? null,
    [entries, selectedId]
  );

  const totalPendingKcal = useMemo(
    () =>
      entries
        .filter((e) => !e.compensated)
        .reduce((acc, e) => acc + e.caloriesToLose, 0),
    [entries]
  );

  const totalPendingFatGrams = Math.round(totalPendingKcal / 7.7);

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const entry = analyzeFoodComment(comment, profile);
    onAddEntry(entry);
    setSelectedId(entry.id);
    setComment('');
    setEditingKcal('');
  };

  const handleRunExample = (exampleText: string) => {
    const entry = analyzeFoodComment(exampleText, profile);
    onAddEntry(entry);
    setSelectedId(entry.id);
    setComment('');
    setEditingKcal('');
  };

  const handleApplyManualKcal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry) return;
    const parsed = Number(editingKcal);
    if (parsed > 0) {
      onUpdateEntryKcal(activeEntry.id, Math.round(parsed));
      setEditingKcal('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Input Box */}
      <section className="apex-hero-glow p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#A3E635]">
              <Calculator className="w-4 h-4" />
              <span>Análise de Alimento &amp; Retorno ao Peso Anterior</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mt-0.5">
              Comente o que você comeu
            </h2>
            <p className="text-xs sm:text-sm text-[#A9B5AE] mt-1">
              Escreva livremente (ex.: &ldquo;comi um hamburguer de queijo e bacon&rdquo;) para ver a tabela nutricional estimada e quantas calorias precisa gastar para voltar ao seu peso anterior ({profile.weightKg} kg).
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyzeSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MessageSquarePlus className="w-4 h-4 text-[#8C9992] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Ex.: comi um hamburguer de queijo e bacon'
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0E1310] border border-white/15 text-sm text-white placeholder-[#6B7871] focus:outline-none focus:border-[#A3E635]"
            />
          </div>
          <button
            type="submit"
            className="h-12 px-6 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Analisar Alimento
          </button>
        </form>

        {/* Quick Example Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8C9992]">Testar exemplo:</span>
          {EXAMPLE_COMMENTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleRunExample(ex)}
              className="px-3 py-1 rounded-lg bg-[#121815]/90 hover:bg-[#1C2621] border border-white/10 text-xs text-[#C8D3CD] hover:text-white transition-colors cursor-pointer"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </section>

      {/* Active Entry Breakdown */}
      {activeEntry && (
        <div className="space-y-6">
          {/* 4 Impact Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="apex-card p-4 space-y-1 border-[#FB923C]/35">
              <div className="flex items-center justify-between text-xs text-[#8C9992]">
                <span>Calorias a Perder</span>
                <Flame className="w-4 h-4 text-[#FB923C]" />
              </div>
              <div className="font-display text-2xl font-extrabold text-[#FB923C] tabular-nums">
                {activeEntry.caloriesToLose.toLocaleString('pt-BR')} kcal
              </div>
              <div className="text-xs text-[#9CA9A2]">
                Para voltar a {profile.weightKg} kg
              </div>
            </div>

            <div className="apex-card p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#8C9992]">
                <span>Impacto no Peso</span>
                <Scale className="w-4 h-4 text-[#A3E635]" />
              </div>
              <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                +{activeEntry.fatGainGrams} g
              </div>
              <div className="text-xs text-[#8C9992] tabular-nums">
                Equiv. gordura (~{activeEntry.scaleRetentionGrams}g na balança hoje)
              </div>
            </div>

            <div className="apex-card p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#8C9992]">
                <span>Macros Identificados</span>
                <Calculator className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="font-mono text-base font-bold text-white tabular-nums pt-1">
                <span className="text-[#A3E635]">{activeEntry.proteinG}g P</span> ·{' '}
                <span className="text-[#14B8A6]">{activeEntry.carbsG}g C</span> ·{' '}
                <span className="text-[#FB923C]">{activeEntry.fatG}g G</span>
              </div>
              <div className="text-xs text-[#8C9992]">
                Proteína · Carboidrato · Gordura
              </div>
            </div>

            <div className="apex-card p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#8C9992]">
                <span>Para Zerar Hoje</span>
                <Timer className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <div className="font-display text-2xl font-extrabold text-[#14B8A6] tabular-nums">
                {activeEntry.burnEquivalents[3]?.minutes ?? 45} min
              </div>
              <div className="text-xs text-[#9CA9A2]">
                Corrida leve ou {activeEntry.burnEquivalents[0]?.minutes ?? 90} min caminhada
              </div>
            </div>
          </section>

          {/* 2-Column Analysis Tables: Ingredient Breakdown + Exercise Burn Equivalents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Ingredient Breakdown Table */}
            <div className="lg:col-span-7 apex-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-white">
                    Tabela de Análise: &ldquo;{activeEntry.comment}&rdquo;
                  </h3>
                  <p className="text-[11px] text-[#8C9992] mt-0.5">
                    {activeEntry.recoveryPlanNote}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/8 bg-[#101513] text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
                      <th className="py-3 px-4">Item Identificado</th>
                      <th className="py-3 px-3">Porção Est.</th>
                      <th className="py-3 px-3 text-right">Calorias</th>
                      <th className="py-3 px-3 text-right">Prot · Carb · Gord</th>
                      <th className="py-3 px-4 text-right">% do Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 tabular-nums">
                    {activeEntry.items.map((item, idx) => {
                      const pct =
                        activeEntry.totalKcal > 0
                          ? Math.round((item.kcal / activeEntry.totalKcal) * 100)
                          : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#171F1B]">
                          <td className="py-3 px-4 font-semibold text-white">
                            {item.name}
                          </td>
                          <td className="py-3 px-3 text-[#9CA9A2] whitespace-nowrap">
                            {item.portion}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#FB923C] whitespace-nowrap">
                            {item.kcal} kcal
                          </td>
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            <span className="text-[#A3E635]">{item.proteinG}g</span> ·{' '}
                            <span className="text-[#14B8A6]">{item.carbsG}g</span> ·{' '}
                            <span className="text-[#FB923C]">{item.fatG}g</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#C8D3CD]">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#101613] font-bold">
                      <td className="py-3 px-4 text-white" colSpan={2}>
                        Total a Compensar para Voltar ao Peso Anterior
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#A3E635] whitespace-nowrap">
                        {activeEntry.caloriesToLose} kcal
                      </td>
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        {activeEntry.proteinG}g · {activeEntry.carbsG}g · {activeEntry.fatG}g
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-white">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Manual Calorie Adjustment */}
              <form
                onSubmit={handleApplyManualKcal}
                className="px-5 py-3 border-t border-white/8 bg-[#101513] flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-[11px] text-[#8C9992]">
                  Sabe a caloria exata da embalagem? Ajuste aqui:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={editingKcal}
                    onChange={(e) => setEditingKcal(e.target.value)}
                    placeholder={`${activeEntry.caloriesToLose} kcal`}
                    className="w-28 h-8 px-2.5 rounded-lg bg-[#161E1A] border border-white/10 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
                  />
                  <button
                    type="submit"
                    className="h-8 px-3 rounded-lg bg-[#18201C] hover:bg-[#A3E635] text-[#A3E635] hover:text-[#0A0F0D] border border-[#A3E635]/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Recalcular
                  </button>
                </div>
              </form>
            </div>

            {/* Exercise Burn Equivalent Table */}
            <div className="lg:col-span-5 apex-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/8">
                <h3 className="font-display text-sm font-bold text-white">
                  Como Gastar essas {activeEntry.caloriesToLose} kcal
                </h3>
                <p className="text-[11px] text-[#8C9992] mt-0.5">
                  Tempo calculado para seu peso atual ({profile.weightKg} kg)
                </p>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/8 bg-[#101513] text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
                    <th className="py-3 px-4">Atividade</th>
                    <th className="py-3 px-3">Ritmo</th>
                    <th className="py-3 px-4 text-right">Tempo Necessário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 tabular-nums">
                  {activeEntry.burnEquivalents.map((eq) => (
                    <tr key={eq.activity} className="hover:bg-[#171F1B]">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {eq.activity}
                      </td>
                      <td className="py-3.5 px-3 text-[#8C9992]">{eq.intensity}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#A3E635]">
                        {eq.minutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History Table of Commented Foods */}
      <section className="apex-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Histórico de Alimentos Analisados ({entries.length})
            </h3>
            <p className="text-xs text-[#8C9992]">
              Saldo pendente para retornar ao peso anterior:{' '}
              <strong className="text-[#FB923C] font-mono tabular-nums">
                {totalPendingKcal.toLocaleString('pt-BR')} kcal
              </strong>{' '}
              (~{totalPendingFatGrams}g equivalentes)
            </p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8C9992]">
            Comente acima qualquer alimento que você comeu para gerar sua tabela de análise e compensação calórica.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/8 bg-[#101513] text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
                  <th className="py-3 px-4">Comentário</th>
                  <th className="py-3 px-3 text-right">Calorias a Perder</th>
                  <th className="py-3 px-3 text-right">Impacto Peso</th>
                  <th className="py-3 px-3 text-right">Corrida / Caminhada</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 tabular-nums">
                {entries.map((entry) => {
                  const isSelected = activeEntry?.id === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1A241E]' : 'hover:bg-[#171F1B]'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-semibold text-sm ${
                            entry.compensated
                              ? 'line-through text-[#8C9992]'
                              : 'text-white'
                          }`}
                        >
                          &ldquo;{entry.comment}&rdquo;
                        </div>
                        <div className="text-[11px] text-[#8C9992] mt-0.5">
                          {entry.createdAt} · {entry.items.length} item(ns) ·{' '}
                          {entry.proteinG}g P / {entry.carbsG}g C / {entry.fatG}g G
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#FB923C] whitespace-nowrap">
                        {entry.caloriesToLose} kcal
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-[#C8D3CD] whitespace-nowrap">
                        +{entry.fatGainGrams} g
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-[#14B8A6] whitespace-nowrap">
                        {entry.burnEquivalents[3]?.minutes}m / {entry.burnEquivalents[0]?.minutes}m
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompensated(entry.id);
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              entry.compensated
                                ? 'bg-[#22C55E] text-[#0A0F0D]'
                                : 'bg-[#18201C] border border-white/12 text-white hover:border-[#A3E635]'
                            }`}
                          >
                            {entry.compensated ? (
                              <>
                                <RotateCcw className="w-3 h-3" />
                                <span>Compensado</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Compensar</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveEntry(entry.id);
                            }}
                            aria-label="Remover análise"
                            className="p-1.5 rounded-lg bg-[#18201C] text-[#8C9992] hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
