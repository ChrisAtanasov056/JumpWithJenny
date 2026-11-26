import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ShoeService from '../../../services/ShoeService';
import './AdminShoes.scss';

const SHOE_OPTIONS = [
  { size: 1, label: 'S (EU 36–38)' },
  { size: 2, label: 'M (EU 39–41)' },
  { size: 3, label: 'L (EU 42–44)' },
  { size: 4, label: 'XL (EU 44–46)' },
];

const AdminShoeForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [size, setSize] = useState(1);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchShoe = async () => {
      setLoading(true);
      try {
        const data = await ShoeService.getShoeById(id);
        setSize(Number(data.Size) || 1);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data || err?.message;
        setError(typeof msg === 'string' ? msg : t('admin.shoes.form.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchShoe();
  }, [id, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (id) {
        await ShoeService.updateShoe(id, { Id: id, Size: Number(size) });
      } else {
        await ShoeService.addShoe({ Size: Number(size) });
      }
      toast.success(t('admin.shoes.addPairSuccess', { size: SHOE_OPTIONS.find((o) => o.size === Number(size))?.label.split(' ')[0] || '' }));
      navigate('/admin/shoes');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      setError(typeof msg === 'string' ? msg : t('admin.shoes.form.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="adm-loading" role="status">{t('admin.shoes.form.loading')}</div>;
  }

  return (
    <div className="admin-shoe-form-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{id ? t('admin.shoes.form.editTitle') : t('admin.shoes.form.addTitle')}</h1>
        </div>
        <Link to="/admin/shoes" className="adm-btn adm-btn--secondary">
          {t('admin.common.backToList')}
        </Link>
      </div>

      {error && <div className="adm-alert adm-alert--error">{t('admin.common.errorPrefix')} {error}</div>}

      <form onSubmit={handleSubmit} className="adm-card shoe-form-card">
        <div className="form-field">
          <label htmlFor="shoe-size">{t('admin.shoes.form.sizeLabel')}</label>
          <select
            id="shoe-size"
            className="adm-select"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setError(null);
            }}
            required
          >
            {SHOE_OPTIONS.map((opt) => (
              <option key={opt.size} value={opt.size}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={() => navigate('/admin/shoes')}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
            {saving ? t('admin.common.saving') : t('admin.shoes.form.saveButton')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminShoeForm;
