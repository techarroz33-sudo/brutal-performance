import {
  ActivityLevel,
  BiometricAnalysis,
  ExerciseItem,
  ExperienceLevel,
  FitnessGoal,
  PlannedMeal,
  RestRecoveryPlan,
  UserProfile,
  WeightEntry,
  WorkoutEnvironment,
  WorkoutPlanResult,
} from '../types';

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  crescimento_muscular: 'Crescimento Muscular',
  perda_peso: 'Perda de Peso',
  manter_forma: 'Manter em Forma',
};

export const GOAL_DESCRIPTIONS: Record<FitnessGoal, string> = {
  crescimento_muscular: 'Hipertrofia miofibrilar, superávit controlado e sobrecarga progressiva',
  perda_peso: 'Déficit calórico estratégico, alta densidade metabólica e preservação muscular',
  manter_forma: 'Equilíbrio energético, força funcional, condicionamento aeróbico e longevidade',
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  atleta: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentário (escritório, pouco movimento)',
  leve: 'Leve (1–2x treino ou caminhadas/sem)',
  moderado: 'Moderado (3–4x treino/sem)',
  intenso: 'Intenso (5–6x treino/sem)',
  atleta: 'Atleta (treino diário ou 2x/dia)',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  iniciante: 'Iniciante (0–6 meses)',
  intermediario: 'Intermediário (6m–2 anos)',
  avancado: 'Avançado (+2 anos)',
};

export function calculateBiometrics(profile: UserProfile): BiometricAnalysis {
  const heightM = Math.max(profile.heightCm, 120) / 100;
  const weight = Math.max(profile.weightKg, 35);
  const age = Math.max(profile.age, 14);

  // IMC
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));
  let bmiCategory = 'Peso Adequado';
  let bmiStatusTone: 'optimal' | 'attention' | 'alert' = 'optimal';
  if (bmi < 18.5) {
    bmiCategory = 'Abaixo do Peso';
    bmiStatusTone = 'attention';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Sobrepeso';
    bmiStatusTone = 'attention';
  } else if (bmi >= 30) {
    bmiCategory = 'Obesidade Grau I+';
    bmiStatusTone = 'alert';
  }

  // TMB (Mifflin-St Jeor)
  const sexOffset = profile.sex === 'masculino' ? 5 : -161;
  const tmb = Math.round(10 * weight + 6.25 * profile.heightCm - 5 * age + sexOffset);

  // GET (Gasto Energético Total)
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? 1.55;
  const get = Math.round(tmb * multiplier);

  // Caloric Target & Macro Split by Goal
  let targetCalories = get;
  let caloricDelta = 0;
  let caloricStrategyLabel = 'Manutenção Normocalórica';
  let proteinPerKg = 1.8;
  let fatPerKg = 0.85;
  let trainingFocusLabel = 'Condicionamento & Saúde Global';
  let weeklyProjectedChangeKg = '±0.0 kg/sem';

  if (profile.goal === 'crescimento_muscular') {
    caloricDelta = 350;
    targetCalories = get + caloricDelta;
    caloricStrategyLabel = `Superávit Controlado (+${caloricDelta} kcal)`;
    proteinPerKg = 2.1;
    fatPerKg = 0.85;
    trainingFocusLabel = 'Hipertrofia Miofibrilar & Força';
    weeklyProjectedChangeKg = '+0.25 a +0.35 kg/sem';
  } else if (profile.goal === 'perda_peso') {
    const rawDeficit = get - 480;
    targetCalories = Math.max(Math.round(tmb * 1.05), rawDeficit);
    caloricDelta = targetCalories - get;
    caloricStrategyLabel = `Déficit Metabólico (${caloricDelta} kcal)`;
    proteinPerKg = 2.2;
    fatPerKg = 0.7;
    trainingFocusLabel = 'Oxidação Lipídica & Retenção Magra';
    weeklyProjectedChangeKg = '-0.45 a -0.60 kg/sem';
  }

  const proteinGrams = Math.round(weight * proteinPerKg);
  const fatGrams = Math.round(weight * fatPerKg);
  const remainingKcal = Math.max(targetCalories - proteinGrams * 4 - fatGrams * 9, 240);
  const carbsGrams = Math.round(remainingKcal / 4);
  const fiberGrams = Math.max(25, Math.round((targetCalories / 1000) * 14));

  // Hydration: 35ml per kg, rounded to 50ml
  const waterMl = Math.max(2000, Math.round((weight * 35) / 50) * 50);

  // Body Fat Estimation (Deurenberg + Waist refinement)
  const sexNum = profile.sex === 'masculino' ? 1 : 0;
  const deurenbergBf = 1.2 * bmi + 0.23 * age - 10.8 * sexNum - 5.4;
  const waistRatio = profile.waistCm > 0 ? profile.waistCm / profile.heightCm : 0.48;
  const waistCorrection = (waistRatio - (profile.sex === 'masculino' ? 0.49 : 0.46)) * 55;
  const estimatedBfPercent = Number(
    Math.min(45, Math.max(6, deurenbergBf + waistCorrection * 0.45)).toFixed(1)
  );

  let bfClassification = 'Atlético / Ideal';
  if (profile.sex === 'masculino') {
    if (estimatedBfPercent < 10) bfClassification = 'Definição Competitiva';
    else if (estimatedBfPercent <= 16) bfClassification = 'Atlético Ideal';
    else if (estimatedBfPercent <= 21) bfClassification = 'Saudável / Moderado';
    else bfClassification = 'Acima do Ideal';
  } else {
    if (estimatedBfPercent < 16) bfClassification = 'Definição Competitiva';
    else if (estimatedBfPercent <= 23) bfClassification = 'Atlético Ideal';
    else if (estimatedBfPercent <= 29) bfClassification = 'Saudável / Moderado';
    else bfClassification = 'Acima do Ideal';
  }

  const leanMassKg = Number((weight * (1 - estimatedBfPercent / 100)).toFixed(1));
  const fatMassKg = Number((weight - leanMassKg).toFixed(1));
  const idealWeightMin = Number((19.5 * heightM * heightM).toFixed(1));
  const idealWeightMax = Number((24.2 * heightM * heightM).toFixed(1));

  // Heart rate zones (Tanaka)
  const maxHeartRate = Math.round(208 - 0.7 * age);
  const fatBurnZone = `${Math.round(maxHeartRate * 0.62)}–${Math.round(maxHeartRate * 0.74)} bpm`;
  const cardioZone = `${Math.round(maxHeartRate * 0.75)}–${Math.round(maxHeartRate * 0.87)} bpm`;

  // Diagnostic text
  let metabolicDiagnostic = '';
  if (profile.goal === 'crescimento_muscular') {
    metabolicDiagnostic = `Com TMB de ${tmb} kcal e GET de ${get} kcal, seu superávit limpo de +${caloricDelta} kcal prioriza síntese proteica (${proteinGrams}g/dia) e reposição de glicogênio (${carbsGrams}g/dia) para ganhos sólidos sem acúmulo excessivo de gordura.`;
  } else if (profile.goal === 'perda_peso') {
    metabolicDiagnostic = `Seu gasto diário estimado é ${get} kcal. Aplicando um déficit controlado para ${targetCalories} kcal/dia com proteína elevada (${proteinGrams}g/dia), você maximiza a oxidação de gordura protegendo seus ${leanMassKg} kg de massa magra.`;
  } else {
    metabolicDiagnostic = `Equilíbrio calórico calibrado em ${targetCalories} kcal/dia (GET ${get} kcal). Essa distribuição sustenta ${leanMassKg} kg de massa magra, melhora o condicionamento cardiovascular na zona ${fatBurnZone} e estabiliza energia diária.`;
  }

  return {
    bmi,
    bmiCategory,
    bmiStatusTone,
    tmb,
    get,
    targetCalories,
    caloricDelta,
    caloricStrategyLabel,
    proteinGrams,
    carbsGrams,
    fatGrams,
    fiberGrams,
    waterMl,
    estimatedBfPercent,
    bfClassification,
    leanMassKg,
    fatMassKg,
    idealWeightMin,
    idealWeightMax,
    maxHeartRate,
    fatBurnZone,
    cardioZone,
    trainingFocusLabel,
    metabolicDiagnostic,
    weeklyProjectedChangeKg,
  };
}

function scaleLoad(baseFactor: number, profile: UserProfile): number {
  const sexFactor = profile.sex === 'masculino' ? 1.0 : 0.66;
  const expFactor =
    profile.experience === 'avancado'
      ? 1.25
      : profile.experience === 'intermediario'
        ? 1.0
        : 0.72;
  const raw = profile.weightKg * baseFactor * sexFactor * expFactor;
  return Math.max(4, Math.round(raw / 2) * 2);
}

function buildSets(
  setsCount: number,
  targetReps: string,
  suggestedLoad: number,
  rpeNum: number
) {
  return Array.from({ length: setsCount }, (_, idx) => {
    const isWarmup = idx === 0 && setsCount >= 4;
    const loadKg = isWarmup ? Math.max(4, Math.round((suggestedLoad * 0.65) / 2) * 2) : suggestedLoad;
    return {
      setNum: idx + 1,
      label: isWarmup ? `${idx + 1} · Aquecimento` : `${idx + 1} · Efetiva`,
      targetReps,
      loadKg,
      reps: parseInt(targetReps, 10) || 10,
      rpe: isWarmup ? 6.0 : rpeNum,
      done: false,
    };
  });
}

type RawExerciseDef = Omit<ExerciseItem, 'sets' | 'suggestedLoadKg'> & {
  loadFactor: number;
  rpeNum: number;
  homeName?: string;
  homeEquipment?: string;
  homeLoadFactor?: number;
  homeTechniqueNote?: string;
};

