import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Check, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { selectUser } from '@/store/authSlice';
import { assetUrl } from '@/shared/lib/assetUrl';
import type { Tutor } from '@/entities/Tutor/types';
import MarkdownText from '@/shared/ui/MarkdownText';

interface TutorCardProps {
  tutor: Tutor;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const TutorCard = ({ tutor }: TutorCardProps) => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { isAuthenticated } = useAuth();
  const initials = getInitials(tutor.fullName);
  const avatarSrc = assetUrl(tutor.profileImage);
  const costPer30Min = Math.round(tutor.pricePerHour / 2);
  const canBook = !isAuthenticated || user?.userType === 'LEARNER';

  const handleSeeProfile = () => {
    navigate(`/tutor/${tutor.id}`);
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    navigate(`/tutor/${tutor.id}`);
  };

  return (
    <article
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 flex flex-col"
    >
      {/* Top: large profile image with certified badge overlay */}
      <div className="relative aspect-[4/5] w-full bg-gray-200 overflow-hidden">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-4xl font-semibold bg-gradient-to-br from-blue-500 to-indigo-600"
            aria-hidden
          >
            {initials}
          </div>
        )}
        {tutor.certified && (
          <div
            className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center shadow-sm"
            title="Certified"
          >
            <Check className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Content: name, bio, price + actions */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-xl truncate">
          {tutor.fullName}
        </h3>
        {tutor.category && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
            {tutor.category.name}
          </span>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-sm">
          {tutor.reviewCount > 0 ? (
            <>
              <Star className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2} fill="currentColor" />
              <span className="font-semibold text-gray-900">{tutor.rating.toFixed(1)}</span>
              <span className="text-gray-500">
                ({tutor.reviewCount} {tutor.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : (
            <span className="text-gray-500">No reviews yet</span>
          )}
        </div>
        <div className="mt-1 max-h-[3rem] overflow-hidden text-sm leading-relaxed text-gray-600">
          {tutor.bio ? (
            <MarkdownText variant="card">{tutor.bio}</MarkdownText>
          ) : (
            <span>No bio yet.</span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <span
            className={`text-lg font-bold text-gray-900 select-none min-w-[4rem] ${!isAuthenticated ? 'blur-sm' : ''}`}
            title={!isAuthenticated ? 'Log in to see price' : undefined}
          >
            {costPer30Min}$
            <span className="text-sm font-normal text-gray-500 ml-0.5">/ 30 min</span>
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSeeProfile}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              See profile
            </button>
            {canBook && (
              <button
                type="button"
                onClick={handleBook}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-colors"
              >
                Book
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default TutorCard;
