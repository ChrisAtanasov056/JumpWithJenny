import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShoeService from '../../../services/ShoeService';
import './AdminShoes.scss';

const AdminShoeForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [shoe, setShoe] = useState({ Id: id || '', Size: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const fetchShoe = async () => {
        setLoading(true);
        try {
          const data = await ShoeService.getShoeById(id);
          setShoe({
            Id: data.Id,
            Size: Number(data.Size) || 1,
          });
        } catch (err) {
          const serverMessage = err.response?.data?.message || err.response?.data || err.message;
          setError(typeof serverMessage === 'string' ? serverMessage : t('admin.shoes.form.loadError'));
        } finally {
          setLoading(false);
        }
      };
      fetchShoe();
    }
  }, [id, t]);

  const handleChange = (e) => {
    const nextSize = Number(e.target.value);
    setShoe(prev => ({
      ...prev,
      Id: id || prev.Id || '',
      Size: nextSize,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await ShoeService.updateShoe(id, {
          Id: id,
          Size: Number(shoe.Size),
        });
      } else {
        await ShoeService.addShoe({
          Size: Number(shoe.Size),
        });
      }
      navigate('/admin/shoes');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data || err.message;
      setError(typeof serverMessage === 'string' ? serverMessage : t('admin.shoes.form.saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>{t('admin.shoes.form.loading')}</div>;

  return (
    <div className="admin-shoe-form">
      <h2>{id ? t('admin.shoes.form.editTitle') : t('admin.shoes.form.addTitle')}</h2>
      {error && <div className="error">{t('admin.common.errorPrefix')} {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="shoe-size">{t('admin.shoes.form.sizeLabel')}</label>
          <select id="shoe-size" name="Size" value={shoe.Size} onChange={handleChange} required>
            <option value={1}>S</option>
            <option value={2}>M</option>
            <option value={3}>L</option>
            <option value={4}>XL</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading}>
            {t('admin.shoes.form.saveButton')}
          </button>
          <button type="button" className="btn-cancel-form" onClick={() => navigate('/admin/shoes')}>
            {t('admin.common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminShoeForm;
