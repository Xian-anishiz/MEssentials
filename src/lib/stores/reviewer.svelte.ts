import { MOCK_REVIEWERS, type Reviewer } from '$mocks/reviewers';

const STORAGE_KEY = 'messentials.mockup.v1.reviewers';

type StoredReviewer = Pick<Reviewer, 'id' | 'bookmarked'>;

export function createReviewerState() {
  let reviewers = $state<Reviewer[]>(MOCK_REVIEWERS);

  // Re-apply persisted bookmarks so saved reviewers survive reloads
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoredReviewer[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const bookmarkedIds = new Set(
            parsed.filter(r => r.bookmarked).map(r => r.id)
          );
          reviewers = MOCK_REVIEWERS.map(r =>
            bookmarkedIds.size > 0 && bookmarkedIds.has(r.id) ? { ...r, bookmarked: true } : r
          );
        }
      } catch (e) {
        console.error('Failed to load mockup reviewer bookmarks', e);
      }
    }
  }

  function saveBookmarks() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewers.map(r => ({ id: r.id, bookmarked: r.bookmarked }))));
    }
  }

  const savedReviewers = $derived.by(() => {
    return reviewers.filter(r => r.bookmarked);
  });

  return {
    get reviewers() { return reviewers; },
    get savedCount() { return savedReviewers.length; },
    get savedReviewers() { return savedReviewers; },
    toggleBookmark(id: string) {
      reviewers = reviewers.map(r => r.id === id ? { ...r, bookmarked: !r.bookmarked } : r);
      saveBookmarks();
    },
    updateManualSummary(id: string, summary: string) {
      reviewers = reviewers.map(r => r.id === id ? { ...r, manualSummary: summary } : r);
    },
    addReviewer(fields: { title: string; courseCode: string; description: string; tags: string[] }) {
      if (!fields.title.trim()) return;
      reviewers = [...reviewers, {
        id: 'rev_' + Math.random().toString(36).substr(2, 9),
        title: fields.title.trim(),
        authors: ['DME Volcorps Academics'],
        description: fields.description.trim(),
        courseCode: fields.courseCode.trim(),
        tags: fields.tags,
        fileSize: `${(Math.random() * 14 + 1).toFixed(1)} MB`,
        hasSelectableText: true,
        bookmarked: false,
        publishedAt: new Date().toISOString().split('T')[0]
      }];
    }
  };
}

export const reviewerState = createReviewerState();
