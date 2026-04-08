import type { Review } from '@/entities/Tutor/api';

interface TutorReviewsProps {
  reviews: Review[];
}

export default function TutorReviews({ reviews }: TutorReviewsProps) {
  if (reviews.length === 0) {
    return <p className="text-gray-500 text-sm">No reviews yet.</p>;
  }

  return (
    <div className="space-y-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews ({reviews.length})</h3>
      <ul className="divide-y divide-gray-100">
        {reviews.map((review) => (
          <li key={review.id} className="py-4 first:pt-0">
            <div className="flex justify-between items-start gap-3">
              <span className="font-medium text-gray-900">{review.learner.user.fullName}</span>
              <span className="text-xs text-gray-500 shrink-0">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="text-amber-500 text-sm mt-1" aria-label={`${review.rating} out of 5 stars`}>
              {'★'.repeat(review.rating)}
              <span className="text-gray-300">{'☆'.repeat(5 - review.rating)}</span>
            </div>
            {review.comment && (
              <p className="mt-2 text-gray-700 text-sm leading-relaxed">{review.comment}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
