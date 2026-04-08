/** Category from GET /tutors/categories and on tutor objects */
export interface TutorCategory {
  id: number;
  name: string;
  slug: string;
}

/** UI-facing tutor type used by TutorCard, FindTutor, etc. */
export interface Tutor {
  id: string;
  fullName: string;
  category: TutorCategory | null;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  bio: string;
  certified: boolean;
  profileImage?: string | null;
}
