import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Sparkles,
  Calendar,
  Target,
  Shield,
  Clock,
  BookOpen,
  BarChart3,
  DollarSign,
  Quote,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { Collapse, Spin } from 'antd';
import TutorCard from '@/shared/ui/TutorCard';
import TutorMatchWizardModal from '@/shared/ui/TutorMatchWizardModal';
import { useTutorsQuery, useTutorCategoriesQuery } from '@/entities/Tutor/api';

const sectionPadding = 'py-12 px-4 md:py-20';

function formatTutorCount(count: number | undefined): string {
  const n = count ?? 0;
  return `${n.toLocaleString()} ${n === 1 ? 'tutor' : 'tutors'}`;
}

const LandingPage = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data: categories = [], isLoading: categoriesLoading } = useTutorCategoriesQuery();
  const { data: ieltsTutors = [], isLoading: ieltsLoading } = useTutorsQuery({ categoryIds: '1' });
  const { data: techTutors = [], isLoading: techLoading } = useTutorsQuery({ categoryIds: '2' });
  const { data: marketingTutors = [], isLoading: marketingLoading } = useTutorsQuery({ categoryIds: '3' });
  const { data: mathematicsTutors = [], isLoading: mathematicsLoading } = useTutorsQuery({ categoryIds: '4' });
  const { data: languagesTutors = [], isLoading: languagesLoading } = useTutorsQuery({ categoryIds: '5' });

  const sections = [
    { label: 'IELTS tutors', tutors: ieltsTutors, isLoading: ieltsLoading, categoryIds: '1' },
    { label: 'Tech tutors', tutors: techTutors, isLoading: techLoading, categoryIds: '2' },
    { label: 'Marketing tutors', tutors: marketingTutors, isLoading: marketingLoading, categoryIds: '3' },
    { label: 'Mathematics tutors', tutors: mathematicsTutors, isLoading: mathematicsLoading, categoryIds: '4' },
    { label: 'Languages tutors', tutors: languagesTutors, isLoading: languagesLoading, categoryIds: '5' },
  ];

  const steps = [
    {
      step: 1,
      title: 'Create your profile',
      desc: 'Share your goals, subject interests, and availability.',
      Icon: UserPlus,
    },
    {
      step: 2,
      title: 'Find your tutor',
      desc: 'Browse tutors by subject, filter by price and rating, and pick the best fit for you.',
      Icon: Sparkles,
    },
    {
      step: 3,
      title: 'Book & start learning',
      desc: 'Book a session and start improving with personalized lessons.',
      Icon: Calendar,
    },
  ];

  const features = [
    { title: 'Smart Filters & Search', Icon: Sparkles },
    { title: 'Certified Expert Tutors', Icon: Shield },
    { title: 'AI Chatbot', Icon: MessageCircle },
    { title: 'Flexible Scheduling', Icon: Clock },
    { title: 'Wide Range of Subjects', Icon: BookOpen },
    { title: 'Progress Tracking Dashboard', Icon: BarChart3 },
    { title: 'Affordable Pricing', Icon: DollarSign },
  ];

  const testimonials = [
    {
      quote: 'BISP matched me with a tutor who understood my weak points. I made real progress in just 2 months.',
      name: 'Aisha K.',
      rating: 5,
      initial: 'A',
    },
    {
      quote: 'I found the right tutor quickly. They specialized in exactly what I needed and helped me build confidence.',
      name: 'Rahul M.',
      rating: 5,
      initial: 'R',
    },
    {
      quote: 'Flexible schedule and great value. I could fit lessons around my job and finally reach my goals.',
      name: 'Maria S.',
      rating: 5,
      initial: 'M',
    },
  ];

  const faqItems = [
    {
      q: 'What is BISP?',
      a: 'BISP is a tutoring platform that connects you with certified tutors across many subjects—from languages and test prep to professional skills. Browse by category, filter by price and rating, and book personalized lessons that fit your schedule. We also offer an AI chatbot to help with quick questions.',
    },
    {
      q: 'How do I find the right tutor?',
      a: 'Use our filters to narrow by subject category, price range, and minimum rating. You can also search by name or keyword. Browse profiles, compare options, and book a session when you find a good fit.',
    },
    {
      q: 'Are all tutors certified?',
      a: 'Yes. Every tutor on BISP is certified with proof of expertise in their subject, teaching experience, and identity. We display a "Certified" badge on their profiles.',
    },
    {
      q: 'What is the AI chatbot?',
      a: 'BISP includes an AI-powered chatbot to answer quick questions and guide you—for example, how to find a tutor or what to expect from a session. Your lessons are always with real, certified tutors; the chatbot is there to support you along the way.',
    },
    {
      q: 'Can I try a session before committing?',
      a: 'Many tutors offer a short introductory session. You can message them or book a trial slot to see if the match is right for you before buying a package.',
    },
    {
      q: 'What if I need to reschedule?',
      a: 'Rescheduling depends on the tutor\'s cancellation policy. You can view this on their profile and communicate with them directly through the platform.',
    },
  ];

  return (
    <div className="pt-16 md:pt-[72px]">
      {/* 1. HERO */}
      <section
        className={`relative min-h-[90vh] md:min-h-[85vh] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 ${sectionPadding} bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 overflow-hidden`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-40 h-40 rounded-full bg-indigo-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-white/5 blur-xl" />
        </div>
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Find Your Perfect Tutor
          </h1>
          <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-lg">
            Get matched with certified tutors in any subject—based on your goals, schedule, and learning style.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start">
            <Link
              to="/find-tutor"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/40 backdrop-blur-sm transition-all duration-300 shadow-lg"
            >
              Find a Tutor
            </Link>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/50 backdrop-blur-sm transition-all duration-300 shadow-lg"
            >
              Help me choose
            </button>
            <Link
              to="/become-tutor"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold bg-white text-blue-700 hover:bg-blue-50 transition-all duration-300 shadow-lg"
            >
              Become a Tutor
            </Link>
          </div>
        </div>
        <div className="relative z-10 hidden lg:flex flex-col gap-2 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <p className="text-white/90 text-sm font-medium uppercase tracking-wider">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {['Languages', 'Math', 'IELTS', 'Marketing', 'Tech'].map((subject) => (
              <span
                key={subject}
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white font-medium text-sm"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className={`${sectionPadding} bg-white border-b border-blue-100`}>
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-2xl border-t-4 border-t-blue-600 bg-white shadow-lg p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gray-900">2,000+</p>
              <p className="text-gray-600 mt-1">Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gray-900">500+</p>
              <p className="text-gray-600 mt-1">Tutors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gray-900">4.9★</p>
              <p className="text-gray-600 mt-1">Average Rating</p>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <p className="text-2xl md:text-3xl font-bold text-gray-900">95%</p>
              <p className="text-gray-600 mt-1">Goal Achievement Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className={`${sectionPadding} bg-gray-50`}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How BISP Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc, Icon }) => (
              <div
                key={step}
                className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <span className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                  {step}
                </span>
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3b. BROWSE CATEGORIES */}
      <section className={`${sectionPadding} bg-white border-t border-gray-100`}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Browse by category
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
            Choose a subject to see tutors in that area. Your filters will be applied on the next page.
          </p>
          {categoriesLoading ? (
            <div className="flex justify-center py-16">
              <Spin size="large" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No categories available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/find-tutor?categoryIds=${encodeURIComponent(String(cat.id))}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <div className="min-w-0 text-left">
                    <p className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatTutorCount(cat.tutorCount)}
                    </p>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. FIND YOUR FIT */}
      <section className={`${sectionPadding} bg-white`}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Find the Right Fit
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Filter by subject, price, and rating. Search by name or keyword. Browse certified tutor profiles and book sessions that fit your goals and schedule.
              </p>
              <ul className="space-y-3">
                {['Filter by category & price', 'Real-time availability', 'Certified tutor profiles', 'AI chatbot for quick questions', 'Book in a few clicks'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-700">
                    <Target className="w-5 h-5 text-blue-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 shadow-lg">
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-2">Example profile</p>
              <p className="text-gray-700 font-medium mb-2">Sarah M.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">IELTS</span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">Languages</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TUTORS BY CATEGORY */}
      <section className={`${sectionPadding} bg-gray-50`}>
        <div className="container mx-auto max-w-6xl space-y-14">
          {sections.map(({ label, tutors, isLoading, categoryIds }) => (
            <div key={label}>
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {label}
                </h2>
                <Link
                  to={`/find-tutor${categoryIds ? `?categoryIds=${encodeURIComponent(categoryIds)}` : ''}`}
                  className="flex-shrink-0 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  See more
                  <span aria-hidden>→</span>
                </Link>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory touch-pan-x">
                  {tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="flex-shrink-0 w-[min(100%,280px)] sm:w-[320px] snap-start"
                    >
                      <TutorCard tutor={tutor} />
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && tutors.length === 0 && (
                <p className="text-gray-500 py-6">No tutors in this category yet.</p>
              )}
            </div>
          ))}
          <div className="pt-4 text-center">
            <Link
              to="/find-tutor"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-all duration-300 shadow-md"
            >
              View All Tutors
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FEATURES GRID */}
      <section className={`${sectionPadding} bg-white`}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ title, Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className={`${sectionPadding} bg-gray-50`}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            What Our Students Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
              >
                <Quote className="w-10 h-10 text-blue-200 mb-4" />
                <p className="text-gray-700 mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{'★'.repeat(t.rating)} rating</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className={`${sectionPadding} bg-gray-50`}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <Collapse
            items={faqItems.map(({ q, a }) => ({
              key: q,
              label: <span className="font-semibold text-gray-900">{q}</span>,
              children: <p className="text-gray-600">{a}</p>,
            }))}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          />
        </div>
      </section>

      <TutorMatchWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        categories={categories}
      />
    </div>
  );
};

export default LandingPage;
