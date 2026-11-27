import axios from '../api/axius';

export const GOOGLE_REVIEW_URL = 'https://share.google/fPrVLn7luewbFyUNC';
export const REVIEWS_CHANGED_EVENT = 'admin:reviews-changed';

export const notifyReviewsChanged = () => {
  window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
};

const mapPublicReview = (item) => ({
  id: item?.Id ?? item?.id,
  name: item?.AuthorName ?? item?.authorName ?? '',
  comment: item?.Comment ?? item?.comment ?? '',
  rating: Number(item?.Rating ?? item?.rating ?? 5),
  source: item?.Source ?? item?.source ?? 'Site',
  createdOn: item?.CreatedOn ?? item?.createdOn ?? null,
});

const mapAdminReview = (item) => ({
  id: item?.Id ?? item?.id,
  authorName: item?.AuthorName ?? item?.authorName ?? '',
  comment: item?.Comment ?? item?.comment ?? '',
  rating: Number(item?.Rating ?? item?.rating ?? 5),
  status: item?.Status ?? item?.status ?? 'Pending',
  source: item?.Source ?? item?.source ?? 'Site',
  createdOn: item?.CreatedOn ?? item?.createdOn ?? null,
  approvedOn: item?.ApprovedOn ?? item?.approvedOn ?? null,
});

export const getApprovedReviews = async () => {
  const response = await axios.get('/api/Reviews');
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(mapPublicReview);
};

export const submitPublicReview = async ({ authorName, comment, rating, website = '' }) => {
  const response = await axios.post('/api/Reviews', {
    AuthorName: authorName,
    Comment: comment,
    Rating: rating,
    Website: website,
  });
  return response.data;
};

export const getAdminReviews = async ({ status = 'all', search = '' } = {}) => {
  const params = {};
  if (status && status !== 'all') {
    params.status = status;
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await axios.get('/api/Reviews/admin', { params });
  const rawItems = Array.isArray(response.data?.Items) ? response.data.Items : [];
  const rawCounts = response.data?.Counts || {};

  return {
    items: rawItems.map(mapAdminReview),
    counts: {
      all: Number(rawCounts.All ?? 0),
      pending: Number(rawCounts.Pending ?? 0),
      approved: Number(rawCounts.Approved ?? 0),
      rejected: Number(rawCounts.Rejected ?? 0),
    },
  };
};

export const getPendingReviewsCount = async () => {
  const response = await axios.get('/api/Reviews/admin/pending-count');
  return Number(response.data?.PendingCount ?? 0);
};

export const adminCreateReview = async ({ authorName, comment, rating, status, source }) => {
  const response = await axios.post('/api/Reviews/admin', {
    AuthorName: authorName,
    Comment: comment,
    Rating: rating,
    Status: status,
    Source: source,
  });
  return mapAdminReview(response.data);
};

export const adminUpdateReview = async (id, { authorName, comment, rating, status, source }) => {
  const response = await axios.put(`/api/Reviews/admin/${encodeURIComponent(id)}`, {
    AuthorName: authorName,
    Comment: comment,
    Rating: rating,
    Status: status,
    Source: source,
  });
  return mapAdminReview(response.data);
};

export const updateReviewStatus = async (id, status) => {
  const response = await axios.patch(`/api/Reviews/admin/${encodeURIComponent(id)}/status`, {
    Status: status,
  });
  return mapAdminReview(response.data);
};

export const deleteReview = async (id) => {
  await axios.delete(`/api/Reviews/admin/${encodeURIComponent(id)}`);
};
