import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Radio, Input, Space } from 'antd';
import type { TutorCategory } from '@/entities/Tutor/types';
import { defaultFilters, type FilterState } from '@/shared/ui/FilterSidebar';
import { filterStateToSearchParams } from '@/shared/lib/tutorMatchFilters';

const TOTAL_STEPS = 4;

type PriceBucket = 'all' | 'budget' | 'balanced' | 'premium';

const PRICE_BUCKETS: Record<Exclude<PriceBucket, 'all'>, [number, number]> = {
  budget: [5, 40],
  balanced: [25, 75],
  premium: [55, 100],
};

export interface TutorMatchWizardModalProps {
  open: boolean;
  onClose: () => void;
  categories: TutorCategory[];
}

export default function TutorMatchWizardModal({ open, onClose, categories }: TutorMatchWizardModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  /** `null` = not chosen on step 0 yet; `'any'` = no category filter */
  const [subjectKey, setSubjectKey] = useState<string | null>(null);
  const [ratingKey, setRatingKey] = useState<'0' | '3' | '4'>('0');
  const [priceBucket, setPriceBucket] = useState<PriceBucket>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSubjectKey(null);
    setRatingKey('0');
    setPriceBucket('all');
    setSearchText('');
  }, [open]);

  const buildFilterState = (): FilterState => {
    let categoryIds: number[] = [];
    if (subjectKey && subjectKey !== 'any') {
      const id = parseInt(subjectKey, 10);
      if (!Number.isNaN(id)) categoryIds = [id];
    }

    let priceMin = defaultFilters.priceMin;
    let priceMax = defaultFilters.priceMax;
    if (priceBucket !== 'all' && PRICE_BUCKETS[priceBucket]) {
      [priceMin, priceMax] = PRICE_BUCKETS[priceBucket];
    }

    const ratingMin = parseInt(ratingKey, 10);
    const safeRating = Number.isNaN(ratingMin) ? 0 : ratingMin;

    return {
      ...defaultFilters,
      categoryIds,
      ratingMin: safeRating,
      priceMin,
      priceMax,
      search: searchText.trim(),
    };
  };

  const canGoNext = () => {
    if (step === 0) {
      if (categories.length === 0) return true;
      return subjectKey !== null;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else {
      const qs = filterStateToSearchParams(buildFilterState());
      navigate(qs ? `/find-tutor?${qs}` : '/find-tutor');
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const titles = [
    'What do you want to work on?',
    'How picky should we be about ratings?',
    "What's your comfort zone per hour?",
    'Anything specific we should look for?',
  ];

  const subtitles = [
    "We'll prioritize tutors who teach this area.",
    'Higher bar usually means fewer tutors, often with more reviews.',
    'Same ranges as our filters—pick what feels right.',
    'Optional: exam name, software, goal, or keyword.',
  ];

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-semibold text-gray-900 pr-8">Find your match</div>
          <div className="text-sm font-normal text-gray-500 mt-1">
            We&apos;re narrowing down your best matches — step {step + 1} of {TOTAL_STEPS}
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          <Button onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Space>
            {step > 0 && (
              <Button onClick={handleBack} className="rounded-xl">
                Back
              </Button>
            )}
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="rounded-xl bg-blue-600"
            >
              {step === TOTAL_STEPS - 1 ? 'See my matches' : 'Next'}
            </Button>
          </Space>
        </div>
      }
      width={520}
      destroyOnClose
      className="rounded-2xl"
    >
      <div className="pt-2">
        <h3 className="text-base font-semibold text-gray-900 mb-1">{titles[step]}</h3>
        <p className="text-sm text-gray-600 mb-6">{subtitles[step]}</p>

        {step === 0 && (
          <div className="max-h-[min(50vh,320px)] overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No subject list loaded yet. You can still continue — we&apos;ll show all tutors and you can
                filter on the next page.
              </p>
            ) : (
              <Radio.Group
                value={subjectKey ?? undefined}
                onChange={(e) => setSubjectKey(e.target.value)}
                className="flex flex-col gap-3 w-full"
                aria-label="Subject or focus area"
              >
                <Radio value="any" className="!items-start !whitespace-normal">
                  <span className="font-medium text-gray-900">I&apos;m not sure yet / any subject</span>
                </Radio>
                {categories.map((cat) => (
                  <Radio key={cat.id} value={String(cat.id)} className="!items-start !whitespace-normal">
                    <span className="font-medium text-gray-900">{cat.name}</span>
                  </Radio>
                ))}
              </Radio.Group>
            )}
          </div>
        )}

        {step === 1 && (
          <Radio.Group
            value={ratingKey}
            onChange={(e) => setRatingKey(e.target.value as '0' | '3' | '4')}
            className="flex flex-col gap-3 w-full"
            aria-label="Minimum rating preference"
          >
            <Radio value="0" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">I&apos;m flexible</span>
              <div className="text-sm text-gray-500">Include tutors with fewer reviews.</div>
            </Radio>
            <Radio value="3" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">Solid track record</span>
              <div className="text-sm text-gray-500">At least 3★ and above.</div>
            </Radio>
            <Radio value="4" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">Top-rated only</span>
              <div className="text-sm text-gray-500">4★ and above.</div>
            </Radio>
          </Radio.Group>
        )}

        {step === 2 && (
          <Radio.Group
            value={priceBucket}
            onChange={(e) => setPriceBucket(e.target.value)}
            className="flex flex-col gap-3 w-full"
            aria-label="Budget per hour"
          >
            <Radio value="all" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">Show me everything</span>
              <div className="text-sm text-gray-500">Full price range ($5–100/hr).</div>
            </Radio>
            <Radio value="budget" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">Budget-friendly</span>
              <div className="text-sm text-gray-500">Roughly $5–40/hr.</div>
            </Radio>
            <Radio value="balanced" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">Balanced</span>
              <div className="text-sm text-gray-500">Roughly $25–75/hr.</div>
            </Radio>
            <Radio value="premium" className="!items-start !whitespace-normal">
              <span className="font-medium text-gray-900">Premium experience</span>
              <div className="text-sm text-gray-500">Roughly $55–100/hr.</div>
            </Radio>
          </Radio.Group>
        )}

        {step === 3 && (
          <Input.TextArea
            rows={4}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="e.g. IELTS speaking, Python basics, job interview English…"
            className="rounded-xl"
            maxLength={200}
            showCount
            aria-label="Optional keywords or goals"
          />
        )}
      </div>
    </Modal>
  );
}
