'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  Dumbbell,
  Loader2,
  Pencil,
  RotateCcw,
  Scale,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface DataControlModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  mealsConfirmedCount: number;
  waterMl: number;
  foodAnalysisCount: number;
  weightEntriesCount: number;
  onEditProfile: () => void;
  onExportData: () => Promise<void>;
  onResetTodayDiary: () => Promise<void>;
  onResetAllWorkouts: () => Promise<void>;
  onClearFoodAnalyses: () => Promise<void>;
  onResetWeightHistory: () => Promise<void>;
  onDeleteAllData: () => Promise<void>;
}

type ConfirmActionKey =
  | 'diary'
  | 'workouts'
  | 'food_analyses'
  | 'weights'
  | 'delete_all'
  | null;

export const DataControlModal: React.FC<DataControlModalProps> = ({
  open,
  onClose,
  profile,
  mealsConfirmedCount,
  waterMl,
  foodAnalysisCount,
  weightEntriesCount,
  onEditProfile,
  onExportData,
  onResetTodayDiary,
  onResetAllWorkouts,
  onClearFoodAnalyses,
  onResetWeightHistory,
  onDeleteAllData,
}) => {
  const [confirmKey, setConfirmKey] = useState<ConfirmActionKey>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!open) return null;

  const runAction = async (
    key: string,
    fn: () => Promise<void>,
    successText: string
  ) => {
    setBusyKey(key);
    setFeedback('');
    setErrorMsg('');
    try {
      await fn();
      setConfirmKey(null);
      setFeedback(successText);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível executar a ação no Supabase.'
      );
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-control-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto apex-card bg-[#111714] border border-white/12 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-[#A3E635]" />
            </div>
            <div>
              <h2
                id="data-control-title"
                className="font-display text-lg font-bold text-white"
              >
                Controle dos Meus Dados
              </h2>
              <p className="text-xs text-[#9CA9A2]">
                Edite, exporte em JSON ou limpe seus registros salvos no Supabase quando quiser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 rounded-lg bg-[#18201C] text-[#9CA9A2] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 px-4 py-2.5 text-xs text-[#86EFAC] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Perfil + Exportação */}
        <div className="apex-subcard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {profile.name} · <span className="text-[#9CA9A2] font-normal">{profile.email}</span>
            </div>
            <div className="text-[11px] text-[#8C9992]">
              {GOAL_LABELS[profile.goal]} · {profile.weightKg} kg · {profile.heightCm} cm · {profile.daysPerWeek}x/sem
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProfile();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F2A24] hover:bg-[#27352E] border border-white/10 text-xs font-semibold text-white cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-[#A3E635]" />
              <span>Editar Perfil</span>
            </button>
            <button
              type="button"
              disabled={busyKey !== null}
              onClick={() =>
                runAction(
                  'export',
                  onExportData,
                  'Backup JSON exportado com sucesso.'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {busyKey === 'export' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Exportar JSON</span>
            </button>
          </div>
        </div>

        {/* Gerenciamento Granular */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
            Limpeza Seletiva de Registros
          </div>

          {/* 1. Diário & Água de Hoje */}
          <div className="apex-subcard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Utensils className="w-4 h-4 text-[#14B8A6] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  Diário &amp; Água de Hoje
                </div>
                <div className="text-[11px] text-[#8C9992]">
                  Atual: {waterMl} ml de água · {mealsConfirmedCount} refeição(ões) confirmada(s) (zera todo dia automaticamente).
                </div>
              </div>
            </div>
            {confirmKey === 'diary' ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      'diary',
                      onResetTodayDiary,
                      'Diário & Água de hoje zerados.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#A3E635] text-[#0A0F0D] text-xs font-bold cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmKey(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#121815] text-[#9CA9A2] text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmKey('diary')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B17] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-white shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Zerar Hoje</span>
              </button>
            )}
          </div>

          {/* 2. Treinos */}
          <div className="apex-subcard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Dumbbell className="w-4 h-4 text-[#A3E635] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  Cargas e Séries dos Treinos
                </div>
                <div className="text-[11px] text-[#8C9992]">
                  Remove cargas editadas e séries marcadas em todos os objetivos e ambientes.
                </div>
              </div>
            </div>
            {confirmKey === 'workouts' ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      'workouts',
                      onResetAllWorkouts,
                      'Registros de treino zerados.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#A3E635] text-[#0A0F0D] text-xs font-bold cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmKey(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#121815] text-[#9CA9A2] text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmKey('workouts')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B17] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-white shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>Limpar Treinos</span>
              </button>
            )}
          </div>

          {/* 3. Análises de Alimentos */}
          <div className="apex-subcard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Trash2 className="w-4 h-4 text-[#FB923C] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  Histórico de Análises de Alimentos ({foodAnalysisCount})
                </div>
                <div className="text-[11px] text-[#8C9992]">
                  Apaga todas as análises de refeições extras e compensações registradas.
                </div>
              </div>
            </div>
            {confirmKey === 'food_analyses' ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      'food_analyses',
                      onClearFoodAnalyses,
                      'Histórico de análises de alimentos apagado.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#FB923C] text-[#0A0F0D] text-xs font-bold cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmKey(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#121815] text-[#9CA9A2] text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={foodAnalysisCount === 0}
                onClick={() => setConfirmKey('food_analyses')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B17] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-white shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#FB923C]" />
                <span>Limpar Análises</span>
              </button>
            )}
          </div>

          {/* 4. Histórico de Peso */}
          <div className="apex-subcard p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Scale className="w-4 h-4 text-[#22C55E] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  Histórico de Peso &amp; Evolução ({weightEntriesCount})
                </div>
                <div className="text-[11px] text-[#8C9992]">
                  Reinicia os registros de evolução mantendo apenas seu peso atual ({profile.weightKg} kg).
                </div>
              </div>
            </div>
            {confirmKey === 'weights' ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() =>
                    runAction(
                      'weights',
                      onResetWeightHistory,
                      'Histórico de evolução reiniciado com seu peso atual.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-[#0A0F0D] text-xs font-bold cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmKey(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#121815] text-[#9CA9A2] text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmKey('weights')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B17] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-white shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Reiniciar Evolução</span>
              </button>
            )}
          </div>
        </div>

        {/* Exclusão Total */}
        <div className="rounded-xl bg-red-500/8 border border-red-500/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-red-200">
                Apagar Todos os Meus Dados do Supabase
              </div>
              <div className="text-[11px] text-red-200/75">
                Exclui seu perfil biométrico, treinos, diário, peso e análises. Você poderá preencher tudo do zero depois.
              </div>
            </div>
          </div>

          {confirmKey === 'delete_all' ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={() =>
                  runAction(
                    'delete_all',
                    onDeleteAllData,
                    'Todos os dados foram apagados.'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                {busyKey === 'delete_all' ? 'Apagando...' : 'Confirmar Exclusão'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmKey(null)}
                className="px-2.5 py-1.5 rounded-lg bg-[#121815] text-[#9CA9A2] text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmKey('delete_all')}
              className="px-3.5 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-xs font-semibold text-red-300 shrink-0 cursor-pointer"
            >
              Apagar Tudo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