function getRestRecoveryPlan(
  goal: FitnessGoal,
  profile: UserProfile
): RestRecoveryPlan {
  const restDays = Math.max(1, 7 - profile.daysPerWeek);
  const maxHr = Math.round(208 - 0.7 * profile.age);
  const z1Low = Math.round(maxHr * 0.5);
  const z1High = Math.round(maxHr * 0.62);

  if (goal === 'crescimento_muscular') {
    return {
      headline: 'Recuperação Anabólica & Descompressão Articular',
      frequencyNote: `${restDays} dia(s) de descanso programado na semana para supercompensação muscular`,
      heartRateTarget: `${z1Low}–${z1High} bpm (Zona 1 regenerativa)`,
      sleepAndNutritionTip:
        'Mantenha a ingestão proteica (100% da meta) mesmo no dia sem treino — a síntese miofibrilar permanece elevada por 24–48h após a sessão.',
      activities: [
        {
          id: 'rec-cm-1',
          title: 'Caminhada Leve ao Ar Livre (Zona 1)',
          duration: '25–35 min',
          intensity: 'Baixa (conversacional)',
          description:
            'Ritmo leve em terreno plano para aumentar fluxo sanguíneo periférico sem gerar dano muscular adicional.',
          benefit: 'Acelera remoção de metabólitos e reduz dor muscular tardia (DOMS).',
        },
        {
          id: 'rec-cm-2',
          title: 'Liberação Miofascial (Foam Roller) + Mobilidade Torácica',
          duration: '15 min',
          intensity: 'Suave',
          description:
            '30–45s por grupo muscular (quadríceps, dorsal, peitoral e panturrilhas) seguido de rotações torácicas.',
          benefit: 'Melhora amplitude para supino, agachamento e previne encurtamentos.',
        },
        {
          id: 'rec-cm-3',
          title: 'Respiração Parassimpática & Banho de Contraste',
          duration: '10 min',
          intensity: 'Relaxamento',
          description:
            'Ciclo 4-6 (4s inspiração nasal, 6s expiração lenta) + alternância térmica morno/frio no pós-banho.',
          benefit: 'Reduz cortisol basal e otimiza tônus vagal para sono profundo.',
        },
        {
          id: 'rec-cm-4',
          title: 'Higiene do Sono (7h30–8h30)',
          duration: 'Noturno',
          intensity: 'Essencial',
          description:
            'Quarto escuro e fresco, zero telas 40 min antes de dormir e magnésio bisglicinato à noite.',
          benefit: 'Pico noturno de GH e recuperação completa do sistema nervoso central (SNC).',
        },
      ],
    };
  }

  if (goal === 'perda_peso') {
    return {
      headline: 'Descanso Ativo (NEAT Elevado & Baixo Impacto)',
      frequencyNote: `${restDays} dia(s) sem treino intenso na semana para controlar fadiga e apetite`,
      heartRateTarget: `${z1Low}–${Math.round(maxHr * 0.65)} bpm (Zona 1–2 leve)`,
      sleepAndNutritionTip:
        'Evite compensar o descanso reduzindo drasticamente a proteína; priorize vegetais volumosos e 35 ml/kg de água para controlar grelina.',
      activities: [
        {
          id: 'rec-pp-1',
          title: 'Caminhada Contínua / Meta de Passos (8.000–10.000)',
          duration: '40–50 min',
          intensity: 'Leve a Moderada',
          description:
            'Divida em 2 caminhadas de 20–25 min (manhã e pós-almoço) mantendo o gasto calórico sem sobrecarga articular.',
          benefit: 'Eleva o NEAT (gasto fora do treino) e melhora sensibilidade à insulina pós-refeição.',
        },
        {
          id: 'rec-pp-2',
          title: 'Ciclismo Recreativo ou Natação Regenerativa',
          duration: '30 min',
          intensity: 'Leve (RPE 4–5)',
          description:
            'Movimento cíclico sem impacto excêntrico nos joelhos e tornozelos.',
          benefit: 'Oxidação lipídica suave poupando articulações entre sessões metabólicas.',
        },
        {
          id: 'rec-pp-3',
          title: 'Alongamento Dinâmico & Soltura de Quadril/Lombar',
          duration: '12–15 min',
          intensity: 'Suave',
          description:
            'Mobilidade de flexores do quadril, piriforme e extensões torácicas no colchonete.',
          benefit: 'Compensa horas sentado e prepara postura para agachamentos e passadas.',
        },
        {
          id: 'rec-pp-4',
          title: 'Sono Reparador & Controle de Estresse',
          duration: '7h30–8h',
          intensity: 'Essencial',
          description:
            'Sono regular evita elevação de grelina (fome) e queda de leptina (saciedade) comuns em déficit calórico.',
          benefit: 'Mantém adesão ao plano alimentar sem compulsão no fim do dia.',
        },
      ],
    };
  }

  return {
    headline: 'Regeneração Funcional, Mobilidade & Mente',
    frequencyNote: `${restDays} dia(s) regenerativos por semana para longevidade articular e vigor`,
    heartRateTarget: `${z1Low}–${z1High} bpm (Ritmo relaxado)`,
    sleepAndNutritionTip:
      'Use os dias de descanso para variar fontes de micronutrientes (frutas vermelhas, folhas escuras e gorduras boas anti-inflamatórias).',
    activities: [
      {
        id: 'rec-mf-1',
        title: 'Yoga Restaurativo ou Pilates de Solo',
        duration: '25–35 min',
        intensity: 'Suave a Leve',
        description:
          'Sequência fluida integrando respiração, alongamento de cadeia posterior e controle de core.',
        benefit: 'Aumenta flexibilidade funcional e reduz rigidez cervical/lombar.',
      },
      {
        id: 'rec-mf-2',
        title: 'Passeio de Bicicleta ou Caminhada em Parque',
        duration: '35–45 min',
        intensity: 'Leve (RPE 4)',
        description:
          'Atividade prazerosa ao ar livre com exposição solar matinal para síntese de vitamina D.',
        benefit: 'Regula ciclo circadiano, melhora humor e sustenta saúde cardiovascular.',
      },
      {
        id: 'rec-mf-3',
        title: 'Rotina de Mobilidade Matinal (Articulações)',
        duration: '10 min',
        intensity: 'Suave',
        description:
          'CARs (rotações articulares controladas) de ombros, quadris, tornozelos e coluna.',
        benefit: 'Lubrifica cápsulas articulares e preserva amplitude saudável a longo prazo.',
      },
      {
        id: 'rec-mf-4',
        title: 'Descompressão & Respiração Diafragmática',
        duration: '8 min',
        intensity: 'Relaxamento',
        description:
          'Pernas elevadas na parede (Viparita Karani) com respiração lenta antes de dormir.',
        benefit: 'Drena retenção leve nos membros inferiores e reduz tensão residual.',
      },
    ],
  };
}

