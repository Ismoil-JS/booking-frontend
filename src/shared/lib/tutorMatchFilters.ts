import { defaultFilters, type FilterState } from '@/shared/ui/FilterSidebar';

const PRICE_MIN = 5;
const PRICE_MAX = 100;

function clampPrice(n: number): number {
  if (!Number.isFinite(n)) return PRICE_MIN;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(n)));
}

function parseRating(raw: string | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return undefined;
  if (n === 0) return 0;
  if ([2, 3, 4, 5].includes(n)) return n;
  return undefined;
}

/** Hydrate sidebar/query state from URL (Find Tutor + wizard handoff). */
export function getInitialFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const categoryIdsParam = searchParams.get('categoryIds');
  const categoryIds = categoryIdsParam
    ? categoryIdsParam.split(',').map((id) => parseInt(id.trim(), 10)).filter((n) => !Number.isNaN(n))
    : [];

  const search = (searchParams.get('search') ?? '').trim();

  let priceMin = defaultFilters.priceMin;
  let priceMax = defaultFilters.priceMax;
  const minP = searchParams.get('minPrice');
  const maxP = searchParams.get('maxPrice');
  if (minP != null && minP !== '') {
    const parsed = parseFloat(minP);
    if (Number.isFinite(parsed)) priceMin = clampPrice(parsed);
  }
  if (maxP != null && maxP !== '') {
    const parsed = parseFloat(maxP);
    if (Number.isFinite(parsed)) priceMax = clampPrice(parsed);
  }
  if (priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }

  let ratingMin = defaultFilters.ratingMin;
  const r = parseRating(searchParams.get('minRating'));
  if (r !== undefined) ratingMin = r;

  return {
    ...defaultFilters,
    categoryIds,
    search,
    priceMin,
    priceMax,
    ratingMin,
  };
}

/** Serialize filter state for /find-tutor query string (wizard + shareable links). */
export function filterStateToSearchParams(state: FilterState): string {
  const p = new URLSearchParams();
  if (state.categoryIds.length) {
    p.set('categoryIds', state.categoryIds.join(','));
  }
  if (state.search?.trim()) {
    p.set('search', state.search.trim());
  }
  if (state.priceMin > PRICE_MIN || state.priceMax < PRICE_MAX) {
    p.set('minPrice', String(state.priceMin));
    p.set('maxPrice', String(state.priceMax));
  }
  if (state.ratingMin > 0) {
    p.set('minRating', String(state.ratingMin));
  }
  return p.toString();
}
