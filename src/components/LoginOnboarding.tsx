'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  HeartPulse,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  UserPlus,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
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
  authenticatedUserId?: string | null;
  authenticatedEmail?: string | null;
  initialProfile?: UserProfile | null;
  isEditingProfile?: boolean;
  onCompleteProfile: (profile: UserProfile) => Promise<void> | void;
  onCancelEdit?: () => void;
  onSignOut?: () => Promise<void> | void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

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

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('user already registered')) {
    return 'Este e-mail já está cadastrado. Acesse pela aba "Entrar".';
  }
  if (lower.includes('email not confirmed')) {
    return 'Esta conta ainda está pendente no Supabase Auth (criada antes de desativar a confirmação de e-mail). Confirme ou remova esse usuário em Authentication > Users no painel do Supabase, ou cadastre um novo e-mail.';
  }
  if (lower.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (lower.includes('unable to validate email address') || lower.includes('invalid email')) {
    return 'Informe um endereço de e-mail válido.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.';
  }
  return message || 'Não foi possível concluir a operação. Tente novamente.';
}

export const LoginOnboarding: React.FC<LoginOnboardingProps> = ({
  authenticatedUserId,
  authenticatedEmail,
  initialProfile,
  isEditingProfile = false,
  onCompleteProfile,
  onCancelEdit,
  onSignOut,
}) => {
  const isProfileCompletionOnly = Boolean(authenticatedUserId);

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState(
    authenticatedEmail ?? initialProfile?.email ?? ''
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<UserProfile>(
    initialProfile ?? {
      name: '',
      email: authenticatedEmail ?? '',
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const liveAnalysis = useMemo(() => calculateBiometrics(form), [form]);

  const validateBiometrics = (): UserProfile | null => {
    if (!form.name.trim()) {
      setErrorMsg('Digite seu nome para continuar.');
      return null;
    }
    if (form.weightKg < 35 || form.weightKg > 250) {
      setErrorMsg('Informe um peso válido entre 35 kg e 250 kg.');
      return null;
    }
    if (form.heightCm < 120 || form.heightCm > 230) {
      setErrorMsg('Informe uma altura válida entre 120 cm e 230 cm.');
      return null;
    }
    const cleanEmail = (authenticatedEmail || email || form.email).trim().toLowerCase();
    return {
      ...form,
      name: form.name.trim(),
      email: cleanEmail,
    };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        'Conexão com o Supabase não configurada. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Digite um e-mail válido.');
      return;
    }

    if (authMode === 'forgot') {
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        if (error) {
          setErrorMsg(translateAuthError(error.message));
        } else {
          setInfoMsg(
            'Enviamos um link de recuperação de senha para o seu e-mail.'
          );
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (authMode === 'login') {
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          setErrorMsg(translateAuthError(error.message));
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // authMode === 'signup'
    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    const validProfile = validateBiometrics();
    if (!validProfile) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: validProfile.name,
            fitnessProfile: validProfile,
          },
        },
      });

      if (error) {
        setErrorMsg(translateAuthError(error.message));
        return;
      }

      if (data.session) {
        await onCompleteProfile(validProfile);
        return;
      }

      if (data.user) {
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (loginError) {
          setErrorMsg(translateAuthError(loginError.message));
          return;
        }

        if (loginData.session) {
          await onCompleteProfile(validProfile);
        }
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? translateAuthError(err.message)
          : 'Erro ao criar conta no Supabase.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAuthenticatedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const validProfile = validateBiometrics();
    if (!validProfile) return;

    setSubmitting(true);
    try {
      await onCompleteProfile(validProfile);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar seus dados no Supabase.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showBiometricSection =
    isProfileCompletionOnly || authMode === 'signup';

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
                {isProfileCompletionOnly
                  ? isEditingProfile
                    ? 'Atualize suas informações biométricas e objetivo salvos na sua conta'
                    : 'Complete seus dados físicos para liberar seus treinos e plano alimentar'
                  : 'Entre com seu e-mail cadastrado ou crie sua conta para salvar tudo na nuvem'}
              </p>
            </div>
          </div>

          {isProfileCompletionOnly ? (
            <div className="flex items-center gap-2">
              {isEditingProfile && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3.5 py-2 rounded-xl bg-[#141B17] hover:bg-[#1D2722] border border-white/10 text-xs font-medium text-[#C8D3CD] hover:text-white transition-colors cursor-pointer"
                >
                  Voltar ao Painel
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141B17] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-xs font-medium text-[#C8D3CD] hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center p-1 rounded-xl bg-[#141B17] border border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  authMode === 'login' || authMode === 'forgot'
                    ? 'bg-[#A3E635] text-[#0A0F0D]'
                    : 'text-[#9CA9A2] hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[#A3E635] text-[#0A0F0D]'
                    : 'text-[#9CA9A2] hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Criar Conta</span>
              </button>
            </div>
          )}
        </div>

        {!isSupabaseConfigured && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3.5 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-100">
                Configuração do Supabase pendente
              </p>
              <p className="text-amber-200/80">
                Adicione as variáveis <code className="font-mono text-white">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
                <code className="font-mono text-white">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> nas variáveis de ambiente do projeto e execute o arquivo{' '}
                <code className="font-mono text-white">supabase/schema.sql</code> no SQL Editor do Supabase.
              </p>
            </div>
          </div>
        )}

        {/* Main Card Form */}
        <form
          onSubmit={
            isProfileCompletionOnly
              ? handleSaveAuthenticatedProfile
              : handleLoginSubmit
          }
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

          {infoMsg && (
            <div
              role="status"
              className="rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/35 px-4 py-3 text-xs text-[#D9F99D]"
            >
              {infoMsg}
            </div>
          )}

          {/* Auth Credentials Section (when not already authenticated) */}
          {!isProfileCompletionOnly && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-white">
                  {authMode === 'login'
                    ? 'Acessar sua conta'
                    : authMode === 'signup'
                      ? 'Cadastro com E-mail'
                      : 'Recuperar senha'}
                </h2>
                {authMode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-xs text-[#A3E635] hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                ) : authMode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-xs text-[#A3E635] hover:underline cursor-pointer"
                  >
                    Voltar ao login
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <label
                  className={`${
                    authMode === 'signup'
                      ? 'sm:col-span-4'
                      : authMode === 'forgot'
                        ? 'sm:col-span-12'
                        : 'sm:col-span-6'
                  } block space-y-1.5`}
                >
                  <span className="text-xs font-medium text-[#C8D3CD]">
                    E-mail *
                  </span>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6B7871] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setForm((prev) => ({ ...prev, email: e.target.value }));
                      }}
                      placeholder="seu@email.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white placeholder-[#5B6861] focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>
                </label>

                {authMode !== 'forgot' && (
                  <label
                    className={`${
                      authMode === 'signup' ? 'sm:col-span-4' : 'sm:col-span-6'
                    } block space-y-1.5`}
                  >
                    <span className="text-xs font-medium text-[#C8D3CD]">
                      Senha *
                    </span>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#6B7871] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={
                          authMode === 'signup'
                            ? 'new-password'
                            : 'current-password'
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white placeholder-[#5B6861] focus:outline-none focus:border-[#A3E635]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label="Mostrar ou ocultar senha"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7871] hover:text-white cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </label>
                )}

                {authMode === 'signup' && (
                  <label className="sm:col-span-4 block space-y-1.5">
                    <span className="text-xs font-medium text-[#C8D3CD]">
                      Confirmar Senha *
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white placeholder-[#5B6861] focus:outline-none focus:border-[#A3E635]"
                    />
                  </label>
                )}
              </div>

              {(authMode === 'login' || authMode === 'forgot') && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-[#8C9992]">
                    {authMode === 'login'
                      ? 'Ainda não tem cadastro? Clique em "Criar Conta" acima.'
                      : 'Você receberá um e-mail para redefinir sua senha.'}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] disabled:opacity-60 text-[#0A0F0D] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>
                      {authMode === 'login'
                        ? 'Entrar na Conta'
                        : 'Enviar Link de Recuperação'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Biometric Profile Fields (Shown during Email Sign Up or Authenticated Profile Edit/Completion) */}
          {showBiometricSection && (
            <>
              {!isProfileCompletionOnly && (
                <div className="border-t border-white/8 pt-5">
                  <h3 className="font-display text-sm font-bold text-white mb-4">
                    Seus Dados Físicos &amp; Objetivo
                  </h3>
                </div>
              )}

              {isProfileCompletionOnly && authenticatedEmail && (
                <div className="rounded-xl bg-[#0E1310] border border-white/8 px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[#8C9992]">Conta autenticada:</span>
                  <span className="font-mono text-[#A3E635]">
                    {authenticatedEmail}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <label className="sm:col-span-5 block space-y-1.5">
                  <span className="text-xs font-medium text-[#C8D3CD]">
                    Seu nome *
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex.: Carlos"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white placeholder-[#5B6861] focus:outline-none focus:border-[#A3E635]"
                  />
                </label>

                <label className="sm:col-span-2 block space-y-1.5">
                  <span className="text-xs font-medium text-[#C8D3CD]">
                    Peso (kg)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min={35}
                    max={250}
                    value={form.weightKg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weightKg: Number(e.target.value) || 60,
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
                  />
                </label>

                <label className="sm:col-span-2 block space-y-1.5">
                  <span className="text-xs font-medium text-[#C8D3CD]">
                    Altura (cm)
                  </span>
                  <input
                    type="number"
                    min={120}
                    max={230}
                    value={form.heightCm}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        heightCm: Number(e.target.value) || 170,
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
                  />
                </label>

                <label className="sm:col-span-3 block space-y-1.5">
                  <span className="text-xs font-medium text-[#C8D3CD]">
                    Sexo
                  </span>
                  <select
                    value={form.sex}
                    onChange={(e) =>
                      setForm({ ...form, sex: e.target.value as Sex })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-sm text-white focus:outline-none focus:border-[#A3E635]"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </label>
              </div>

              {/* Goal Selection */}
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
                    Ajustes opcionais (idade, cintura, rotina, nível de treino)
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
                          setForm({
                            ...form,
                            age: Number(e.target.value) || 25,
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white font-mono"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs text-[#8C9992]">
                        Cintura (cm)
                      </span>
                      <input
                        type="number"
                        min={50}
                        max={180}
                        value={form.waistCm}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            waistCm: Number(e.target.value) || 80,
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white font-mono"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs text-[#8C9992]">
                        Dias por semana
                      </span>
                      <select
                        value={form.daysPerWeek}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            daysPerWeek: Number(e.target.value),
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white"
                      >
                        <option value={3}>3 dias/semana</option>
                        <option value={4}>4 dias/semana</option>
                        <option value={5}>5 dias/semana</option>
                        <option value={6}>6 dias/semana</option>
                      </select>
                    </label>

                    <label className="block space-y-1 sm:col-span-2">
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
                        {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(
                          (k) => (
                            <option key={k} value={k}>
                              {ACTIVITY_LABELS[k]}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs text-[#8C9992]">
                        Experiência
                      </span>
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
                        {(
                          Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]
                        ).map((k) => (
                          <option key={k} value={k}>
                            {EXPERIENCE_LABELS[k]}
                          </option>
                        ))}
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
                      {liveAnalysis.targetCalories.toLocaleString('pt-BR')}{' '}
                      kcal/dia
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C9992] block">
                      Proteína · Água
                    </span>
                    <span className="font-mono font-bold text-[#22C55E] text-sm">
                      {liveAnalysis.proteinGrams}g ·{' '}
                      {(liveAnalysis.waterMl / 1000).toFixed(1)}L
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
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] disabled:opacity-60 text-[#0A0F0D] font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {isProfileCompletionOnly
                      ? isEditingProfile
                        ? 'Salvar Alterações'
                        : 'Salvar e Gerar Plano'
                      : 'Cadastrar e Gerar Plano'}
                  </span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