export function generateWorkoutPlan(
  profile: UserProfile,
  overrideGoal?: FitnessGoal,
  environment: WorkoutEnvironment = 'academia'
): WorkoutPlanResult {
  const goal = overrideGoal ?? profile.goal;
  const restRecovery = getRestRecoveryPlan(goal, profile);

  const finalizeExercises = (rawExercises: RawExerciseDef[]): ExerciseItem[] =>
    rawExercises.map(
      ({ loadFactor, rpeNum, homeName, homeEquipment, homeLoadFactor, homeTechniqueNote, ...rest }) => {
        const useHome = environment === 'casa' && Boolean(homeName);
        const effectiveFactor = useHome ? (homeLoadFactor ?? 0) : loadFactor;
        const suggestedLoadKg = effectiveFactor === 0 ? 0 : scaleLoad(effectiveFactor, profile);
        return {
          ...rest,
          name: useHome ? homeName! : rest.name,
          equipment: useHome ? (homeEquipment ?? 'Peso Corporal') : rest.equipment,
          techniqueNote: useHome && homeTechniqueNote ? homeTechniqueNote : rest.techniqueNote,
          alternativeName: useHome ? rest.name : homeName ?? rest.alternativeName,
          suggestedLoadKg,
          sets: buildSets(rest.setsCount, rest.repsRange, suggestedLoadKg, rpeNum),
        };
      }
    );

  if (goal === 'crescimento_muscular') {
    const rawExercises: RawExerciseDef[] = [
      // Ficha A - Peito & Tríceps
      {
        id: 'cm-a1',
        splitId: 'A',
        order: 1,
        name: 'Supino Reto com Barra Olímpica',
        homeName: 'Flexão de Braço Clássica (Cadência Lenta)',
        muscleGroup: 'Peitoral Maior',
        equipment: 'Barra Olímpica 20kg',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '8–12',
        restSeconds: 120,
        targetRpe: '8.5 – 9.0',
        tempo: '3-1-1-0',
        loadFactor: 0.95,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Retração escapular firme no banco e descida controlada até o esterno.',
        homeTechniqueNote: 'Mãos na largura dos ombros, descida controlada de 3s até o peito quase tocar o chão.',
      },
      {
        id: 'cm-a2',
        splitId: 'A',
        order: 2,
        name: 'Supino Inclinado com Halteres (30°)',
        homeName: 'Flexão em V Aberta (Foco Peitoral Superior)',
        muscleGroup: 'Peitoral Superior',
        equipment: 'Halteres',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '8–12',
        restSeconds: 90,
        targetRpe: '8.5',
        tempo: '3-0-1-1',
        loadFactor: 0.34,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Alongamento máximo na base sem perder alinhamento dos cotovelos a 45°.',
        homeTechniqueNote: 'Quadril levemente elevado projetando o peito para baixo e cotovelos a 45°.',
      },
      {
        id: 'cm-a3',
        splitId: 'A',
        order: 3,
        name: 'Crucifixo na Máquina (Peck Deck) ou Polia',
        homeName: 'Flexão Arqueiro (Unilateral Alternada)',
        muscleGroup: 'Peitoral (Adução)',
        equipment: 'Peck Deck / Cabo',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '10–12',
        restSeconds: 75,
        targetRpe: '8.5',
        tempo: '2-1-1-1',
        loadFactor: 0.55,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Cotovelos semi-flexionados e pico de contração de 1s no centro.',
        homeTechniqueNote: 'Desloque o peso para um lado mantendo o braço oposto estendido para máxima tensão.',
      },
      {
        id: 'cm-a4',
        splitId: 'A',
        order: 4,
        name: 'Tríceps Testa com Barra W',
        homeName: 'Flexão Diamante (Pegada Fechada)',
        muscleGroup: 'Tríceps Cabeça Longa',
        equipment: 'Barra W',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12',
        restSeconds: 75,
        targetRpe: '8.5',
        tempo: '3-0-1-0',
        loadFactor: 0.38,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Mantenha úmeros estáveis priorizando o alongamento completo da cabeça longa.',
        homeTechniqueNote: 'Mãos próximas formando um triângulo abaixo do peito e cotovelos rentes ao corpo.',
      },
      {
        id: 'cm-a5',
        splitId: 'A',
        order: 5,
        name: 'Tríceps Corda na Polia Alta',
        homeName: 'Extensão de Tríceps no Solo (Prancha Baixa)',
        muscleGroup: 'Tríceps Lateral',
        equipment: 'Polia + Corda',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12–15',
        restSeconds: 60,
        targetRpe: '9.0',
        tempo: '2-1-1-1',
        loadFactor: 0.32,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Extensão completa ao final com pico de contração de 1s.',
        homeTechniqueNote: 'Em prancha alta, desça os antebraços ao solo mantendo cotovelos fechados e estenda.',
      },

      // Ficha B - Costas & Bíceps
      {
        id: 'cm-b1',
        splitId: 'B',
        order: 1,
        name: 'Puxada Frontal Aberta (Pulley)',
        homeName: 'Superman com Puxada Escapular no Solo',
        muscleGroup: 'Latíssimo do Dorso',
        equipment: 'Polia Alta',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12',
        restSeconds: 90,
        targetRpe: '8.5',
        tempo: '2-1-1-1',
        loadFactor: 0.78,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Inicie deprimindo as escápulas antes de flexionar os cotovelos.',
        homeTechniqueNote: 'Deitado de bruços, eleve o peito e puxe os cotovelos para trás contraindo o dorsal.',
      },
      {
        id: 'cm-b2',
        splitId: 'B',
        order: 2,
        name: 'Remada Curvada Pronada com Barra',
        homeName: 'Anjo Invertido no Solo (Reverse Snow Angel)',
        muscleGroup: 'Dorsal Médio & Romboides',
        equipment: 'Barra Olímpica',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12',
        restSeconds: 90,
        targetRpe: '8.5',
        tempo: '2-1-1-0',
        loadFactor: 0.85,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Tronco estável a ~40°, puxe em direção à linha umbilical.',
        homeTechniqueNote: 'Deitado de bruços sem tocar as mãos no chão, faça arcos amplos ativando as costas.',
      },
      {
        id: 'cm-b3',
        splitId: 'B',
        order: 3,
        name: 'Remada Unilateral (Serrote) com Halter',
        homeName: 'Puxada Isométrica em Y-W no Solo',
        muscleGroup: 'Grande Dorsal',
        equipment: 'Halter + Banco',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '10–12',
        restSeconds: 75,
        targetRpe: '8.5',
        tempo: '2-1-1-1',
        loadFactor: 0.38,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Arco amplo trazendo o cotovelo na direção do quadril.',
        homeTechniqueNote: 'Alterne braços estendidos em Y para W apertando as escápulas por 2 segundos.',
      },
      {
        id: 'cm-b4',
        splitId: 'B',
        order: 4,
        name: 'Rosca Direta com Barra W',
        homeName: 'Flexão de Bíceps com Auto-Resistência',
        muscleGroup: 'Bíceps Braquial',
        equipment: 'Barra W',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12',
        restSeconds: 75,
        targetRpe: '8.5',
        tempo: '3-0-1-1',
        loadFactor: 0.4,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Cotovelos fixos ao lado do tronco sem balanço lombar.',
        homeTechniqueNote: 'Use a mão oposta aplicando resistência contínua na subida e descida lenta de 4s.',
      },
      {
        id: 'cm-b5',
        splitId: 'B',
        order: 5,
        name: 'Rosca Martelo Alternada com Halteres',
        homeName: 'Rosca Martelo Isométrica (Auto-Resistência)',
        muscleGroup: 'Braquiorradial & Bíceps',
        equipment: 'Halteres',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '10–12',
        restSeconds: 60,
        targetRpe: '9.0',
        tempo: '2-0-1-1',
        loadFactor: 0.2,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Pegada neutra firme para espessura de braço e antebraço.',
        homeTechniqueNote: 'Punho em posição neutra, resista firmemente com a outra mão em toda a amplitude.',
      },

      // Ficha C - Pernas Foco Quadríceps & Panturrilha
      {
        id: 'cm-c1',
        splitId: 'C',
        order: 1,
        name: 'Agachamento Livre (Back Squat)',
        homeName: 'Agachamento Profundo Lento (Cadência 4s)',
        muscleGroup: 'Quadríceps & Glúteos',
        equipment: 'Rack + Barra Olímpica',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '12–15',
        restSeconds: 120,
        targetRpe: '8.5',
        tempo: '4-1-1-0',
        loadFactor: 1.25,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Bracing abdominal antes da descida, quebra paralela controlada.',
        homeTechniqueNote: 'Desça em 4 segundos, pause 1 segundo embaixo e suba sem travar os joelhos.',
      },
      {
        id: 'cm-c2',
        splitId: 'C',
        order: 2,
        name: 'Leg Press 45° Amplitude Total',
        homeName: 'Agachamento Unilateral / Afundo Reverso',
        muscleGroup: 'Quadríceps',
        equipment: 'Máquina Leg Press',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12 cada',
        restSeconds: 90,
        targetRpe: '8.5',
        tempo: '3-0-1-0',
        loadFactor: 2.1,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Amplitude profunda mantendo joelhos alinhados aos pés.',
        homeTechniqueNote: 'Concentre o peso na perna da frente mantendo o joelho alinhado com a ponta do pé.',
      },
      {
        id: 'cm-c3',
        splitId: 'C',
        order: 3,
        name: 'Cadeira Extensora (Drop-set final)',
        homeName: 'Sissy Squat Corporal (Extensão de Joelho)',
        muscleGroup: 'Reto Femoral & Vasto Medial',
        equipment: 'Máquina Extensora',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12–15',
        restSeconds: 75,
        targetRpe: '9.0',
        tempo: '2-1-1-1',
        loadFactor: 0.72,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Pausa de 1 segundo na extensão máxima de joelho.',
        homeTechniqueNote: 'Incline o tronco para trás projetando os joelhos à frente com foco total no quadríceps.',
      },
      {
        id: 'cm-c4',
        splitId: 'C',
        order: 4,
        name: 'Panturrilha em Pé na Máquina',
        homeName: 'Elevação de Panturrilha Unilateral no Solo',
        muscleGroup: 'Gastrocnêmio',
        equipment: 'Máquina Panturrilha',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '15–20',
        restSeconds: 60,
        targetRpe: '9.0',
        tempo: '2-2-1-1',
        loadFactor: 0.9,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Pausa de 2s no alongamento máximo inferior para eliminar rebote.',
        homeTechniqueNote: 'Suba na máxima amplitude em um pé só, segure 2s no topo e desça sem tocar o calcanhar.',
      },

      // Ficha D - Ombros, Trapézio & Braços Completos
      {
        id: 'cm-d1',
        splitId: 'D',
        order: 1,
        name: 'Desenvolvimento Militar com Halteres',
        homeName: 'Pike Push-up (Flexão em V para Ombros)',
        muscleGroup: 'Deltóide Anterior & Medial',
        equipment: 'Halteres + Banco 75°',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '8–12',
        restSeconds: 90,
        targetRpe: '8.5',
        tempo: '2-0-1-0',
        loadFactor: 0.28,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Core contraído, evite arqueamento lombar ao estender acima da cabeça.',
        homeTechniqueNote: 'Quadril alto em V invertido, leve o topo da cabeça à frente das mãos e empurre.',
      },
      {
        id: 'cm-d2',
        splitId: 'D',
        order: 2,
        name: 'Elevação Lateral na Polia Baixa',
        homeName: 'Prancha Toca Ombro + Elevação Lateral Isométrica',
        muscleGroup: 'Deltóide Lateral',
        equipment: 'Polia Cabo',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '12–16',
        restSeconds: 60,
        targetRpe: '9.0',
        tempo: '2-1-1-1',
        loadFactor: 0.14,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Subida no plano escapular com cotovelos liderando o movimento.',
        homeTechniqueNote: 'Mantenha o quadril estável durante os toques alternados e sustente a prancha firme.',
      },
      {
        id: 'cm-d3',
        splitId: 'D',
        order: 3,
        name: 'Face Pull + Crucifixo Inverso',
        homeName: 'W-Raise no Solo (Deltóide Posterior)',
        muscleGroup: 'Deltóide Posterior & Escápulas',
        equipment: 'Polia + Corda',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12–15',
        restSeconds: 60,
        targetRpe: '8.0',
        tempo: '2-1-1-1',
        loadFactor: 0.28,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Rotação externa controlada mantendo ombros longe das orelhas.',
        homeTechniqueNote: 'Deitado de bruços, eleve os braços formando um W com polegares apontados para cima.',
      },
      {
        id: 'cm-d4',
        splitId: 'D',
        order: 4,
        name: 'Encolhimento de Ombros com Barra/Halteres',
        homeName: 'Ponte Escapular em Prancha (Protração/Retração)',
        muscleGroup: 'Trapézio Superior',
        equipment: 'Halteres / Barra',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12–15',
        restSeconds: 60,
        targetRpe: '8.5',
        tempo: '2-2-1-0',
        loadFactor: 0.45,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Segure 2 segundos no topo sem girar os ombros.',
        homeTechniqueNote: 'Em prancha alta com braços estendidos, empurre o chão e una as escápulas com pausa.',
      },
      {
        id: 'cm-d5',
        splitId: 'D',
        order: 5,
        name: 'Supersérie: Rosca Scott + Tríceps Coice/Polia',
        homeName: 'Supersérie: Flexão Fechada + Tríceps no Solo',
        muscleGroup: 'Bíceps & Tríceps (Pump)',
        equipment: 'Banco Scott + Polia',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12 + 12',
        restSeconds: 75,
        targetRpe: '9.0',
        tempo: '2-0-1-1',
        loadFactor: 0.34,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Execute bíceps e tríceps em sequência para máxima congestão vascular.',
        homeTechniqueNote: 'Execute as variações em sequência direta para gerar máxima congestão muscular.',
      },

      // Ficha E - Posterior de Coxa, Glúteos & Core
      {
        id: 'cm-e1',
        splitId: 'E',
        order: 1,
        name: 'Stiff / Levantamento Terra Romeno (RDL)',
        homeName: 'Terra Unilateral Corporal (Avião)',
        muscleGroup: 'Posteriores & Glúteos',
        equipment: 'Barra Olímpica',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12 cada',
        restSeconds: 90,
        targetRpe: '8.5',
        tempo: '3-1-1-0',
        loadFactor: 1.05,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Empurre o quadril para trás mantendo a barra raspando nas pernas.',
        homeTechniqueNote: 'Em uma perna só, incline o tronco com coluna alinhada até sentir o posterior alongar.',
      },
      {
        id: 'cm-e2',
        splitId: 'E',
        order: 2,
        name: 'Elevação Pélvica (Hip Thrust) com Barra',
        homeName: 'Ponte de Glúteos Unilateral no Solo',
        muscleGroup: 'Glúteo Máximo',
        equipment: 'Banco + Barra',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '12–15 cada',
        restSeconds: 75,
        targetRpe: '8.5',
        tempo: '2-1-1-1',
        loadFactor: 1.15,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Queixo levemente recolhido e extensão total sem hiperextender lombar.',
        homeTechniqueNote: 'Deitado no solo, eleve o quadril com uma perna apoiada segurando 2s no topo.',
      },
      {
        id: 'cm-e3',
        splitId: 'E',
        order: 3,
        name: 'Cadeira Flexora Sentada',
        homeName: 'Ponte Posterior Marchando no Solo',
        muscleGroup: 'Isquiotibiais',
        equipment: 'Máquina Flexora',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12–15',
        restSeconds: 75,
        targetRpe: '9.0',
        tempo: '2-1-1-1',
        loadFactor: 0.65,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Contração de 1 segundo no ponto máximo de flexão.',
        homeTechniqueNote: 'Calcanhares afastados do quadril, sustente a ponte alternando passos curtos.',
      },
      {
        id: 'cm-e4',
        splitId: 'E',
        order: 4,
        name: 'Abdominal Supra na Polia + Infra Paralela',
        homeName: 'Abdominal Supra + Elevação de Pernas no Solo',
        muscleGroup: 'Core Completo',
        equipment: 'Polia Alta + Paralela',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '12–15',
        restSeconds: 60,
        targetRpe: '8.5',
        tempo: '2-1-1-1',
        loadFactor: 0.42,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Flexione a coluna expirando completamente na contração.',
        homeTechniqueNote: 'Expire completamente na subida e controle a descida das pernas sem soltar a lombar.',
      },
    ];

    return {
      goal,
      environment,
      goalTitle: 'Protocolo de Crescimento Muscular (Hipertrofia)',
      protocolSummary:
        environment === 'casa'
          ? '5 fichas (A a E) adaptadas para casa 100% com peso corporal e zero equipamentos, usando cadência lenta e variações unilaterais.'
          : 'Agora com 5 opções de fichas (A a E) combinando alta tensão mecânica, faixas de 6–12 repetições, descansos de 60–150s e variação Academia ou Casa.',
      coachGuidelines: [
        'Registre suas cargas semanalmente e busque adicionar +1 a 2 reps ou +2 kg nos compostos principais.',
        'Alterne entre as Fichas A–E conforme seus dias disponíveis na semana (3 a 5x/semana).',
        'Nos dias sem treino, siga o Protocolo de Descanso Ativo para acelerar a síntese proteica.',
      ],
      splits: [
        {
          id: 'A',
          shortTitle: 'Ficha A · Peito & Tríceps',
          fullTitle: 'Treino A — Peitoral Completo & Tríceps',
          subtitle: 'Empurrar horizontal com foco em tensão mecânica e alongamento.',
          estimatedMinutes: 55,
          targetRir: '1 a 2 RIR',
          focusTag: 'Hipertrofia Superior',
        },
        {
          id: 'B',
          shortTitle: 'Ficha B · Costas & Bíceps',
          fullTitle: 'Treino B — Dorsal, Romboides & Bíceps',
          subtitle: 'Puxadas verticais e horizontais com controle escapular completo.',
          estimatedMinutes: 55,
          targetRir: '1 a 2 RIR',
          focusTag: 'Largura & Densidade',
        },
        {
          id: 'C',
          shortTitle: 'Ficha C · Pernas (Quadríceps)',
          fullTitle: 'Treino C — Quadríceps & Panturrilha',
          subtitle: 'Compostos pesados para estímulo anabólico sistêmico de membros inferiores.',
          estimatedMinutes: 60,
          targetRir: '1 a 2 RIR',
          focusTag: 'Força & Volume Anterior',
        },
        {
          id: 'D',
          shortTitle: 'Ficha D · Ombros & Braços',
          fullTitle: 'Treino D — Deltóides 3D, Trapézio & Pump de Braços',
          subtitle: 'Ênfase em porção lateral/posterior de ombros e supersérie de braços.',
          estimatedMinutes: 52,
          targetRir: '1 RIR',
          focusTag: 'Estética & Simetria',
        },
        {
          id: 'E',
          shortTitle: 'Ficha E · Posterior & Core',
          fullTitle: 'Treino E — Isquiotibiais, Glúteos & Abdômen',
          subtitle: 'Cadeia posterior pesada e fortalecimento abdominal com carga.',
          estimatedMinutes: 54,
          targetRir: '1 a 2 RIR',
          focusTag: 'Cadeia Posterior',
        },
      ],
      exercises: finalizeExercises(rawExercises),
      restRecovery,
    };
  }

  if (goal === 'perda_peso') {
    const rawExercises: RawExerciseDef[] = [
      // Ficha A - Full-Body Metabólico + HIIT
      {
        id: 'pp-a1',
        splitId: 'A',
        order: 1,
        name: 'Agachamento Goblet com Halter',
        homeName: 'Agachamento Sumô Ritmado (Peso Corporal)',
        muscleGroup: 'Quadríceps & Core',
        equipment: 'Halter Único',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '15–20',
        restSeconds: 45,
        targetRpe: '8.0',
        tempo: '2-0-1-0',
        loadFactor: 0.34,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Ritmo dinâmico mantendo tronco ereto para elevar frequência cardíaca.',
      },
      {
        id: 'pp-a2',
        splitId: 'A',
        order: 2,
        name: 'Supino Reto com Halteres',
        homeName: 'Flexão de Braço Ritmada',
        muscleGroup: 'Peitoral & Tríceps',
        equipment: 'Halteres',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '12–15',
        restSeconds: 45,
        targetRpe: '8.0',
        tempo: '2-0-1-0',
        loadFactor: 0.3,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Transição rápida após o agachamento para maximizar gasto energético.',
      },
      {
        id: 'pp-a3',
        splitId: 'A',
        order: 3,
        name: 'Remada Baixa Triângulo na Polia',
        homeName: 'Superman Dinâmico (Puxada Dorsal no Solo)',
        muscleGroup: 'Costas & Postura',
        equipment: 'Polia Baixa',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '15',
        restSeconds: 45,
        targetRpe: '8.0',
        tempo: '2-1-1-0',
        loadFactor: 0.62,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Puxada firme mantendo postura neutra e abdômen ativo.',
        homeTechniqueNote: 'Deitado de bruços, puxe os cotovelos para trás em ritmo contínuo ativando o dorsal.',
      },
      {
        id: 'pp-a4',
        splitId: 'A',
        order: 4,
        name: 'Thruster com Halteres (Agacha + Desenvolve)',
        homeName: 'Burpee Clássico / Meio-Burpee Dinâmico',
        muscleGroup: 'Corpo Todo (Composto)',
        equipment: 'Halteres',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '12–14',
        restSeconds: 50,
        targetRpe: '8.5',
        tempo: '1-0-X-0',
        loadFactor: 0.2,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Use o impulso dos quadris para empurrar os halteres acima da cabeça.',
        homeTechniqueNote: 'Movimento fluido de corpo todo alternando prancha, agachamento e extensão vertical.',
      },
      {
        id: 'pp-a5',
        splitId: 'A',
        order: 5,
        name: 'HIIT Esteira / Bike (Tiros 30s/30s)',
        homeName: 'HIIT Polichinelo + Corrida Estacionária (30s/30s)',
        muscleGroup: 'Sistema Cardiovascular (EPOC)',
        equipment: 'Bike / Esteira',
        homeEquipment: 'Peso Corporal',
        setsCount: 8,
        repsRange: '30s ON / 30s OFF',
        restSeconds: 30,
        targetRpe: '9.0',
        tempo: 'Intervalado',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Alcance 85–90% da FC máxima nos tiros para alto consumo pós-exercício.',
      },

      // Ficha B - Superiores Bi-sets & Remo
      {
        id: 'pp-b1',
        splitId: 'B',
        order: 1,
        name: 'Puxada Aberta + Flexão de Braço (Bi-set)',
        homeName: 'Superman Escapular + Flexão de Braço (Bi-set)',
        muscleGroup: 'Dorsal & Peitoral',
        equipment: 'Polia + Peso Corporal',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '12–15',
        restSeconds: 50,
        targetRpe: '8.0',
        tempo: '2-0-1-0',
        loadFactor: 0.65,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Execute a flexão imediatamente após fechar a puxada sem descanso.',
        homeTechniqueNote: 'Execute a flexão imediatamente após fechar as repetições dorsais no solo.',
      },
      {
        id: 'pp-b2',
        splitId: 'B',
        order: 2,
        name: 'Desenvolvimento em Pé com Barra',
        homeName: 'Pike Push-up Ritmado (Ombros & Core)',
        muscleGroup: 'Ombros & Core',
        equipment: 'Barra Reta',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '10–14',
        restSeconds: 45,
        targetRpe: '8.0',
        tempo: '2-0-1-0',
        loadFactor: 0.4,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Estabilidade total em pé exige maior recrutamento calórico do core.',
        homeTechniqueNote: 'Quadril elevado em V invertido com foco contínuo nos ombros e abdômen firme.',
      },
      {
        id: 'pp-b3',
        splitId: 'B',
        order: 3,
        name: 'Mountain Climber + Prancha Dinâmica',
        homeName: 'Mountain Climber + Prancha Toca Ombro',
        muscleGroup: 'Core & Metabólico',
        equipment: 'Solo / Colchonete',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '40 seg',
        restSeconds: 30,
        targetRpe: '8.5',
        tempo: 'Contínuo',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Quadril alinhado e joelhos acelerando em direção ao peito.',
      },
      {
        id: 'pp-b4',
        splitId: 'B',
        order: 4,
        name: 'Remo Indoor (RowErg) Ritmo Intenso',
        homeName: 'Sprawl / Meio-Burpee Sem Impacto',
        muscleGroup: 'Cardio Full-Body',
        equipment: 'Remo Ergométrico',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '45 seg',
        restSeconds: 45,
        targetRpe: '8.5',
        tempo: 'Forte',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Ritmo constante gerando alta demanda respiratória.',
      },

      // Ficha C - Inferiores Metabólico & Queima
      {
        id: 'pp-c1',
        splitId: 'C',
        order: 1,
        name: 'Passada / Afundo Caminhando com Halteres',
        homeName: 'Afundo Alternado no Lugar',
        muscleGroup: 'Glúteos & Quadríceps',
        equipment: 'Halteres',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '20 passos',
        restSeconds: 50,
        targetRpe: '8.5',
        tempo: 'Contínuo',
        loadFactor: 0.22,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Passo firme mantendo joelho da frente alinhado com a ponta do pé.',
      },
      {
        id: 'pp-c2',
        splitId: 'C',
        order: 2,
        name: 'Leg Press Horizontal + Salto no Step',
        homeName: 'Agachamento + Salto Suave (Jump Squat)',
        muscleGroup: 'Membros Inferiores & Potência',
        equipment: 'Leg Press + Step',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '15 + 10',
        restSeconds: 55,
        targetRpe: '8.5',
        tempo: '2-0-X-0',
        loadFactor: 1.5,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Aterrissagem macia com joelhos levemente flexionados.',
      },
      {
        id: 'pp-c3',
        splitId: 'C',
        order: 3,
        name: 'Levantamento Terra Sumô com Kettlebell',
        homeName: 'Bom Dia Corporal + Agachamento Sumô (Combo)',
        muscleGroup: 'Adutores, Glúteos & Lombar',
        equipment: 'Kettlebell Pesado',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '15',
        restSeconds: 45,
        targetRpe: '8.0',
        tempo: '2-0-1-0',
        loadFactor: 0.4,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Coluna neutra e pressão firme nos calcanhares.',
      },
      {
        id: 'pp-c4',
        splitId: 'C',
        order: 4,
        name: 'Cardio Zona 2 Inclinado (Finalizador)',
        homeName: 'Corrida Estacionária + Joelho Alto (Finalizador)',
        muscleGroup: 'Oxidação Lipídica',
        equipment: 'Esteira Inclinada 8%',
        homeEquipment: 'Peso Corporal',
        setsCount: 1,
        repsRange: '20 min',
        restSeconds: 0,
        targetRpe: '7.0',
        tempo: 'Contínuo',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 7.0,
        techniqueNote: 'Caminhada inclinada vigorosa na zona alvo de queima de gordura.',
        homeTechniqueNote: 'Mantenha ritmo contínuo e respiração ativa na zona alvo de queima de gordura.',
      },

      // Ficha D - Circuito Kettlebell, Sled & Core
      {
        id: 'pp-d1',
        splitId: 'D',
        order: 1,
        name: 'Kettlebell Swing Russo',
        homeName: 'Swing Corporal Explosivo (Hip Hinge Dinâmico)',
        muscleGroup: 'Posteriores, Glúteos & Cardio',
        equipment: 'Kettlebell',
        homeEquipment: 'Peso Corporal',
        setsCount: 5,
        repsRange: '20',
        restSeconds: 40,
        targetRpe: '8.5',
        tempo: 'Explosivo',
        loadFactor: 0.24,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Extensão potente de quadril, braços apenas conduzem a carga.',
        homeTechniqueNote: 'Extensão potente de quadril coordenada com balanço rápido dos braços à frente.',
      },
      {
        id: 'pp-d2',
        splitId: 'D',
        order: 2,
        name: 'Empurrada de Trenó (Sled Push) / Esteira Desligada',
        homeName: 'Bear Crawl (Caminhada do Urso)',
        muscleGroup: 'Pernas, Core & Condicionamento',
        equipment: 'Sled / Esteira',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '30 seg',
        restSeconds: 50,
        targetRpe: '9.0',
        tempo: 'Máximo',
        loadFactor: 1.0,
        homeLoadFactor: 0,
        rpeNum: 9.0,
        techniqueNote: 'Passos curtos e rápidos mantendo coluna alinhada.',
      },
      {
        id: 'pp-d3',
        splitId: 'D',
        order: 3,
        name: 'Corda Naval (Battle Rope) Alternada',
        homeName: 'Shadow Boxing (Soco Rápido sem Carga)',
        muscleGroup: 'Ombros, Braços & EPOC',
        equipment: 'Corda Naval',
        homeEquipment: 'Peso Corporal',
        setsCount: 5,
        repsRange: '30 seg',
        restSeconds: 30,
        targetRpe: '8.5',
        tempo: 'Velocidade',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Base atlética semi-agachada acelerando ondas sem travar respiração.',
        homeTechniqueNote: 'Base semi-agachada desferindo socos rápidos e contínuos mantendo o core firme.',
      },
      {
        id: 'pp-d4',
        splitId: 'D',
        order: 4,
        name: 'Abdominal Bicicleta + Prancha Lateral',
        homeName: 'Abdominal Bicicleta + Prancha Lateral',
        muscleGroup: 'Oblíquos & Transverso',
        equipment: 'Colchonete',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '30 reps + 30s',
        restSeconds: 30,
        targetRpe: '8.0',
        tempo: 'Controlado',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Rotação real de tronco levando ombro na direção do joelho oposto.',
      },

      // Ficha E - Resistência Muscular & Cardio Tabata
      {
        id: 'pp-e1',
        splitId: 'E',
        order: 1,
        name: 'Agachamento Sumô + Remada Alta (Complexo)',
        homeName: 'Agachamento Sumô + Elevação de Braços',
        muscleGroup: 'Pernas, Ombros & Core',
        equipment: 'Barra / Kettlebell',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '15',
        restSeconds: 45,
        targetRpe: '8.0',
        tempo: 'Contínuo',
        loadFactor: 0.36,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Movimento fluido unindo membros inferiores e superiores.',
      },
      {
        id: 'pp-e2',
        splitId: 'E',
        order: 2,
        name: 'Step-Up Dinâmico no Caixote',
        homeName: 'Afundo Reverso com Joelho Alto Alternado',
        muscleGroup: 'Glúteos & Cardio',
        equipment: 'Box / Step + Halteres',
        homeEquipment: 'Peso Corporal',
        setsCount: 3,
        repsRange: '14 cada perna',
        restSeconds: 40,
        targetRpe: '8.0',
        tempo: 'Ritmo Firme',
        loadFactor: 0.16,
        homeLoadFactor: 0,
        rpeNum: 8.0,
        techniqueNote: 'Impulsione pelo calcanhar da perna que está em cima do degrau.',
        homeTechniqueNote: 'Impulsione pelo calcanhar da perna da frente trazendo o joelho de trás ao alto.',
      },
      {
        id: 'pp-e3',
        splitId: 'E',
        order: 3,
        name: 'Clean & Press Alternado com Halter',
        homeName: 'Inchworm + Flexão Explosiva',
        muscleGroup: 'Corpo Todo (Potência)',
        equipment: 'Halter Único',
        homeEquipment: 'Peso Corporal',
        setsCount: 4,
        repsRange: '10–12',
        restSeconds: 45,
        targetRpe: '8.5',
        tempo: 'Explosivo',
        loadFactor: 0.22,
        homeLoadFactor: 0,
        rpeNum: 8.5,
        techniqueNote: 'Troca coordenada na altura do peito mantendo coluna reta.',
        homeTechniqueNote: 'Caminhe com as mãos até a prancha, faça a flexão e volte mantendo coluna alinhada.',
      },
      {
        id: 'pp-e4',
        splitId: 'E',
        order: 4,
        name: 'Protocolo Tabata Bike / Corda (20s/10s × 8)',
        homeName: 'Protocolo Tabata Corrida no Lugar + Polichinelo',
        muscleGroup: 'Capacidade Metabólica Máxima',
        equipment: 'AirBike / Corda',
        homeEquipment: 'Peso Corporal',
        setsCount: 8,
        repsRange: '20s ON / 10s OFF',
        restSeconds: 10,
        targetRpe: '9.5',
        tempo: 'Tabata',
        loadFactor: 0,
        homeLoadFactor: 0,
        rpeNum: 9.5,
        techniqueNote: '4 minutos totais de esforço máximo seguido de 3 min de desaquecimento.',
      },
    ];

    return {
      goal,
      environment,
      goalTitle: 'Protocolo de Perda de Peso & Definição Metabólica',
      protocolSummary:
        environment === 'casa'
          ? '5 fichas (A a E) em casa 100% com peso corporal e sem equipamentos, combinando circuitos metabólicos, HIIT e Tabata.'
          : '5 opções de fichas (A a E) com alta densidade metabólica, descansos curtos (30–50s), circuitos compostos e finalizadores HIIT/Tabata para máxima oxidação lipídica.',
      coachGuidelines: [
        'Respeite rigorosamente os descansos curtos (30–50s) para manter a frequência cardíaca elevada.',
        'Alterne fichas de força metabólica (A, B, C) com circuitos de condicionamento (D, E).',
        'Nos dias sem treino pesado, aplique o Descanso Ativo (8.000+ passos) para sustentar o déficit.',
      ],
      splits: [
        {
          id: 'A',
          shortTitle: 'Ficha A · Full-Body + HIIT',
          fullTitle: 'Treino A — Circuito Composto & Tiros HIIT',
          subtitle: 'Alto recrutamento muscular global combinado a tiros intervalados.',
          estimatedMinutes: 46,
          targetRir: '2 RIR',
          focusTag: 'Alta Densidade Calórica',
        },
        {
          id: 'B',
          shortTitle: environment === 'casa' ? 'Ficha B · Superiores & Core' : 'Ficha B · Superiores & Remo',
          fullTitle:
            environment === 'casa'
              ? 'Treino B — Bi-sets Superiores, Core & Cardio Corporal'
              : 'Treino B — Bi-sets Superiores, Core & Cardio',
          subtitle: 'Alternância agonista/antagonista sem perda de ritmo cardíaco.',
          estimatedMinutes: 44,
          targetRir: '2 RIR',
          focusTag: 'Metabólico Superior',
        },
        {
          id: 'C',
          shortTitle: 'Ficha C · Inferiores & Queima',
          fullTitle:
            environment === 'casa'
              ? 'Treino C — Pernas Dinâmicas & Cardio Finalizador'
              : 'Treino C — Pernas Dinâmicas & Esteira Inclinada',
          subtitle: 'Grande demanda energética nos membros inferiores + oxidação lipídica.',
          estimatedMinutes: 50,
          targetRir: '2 RIR',
          focusTag: 'Oxidação Lipídica',
        },
        {
          id: 'D',
          shortTitle: environment === 'casa' ? 'Ficha D · Potência & Core' : 'Ficha D · Kettlebell & Corda',
          fullTitle:
            environment === 'casa'
              ? 'Treino D — Condicionamento Corporal, Agilidade & Core'
              : 'Treino D — Condicionamento Atlântico, Sled & Core',
          subtitle: 'Potência metabólica com mínimo estresse excêntrico.',
          estimatedMinutes: 42,
          targetRir: '1 a 2 RIR',
          focusTag: 'EPOC Máximo',
        },
        {
          id: 'E',
          shortTitle: 'Ficha E · Complexos & Tabata',
          fullTitle: 'Treino E — Complexos Musculares & Finalizador Tabata',
          subtitle: 'Sessão enxuta e intensa ideal para dias corridos.',
          estimatedMinutes: 38,
          targetRir: '1 a 2 RIR',
          focusTag: 'Express Queima',
        },
      ],
      exercises: finalizeExercises(rawExercises),
      restRecovery,
    };
  }

  // Goal: manter_forma
  const rawExercises: RawExerciseDef[] = [
    // Ficha A - Força Funcional Superior
    {
      id: 'mf-a1',
      splitId: 'A',
      order: 1,
      name: 'Supino Reto com Halteres',
      homeName: 'Flexão de Braço Clássica Controlada',
      muscleGroup: 'Peitoral & Estabilizadores',
      equipment: 'Halteres',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '10–12',
      restSeconds: 75,
      targetRpe: '7.5',
      tempo: '2-1-1-0',
      loadFactor: 0.32,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Execução limpa e simétrica focando saúde dos ombros.',
    },
    {
      id: 'mf-a2',
      splitId: 'A',
      order: 2,
      name: 'Remada Apoiada no Banco Inclinado',
      homeName: 'Remada Escapular no Solo (Prone W-Pull)',
      muscleGroup: 'Dorsal & Postura',
      equipment: 'Halteres + Banco',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12–15',
      restSeconds: 75,
      targetRpe: '7.5',
      tempo: '2-1-1-0',
      loadFactor: 0.28,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Fortalecimento postural sem sobrecarga na região lombar.',
    },
    {
      id: 'mf-a3',
      splitId: 'A',
      order: 3,
      name: 'Desenvolvimento Arnold com Halteres',
      homeName: 'Flexão em V (Pike Push-up) Controlada',
      muscleGroup: 'Ombros Completos',
      equipment: 'Halteres',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '8–12',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: '2-0-1-0',
      loadFactor: 0.2,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Rotação fluida trabalhando todas as porções do deltóide.',
      homeTechniqueNote: 'Amplitude controlada em V invertido fortalecendo ombros e escápulas.',
    },
    {
      id: 'mf-a4',
      splitId: 'A',
      order: 4,
      name: 'Puxada Neutra Fechada',
      homeName: 'Anjo Invertido + Retração Escapular',
      muscleGroup: 'Dorsal & Postura',
      equipment: 'Polia Alta',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: '2-1-1-0',
      loadFactor: 0.72,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Pegada neutra protege punhos e cotovelos com excelente ativação.',
      homeTechniqueNote: 'Movimento amplo no solo protegendo ombros com forte ativação dorsal.',
    },
    {
      id: 'mf-a5',
      splitId: 'A',
      order: 5,
      name: 'Prancha Abdominal + Pallof Press',
      homeName: 'Prancha Abdominal + Toca Ombro',
      muscleGroup: 'Core Anti-Rotacional',
      equipment: 'Polia Média + Solo',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12 cada lado',
      restSeconds: 45,
      targetRpe: '7.0',
      tempo: '2-2-1-0',
      loadFactor: 0.2,
      homeLoadFactor: 0,
      rpeNum: 7.0,
      techniqueNote: 'Estabilidade profunda de coluna para saúde funcional diária.',
    },

    // Ficha B - Pernas & Mobilidade
    {
      id: 'mf-b1',
      splitId: 'B',
      order: 1,
      name: 'Agachamento Frontal ou Taça (Goblet)',
      homeName: 'Agachamento Livre Controlado (Pausa na Base)',
      muscleGroup: 'Quadríceps & Core',
      equipment: 'Halter / Barra',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12–15',
      restSeconds: 75,
      targetRpe: '7.5',
      tempo: '3-1-1-0',
      loadFactor: 0.45,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Excelente mobilidade de tornozelo e quadril com tronco vertical.',
    },
    {
      id: 'mf-b2',
      splitId: 'B',
      order: 2,
      name: 'Levantamento Terra Romeno com Halteres',
      homeName: 'Bom Dia Corporal (Hip Hinge)',
      muscleGroup: 'Posteriores & Glúteos',
      equipment: 'Halteres',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12–15',
      restSeconds: 75,
      targetRpe: '7.5',
      tempo: '3-1-1-0',
      loadFactor: 0.32,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Mobilidade dinâmica de isquiotibiais e proteção lombar.',
    },
    {
      id: 'mf-b3',
      splitId: 'B',
      order: 3,
      name: 'Elevação Pélvica (Hip Thrust)',
      homeName: 'Ponte de Glúteos Unilateral no Solo',
      muscleGroup: 'Glúteos & Estabilidade',
      equipment: 'Barra / Máquina',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12 cada',
      restSeconds: 75,
      targetRpe: '8.0',
      tempo: '2-1-1-1',
      loadFactor: 0.9,
      homeLoadFactor: 0,
      rpeNum: 8.0,
      techniqueNote: 'Pausa de 1s no topo alinhando quadril e joelhos a 90°.',
    },
    {
      id: 'mf-b4',
      splitId: 'B',
      order: 4,
      name: 'Afundo Búlgaro Guiado',
      homeName: 'Afundo Reverso Controlado',
      muscleGroup: 'Unilateral Pernas',
      equipment: 'Halteres + Banco',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '10 cada',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: '2-0-1-0',
      loadFactor: 0.18,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Corrige assimetrias musculares entre os membros inferiores.',
    },

    // Ficha C - Condicionamento Cardiovascular & Core
    {
      id: 'mf-c1',
      splitId: 'C',
      order: 1,
      name: 'Bike ou Corrida Zona 2 (Aeróbico Base)',
      homeName: 'Corrida Estacionária Leve / Marcha Vigorosa Zona 2',
      muscleGroup: 'Capacidade Cardiorrespiratória',
      equipment: 'Bike / Esteira',
      homeEquipment: 'Peso Corporal',
      setsCount: 1,
      repsRange: '25 min',
      restSeconds: 0,
      targetRpe: '6.5',
      tempo: 'Ritmo Constante',
      loadFactor: 0,
      homeLoadFactor: 0,
      rpeNum: 6.5,
      techniqueNote: 'Ritmo conversacional sustentável para saúde mitocondrial e VO2.',
    },
    {
      id: 'mf-c2',
      splitId: 'C',
      order: 2,
      name: 'Farmer Walk (Caminhada do Fazendeiro)',
      homeName: 'Prancha Lateral com Sustentação Isométrica',
      muscleGroup: 'Pegada, Estabilidade & Core',
      equipment: 'Halteres / Kettlebells',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '30s cada lado',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: 'Postura Firme',
      loadFactor: 0.36,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Ombros encaixados e passos controlados sem oscilar o tronco.',
      homeTechniqueNote: 'Ombros encaixados e quadril elevado mantendo alinhamento lateral firme.',
    },
    {
      id: 'mf-c3',
      splitId: 'C',
      order: 3,
      name: 'Face Pull + Rotação Externa',
      homeName: 'Y-T-W Escapular no Solo',
      muscleGroup: 'Saúde Escapular',
      equipment: 'Polia / Elástico',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '15',
      restSeconds: 45,
      targetRpe: '7.0',
      tempo: '2-1-1-1',
      loadFactor: 0.22,
      homeLoadFactor: 0,
      rpeNum: 7.0,
      techniqueNote: 'Previne encurtamentos anteriores e melhora alinhamento cervical.',
    },
    {
      id: 'mf-c4',
      splitId: 'C',
      order: 4,
      name: 'Dead Bug & Bird Dog (Core Integrado)',
      homeName: 'Dead Bug & Bird Dog (Core Integrado)',
      muscleGroup: 'Estabilização Lombar',
      equipment: 'Colchonete',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12 alternados',
      restSeconds: 45,
      targetRpe: '7.0',
      tempo: 'Controlado',
      loadFactor: 0,
      homeLoadFactor: 0,
      rpeNum: 7.0,
      techniqueNote: 'Coordenação respiratória mantendo lombar neutra.',
    },

    // Ficha D - Full-Body Unilateral & Potência Leve
    {
      id: 'mf-d1',
      splitId: 'D',
      order: 1,
      name: 'Supino Unilateral com Halter',
      homeName: 'Flexão Arqueiro / Assimétrica',
      muscleGroup: 'Peitoral & Anti-Rotação',
      equipment: 'Halter + Banco',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '10 cada',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: '2-1-1-0',
      loadFactor: 0.26,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Core travado impede giro do quadril durante a execução unilateral.',
    },
    {
      id: 'mf-d2',
      splitId: 'D',
      order: 2,
      name: 'Remada Unilateral no Cabo em Pé',
      homeName: 'Superman Unilateral Alternado (Braço e Perna Opostos)',
      muscleGroup: 'Dorsal & Core',
      equipment: 'Polia Média',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12 cada',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: '2-1-1-0',
      loadFactor: 0.34,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Puxada integrada com postura atlética estável.',
      homeTechniqueNote: 'Eleve braço e perna opostos de forma controlada mantendo coluna neutra.',
    },
    {
      id: 'mf-d3',
      splitId: 'D',
      order: 3,
      name: 'Terra Unilateral (Single-Leg RDL)',
      homeName: 'Avião / Terra Unilateral Corporal',
      muscleGroup: 'Equilíbrio, Posterior & Tornozelo',
      equipment: 'Halter',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '10 cada',
      restSeconds: 60,
      targetRpe: '7.5',
      tempo: '3-0-1-0',
      loadFactor: 0.2,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Excelente para propriocepção e prevenção de entorses.',
    },
    {
      id: 'mf-d4',
      splitId: 'D',
      order: 4,
      name: 'Medicine Ball Slam / Arremesso Leve',
      homeName: 'Agachamento com Alcance Vertical Dinâmico',
      muscleGroup: 'Potência & Coordenação',
      equipment: 'Medicine Ball',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '12',
      restSeconds: 45,
      targetRpe: '7.5',
      tempo: 'Dinâmico',
      loadFactor: 0.12,
      homeLoadFactor: 0,
      rpeNum: 7.5,
      techniqueNote: 'Mantém fibras rápidas ativas com baixo risco articular.',
    },

    // Ficha E - Mobilidade, Postura & Condicionamento Suave
    {
      id: 'mf-e1',
      splitId: 'E',
      order: 1,
      name: 'Fluxo Mobilidade: World’s Greatest Stretch',
      homeName: 'World’s Greatest Stretch (Rotação Torácica)',
      muscleGroup: 'Quadril, Torácica & Posterior',
      equipment: 'Colchonete',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '6 cada lado',
      restSeconds: 30,
      targetRpe: '6.0',
      tempo: 'Lento e Fluido',
      loadFactor: 0,
      homeLoadFactor: 0,
      rpeNum: 6.0,
      techniqueNote: 'Acompanhe a mão com o olhar na abertura torácica respirando fundo.',
    },
    {
      id: 'mf-e2',
      splitId: 'E',
      order: 2,
      name: 'Agachamento Profundo Isométrico (Pry Squat)',
      homeName: 'Agachamento Profundo com Abertura de Quadril',
      muscleGroup: 'Tornozelos & Quadril',
      equipment: 'Kettlebell Leve',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '30 seg',
      restSeconds: 45,
      targetRpe: '6.5',
      tempo: 'Isometria',
      loadFactor: 0.14,
      homeLoadFactor: 0,
      rpeNum: 6.5,
      techniqueNote: 'Empurre suavemente os joelhos para fora com os cotovelos.',
    },
    {
      id: 'mf-e3',
      splitId: 'E',
      order: 3,
      name: 'Prancha RKC + Hollow Body Hold',
      homeName: 'Prancha RKC + Hollow Body Hold',
      muscleGroup: 'Core Profundo',
      equipment: 'Colchonete',
      homeEquipment: 'Peso Corporal',
      setsCount: 3,
      repsRange: '25s + 25s',
      restSeconds: 45,
      targetRpe: '7.0',
      tempo: 'Isometria',
      loadFactor: 0,
      homeLoadFactor: 0,
      rpeNum: 7.0,
      techniqueNote: 'Lombar pressionada contra o solo durante o Hollow Hold.',
    },
    {
      id: 'mf-e4',
      splitId: 'E',
      order: 4,
      name: 'Elíptico / Remo Leve Zona 2',
      homeName: 'Marcha Vigorosa ou Polichinelos Leves',
      muscleGroup: 'Saúde Cardiovascular',
      equipment: 'Elíptico / Remo',
      homeEquipment: 'Peso Corporal',
      setsCount: 1,
      repsRange: '20 min',
      restSeconds: 0,
      targetRpe: '6.5',
      tempo: 'Constante',
      loadFactor: 0,
      homeLoadFactor: 0,
      rpeNum: 6.5,
      techniqueNote: 'Finalização leve promovendo bem-estar e recuperação circulatória.',
    },
  ];

  return {
    goal,
    environment,
    goalTitle: 'Protocolo Manter em Forma (Força Funcional & Longevidade)',
    protocolSummary:
      environment === 'casa'
        ? '5 fichas (A a E) em casa 100% com peso corporal e sem equipamentos, unindo força funcional, mobilidade articular e cardio.'
        : '5 opções de fichas (A a E) unindo força equilibrada, trabalho unilateral, cardio Zona 2 e mobilidade articular — adaptável para Academia ou Casa.',
    coachGuidelines: [
      'Mantenha consistência de 3 a 4 sessões semanais escolhendo entre as Fichas A–E.',
      'Combine força funcional com 20–25 minutos de cardio Zona 2 para saúde cardiovascular e disposição.',
      'Nos dias livres, pratique a recomendação de Yoga/Caminhada em parque para longevidade.',
    ],
    splits: [
      {
        id: 'A',
        shortTitle: 'Ficha A · Força Superior',
        fullTitle: 'Treino A — Empurrar, Puxar & Estabilidade',
        subtitle: 'Equilíbrio biomecânico de ombros, peitoral, costas e core.',
        estimatedMinutes: 45,
        targetRir: '2 a 3 RIR',
        focusTag: 'Equilíbrio Postural',
      },
      {
        id: 'B',
        shortTitle: 'Ficha B · Pernas & Mobilidade',
        fullTitle: 'Treino B — Força Unilateral & Cadeia Posterior',
        subtitle: 'Preservação de massa magra inferior e estabilidade de quadril.',
        estimatedMinutes: 46,
        targetRir: '2 a 3 RIR',
        focusTag: 'Força Funcional',
      },
      {
        id: 'C',
        shortTitle: 'Ficha C · Cardio Zona 2 & Core',
        fullTitle: 'Treino C — Base Aeróbica & Prevenção Articular',
        subtitle: 'Saúde cardiorrespiratória, pegada e estabilidade lombar.',
        estimatedMinutes: 42,
        targetRir: '3 RIR',
        focusTag: 'Longevidade & VO2',
      },
      {
        id: 'D',
        shortTitle: 'Ficha D · Unilateral & Potência',
        fullTitle: 'Treino D — Simetria Muscular & Coordenação',
        subtitle: 'Exercícios unilaterais anti-rotacionais para proteção articular.',
        estimatedMinutes: 44,
        targetRir: '2 a 3 RIR',
        focusTag: 'Propriocepção',
      },
      {
        id: 'E',
        shortTitle: 'Ficha E · Fluxo & Postura',
        fullTitle: 'Treino E — Mobilidade Global, Core & Cardio Suave',
        subtitle: 'Sessão de manutenção postural e liberação de tensões diárias.',
        estimatedMinutes: 38,
        targetRir: '3 RIR',
        focusTag: 'Bem-Estar & Mobilidade',
      },
    ],
    exercises: finalizeExercises(rawExercises),
    restRecovery,
  };
}

