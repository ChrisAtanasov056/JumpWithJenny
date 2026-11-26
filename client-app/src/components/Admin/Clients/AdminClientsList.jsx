import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaPhone, FaEnvelope, FaHistory, FaExternalLinkAlt } from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import { formatWorkoutDateBg } from '../../../utils/workoutDate';
import useModalAccessibility from '../../../services/useModalAccessibility';
import useOutsideClick from '../../../services/useOutsideClick';
import './AdminClientsList.scss';

const SHOE_SIZE_LABELS = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const PAGE_SIZE = 25;

const AdminClientsList = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastVisit');
  const [page, setPage] = useState(1);

  const [pagedResult, setPagedResult] = useState({
    Items: [],
    Page: 1,
    PageSize: PAGE_SIZE,
    TotalCount: 0,
    TotalPages: 0,
    HasPreviousPage: false,
    HasNextPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const historyModalRef = useRef(null);

  const closeHistory = useCallback(() => setSelectedClient(null), []);

  useOutsideClick(historyModalRef, closeHistory, Boolean(selectedClient));
  useModalAccessibility({
    isOpen: Boolean(selectedClient),
    onClose: closeHistory,
    modalRef: historyModalRef,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkoutService.getClients({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sortBy,
      });
      setPagedResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('admin.clients.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sortBy, t]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const getTranslatedDay = (day) =>
    day ? t(`days.${day.toLowerCase()}`, { defaultValue: day }) : '';

  const renderShoeLabel = (client) => {
    if (client.UsesOwnShoesMostly) return t('admin.clients.ownShoes');
    if (client.PreferredShoeSize) return SHOE_SIZE_LABELS[Number(client.PreferredShoeSize)] || '—';
    return '—';
  };

  const clients = pagedResult?.Items || [];

  return (
    <div className="admin-clients-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.clients.title')}</h1>
          <p>{t('admin.clients.subtitle')}</p>
        </div>
      </div>

      <div className="adm-card clients-toolbar">
        <div className="adm-search-field">
          <FaSearch className="adm-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="adm-input"
            placeholder={t('admin.clients.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={t('admin.clients.searchAriaLabel')}
          />
        </div>

        <div className="sort-control">
          <label htmlFor="clients-sort">{t('admin.clients.sortLabel')}:</label>
          <select
            id="clients-sort"
            className="adm-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="lastVisit">{t('admin.clients.sortLastVisit')}</option>
            <option value="bookingsCount">{t('admin.clients.sortBookings')}</option>
            <option value="name">{t('admin.clients.sortName')}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error">
          {t('admin.common.errorPrefix')} {error}
        </div>
      )}

      {loading ? (
        <div className="adm-loading" role="status">{t('admin.clients.loading')}</div>
      ) : clients.length === 0 ? (
        <div className="adm-empty">
          <h3>{debouncedSearch ? t('admin.clients.noMatchingClients') : t('admin.clients.noClients')}</h3>
          {debouncedSearch && (
            <button
              type="button"
              className="adm-btn adm-btn--secondary"
              onClick={() => {
                setSearchInput('');
                setPage(1);
              }}
            >
              {t('admin.common.resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="adm-card clients-table-card">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>{t('admin.clients.table.client')}</th>
                  <th>{t('admin.clients.table.contacts')}</th>
                  <th>{t('admin.clients.table.bookings')}</th>
                  <th>{t('admin.clients.table.attended')}</th>
                  <th>{t('admin.clients.table.shoes')}</th>
                  <th>{t('admin.clients.table.lastWorkout')}</th>
                  <th>{t('admin.clients.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.ClientKey}>
                    <td>
                      <strong>{client.FullName}</strong>
                    </td>
                    <td>
                      <div className="contacts-col">
                        {client.PhoneNumber && (
                          <a href={`tel:${client.PhoneNumber.replace(/\s+/g, '')}`} className="contact-item tabular-nums">
                            <FaPhone aria-hidden="true" /> {client.PhoneNumber}
                          </a>
                        )}
                        {client.Email ? (
                          <a href={`mailto:${client.Email}`} className="contact-item">
                            <FaEnvelope aria-hidden="true" /> {client.Email}
                          </a>
                        ) : (
                          <span className="muted-tag">{t('admin.clients.noEmail')}</span>
                        )}
                      </div>
                    </td>
                    <td className="tabular-nums">
                      <strong>{client.TotalBookings}</strong>
                      {client.UpcomingBookings > 0 && (
                        <span className="upcoming-pill">
                          {t('admin.clients.upcomingTag', { count: client.UpcomingBookings })}
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums">{client.AttendedCount}</td>
                    <td>
                      <span className="shoe-badge">{renderShoeLabel(client)}</span>
                    </td>
                    <td className="tabular-nums">{formatWorkoutDateBg(client.LastWorkoutDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="adm-btn adm-btn--secondary adm-btn--sm"
                        onClick={() => setSelectedClient(client)}
                      >
                        <FaHistory aria-hidden="true" /> {t('admin.clients.historyBtn')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="clients-mobile-list">
            {clients.map((client) => (
              <div key={client.ClientKey} className="adm-card client-mobile-card">
                <div className="client-mobile-top">
                  <strong>{client.FullName}</strong>
                  <span className="shoe-badge">{renderShoeLabel(client)}</span>
                </div>
                <div className="contacts-col">
                  {client.PhoneNumber && (
                    <a href={`tel:${client.PhoneNumber.replace(/\s+/g, '')}`} className="contact-item tabular-nums">
                      <FaPhone aria-hidden="true" /> {client.PhoneNumber}
                    </a>
                  )}
                  {client.Email && (
                    <a href={`mailto:${client.Email}`} className="contact-item">
                      <FaEnvelope aria-hidden="true" /> {client.Email}
                    </a>
                  )}
                </div>
                <div className="client-mobile-bottom">
                  <span className="tabular-nums">
                    {t('admin.clients.historyStats', {
                      total: client.TotalBookings,
                      attended: client.AttendedCount,
                    })}
                  </span>
                  <button
                    type="button"
                    className="adm-btn adm-btn--secondary adm-btn--sm"
                    onClick={() => setSelectedClient(client)}
                  >
                    <FaHistory aria-hidden="true" /> {t('admin.clients.historyBtn')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagedResult.TotalPages > 1 && (
            <div className="adm-pagination">
              <span className="tabular-nums">
                {t('admin.common.pageInfo', {
                  page: pagedResult.Page,
                  totalPages: pagedResult.TotalPages,
                  totalCount: pagedResult.TotalCount,
                })}
              </span>
              <div className="adm-pagination-controls">
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={!pagedResult.HasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('admin.common.previousPage')}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={!pagedResult.HasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('admin.common.nextPage')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedClient && (
        <div className="adm-modal-overlay" role="presentation">
          <div
            ref={historyModalRef}
            className="adm-modal-dialog client-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-history-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <div>
                <h3 id="client-history-title">
                  {t('admin.clients.historyTitle', { name: selectedClient.FullName })}
                </h3>
                <p className="history-subtitle tabular-nums">
                  {t('admin.clients.historyStats', {
                    total: selectedClient.TotalBookings,
                    attended: selectedClient.AttendedCount,
                  })}
                </p>
              </div>
              <button
                type="button"
                className="adm-modal-close"
                onClick={closeHistory}
                aria-label={t('admin.common.close')}
              >
                &times;
              </button>
            </div>

            <div className="history-list">
              {(selectedClient.RecentWorkouts || []).map((w) => (
                <div key={w.AppointmentId} className="history-row">
                  <div>
                    <strong className="tabular-nums">{formatWorkoutDateBg(w.WorkoutDate)}</strong>
                    <div className="history-meta">
                      {getTranslatedDay(w.WorkoutDay)} · {w.WorkoutTime}
                    </div>
                  </div>
                  <div className="history-right">
                    <span className="shoe-badge">
                      {w.UsesOwnShoes
                        ? t('admin.clients.ownShoes')
                        : (SHOE_SIZE_LABELS[Number(w.ShoeSize)] || '—')}
                    </span>
                    <span className={`att-tag${w.IsAttended ? ' yes' : ''}`}>
                      {w.IsAttended ? t('admin.clients.attendedTag') : t('admin.clients.notAttendedTag')}
                    </span>
                    <Link
                      to={`/admin/workouts/${w.WorkoutId}/view`}
                      className="adm-btn adm-btn--secondary adm-btn--sm"
                      onClick={closeHistory}
                    >
                      <FaExternalLinkAlt aria-hidden="true" /> {t('admin.clients.openWorkout')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClientsList;
