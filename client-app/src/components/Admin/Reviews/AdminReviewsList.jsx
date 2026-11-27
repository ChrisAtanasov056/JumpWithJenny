import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaSearch,
  FaStar,
  FaPlus,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrashAlt,
  FaGoogle,
  FaGlobe,
  FaUserShield,
  FaCommentDots,
} from 'react-icons/fa';
import {
  getAdminReviews,
  adminCreateReview,
  adminUpdateReview,
  updateReviewStatus,
  deleteReview,
  notifyReviewsChanged,
} from '../../../services/ReviewService';
import useModalAccessibility from '../../../services/useModalAccessibility';
import useOutsideClick from '../../../services/useOutsideClick';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import './AdminReviewsList.scss';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];
const MAX_AUTHOR_LENGTH = 80;
const MIN_AUTHOR_LENGTH = 2;
const MAX_COMMENT_LENGTH = 200;
const MIN_COMMENT_LENGTH = 10;

const INITIAL_FORM_STATE = {
  authorName: '',
  rating: 5,
  comment: '',
  source: 'Google',
  status: 'Approved',
};

const formatReviewDate = (dateValue) => {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const renderSourceIcon = (source) => {
  if (source === 'Google') return <FaGoogle aria-hidden="true" />;
  if (source === 'Admin') return <FaUserShield aria-hidden="true" />;
  return <FaGlobe aria-hidden="true" />;
};

const AdminReviewsList = () => {
  const { t } = useTranslation();

  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState('');
  const [isSavingForm, setIsSavingForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formModalRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReviews({
        status: activeTab,
        search: debouncedSearch,
      });
      setReviews(data.items);
      setCounts(data.counts);
    } catch {
      setError(t('admin.reviews.loadError'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, t]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const closeFormModal = useCallback(() => {
    if (isSavingForm) return;
    setFormModalOpen(false);
    setEditingReview(null);
    setFormError('');
  }, [isSavingForm]);

  useOutsideClick(formModalRef, closeFormModal, formModalOpen && !isSavingForm);
  useModalAccessibility({
    isOpen: formModalOpen,
    onClose: isSavingForm ? undefined : closeFormModal,
    modalRef: formModalRef,
  });

  const openCreateModal = () => {
    setEditingReview(null);
    setFormState(INITIAL_FORM_STATE);
    setFormError('');
    setFormModalOpen(true);
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setFormState({
      authorName: review.authorName,
      rating: review.rating,
      comment: review.comment,
      source: review.source || 'Site',
      status: review.status || 'Approved',
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const handleStatusChange = async (review, nextStatus) => {
    if (busyId) return;
    setBusyId(review.id);
    try {
      await updateReviewStatus(review.id, nextStatus);
      toast.success(
        nextStatus === 'Approved'
          ? t('admin.reviews.toasts.approved')
          : t('admin.reviews.toasts.rejected')
      );
      notifyReviewsChanged();
      await fetchReviews();
    } catch {
      toast.error(t('admin.reviews.toasts.actionError'));
    } finally {
      setBusyId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSavingForm) return;

    const normalizedAuthor = formState.authorName.trim().replace(/\s+/g, ' ');
    if (normalizedAuthor.length < MIN_AUTHOR_LENGTH || normalizedAuthor.length > MAX_AUTHOR_LENGTH) {
      setFormError(t('admin.reviews.form.errorAuthor'));
      return;
    }

    const normalizedComment = formState.comment.trim().replace(/\s+/g, ' ');
    if (normalizedComment.length < MIN_COMMENT_LENGTH || normalizedComment.length > MAX_COMMENT_LENGTH) {
      setFormError(t('admin.reviews.form.errorComment'));
      return;
    }

    setIsSavingForm(true);
    setFormError('');

    const payload = {
      authorName: normalizedAuthor,
      comment: normalizedComment,
      rating: Number(formState.rating) || 5,
      source: formState.source,
      status: formState.status,
    };

    try {
      if (editingReview) {
        await adminUpdateReview(editingReview.id, payload);
        toast.success(t('admin.reviews.toasts.updated'));
      } else {
        await adminCreateReview(payload);
        toast.success(t('admin.reviews.toasts.created'));
      }
      setFormModalOpen(false);
      setEditingReview(null);
      notifyReviewsChanged();
      await fetchReviews();
    } catch {
      setFormError(t('admin.reviews.toasts.actionError'));
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteReview(deleteTarget.id);
      toast.success(t('admin.reviews.toasts.deleted'));
      setDeleteTarget(null);
      notifyReviewsChanged();
      await fetchReviews();
    } catch {
      toast.error(t('admin.reviews.toasts.actionError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const hasFilters = activeTab !== 'all' || Boolean(debouncedSearch);

  return (
    <div className="admin-reviews-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.reviews.title')}</h1>
          <p>{t('admin.reviews.subtitle')}</p>
        </div>

        <div className="adm-header-actions">
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={openCreateModal}
          >
            <FaPlus aria-hidden="true" />
            <span>{t('admin.reviews.addButton')}</span>
          </button>
        </div>
      </div>

      <div className="adm-card reviews-toolbar">
        <div className="reviews-tabs" role="tablist" aria-label={t('admin.reviews.title')}>
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`reviews-tab${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{t(`admin.reviews.tabs.${tab}`)}</span>
                <span className="tab-count tabular-nums">{counts[tab] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className="adm-search-field">
          <FaSearch className="adm-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="adm-input"
            placeholder={t('admin.reviews.searchPlaceholder')}
            aria-label={t('admin.reviews.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      {loading ? (
        <div className="adm-loading" role="status">
          {t('admin.reviews.loading')}
        </div>
      ) : reviews.length === 0 ? (
        <div className="adm-empty">
          <FaCommentDots size={36} aria-hidden="true" />
          <p>
            {hasFilters ? t('admin.reviews.emptyFiltered') : t('admin.reviews.emptyAll')}
          </p>
          {hasFilters && (
            <button
              type="button"
              className="adm-btn adm-btn--secondary adm-btn--sm"
              onClick={() => {
                setActiveTab('all');
                setSearchInput('');
              }}
            >
              {t('admin.common.resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => {
            const isBusy = busyId === review.id;
            const statusClass = (review.status || 'Pending').toLowerCase();

            return (
              <article key={review.id} className="adm-card review-card">
                <div className="review-card__top">
                  <div className="review-card__author-block">
                    <strong className="review-card__author">{review.authorName}</strong>
                    <div
                      className="review-card__stars"
                      aria-label={t('testimonials.ratingLabel', { rating: review.rating })}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={star <= review.rating ? 'is-filled' : 'is-empty'}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="review-card__meta">
                    <span className={`adm-status-badge review-status-${statusClass}`}>
                      {t(`admin.reviews.status.${review.status}`)}
                    </span>
                    <span className={`review-source-pill source-${(review.source || 'Site').toLowerCase()}`}>
                      {renderSourceIcon(review.source)}
                      <span>{t(`admin.reviews.source.${review.source}`)}</span>
                    </span>
                    {review.createdOn && (
                      <span className="review-card__date">{formatReviewDate(review.createdOn)}</span>
                    )}
                  </div>
                </div>

                <p className="review-card__comment">„{review.comment}“</p>

                <div className="review-card__actions">
                  {review.status !== 'Approved' && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--sm review-approve-btn"
                      onClick={() => handleStatusChange(review, 'Approved')}
                      disabled={isBusy}
                    >
                      <FaCheck aria-hidden="true" />
                      <span>{t('admin.reviews.actions.approve')}</span>
                    </button>
                  )}

                  {review.status !== 'Rejected' && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--secondary adm-btn--sm"
                      onClick={() => handleStatusChange(review, 'Rejected')}
                      disabled={isBusy}
                    >
                      <FaTimes aria-hidden="true" />
                      <span>{t('admin.reviews.actions.reject')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                    onClick={() => openEditModal(review)}
                    disabled={isBusy}
                  >
                    <FaEdit aria-hidden="true" />
                    <span>{t('admin.reviews.actions.edit')}</span>
                  </button>

                  <button
                    type="button"
                    className="adm-btn adm-btn--danger-soft adm-btn--sm"
                    onClick={() => setDeleteTarget(review)}
                    disabled={isBusy}
                  >
                    <FaTrashAlt aria-hidden="true" />
                    <span>{t('admin.reviews.actions.delete')}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {formModalOpen && (
        <div className="adm-modal-overlay" role="presentation">
          <div
            ref={formModalRef}
            className="adm-modal-dialog review-form-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-review-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3 id="adm-review-form-title">
                {editingReview
                  ? t('admin.reviews.form.editTitle')
                  : t('admin.reviews.form.createTitle')}
              </h3>
              <button
                type="button"
                className="adm-modal-close"
                onClick={closeFormModal}
                disabled={isSavingForm}
                aria-label={t('admin.common.close')}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="review-form" noValidate>
              <div className="review-form__field">
                <label htmlFor="adm-review-author">{t('admin.reviews.form.authorLabel')}</label>
                <input
                  id="adm-review-author"
                  type="text"
                  className="adm-input"
                  placeholder={t('admin.reviews.form.authorPlaceholder')}
                  value={formState.authorName}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, authorName: e.target.value }));
                    setFormError('');
                  }}
                  maxLength={MAX_AUTHOR_LENGTH}
                  required
                />
              </div>

              <div className="review-form__field">
                <span id="adm-review-rating-label" className="review-form__label">
                  {t('admin.reviews.form.ratingLabel')}
                </span>
                <div
                  className="review-form__stars"
                  role="radiogroup"
                  aria-labelledby="adm-review-rating-label"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={formState.rating === star}
                      aria-label={t('reviewModal.starAria', { count: star })}
                      className={`adm-star-btn${star <= formState.rating ? ' is-filled' : ''}`}
                      onClick={() => setFormState((prev) => ({ ...prev, rating: star }))}
                    >
                      <FaStar aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="review-form__field">
                <div className="review-form__label-row">
                  <label htmlFor="adm-review-comment">{t('admin.reviews.form.commentLabel')}</label>
                  <span className="review-form__counter tabular-nums">
                    {formState.comment.length} / {MAX_COMMENT_LENGTH}
                  </span>
                </div>
                <textarea
                  id="adm-review-comment"
                  className="adm-input review-form__textarea"
                  rows={4}
                  placeholder={t('admin.reviews.form.commentPlaceholder')}
                  value={formState.comment}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, comment: e.target.value }));
                    setFormError('');
                  }}
                  maxLength={MAX_COMMENT_LENGTH}
                  required
                />
              </div>

              <div className="review-form__grid">
                <div className="review-form__field">
                  <label htmlFor="adm-review-source">{t('admin.reviews.form.sourceLabel')}</label>
                  <select
                    id="adm-review-source"
                    className="adm-select"
                    value={formState.source}
                    onChange={(e) => setFormState((prev) => ({ ...prev, source: e.target.value }))}
                  >
                    <option value="Google">{t('admin.reviews.source.Google')}</option>
                    <option value="Site">{t('admin.reviews.source.Site')}</option>
                    <option value="Admin">{t('admin.reviews.source.Admin')}</option>
                  </select>
                </div>

                <div className="review-form__field">
                  <label htmlFor="adm-review-status">{t('admin.reviews.form.statusLabel')}</label>
                  <select
                    id="adm-review-status"
                    className="adm-select"
                    value={formState.status}
                    onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Approved">{t('admin.reviews.status.Approved')}</option>
                    <option value="Pending">{t('admin.reviews.status.Pending')}</option>
                    <option value="Rejected">{t('admin.reviews.status.Rejected')}</option>
                  </select>
                </div>
              </div>

              {formError && <div className="adm-alert adm-alert--error">{formError}</div>}

              <div className="review-form__actions">
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary"
                  onClick={closeFormModal}
                  disabled={isSavingForm}
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn--primary"
                  disabled={isSavingForm}
                >
                  {isSavingForm
                    ? t('admin.common.saving')
                    : editingReview
                      ? t('admin.reviews.form.save')
                      : t('admin.reviews.form.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={t('admin.reviews.deleteModal.title')}
        message={
          deleteTarget
            ? t('admin.reviews.deleteModal.prompt', { name: deleteTarget.authorName })
            : ''
        }
        warning={t('admin.reviews.deleteModal.warning')}
        confirmLabel={t('admin.reviews.deleteModal.confirm')}
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminReviewsList;