export function generatePlannedMeals(
  profile: UserProfile,
  analysis: BiometricAnalysis
): PlannedMeal[] {
  const factor = analysis.targetCalories / 2200;
  const scale = (n: number) => Math.round(n * factor);

  if (profile.goal === 'crescimento_muscular') {
    return [
      {
        id: 'meal-1',
        order: '01',
        time: '07:30',
        title: 'Café da Manhã Anabólico',
        description:
          'Omelete de 3 ovos inteiros com aveia em flocos finos, 1 banana prata com canela e café sem açúcar.',
        kcal: scale(520),
        proteinG: scale(34),
        carbsG: scale(52),
        fatG: scale(18),
        fiberG: 7,
        tag: 'Café Matinal',
        confirmed: true,
      },
      {
        id: 'meal-2',
        order: '02',
        time: '12:45',
        title: 'Almoço Pós-Treino Hipertrófico',
        description:
          'Arroz integral ou branco cozido, peito de frango grelhado em tiras, brócolis no vapor e 1 fio de azeite extra virgem.',
        kcal: scale(740),
        proteinG: scale(56),
        carbsG: scale(82),
        fatG: scale(16),
        fiberG: 10,
        tag: 'Janela Anabólica',
        confirmed: true,
      },
      {
        id: 'meal-3',
        order: '03',
        time: '16:30',
        title: 'Lanche da Tarde · Anti-Catabólico',
        description:
          'Iogurte grego natural desnatado, 30g de Whey Protein concentrado/isolado e mix de frutas vermelhas.',
        kcal: scale(350),
        proteinG: scale(36),
        carbsG: scale(32),
        fatG: scale(5),
        fiberG: 5,
        tag: 'Absorção Rápida',
        confirmed: false,
      },
      {
        id: 'meal-4',
        order: '04',
        time: '20:30',
        title: 'Jantar Noturno · Síntese Sustentada',
        description:
          'Salmão ou patinho grelhado, batata doce assada com alecrim e mix de folhas verdes escuras.',
        kcal: scale(590),
        proteinG: scale(44),
        carbsG: scale(54),
        fatG: scale(18),
        fiberG: 8,
        tag: 'Recuperação Noturna',
        confirmed: false,
      },
    ];
  }

  if (profile.goal === 'perda_peso') {
    return [
      {
        id: 'meal-1',
        order: '01',
        time: '07:30',
        title: 'Desjejum Proteico de Alta Saciedade',
        description:
          '2 ovos mexidos + 2 claras, 1 fatia de pão integral 100%, mamão papaia com chia e café puro.',
        kcal: scale(390),
        proteinG: scale(32),
        carbsG: scale(34),
        fatG: scale(12),
        fiberG: 8,
        tag: 'Baixo Índice Glicêmico',
        confirmed: true,
      },
      {
        id: 'meal-2',
        order: '02',
        time: '12:30',
        title: 'Almoço Termogênico & Volumoso',
        description:
          'Tilápia ou frango grelhado, quinoa cozida, abobrinha grelhada, salada abundante de folhas verdes e limão.',
        kcal: scale(510),
        proteinG: scale(48),
        carbsG: scale(42),
        fatG: scale(11),
        fiberG: 12,
        tag: 'Alta Saciedade',
        confirmed: true,
      },
      {
        id: 'meal-3',
        order: '03',
        time: '16:15',
        title: 'Lanche Controlador de Apetite',
        description:
          'Iogurte natural zero gordura com 1 scoop de Whey Isolado e 1 maçã verde fatiada com canela.',
        kcal: scale(260),
        proteinG: scale(32),
        carbsG: scale(22),
        fatG: scale(3),
        fiberG: 5,
        tag: 'Zero Açúcar',
        confirmed: false,
      },
      {
        id: 'meal-4',
        order: '04',
        time: '20:00',
        title: 'Jantar Leve · Preservação Magra',
        description:
          'Filé de peito de peru ou ovo cozido com purê leve de abóbora cabotiá e aspargos/brócolis refogados.',
        kcal: scale(420),
        proteinG: scale(40),
        carbsG: scale(28),
        fatG: scale(12),
        fiberG: 9,
        tag: 'Déficit Limpo',
        confirmed: false,
      },
    ];
  }

  // manter_forma
  return [
    {
      id: 'meal-1',
      order: '01',
      time: '07:45',
      title: 'Café da Manhã Equilibrado',
      description:
        'Tapioca ou pão integral com 2 ovos mexidos, queijo cottage, 1 fatia de abacate e frutas frescas.',
      kcal: scale(460),
      proteinG: scale(28),
      carbsG: scale(48),
      fatG: scale(16),
      fiberG: 7,
      tag: 'Energia Estável',
      confirmed: true,
    },
    {
      id: 'meal-2',
      order: '02',
      time: '12:45',
      title: 'Almoço Balanceado Mediterrâneo',
      description:
        'Filé bovino magro ou frango grelhado, arroz com feijão carioca, legumes salteados e azeite extra virgem.',
      kcal: scale(640),
      proteinG: scale(44),
      carbsG: scale(68),
      fatG: scale(18),
      fiberG: 11,
      tag: 'Micronutrientes',
      confirmed: true,
    },
    {
      id: 'meal-3',
      order: '03',
      time: '16:30',
      title: 'Lanche Funcional da Tarde',
      description:
        'Mix de castanhas do pará e amêndoas com iogurte natural integral e morangos.',
      kcal: scale(310),
      proteinG: scale(18),
      carbsG: scale(24),
      fatG: scale(15),
      fiberG: 5,
      tag: 'Gorduras Boas',
      confirmed: false,
    },
    {
      id: 'meal-4',
      order: '04',
      time: '20:15',
      title: 'Jantar Reparador',
      description:
        'Omelete ou filé de peixe assado com batata inglesa cozida, tomate cereja e rúcula.',
      kcal: scale(510),
      proteinG: scale(38),
      carbsG: scale(44),
      fatG: scale(16),
      fiberG: 7,
      tag: 'Manutenção',
      confirmed: false,
    },
  ];
}

