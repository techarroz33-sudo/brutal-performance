import React from 'react';
import {
  Apple,
  Calculator,
  Dumbbell,
  LayoutDashboard,
  LineChart,
  Utensils,
  X,
} from 'lucide-react';
import { AppTab, BiometricAnalysis, UserProfile } from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface SidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  profile: UserProfile;
  analysis: BiometricAnalysis;
  workoutCompletionPct: number;
  onEditProfile: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Resumo', icon: LayoutDashboard },
  { id: 'workouts', label: 'Treinos', icon: Dumbbell },
  { id: 'foods', label: 'Alimentos por Perfil', icon: Apple },
  { id: 'food_analyzer', label: 'Análise de Alimento', icon: Calculator },
  { id: 'nutrition', label: 'Diário & Água', icon: Utensils },
  { id: 'evolution', label: 'Evolução', icon: LineChart },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  analysis,
  workoutCompletionPct,
  onEditProfile,
  mobileOpen,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col justify-between h-full bg-[#101513] border-r border-white/8 w-60 px-4 py-5">
      <div className="space-y-7">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_ouqeatouqeatouqe_e431381e.jpg"
              alt="Brutal Performance"
              className="w-12 h-9 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <span className="font-display text-sm font-extrabold tracking-tight text-white leading-tight uppercase">
              Brutal Performance
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 rounded-lg text-[#8C9992] hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1.5" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1D2722] text-white border border-white/10'
                    : 'text-[#8C9992] hover:text-white hover:bg-white/4 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#A3E635]' : 'text-[#6B7871]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Simple Profile Summary Footer */}
      <button
        type="button"
        onClick={onEditProfile}
        className="text-left apex-subcard p-3.5 space-y-2 hover:border-[#A3E635]/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white truncate">{profile.name}</span>
          <span className="text-[#A3E635] font-mono tabular-nums">
            {workoutCompletionPct}%
          </span>
        </div>
        <div className="text-[11px] text-[#8C9992] truncate">
          {GOAL_LABELS[profile.goal]} · {analysis.targetCalories} kcal
        </div>
        <div className="h-1.5 w-full bg-[#0B0F0D] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#A3E635] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(8, workoutCompletionPct)}%` }}
          />
        </div>
        <div className="text-[11px] text-[#A3E635] font-medium">
          Editar meus dados →
        </div>
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
};
