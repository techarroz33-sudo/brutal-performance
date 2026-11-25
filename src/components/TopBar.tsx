'use client';

import React from 'react';
import { Database, LogOut, Menu } from 'lucide-react';
import { AppTab, FitnessGoal, UserProfile } from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface TopBarProps {
  activeTab: AppTab;
  profile: UserProfile;
  onChangeGoal: (goal: FitnessGoal) => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  onOpenDataControl: () => void;
}

const TAB_TITLES: Record<AppTab, string> = {
  dashboard: 'Resumo',
  workouts: 'Treinos & Descanso',
  foods: 'Alimentos por Perfil',
  food_analyzer: 'Análise de Alimento & Compensação',
  nutrition: 'Diário & Água',
  evolution: 'Evolução',
};

const GOALS: FitnessGoal[] = ['crescimento_muscular', 'perda_peso', 'manter_forma'];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  profile,
  onChangeGoal,
  onLogout,
  onOpenMobileMenu,
  onOpenDataControl,
}) => {
  return (
    <header className="h-16 border-b border-white/8 bg-[#0E1310]/95 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu lateral"
          className="lg:hidden p-2 rounded-lg text-[#9CA9A2] hover:text-white hover:bg-white/5 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-display text-base font-bold text-white truncate">
          {TAB_TITLES[activeTab]}
        </h1>
      </div>

      {/* Unified Goal Switcher (Desktop segmented bar + Mobile dropdown) */}
      <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#141B17] border border-white/8 shrink-0">
        {GOALS.map((goal) => {
          const active = profile.goal === goal;
          return (
            <button
              key={goal}
              type="button"
              onClick={() => onChangeGoal(goal)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#A3E635] text-[#0A0F0D] font-semibold'
                  : 'text-[#9CA9A2] hover:text-white'
              }`}
            >
              {GOAL_LABELS[goal]}
            </button>
          );
        })}
      </div>

      <div className="md:hidden">
        <select
          aria-label="Objetivo atual"
          value={profile.goal}
          onChange={(e) => onChangeGoal(e.target.value as FitnessGoal)}
          className="h-8 px-2.5 rounded-lg bg-[#141B17] border border-white/10 text-xs font-medium text-[#A3E635]"
        >
          {GOALS.map((g) => (
            <option key={g} value={g}>
              {GOAL_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenDataControl}
          title="Controlar, exportar ou limpar meus dados"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151D19] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-[#C8D3CD] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-[#A3E635]" />
          <span className="hidden sm:inline">Meus Dados</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151D19] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-[#C8D3CD] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-[#9CA9A2]" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};
