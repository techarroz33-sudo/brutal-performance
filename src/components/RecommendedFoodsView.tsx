import React, { useMemo, useState } from 'react';
import {
  Apple,
  ArrowUpDown,
  Check,
  Plus,
  Search,
} from 'lucide-react';
import { RECOMMENDED_FOODS } from '../data/fitnessData';
import {
  FitnessGoal,
  FoodCategory,
  RecommendedFood,
  UserProfile,
} from '../types';
import { GOAL_LABELS } from '../utils/fitnessEngine';

interface RecommendedFoodsViewProps {
  userProfile: UserProfile;
  onAddFoodToDay: (food: RecommendedFood) => void;
}

type ProfileFilter = 'all' | FitnessGoal;
type SortKey = 'name' | 'kcal' | 'proteinG';

const PROFILE_TABS: Array<{ id: ProfileFilter; label: string }> = [
  { id: 'crescimento_muscular', label: 'Crescimento Muscular' },
  { id: 'perda_peso', label: 'Perda de Peso' },
  { id: 'manter_forma', label: 'Manter em Forma' },
  { id: 'all', label: 'Todos' },
];

const CATEGORIES: Array<'Todas' | FoodCategory> = [
  'Todas',
  'Proteínas',
  'Carboidratos',
  'Gorduras Boas',
  'Vegetais & Fibras',
  'Lácteos & Suplementos',
];

export const RecommendedFoodsView: React.FC<RecommendedFoodsViewProps> = ({
  userProfile,
  onAddFoodToDay,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<ProfileFilter>(userProfile.goal);
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | FoodCategory>('Todas');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('proteinG');
  const [sortDesc, setSortDesc] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RECOMMENDED_FOODS.filter((food) => {
      const matchesProfile =
        selectedProfile === 'all' || food.profiles.includes(selectedProfile);
      const matchesCategory =
        selectedCategory === 'Todas' || food.category === selectedCategory;
      const matchesQuery =
        !q ||
        food.name.toLowerCase().includes(q) ||
        food.benefit.toLowerCase().includes(q) ||
        food.mealTiming.toLowerCase().includes(q);
      return matchesProfile && matchesCategory && matchesQuery;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return sortDesc
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      return sortDesc ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy];
    });
  }, [selectedProfile, selectedCategory, search, sortBy, sortDesc]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(key);
      setSortDesc(key !== 'name');
    }
  };

  const handleAdd = (food: RecommendedFood) => {
    onAddFoodToDay(food);
    setAddedIds((prev) => ({ ...prev, [food.id]: true }));
    window.setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [food.id]: false }));
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Simple Header & Profile Filter Tabs */}
      <div className="apex-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A3E635]">
              <Apple className="w-4 h-4" />
              <span>Seu perfil atual: {GOAL_LABELS[userProfile.goal]}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-white mt-0.5">
              Tabela de Alimentos Recomendados
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0E1310] border border-white/10">
            {PROFILE_TABS.map((tab) => {
              const active = selectedProfile === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedProfile(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#A3E635] text-[#0A0F0D]'
                      : 'text-[#9CA9A2] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1F2C24] text-[#A3E635] border border-[#A3E635]/40'
                      : 'bg-[#101513] border border-white/8 text-[#9CA9A2] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="w-4 h-4 text-[#6B7871] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#0E1310] border border-white/10 text-xs text-white placeholder-[#6B7871] focus:outline-none focus:border-[#A3E635]"
            />
          </div>
        </div>
      </div>

      {/* Streamlined 6-Column Table */}
      <div className="apex-card overflow-hidden">
        {filteredFoods.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm text-[#9CA9A2]">
              Nenhum alimento encontrado para esse filtro.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todas');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-[#18201C] text-xs font-semibold text-[#A3E635] cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-[#101513] text-[11px] font-semibold uppercase tracking-wider text-[#8C9992]">
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                    >
                      <span>Alimento</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">Porção</th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('kcal')}
                      className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                    >
                      <span>Calorias</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('proteinG')}
                      className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                    >
                      <span>Prot · Carb · Gord</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">Horário Ideal</th>
                  <th className="py-3 px-4 text-right">Adicionar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 text-xs">
                {filteredFoods.map((food) => {
                  const justAdded = Boolean(addedIds[food.id]);
                  return (
                    <tr
                      key={food.id}
                      className="hover:bg-[#171F1B] transition-colors align-middle"
                    >
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-white text-sm">
                          {food.name}
                        </div>
                        <div className="text-[11px] text-[#8C9992] mt-0.5">
                          {food.benefit}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[#C8D3CD] whitespace-nowrap">
                        {food.servingSize}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white tabular-nums whitespace-nowrap">
                        {food.kcal} kcal
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className="text-[#A3E635] font-bold">{food.proteinG}g</span>
                        <span className="text-[#5B6861] mx-1">·</span>
                        <span className="text-[#14B8A6]">{food.carbsG}g</span>
                        <span className="text-[#5B6861] mx-1">·</span>
                        <span className="text-[#FB923C]">{food.fatG}g</span>
                      </td>
                      <td className="py-3.5 px-3 text-[#C8D3CD] whitespace-nowrap">
                        {food.mealTiming}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleAdd(food)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            justAdded
                              ? 'bg-[#22C55E] text-[#0A0F0D]'
                              : 'bg-[#18201C] hover:bg-[#A3E635] text-[#A3E635] hover:text-[#0A0F0D] border border-[#A3E635]/30'
                          }`}
                        >
                          {justAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>No Diário</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Diário</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
