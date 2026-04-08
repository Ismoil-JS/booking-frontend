import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Drawer, Spin, Alert } from 'antd';
import { Filter, RotateCcw, Sparkles } from 'lucide-react';
import FilterSidebar, { defaultFilters, type FilterState } from '@/shared/ui/FilterSidebar';
import TutorCard from '@/shared/ui/TutorCard';
import { useTutorsQuery, useTutorCategoriesQuery } from '@/entities/Tutor/api';
import { getInitialFiltersFromSearchParams } from '@/shared/lib/tutorMatchFilters';
import TutorMatchWizardModal from '@/shared/ui/TutorMatchWizardModal';

const sectionPadding = 'py-12 px-4 md:py-16';

function filtersToApiParams(applied: FilterState): {
  search?: string;
  categoryIds?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
} {
  const params: {
    search?: string;
    categoryIds?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  } = {};
  if (applied.search?.trim()) params.search = applied.search.trim();
  if (applied.categoryIds.length) params.categoryIds = applied.categoryIds.join(',');
  if (applied.priceMin > 5 || applied.priceMax < 100) {
    params.minPrice = applied.priceMin;
    params.maxPrice = applied.priceMax;
  }
  if (applied.ratingMin > 0) params.minRating = applied.ratingMin;
  return params;
}

const FindTutor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFromUrl = useMemo(() => getInitialFiltersFromSearchParams(searchParams), [searchParams]);
  const [filters, setFilters] = useState<FilterState>(initialFromUrl);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFromUrl);

  useEffect(() => {
    setFilters(initialFromUrl);
    setAppliedFilters(initialFromUrl);
  }, [initialFromUrl]);

  const apiFilters = useMemo(() => filtersToApiParams(appliedFilters), [appliedFilters]);
  const { data: tutors = [], isLoading, isError, error } = useTutorsQuery(apiFilters);
  const { data: categories = [] } = useTutorCategoriesQuery();

  const sortedTutors = useMemo(() => {
    const list = [...tutors];
    list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [tutors]);

  const handleApply = () => {
    setAppliedFilters(filters);
    setFilterDrawerOpen(false);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setFilterDrawerOpen(false);
    navigate('/find-tutor', { replace: true });
  };

  return (
    <div className={`pt-16 md:pt-[72px] ${sectionPadding}`}>
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Find a Tutor</h1>
          <Button
            type="default"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => setWizardOpen(true)}
            className="rounded-xl border-blue-200 text-blue-700 w-fit"
          >
            Guided search
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <FilterSidebar
              filters={filters}
              categories={categories}
              onChange={setFilters}
              onApply={handleApply}
              onReset={handleReset}
            />
          </div>

          {/* Main: filter button (mobile) + grid */}
          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-4 flex flex-wrap items-center gap-2">
              <Button
                icon={<Filter className="w-4 h-4" />}
                onClick={() => setFilterDrawerOpen(true)}
                className="rounded-xl"
              >
                Filters
              </Button>
              <Button
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleReset}
                className="rounded-xl"
              >
                Reset filters
              </Button>
            </div>
            {isLoading && (
              <div className="flex justify-center py-16">
                <Spin size="large" />
              </div>
            )}
            {isError && (
              <Alert
                type="error"
                message="Could not load tutors"
                description={error instanceof Error ? error.message : 'Please try again later.'}
                showIcon
                className="mb-4"
              />
            )}
            {!isLoading && !isError && (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedTutors.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>
                {sortedTutors.length === 0 && (
                  <p className="text-center text-gray-500 py-12">
                    No tutors match your filters. Try adjusting them.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <TutorMatchWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        categories={categories}
      />

      <Drawer
        title="Filters"
        placement="left"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        width={320}
        footer={
          <div className="flex gap-2">
            <Button onClick={handleReset}>Reset</Button>
            <Button type="primary" onClick={handleApply} className="bg-blue-600">
              Apply
            </Button>
          </div>
        }
      >
        <FilterSidebar
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onApply={handleApply}
          onReset={handleReset}
        />
      </Drawer>
    </div>
  );
};

export default FindTutor;
