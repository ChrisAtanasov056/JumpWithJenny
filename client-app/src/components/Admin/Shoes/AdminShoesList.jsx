import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaPlus, FaMinus, FaTrashAlt, FaEdit, FaEye } from 'react-icons/fa';
import ShoeService from '../../../services/ShoeService';
import { formatWorkoutDateBg } from '../../../utils/workoutDate';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import './AdminShoes.scss';

const SHOE_META = [
  { size: 1, label: 'S', range: '36–38' },
  { size: 2, label: 'M', range: '39–41' },
  { size: 3, label: 'L', range: '42–44' },
  { size: 4, label: 'XL', range: '44–46' },
];

const SHOE_LABELS = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const AdminShoesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busySize, setBusySize] = useState(null);

  const [batchSize, setBatchSize] = useState(1);
  const [batchCount, setBatchCount] = useState(2);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ShoeService.getInventory();
      setInventory(data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      setError(typeof msg === 'string' ? msg : t('admin.shoes.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const summaryMap = useMemo(() => {
    const map = {};
    for (const s of inventory?.SizeSummaries || []) {
      map[Number(s.Size)] = s;
    }
    return map;
  }, [inventory]);

  const handleQuickAdd = async (size) => {
    setBusySize(size);
    try {
      await ShoeService.addShoe({ Size: size });
      toast.success(t('admin.shoes.addPairSuccess', { size: SHOE_LABELS[size] }));
      await fetchInventory();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      toast.error(typeof msg === 'string' ? msg : t('admin.shoes.addError'));
    } finally {
      setBusySize(null);
    }
  };

  const handleQuickRemove = async (size) => {
    setBusySize(size);
    try {
      await ShoeService.deleteOneBySize(size);
      toast.success(t('admin.shoes.deleteSuccess'));
      await fetchInventory();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      toast.error(typeof msg === 'string' ? msg : t('admin.shoes.deleteError'));
    } finally {
      setBusySize(null);
    }
  };

  const handleBatchAdd = async (e) => {
    e.preventDefault();
    setBatchSubmitting(true);
    try {
      await ShoeService.addShoesBatch(batchSize, batchCount);
      toast.success(
        t('admin.shoes.batchAddSuccess', {
          count: batchCount,
          size: SHOE_LABELS[Number(batchSize)],
        })
      );
      await fetchInventory();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      toast.error(typeof msg === 'string' ? msg : t('admin.shoes.addError'));
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await ShoeService.deleteShoe(deleteTarget.Id);
      toast.success(t('admin.shoes.deleteSuccess'));
      setDeleteTarget(null);
      await fetchInventory();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      toast.error(typeof msg === 'string' ? msg : t('admin.shoes.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="adm-loading" role="status">{t('admin.shoes.loading')}</div>;
  }

  if (error) {
    return (
      <div className="adm-empty">
        <h3>{t('admin.common.errorPrefix')} {error}</h3>
        <button type="button" className="adm-btn adm-btn--primary" onClick={fetchInventory}>
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  const items = inventory?.Items || [];
  const sizeCounters = { 1: 0, 2: 0, 3: 0, 4: 0 };

  return (
    <div className="admin-shoes-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.shoes.title')}</h1>
          <p>{t('admin.shoes.subtitle')}</p>
        </div>
        <div className="adm-header-actions">
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={() => navigate('/admin/shoes/new')}
          >
            <FaPlus aria-hidden="true" /> {t('admin.shoes.addNew').replace(/^\+\s*/, '')}
          </button>
        </div>
      </div>

      {/* 4 Visual Size Cards */}
      <div className="size-cards-grid">
        {SHOE_META.map((meta) => {
          const stats = summaryMap[meta.size] || {
            TotalCount: 0,
            ReservedUpcomingCount: 0,
            FreeToDeleteCount: 0,
          };
          const isBusy = busySize === meta.size;

          return (
            <div key={meta.size} className="adm-card size-inventory-card">
              <div className="size-card-head">
                <div className="size-badge-wrap">
                  <span className="size-badge">{meta.label}</span>
                  <span className="size-eu">EU {meta.range}</span>
                </div>
                <strong className="size-total tabular-nums">{stats.TotalCount}</strong>
              </div>

              <div className="size-card-stats tabular-nums">
                <span>
                  {t('admin.shoes.reservedUpcoming')}: <strong>{stats.ReservedUpcomingCount}</strong>
                </span>
                <span>
                  {t('admin.shoes.freePairs')}: <strong>{stats.FreeToDeleteCount}</strong>
                </span>
              </div>

              <div className="size-card-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn--navy adm-btn--sm"
                  disabled={isBusy}
                  onClick={() => handleQuickAdd(meta.size)}
                >
                  <FaPlus aria-hidden="true" /> {t('admin.shoes.addOnePair')}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={isBusy || stats.FreeToDeleteCount <= 0}
                  onClick={() => handleQuickRemove(meta.size)}
                >
                  <FaMinus aria-hidden="true" /> {t('admin.shoes.removeOnePair')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Add Bar */}
      <form onSubmit={handleBatchAdd} className="adm-card batch-add-card">
        <div className="batch-title">
          <strong>{t('admin.shoes.batchTitle')}</strong>
        </div>
        <div className="batch-controls">
          <label className="batch-field">
            <span>{t('admin.shoes.batchSizeLabel')}</span>
            <select
              className="adm-select"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
            >
              {SHOE_META.map((m) => (
                <option key={m.size} value={m.size}>
                  {m.label} (EU {m.range})
                </option>
              ))}
            </select>
          </label>

          <label className="batch-field">
            <span>{t('admin.shoes.batchCountLabel')}</span>
            <input
              type="number"
              className="adm-input"
              min={1}
              max={20}
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
            />
          </label>

          <button
            type="submit"
            className="adm-btn adm-btn--primary"
            disabled={batchSubmitting}
          >
            {t('admin.shoes.batchSubmit')}
          </button>
        </div>
      </form>

      {/* Clean All Pairs Inventory List */}
      <section className="adm-card shoes-inventory-list-card">
        <div className="inventory-list-header">
          <h2>{t('admin.shoes.allPairsTitle', { count: items.length })}</h2>
        </div>

        {items.length === 0 ? (
          <div className="adm-empty">
            <p>{t('admin.shoes.noShoes')}</p>
          </div>
        ) : (
          <div className="inventory-table-wrap">
            <table className="shoes-table">
              <thead>
                <tr>
                  <th>{t('admin.shoes.table.id')}</th>
                  <th>{t('admin.shoes.table.size')}</th>
                  <th>{t('admin.shoes.table.status')}</th>
                  <th>{t('admin.shoes.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((shoe) => {
                  const sNum = Number(shoe.Size);
                  sizeCounters[sNum] = (sizeCounters[sNum] || 0) + 1;
                  const label = SHOE_LABELS[sNum] || '?';

                  return (
                    <tr key={shoe.Id}>
                      <td>
                        <strong>
                          {label} · {t('admin.shoes.pairNumber', { index: sizeCounters[sNum] })}
                        </strong>
                      </td>
                      <td>
                        <span className="size-pill">{label}</span>
                      </td>
                      <td>
                        {shoe.IsReservedUpcoming ? (
                          <span className="status-pill reserved tabular-nums">
                            {t('admin.shoes.reservedStatus', { count: shoe.UpcomingReservationsCount })}
                            {shoe.NextReservedWorkoutDate
                              ? ` · ${t('admin.shoes.nextClass', { date: formatWorkoutDateBg(shoe.NextReservedWorkoutDate) })}`
                              : ''}
                          </span>
                        ) : (
                          <span className="status-pill free">{t('admin.shoes.freeStatus')}</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            to={`/admin/shoes/details/${shoe.Id}`}
                            className="adm-btn adm-btn--secondary adm-btn--sm"
                          >
                            <FaEye aria-hidden="true" /> {t('admin.common.viewDetails')}
                          </Link>
                          <Link
                            to={`/admin/shoes/${shoe.Id}`}
                            className="adm-btn adm-btn--secondary adm-btn--sm"
                            aria-label={t('admin.common.edit')}
                          >
                            <FaEdit aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            className="adm-btn adm-btn--danger-soft adm-btn--sm"
                            disabled={shoe.IsReservedUpcoming}
                            onClick={() => setDeleteTarget(shoe)}
                            aria-label={t('admin.common.delete')}
                          >
                            <FaTrashAlt aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={t('admin.shoes.deleteModal.title')}
        message={
          deleteTarget
            ? t('admin.shoes.deleteModal.prompt', {
                size: SHOE_LABELS[Number(deleteTarget.Size)] || '',
              })
            : ''
        }
        warning={t('admin.shoes.deleteModal.warning')}
        confirmLabel={t('admin.shoes.deleteModal.confirm')}
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminShoesList;
