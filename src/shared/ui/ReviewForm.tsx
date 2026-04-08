import { useState } from 'react';
import { Button, Input, Rate, Alert, message } from 'antd';
import axios from 'axios';
import { useCreateTutorReviewMutation } from '@/entities/Tutor/api';

interface ReviewFormProps {
  tutorId: string;
  onSuccess: () => void;
}

export default function ReviewForm({ tutorId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const mutation = useCreateTutorReviewMutation(tutorId);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating (1–5).');
      return;
    }
    setError('');
    try {
      await mutation.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
      });
      message.success('Thank you for your review!');
      setComment('');
      setRating(0);
      onSuccess();
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const msg =
          (e.response?.data as { message?: string })?.message ?? 'Failed to submit review';
        if (status === 409) {
          setError('You have already reviewed this tutor.');
        } else if (status === 400) {
          setError('You need to complete a paid session with this tutor before leaving a review.');
        } else {
          setError(msg);
        }
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Leave a review</h3>
      <p className="text-sm text-gray-600 mb-4">Rate your experience (1–5). Comment is optional.</p>

      <div className="mb-4">
        <span className="block text-sm font-medium text-gray-700 mb-2">Rating</span>
        <Rate
          value={rating}
          onChange={setRating}
          allowClear
          className="text-amber-500 text-2xl"
        />
      </div>

      <Input.TextArea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment (optional)…"
        rows={4}
        maxLength={2000}
        showCount
        className="rounded-xl"
      />

      {error && (
        <Alert type="error" message={error} showIcon className="mt-3" />
      )}

      <Button
        type="primary"
        onClick={handleSubmit}
        disabled={rating < 1 || mutation.isPending}
        loading={mutation.isPending}
        className="mt-4 rounded-xl bg-blue-600"
      >
        Submit review
      </Button>
    </div>
  );
}
