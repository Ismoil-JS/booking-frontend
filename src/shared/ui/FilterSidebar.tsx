import { useState } from 'react';
import { Input, Checkbox, Slider, Button } from 'antd';
import { Search } from 'lucide-react';
import type { TutorCategory } from '@/entities/Tutor/types';

export interface FilterState {
  search: string;
  categoryIds: number[];
  priceMin: number;
  priceMax: number;
  ratingMin: number;
}

export const defaultFilters: FilterState = {
  search: '',
  categoryIds: [],
  priceMin: 5,
  priceMax: 100,
  ratingMin: 0,
};

interface FilterSidebarProps {
  filters: FilterState;
  categories: TutorCategory[];
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  className?: string;
}

const FilterSidebar = ({
  filters,
  categories,
  onChange,
  onApply,
  onReset,
  className = '',
}: FilterSidebarProps) => {
  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <aside
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 ${className}`}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name or keyword"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-3 rounded-xl"
        />
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">
          Price: ${filters.priceMin} – ${filters.priceMax}/hr
        </h4>
        <Slider
          range
          min={5}
          max={100}
          value={[filters.priceMin, filters.priceMax]}
          onChange={([a, b]) => update({ priceMin: a, priceMax: b })}
        />
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Rating</h4>
        <div className="space-y-2">
          {[2, 3, 4, 5].map((r) => (
            <Checkbox
              key={r}
              checked={filters.ratingMin === r}
              onChange={(e) => update({ ratingMin: e.target.checked ? r : 0 })}
            >
              {r}★ and above
            </Checkbox>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Tutor type</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <Checkbox
                key={cat.id}
                checked={filters.categoryIds.includes(cat.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...filters.categoryIds, cat.id]
                    : filters.categoryIds.filter((id) => id !== cat.id);
                  update({ categoryIds: next });
                }}
              >
                {cat.name}
              </Checkbox>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="primary"
          onClick={onApply}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-0"
        >
          Apply Filters
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-blue-600 hover:underline"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
