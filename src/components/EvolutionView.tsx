import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  Plus,
  Ruler,
  TrendingUp,
} from 'lucide-react';
import { BiometricAnalysis, UserProfile, WeightEntry } from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface EvolutionViewProps {
  profile: UserProfile;
  analysis: BiometricAnalysis;
  history: WeightEntry[];
  onLogNewWeight: (newWeightKg: number, newWaistCm: number) => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  profile,
  analysis,
  history,
  onLogNewWeight,
}) => {
  const [showWeighModal, setShowWeighModal] = useState(false);
  const [newWeight, setNewWeight] = useState<number>(profile.weightKg);
  const [newWaist, setNewWaist] = useState<number>(profile.waistCm || 80);

  const firstEntry = history[0] ?? {
    weightKg: profile.weightKg,
    volumeKg: 30000,
    bfPercent: analysis.estimatedBfPercent,
  };
  const latestEntry = history[history.length - 1] ?? firstEntry;
  const weightDelta = Number((latestEntry.weightKg - firstEntry.weightKg).toFixed(1));
  const bfDelta = Number((latestEntry.bfPercent - firstEntry.bfPercent).toFixed(1));

  // SVG Chart coordinate mapping
  const chartPoints = useMemo(() => {
    const wMin = Math.min(...history.map((h) => h.weightKg)) - 1.5;
    const wMax = Math.max(...history.map((h) => h.weightKg)) + 1.5;
    const vMin = Math.min(...history.map((h) => h.volumeKg)) * 0.92;
    const vMax = Math.max(...history.map((h) => h.volumeKg)) * 1.05;

    const width = 560;
    const height = 190;
    const padX = 28;
    const padY = 20;

    return history.map((entry, idx) => {
      const x =
        history.length > 1
          ? padX + (idx / (history.length - 1)) * (width - padX * 2)
          : width / 2;
      const yWeight =
        height -
        padY -
        ((entry.weightKg - wMin) / Math.max(0.1, wMax - wMin)) * (height - padY * 2);
      const yVol =
        height -
        padY -
        ((entry.volumeKg - vMin) / Math.max(1, vMax - vMin)) * (height - padY * 2);
      return { x, yWeight, yVol, entry };
    });
  }, [history]);

  const weightPolyline = chartPoints.map((p) => `${p.x},${p.yWeight}`).join(' ');
  const volPolyline = chartPoints.map((p) => `${p.x},${p.yVol}`).join(' ');

  const handleSaveWeigh = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWeight >= 35 && newWeight <= 250) {
      onLogNewWeight(newWeight, newWaist);
      setShowWeighModal(false);
    }
  };

  // Estimated PRs scaled from user's body weight & experience
  const expMult =
    profile.experience === 'avancado'
      ? 1.28
      : profile.experience === 'intermediario'
        ? 1.02
        : 0.75;
  const sexMult = profile.sex === 'masculino' ? 1 : 0.65;

  const prs = [
    {
      name: 'Supino Reto com Barra',
      detail: '3 séries de trabalho · 1RM est.',
      value: `${Math.round(profile.weightKg * 1.12 * expMult * sexMult)} kg`,
      delta: '+4 kg',
    },
    {
      name: 'Agachamento Livre (Back Squat)',
      detail: 'Profundidade paralela · 5 reps',
      value: `${Math.round(profile.weightKg * 1.52 * expMult * sexMult)} kg`,
      delta: '+6 kg',
    },
    {
      name: 'Levantamento Terra Convencional',
      detail: 'Lockout firme · 3 reps',
      value: `${Math.round(profile.weightKg * 1.85 * expMult * sexMult)} kg`,
      delta: '+8 kg',
    },
  ];

  const measures = [
    {
      region: 'Peso Corporal',
      start: `${firstEntry.weightKg} kg`,
      current: `${profile.weightKg} kg`,
      diff: `${weightDelta >= 0 ? '+' : ''}${weightDelta} kg`,
    },
    {
      region: 'Cintura / Linha Umbilical',
      start: `${(profile.waistCm || 80) + (profile.goal === 'perda_peso' ? 3 : 0)} cm`,
      current: `${profile.waistCm || 80} cm`,
      diff: profile.goal === 'perda_peso' ? '-3.0 cm' : 'Estável',
    },
    {
      region: 'Massa Magra Estimada',
      start: `${Number((analysis.leanMassKg - 0.5).toFixed(1))} kg`,
      current: `${analysis.leanMassKg} kg`,
      diff: '+0.5 kg',
    },
    {
      region: 'Gordura Corporal Estimada',
      start: `${firstEntry.bfPercent}%`,
      current: `${analysis.estimatedBfPercent}%`,
      diff: `${bfDelta >= 0 ? '+' : ''}${bfDelta}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A3E635]">
            Métricas &amp; Biometria Integrada
          </div>
          <h2 className="font-display text-2xl font-bold text-white mt-0.5">
            Evolução Corporal &amp; Telemetria
          </h2>
          <p className="text-xs text-[#9CA9A2] mt-0.5">
            Protocolo ativo: {GOAL_LABELS[profile.goal]} · Projeção {analysis.weeklyProjectedChangeKg}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWeighModal((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#B4F72E] text-[#0A0F0D] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nova Pesagem</span>
        </button>
      </div>

      {/* Inline Weigh-In Form */}
      {showWeighModal && (
        <form
          onSubmit={handleSaveWeigh}
          className="apex-card p-5 flex flex-wrap items-end gap-4"
        >
          <label className="space-y-1">
            <span className="text-xs text-[#9CA9A2]">Novo Peso (kg)</span>
            <input
              type="number"
              step="0.1"
              min={35}
              max={250}
              value={newWeight}
              onChange={(e) => setNewWeight(Number(e.target.value) || profile.weightKg)}
              className="block w-36 h-9 px-3 rounded-lg bg-[#0E1310] border border-white/10 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[#9CA9A2]">Cintura Atual (cm)</span>
            <input
              type="number"
              min={50}
              max={180}
              value={newWaist}
              onChange={(e) => setNewWaist(Number(e.target.value) || 80)}
              className="block w-36 h-9 px-3 rounded-lg bg-[#0E1310] border border-white/10 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#A3E635]"
            />
          </label>
          <button
            type="submit"
            className="h-9 px-5 rounded-lg bg-[#A3E635] text-[#0A0F0D] text-xs font-bold cursor-pointer"
          >
            Atualizar Análise
          </button>
          <button
            type="button"
            onClick={() => setShowWeighModal(false)}
            className="h-9 px-4 rounded-lg bg-[#18201C] text-xs text-[#9CA9A2] hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Top 4 KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apex-card p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>PESO ATUAL</span>
            <span className="text-[#22C55E] font-mono tabular-nums">
              {weightDelta >= 0 ? `+${weightDelta}` : weightDelta} kg
            </span>
          </div>
          <div className="font-display text-3xl font-extrabold text-white tabular-nums">
            {profile.weightKg} <span className="text-sm font-normal text-[#8C9992]">kg</span>
          </div>
          <div className="text-xs text-[#9CA9A2] tabular-nums">
            Faixa ideal: {analysis.idealWeightMin}–{analysis.idealWeightMax} kg
          </div>
        </div>

        <div className="apex-card p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>% GORDURA (BF EST.)</span>
            <span className="text-[#22C55E] font-mono tabular-nums">
              {bfDelta >= 0 ? `+${bfDelta}` : bfDelta}%
            </span>
          </div>
          <div className="font-display text-3xl font-extrabold text-white tabular-nums">
            {analysis.estimatedBfPercent}
            <span className="text-sm font-normal text-[#8C9992]">%</span>
          </div>
          <div className="text-xs text-[#22C55E]">{analysis.bfClassification}</div>
        </div>

        <div className="apex-card p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>VOLUME SEMANAL CARGA</span>
            <span className="text-[#A3E635] font-mono tabular-nums">+8%</span>
          </div>
          <div className="font-display text-3xl font-extrabold text-[#A3E635] tabular-nums">
            {(latestEntry.volumeKg / 1000).toFixed(1)}k{' '}
            <span className="text-sm font-normal text-[#8C9992]">kg</span>
          </div>
          <div className="text-xs text-[#9CA9A2]">Overload progressivo ativo</div>
        </div>

        <div className="apex-card p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#8C9992]">
            <span>MASSA MAGRA ESTIMADA</span>
            <span className="text-[#22C55E] font-mono tabular-nums">
              {Math.round((analysis.leanMassKg / profile.weightKg) * 100)}%
            </span>
          </div>
          <div className="font-display text-3xl font-extrabold text-white tabular-nums">
            {analysis.leanMassKg}{' '}
            <span className="text-sm font-normal text-[#8C9992]">kg</span>
          </div>
          <div className="text-xs text-[#A3E635]">Gordura est.: {analysis.fatMassKg} kg</div>
        </div>
      </section>

      {/* Main Split: Trajectory Chart + Diagnostic & Measures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Dual Series Chart */}
          <div className="apex-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#A3E635]" />
                  <span>Trajetória Corporal vs Volume de Carga</span>
                </h3>
                <p className="text-xs text-[#8C9992] mt-0.5">
                  Correlação entre evolução de peso (kg) e tonelagem mecânica semanal
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-[#14B8A6] font-medium">● Peso Corporal (kg)</span>
                <span className="text-[#A3E635] font-medium">● Volume Carga (kg)</span>
              </div>
            </div>

            <div className="bg-[#0E1310] border border-white/6 rounded-xl p-4">
              <svg viewBox="0 0 560 190" className="w-full h-48 overflow-visible">
                {/* Horizontal subtle grid lines */}
                {[40, 85, 130, 170].map((y) => (
                  <line
                    key={y}
                    x1={20}
                    y1={y}
                    x2={540}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                ))}

                <polyline
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="2.5"
                  points={weightPolyline}
                />
                <polyline
                  fill="none"
                  stroke="#A3E635"
                  strokeWidth="3"
                  points={volPolyline}
                />

                {chartPoints.map((pt) => (
                  <g key={pt.entry.label}>
                    <circle cx={pt.x} cy={pt.yWeight} r="4" fill="#14B8A6" />
                    <circle cx={pt.x} cy={pt.yVol} r="4.5" fill="#A3E635" />
                    <text
                      x={pt.x}
                      y={186}
                      textAnchor="middle"
                      fill="#8C9992"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {pt.entry.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Personal Records */}
          <div className="apex-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#A3E635]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Recordes Estimados de Referência (PRs)
                </h3>
              </div>
              <span className="text-xs text-[#8C9992]">Calibrado para {profile.weightKg} kg</span>
            </div>

            <div className="space-y-2.5">
              {prs.map((pr) => (
                <div
                  key={pr.name}
                  className="apex-subcard p-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{pr.name}</div>
                    <div className="text-xs text-[#8C9992]">{pr.detail}</div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="font-display text-base font-bold text-white">
                      {pr.value}
                    </div>
                    <div className="text-[11px] font-mono text-[#22C55E]">{pr.delta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Biomechanical Diagnostic & Measures History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="apex-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#A3E635]" />
              <h3 className="font-display text-lg font-bold text-white">
                Diagnóstico Metabólico
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="apex-subcard p-3">
                <div className="text-[10px] uppercase text-[#8C9992]">IMC</div>
                <div className="font-display text-lg font-bold text-white tabular-nums mt-0.5">
                  {analysis.bmi}
                </div>
                <div className="text-[11px] text-[#22C55E]">{analysis.bmiCategory}</div>
              </div>
              <div className="apex-subcard p-3">
                <div className="text-[10px] uppercase text-[#8C9992]">TMB</div>
                <div className="font-display text-lg font-bold text-white tabular-nums mt-0.5">
                  {analysis.tmb}
                </div>
                <div className="text-[11px] text-[#9CA9A2]">kcal/dia</div>
              </div>
              <div className="apex-subcard p-3">
                <div className="text-[10px] uppercase text-[#8C9992]">FC Cardio</div>
                <div className="font-display text-sm font-bold text-[#A3E635] tabular-nums mt-1">
                  {analysis.cardioZone}
                </div>
                <div className="text-[11px] text-[#9CA9A2]">Zona 3–4</div>
              </div>
            </div>

            <p className="text-xs text-[#A9B5AE] leading-relaxed">
              {analysis.metabolicDiagnostic}
            </p>
          </div>

          <div className="apex-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#A3E635]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Histórico de Medidas Corporais
                </h3>
              </div>
              <span className="text-xs text-[#8C9992]">Comparativo</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-[#6B7871]">
                  <th className="py-2">Métrica</th>
                  <th className="py-2 text-right">Início</th>
                  <th className="py-2 text-right">Atual</th>
                  <th className="py-2 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 tabular-nums">
                {measures.map((m) => (
                  <tr key={m.region}>
                    <td className="py-3 text-[#C8D3CD] font-medium">{m.region}</td>
                    <td className="py-3 text-right font-mono text-[#8C9992]">{m.start}</td>
                    <td className="py-3 text-right font-mono font-bold text-white">
                      {m.current}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-[#A3E635]">
                      {m.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
