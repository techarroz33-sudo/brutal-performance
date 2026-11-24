import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Flame,
  HeartPulse,
  UserCheck,
} from 'lucide-react';
import { DEMO_PROFILES } from '../data/fitnessData';
import {
  ActivityLevel,
  ExperienceLevel,
  FitnessGoal,
  Sex,
  UserProfile,
} from '../types';
import {
  ACTIVITY_LABELS,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  calculateBiometrics,
} from '../utils/fitnessEngine';

interface LoginOnboardingProps {
  initialProfile?: UserProfile | null;
  onCompleteLogin: (profile: UserProfile) => void;
}

const GOAL_OPTIONS: Array<{
  id: FitnessGoal;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'crescimento_muscular',
    title: 'Crescimento Muscular',
    desc: 'Ganhar massa e força',
    icon: Dumbbell,
  },
  {
    id: 'perda_peso',
    title: 'Perda de Peso',
    desc: 'Queimar gordura e definir',
    icon: Flame,
  },
  {
    id: 'manter_forma',
    title: 'Manter em Forma',
    desc: 'Saúde, energia e equilíbrio',
    icon: HeartPulse,
  },
];

export const LoginOnboarding: React.FC<LoginOnboardingProps> = ({
  initialProfile,
  onCompleteLogin,
}) => {
  const [form, setForm] = useState<UserProfile>(
    initialProfile ?? {
      name: '',
      email: '',
      age: 27,
      sex: 'masculino',
      weightKg: 76,
      heightCm: 176,
      waistCm: 80,
      goal: 'crescimento_muscular',
      activityLevel: 'moderado',
      experience: 'intermediario',
      daysPerWeek: 4,
    }
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const liveAnalysis = useMemo(() => calculateBiometrics(form), [form]);

  const handleQuickEnter = (demoProfile: UserProfile) => {
    onCompleteLogin({ ...demoProfile });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('Digite seu nome para continuar.');
      return;
    }
    if (form.weightKg < 35 || form.weightKg > 250) {
      setErrorMsg('Informe um peso válido entre 35 kg e 250 kg.');
      return;
    }
    if (form.heightCm < 120 || form.heightCm > 230) {
      setErrorMsg('Informe uma altura válida entre 120 cm e 230 cm.');
      return;
    }
    setErrorMsg('');
    onCompleteLogin({
      ...form,
      name: form.name.trim(),
      email:
        form.email.trim() ||
        `${form.name.trim().toLowerCase().replace(/\s+/g, '.')}@apexfit.com.br`,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F0D] text-[#F1F5F3] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Clean Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_ouqeatouqeatouqe_e431381e.jpg"
              alt="Brutal Performance"
              className="w-16 h-11 rounded-xl object-cover border border-white/10 shrink-0"
            />
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white uppercase">
                Brutal Performance
              </span>
              <p className="text-xs text-[#8C9992]">
                Preencha seus dados básicos para gerar treinos e dieta personalizados
              </p>
            </div>
          </div>

          {/* 1-Click Demo Login */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#8C9992]">Acesso rápido:</span>
            {DEMO_PROFILES.map((demo) => (
              <button
                key={demo.label}
                type="button"
                onClick={() => handleQuickEnter(demo.profile)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141B17] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-[#C8D3CD] hover:text-white transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>{demo.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simplified Single Card Form */}
        <form
          onSubmit={handleSubmit}
          className="apex-card p-6 sm:p-8 space-y-6"
        >
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300"
            >
              {errorMsg}
            </div>
          )}

          {/* Step 1: Essential Info */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <label className="sm:col-span-5 block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D3CD]">Seu nome *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Carlos"
                className="w-full h-11 px-3.5 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white placeholder-[#5B6861] focus:outline-none focus:border-[#A3E635]"
              />
            </label>

            <label className="sm:col-span-2 block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D3CD]">Peso (kg)</span>
              <input
                type="number"
                step="0.1"
                min={35}
                max={250}
                value={form.weightKg}
                onChange={(e) =>
                  setForm({ ...form, weightKg: Number(e.target.value) || 60 })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
              />
            </label>

            <label className="sm:col-span-2 block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D3CD]">Altura (cm)</span>
              <input
                type="number"
                min={120}
                max={230}
                value={form.heightCm}
                onChange={(e) =>
                  setForm({ ...form, heightCm: Number(e.target.value) || 170 })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
              />
            </label>

            <label className="sm:col-span-3 block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D3CD]">Sexo</span>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })}
                className="w-full h-11 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white focus:outline-none focus:border-[#A3E635]"
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </label>
          </div>

          {/* Step 2: Goal Selection */}
          <div className="space-y-2.5">
            <span className="text-xs font-medium text-[#C8D3CD]">
              Qual é o seu objetivo?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GOAL_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = form.goal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm({ ...form, goal: opt.id })}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-center gap-3 cursor-pointer ${
                      active
                        ? 'bg-[#A3E635]/14 border-[#A3E635] text-white'
                        : 'bg-[#0E1310] border-white/10 text-[#9CA9A2] hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-[#A3E635] text-[#0A0F0D]'
                          : 'bg-[#18201C] text-[#9CA9A2]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {opt.title}
                      </div>
                      <div className="text-xs text-[#8C9992] truncate">
                        {opt.desc}
                      </div>
                    </div>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Advanced Details Collapsible */}
          <div className="border-t border-white/8 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA9A2] hover:text-white cursor-pointer"
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-[#A3E635]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#A3E635]" />
              )}
              <span>
                Ajustes opcionais (idade, rotina, nível de treino, e-mail)
              </span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <label className="block space-y-1">
                  <span className="text-xs text-[#8C9992]">Idade</span>
                  <input
                    type="number"
                    min={14}
                    max={95}
                    value={form.age}
                    onChange={(e) =>
                      setForm({ ...form, age: Number(e.target.value) || 25 })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#8C9992]">Cintura (cm)</span>
                  <input
                    type="number"
                    min={50}
                    max={180}
                    value={form.waistCm}
                    onChange={(e) =>
                      setForm({ ...form, waistCm: Number(e.target.value) || 80 })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#8C9992]">E-mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="opcional@email.com"
                    className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#8C9992]">Atividade</span>
                  <select
                    value={form.activityLevel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        activityLevel: e.target.value as ActivityLevel,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white"
                  >
                    {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                      <option key={k} value={k}>
                        {ACTIVITY_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#8C9992]">Experiência</span>
                  <select
                    value={form.experience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        experience: e.target.value as ExperienceLevel,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white"
                  >
                    {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((k) => (
                      <option key={k} value={k}>
                        {EXPERIENCE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-[#8C9992]">Dias por semana</span>
                  <select
                    value={form.daysPerWeek}
                    onChange={(e) =>
                      setForm({ ...form, daysPerWeek: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white"
                  >
                    <option value={3}>3 dias/semana</option>
                    <option value={4}>4 dias/semana</option>
                    <option value={5}>5 dias/semana</option>
                    <option value={6}>6 dias/semana</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* Live Summary Strip + Submit */}
          <div className="rounded-xl bg-[#0E1310] border border-white/8 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5 text-xs tabular-nums">
              <div>
                <span className="text-[#8C9992] block">IMC</span>
                <span className="font-mono font-bold text-white text-sm">
                  {liveAnalysis.bmi} ({liveAnalysis.bmiCategory})
                </span>
              </div>
              <div>
                <span className="text-[#8C9992] block">Meta Calórica</span>
                <span className="font-mono font-bold text-[#A3E635] text-sm">
                  {liveAnalysis.targetCalories.toLocaleString('pt-BR')} kcal/dia
                </span>
              </div>
              <div>
                <span className="text-[#8C9992] block">Proteína · Água</span>
                <span className="font-mono font-bold text-[#22C55E] text-sm">
                  {liveAnalysis.proteinGrams}g · {(liveAnalysis.waterMl / 1000).toFixed(1)}L
                </span>
              </div>
              <div className="hidden md:block">
                <span className="text-[#8C9992] block">Objetivo</span>
                <span className="font-semibold text-white text-sm">
                  {GOAL_LABELS[form.goal]}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Entrar e Gerar Plano</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