export function generateWeightHistory(profile: UserProfile, analysis: BiometricAnalysis): WeightEntry[] {
  const currentW = profile.weightKg;
  const currentBf = analysis.estimatedBfPercent;
  const baseVol = Math.round(profile.weightKg * 420);

  if (profile.goal === 'crescimento_muscular') {
    return [
      { label: 'Sem 01', weightKg: Number((currentW - 1.4).toFixed(1)), volumeKg: Math.round(baseVol * 0.84), bfPercent: Number((currentBf - 0.1).toFixed(1)) },
      { label: 'Sem 02', weightKg: Number((currentW - 1.1).toFixed(1)), volumeKg: Math.round(baseVol * 0.88), bfPercent: currentBf },
      { label: 'Sem 03', weightKg: Number((currentW - 0.8).toFixed(1)), volumeKg: Math.round(baseVol * 0.91), bfPercent: currentBf },
      { label: 'Sem 04', weightKg: Number((currentW - 0.5).toFixed(1)), volumeKg: Math.round(baseVol * 0.95), bfPercent: Number((currentBf + 0.1).toFixed(1)) },
      { label: 'Sem 05', weightKg: Number((currentW - 0.2).toFixed(1)), volumeKg: Math.round(baseVol * 0.98), bfPercent: currentBf },
      { label: 'Atual', weightKg: currentW, volumeKg: baseVol, bfPercent: currentBf },
    ];
  }

  if (profile.goal === 'perda_peso') {
    return [
      { label: 'Sem 01', weightKg: Number((currentW + 2.6).toFixed(1)), volumeKg: Math.round(baseVol * 0.86), bfPercent: Number((currentBf + 1.9).toFixed(1)) },
      { label: 'Sem 02', weightKg: Number((currentW + 2.1).toFixed(1)), volumeKg: Math.round(baseVol * 0.89), bfPercent: Number((currentBf + 1.5).toFixed(1)) },
      { label: 'Sem 03', weightKg: Number((currentW + 1.5).toFixed(1)), volumeKg: Math.round(baseVol * 0.93), bfPercent: Number((currentBf + 1.1).toFixed(1)) },
      { label: 'Sem 04', weightKg: Number((currentW + 1.0).toFixed(1)), volumeKg: Math.round(baseVol * 0.95), bfPercent: Number((currentBf + 0.7).toFixed(1)) },
      { label: 'Sem 05', weightKg: Number((currentW + 0.4).toFixed(1)), volumeKg: Math.round(baseVol * 0.98), bfPercent: Number((currentBf + 0.3).toFixed(1)) },
      { label: 'Atual', weightKg: currentW, volumeKg: baseVol, bfPercent: currentBf },
    ];
  }

  return [
    { label: 'Sem 01', weightKg: Number((currentW + 0.3).toFixed(1)), volumeKg: Math.round(baseVol * 0.9), bfPercent: Number((currentBf + 0.3).toFixed(1)) },
    { label: 'Sem 02', weightKg: Number((currentW + 0.1).toFixed(1)), volumeKg: Math.round(baseVol * 0.92), bfPercent: Number((currentBf + 0.2).toFixed(1)) },
    { label: 'Sem 03', weightKg: Number((currentW + 0.2).toFixed(1)), volumeKg: Math.round(baseVol * 0.94), bfPercent: Number((currentBf + 0.1).toFixed(1)) },
    { label: 'Sem 04', weightKg: currentW, volumeKg: Math.round(baseVol * 0.97), bfPercent: Number((currentBf + 0.1).toFixed(1)) },
    { label: 'Sem 05', weightKg: Number((currentW - 0.1).toFixed(1)), volumeKg: Math.round(baseVol * 0.99), bfPercent: currentBf },
    { label: 'Atual', weightKg: currentW, volumeKg: baseVol, bfPercent: currentBf },
  ];
}
