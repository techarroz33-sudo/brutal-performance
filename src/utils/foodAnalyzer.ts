import {
  ExerciseBurnEquivalent,
  FoodAnalysisEntry,
  FoodAnalysisItem,
  UserProfile,
} from '../types';

interface FoodCatalogRule {
  keywords: string[];
  name: string;
  portion: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const FOOD_RULES: FoodCatalogRule[] = [
  // Lanches & Fast-Food
  {
    keywords: ['x-bacon', 'xbacon', 'cheesebacon'],
    name: 'Hambúrguer com Queijo e Bacon (X-Bacon)',
    portion: '1 unidade (~240g)',
    kcal: 730,
    proteinG: 36,
    carbsG: 38,
    fatG: 46,
  },
  {
    keywords: ['hamburguer', 'hamburger', 'burguer', 'burger', 'x-burguer', 'xburguer', 'x-salada', 'xsalada', 'big mac', 'whopper'],
    name: 'Hambúrguer (Pão + Carne Bovina)',
    portion: '1 unidade (~175g)',
    kcal: 440,
    proteinG: 24,
    carbsG: 36,
    fatG: 21,
  },
  {
    keywords: ['bacon'],
    name: 'Bacon Crocante em Tiras',
    portion: '30g (2–3 tiras)',
    kcal: 165,
    proteinG: 10,
    carbsG: 0,
    fatG: 14,
  },
  {
    keywords: ['cheddar', 'catupiry', 'requeijao', 'mussarela', 'queijo', 'mucarela'],
    name: 'Queijo Derretido / Cheddar',
    portion: '2 fatias (~40g)',
    kcal: 135,
    proteinG: 8,
    carbsG: 1,
    fatG: 11,
  },
  {
    keywords: ['batata frita', 'fritas'],
    name: 'Batata Frita',
    portion: '1 porção média (~150g)',
    kcal: 430,
    proteinG: 5,
    carbsG: 52,
    fatG: 22,
  },
  {
    keywords: ['pizza', 'calabresa', 'portuguesa', 'quatro queijos', 'marguerita'],
    name: 'Fatia de Pizza Tradicional',
    portion: '1 fatia (~110g)',
    kcal: 290,
    proteinG: 12,
    carbsG: 32,
    fatG: 12,
  },
  {
    keywords: ['cachorro quente', 'hot dog', 'hotdog'],
    name: 'Cachorro-Quente Completo',
    portion: '1 unidade (~180g)',
    kcal: 420,
    proteinG: 14,
    carbsG: 42,
    fatG: 21,
  },
  {
    keywords: ['coxinha'],
    name: 'Coxinha de Frango Frita',
    portion: '1 unidade média (~120g)',
    kcal: 295,
    proteinG: 11,
    carbsG: 30,
    fatG: 14,
  },
  {
    keywords: ['pastel'],
    name: 'Pastel de Feira Frito',
    portion: '1 unidade (~130g)',
    kcal: 360,
    proteinG: 11,
    carbsG: 34,
    fatG: 20,
  },
  {
    keywords: ['esfiha', 'esfirra'],
    name: 'Esfiha Aberta/Fechada',
    portion: '1 unidade (~90g)',
    kcal: 225,
    proteinG: 9,
    carbsG: 24,
    fatG: 10,
  },
  {
    keywords: ['pao de queijo'],
    name: 'Pão de Queijo',
    portion: '1 unidade média (~40g)',
    kcal: 130,
    proteinG: 3,
    carbsG: 14,
    fatG: 7,
  },
  {
    keywords: ['lasanha'],
    name: 'Lasanha à Bolonhesa',
    portion: '1 porção (~280g)',
    kcal: 480,
    proteinG: 24,
    carbsG: 42,
    fatG: 24,
  },
  {
    keywords: ['macarrao', 'massa', 'espaguete', 'pasta'],
    name: 'Macarrão com Molho',
    portion: '1 prato (~250g)',
    kcal: 360,
    proteinG: 11,
    carbsG: 62,
    fatG: 7,
  },

  // Doces & Sobremesas
  {
    keywords: ['acai', 'açaí'],
    name: 'Açaí Batido',
    portion: '300ml',
    kcal: 330,
    proteinG: 4,
    carbsG: 48,
    fatG: 14,
  },
  {
    keywords: ['leite condensado'],
    name: 'Leite Condensado (Cobertura)',
    portion: '2 colheres sopa (~40g)',
    kcal: 130,
    proteinG: 3,
    carbsG: 22,
    fatG: 3.5,
  },
  {
    keywords: ['granola'],
    name: 'Granola Crocante',
    portion: '30g',
    kcal: 125,
    proteinG: 3,
    carbsG: 21,
    fatG: 3,
  },
  {
    keywords: ['brigadeiro'],
    name: 'Brigadeiro Tradicional',
    portion: '1 unidade (~25g)',
    kcal: 95,
    proteinG: 1.5,
    carbsG: 14,
    fatG: 3.8,
  },
  {
    keywords: ['sorvete', 'casquinha', 'milkshake', 'milk shake'],
    name: 'Sorvete / Milkshake',
    portion: '1 porção (~150g)',
    kcal: 310,
    proteinG: 5,
    carbsG: 38,
    fatG: 15,
  },
  {
    keywords: ['bolo', 'torta'],
    name: 'Fatia de Bolo / Torta',
    portion: '1 fatia (~100g)',
    kcal: 320,
    proteinG: 4.5,
    carbsG: 44,
    fatG: 14,
  },
  {
    keywords: ['chocolate', 'barra de chocolate', 'bombom'],
    name: 'Chocolate ao Leite',
    portion: '40g (~4 quadradinhos)',
    kcal: 215,
    proteinG: 3,
    carbsG: 24,
    fatG: 12,
  },
  {
    keywords: ['nutella'],
    name: 'Creme de Avelã (Nutella)',
    portion: '2 colheres sopa (~30g)',
    kcal: 162,
    proteinG: 2,
    carbsG: 17,
    fatG: 9.5,
  },

  // Bebidas
  {
    keywords: ['refrigerante', 'coca', 'guarana', 'fanta', 'pepsi'],
    name: 'Refrigerante Tradicional',
    portion: '1 lata (350ml)',
    kcal: 145,
    proteinG: 0,
    carbsG: 37,
    fatG: 0,
  },
  {
    keywords: ['cerveja', 'chopp'],
    name: 'Cerveja Tradicional',
    portion: '1 lata / long neck (350ml)',
    kcal: 148,
    proteinG: 1,
    carbsG: 12,
    fatG: 0,
  },
  {
    keywords: ['suco'],
    name: 'Suco de Fruta Adoçado',
    portion: '1 copo (300ml)',
    kcal: 135,
    proteinG: 1,
    carbsG: 32,
    fatG: 0,
  },

  // Refeições & Básicos
  {
    keywords: ['maionese', 'molho especial', 'molho'],
    name: 'Maionese / Molho Especial',
    portion: '1 colher sopa (~20g)',
    kcal: 110,
    proteinG: 0.3,
    carbsG: 2,
    fatG: 11,
  },
  {
    keywords: ['ovo', 'ovos'],
    name: 'Ovo Inteiro',
    portion: '1 unidade (~50g)',
    kcal: 74,
    proteinG: 6.3,
    carbsG: 0.5,
    fatG: 5,
  },
  {
    keywords: ['frango', 'peito de frango'],
    name: 'Frango Grelhado',
    portion: '120g',
    kcal: 195,
    proteinG: 36,
    carbsG: 0,
    fatG: 4.5,
  },
  {
    keywords: ['carne', 'bife', 'picanha', 'churrasco'],
    name: 'Carne Bovina / Bife',
    portion: '150g',
    kcal: 330,
    proteinG: 34,
    carbsG: 0,
    fatG: 21,
  },
  {
    keywords: ['arroz'],
    name: 'Arroz Cozido',
    portion: '150g (4 col. sopa)',
    kcal: 192,
    proteinG: 4,
    carbsG: 42,
    fatG: 0.5,
  },
  {
    keywords: ['feijao', 'feijão'],
    name: 'Feijão Cozido',
    portion: '1 concha (~140g)',
    kcal: 108,
    proteinG: 7,
    carbsG: 19,
    fatG: 0.7,
  },
  {
    keywords: ['pao frances', 'pão francês', 'paozinho', 'pao'],
    name: 'Pão Francês / Pão',
    portion: '1 unidade (~50g)',
    kcal: 145,
    proteinG: 4.5,
    carbsG: 29,
    fatG: 1.5,
  },
  {
    keywords: ['banana'],
    name: 'Banana Prata',
    portion: '1 unidade (~90g)',
    kcal: 89,
    proteinG: 1.1,
    carbsG: 23,
    fatG: 0.2,
  },
];

const NUMBER_WORDS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  meio: 0.5,
  meia: 0.5,
  duplo: 1.6,
  dupla: 1.6,
  triplo: 2.2,
  grande: 1.35,
  pequeno: 0.75,
  pequena: 0.75,
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function detectMultiplierBeforeKeyword(
  normalizedText: string,
  keyword: string
): number {
  const idx = normalizedText.indexOf(keyword);
  if (idx <= 0) return 1;
  const prefix = normalizedText.slice(Math.max(0, idx - 26), idx).trim();
  const tokens = prefix.split(/\s+/);
  // Check last 2 tokens for numeric quantity or modifier (e.g. "2 fatias de", "duplo")
  for (let i = tokens.length - 1; i >= Math.max(0, tokens.length - 3); i--) {
    const tok = tokens[i].replace(/[^\w.,]/g, '');
    if (!tok) continue;
    if (/^\d+([.,]\d+)?$/.test(tok)) {
      const val = parseFloat(tok.replace(',', '.'));
      if (val > 0 && val <= 15) return val;
    }
    if (NUMBER_WORDS[tok]) {
      return NUMBER_WORDS[tok];
    }
  }
  return 1;
}

export function calculateExerciseBurnEquivalents(
  caloriesToLose: number,
  weightKg: number
): ExerciseBurnEquivalent[] {
  const w = Math.max(45, weightKg);
  // Calories/min = (MET * 3.5 * weightKg) / 200
  const calcMinutes = (met: number) =>
    Math.max(5, Math.round(caloriesToLose / ((met * 3.5 * w) / 200)));

  return [
    {
      activity: 'Caminhada Rápida (6 km/h)',
      minutes: calcMinutes(4.3),
      intensity: 'Moderada',
    },
    {
      activity: 'Musculação / Treino Intenso',
      minutes: calcMinutes(5.8),
      intensity: 'Alta',
    },
    {
      activity: 'Bicicleta / Bike Ergométrica',
      minutes: calcMinutes(7.0),
      intensity: 'Moderada-Alta',
    },
    {
      activity: 'Corrida Leve (8–9 km/h)',
      minutes: calcMinutes(8.8),
      intensity: 'Vigorosa',
    },
  ];
}

export function analyzeFoodComment(
  rawComment: string,
  profile: UserProfile,
  customKcalOverride?: number
): FoodAnalysisEntry {
  const normalized = normalizeText(rawComment);
  const matchedItems: FoodAnalysisItem[] = [];
  const usedRuleNames = new Set<string>();

  // If "x-bacon" is explicitly typed, avoid duplicating burger/cheese/bacon separately
  const isExplicitXBacon =
    normalized.includes('x-bacon') ||
    normalized.includes('xbacon') ||
    normalized.includes('cheesebacon');

  for (const rule of FOOD_RULES) {
    if (
      isExplicitXBacon &&
      ['Hambúrguer (Pão + Carne Bovina)', 'Queijo Derretido / Cheddar', 'Bacon Crocante em Tiras'].includes(
        rule.name
      )
    ) {
      continue;
    }

    const matchedKeyword = rule.keywords.find((kw) =>
      normalized.includes(normalizeText(kw))
    );
    if (matchedKeyword && !usedRuleNames.has(rule.name)) {
      usedRuleNames.add(rule.name);
      const mult = detectMultiplierBeforeKeyword(
        normalized,
        normalizeText(matchedKeyword)
      );
      matchedItems.push({
        name: mult !== 1 ? `${rule.name} (×${mult})` : rule.name,
        portion: rule.portion,
        kcal: Math.round(rule.kcal * mult),
        proteinG: Number((rule.proteinG * mult).toFixed(1)),
        carbsG: Number((rule.carbsG * mult).toFixed(1)),
        fatG: Number((rule.fatG * mult).toFixed(1)),
      });
    }
  }

  // Fallback smart estimate if no catalog keyword matched
  if (matchedItems.length === 0) {
    let estKcal = 320;
    let estP = 12;
    let estC = 38;
    let estG = 13;
    let label = rawComment.trim() || 'Alimento informado';

    if (
      normalized.includes('doce') ||
      normalized.includes('sobremesa') ||
      normalized.includes('pudim') ||
      normalized.includes('churros')
    ) {
      estKcal = 280;
      estP = 4;
      estC = 42;
      estG = 11;
    } else if (
      normalized.includes('frito') ||
      normalized.includes('salgado') ||
      normalized.includes('lanche') ||
      normalized.includes('sanduiche')
    ) {
      estKcal = 410;
      estP = 15;
      estC = 39;
      estG = 21;
    } else if (
      normalized.includes('prato') ||
      normalized.includes('almoco') ||
      normalized.includes('jantar')
    ) {
      estKcal = 560;
      estP = 32;
      estC = 64;
      estG = 18;
    }

    matchedItems.push({
      name: `${label} (estimativa padrão)`,
      portion: '1 porção média',
      kcal: estKcal,
      proteinG: estP,
      carbsG: estC,
      fatG: estG,
    });
  }

  const summedKcal = matchedItems.reduce((acc, i) => acc + i.kcal, 0);
  const totalKcal =
    customKcalOverride !== undefined && customKcalOverride > 0
      ? Math.round(customKcalOverride)
      : summedKcal;

  const proteinG = Math.round(
    matchedItems.reduce((acc, i) => acc + i.proteinG, 0)
  );
  const carbsG = Math.round(
    matchedItems.reduce((acc, i) => acc + i.carbsG, 0)
  );
  const fatG = Math.round(matchedItems.reduce((acc, i) => acc + i.fatG, 0));

  // 1 kg of body fat ≈ 7700 kcal -> 1g ≈ 7.7 kcal
  const fatGainGrams = Math.round(totalKcal / 7.7);
  // Short-term scale impact includes glycogen + water retention (~3g water per 1g carb + sodium effect)
  const scaleRetentionGrams = Math.round(fatGainGrams + carbsG * 2.5 + 80);

  const burnEquivalents = calculateExerciseBurnEquivalents(
    totalKcal,
    profile.weightKg
  );

  const twoDaySplit = Math.round(totalKcal / 2);
  const recoveryPlanNote = `Para voltar ao peso anterior a esse alimento (${profile.weightKg} kg), você precisa gastar ou reduzir ${totalKcal} kcal — por exemplo, fazer ${burnEquivalents[3].minutes} min de corrida leve hoje ou reduzir ${twoDaySplit} kcal/dia nos próximos 2 dias.`;

  return {
    id: `fa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    comment: rawComment.trim(),
    createdAt: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    items: matchedItems,
    totalKcal,
    caloriesToLose: totalKcal,
    proteinG,
    carbsG,
    fatG,
    fatGainGrams,
    scaleRetentionGrams,
    burnEquivalents,
    recoveryPlanNote,
    compensated: false,
  };
}
