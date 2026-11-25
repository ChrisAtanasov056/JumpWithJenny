import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ShoeService from '../../../services/ShoeService';
import './AdminShoes.scss';

const shoeSizeLabels = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const AdminShoesList = () => {
  const { t } = useTranslation();
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShoes = async () => {
      try {
        const data = await ShoeService.getAllShoes();
        setShoes(data);
      } catch (err) {
        const serverMessage = err.response?.data?.message || err.response?.data || err.message;
        setError(typeof serverMessage === 'string' ? serverMessage : t('admin.shoes.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchShoes();
  }, [t]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.shoes.deleteConfirm'))) return;
    setActionError(null);

    try {
      await ShoeService.deleteShoe(id);
      setShoes(prev => prev.filter(shoe => shoe.Id !== id));
      toast.success(t('admin.shoes.deleteSuccess'));
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data || err.message;
      setActionError(typeof serverMessage === 'string' ? serverMessage : t('admin.shoes.deleteError'));
    }
  };

  if (loading) return <div>{t('admin.shoes.loading')}</div>;
  if (error) return <div>{t('admin.common.errorPrefix')} {error}</div>;

  return (
    <div className="admin-shoes">
      <div className="header">
        <h2>{t('admin.shoes.title')}</h2>
        <button className="btn-add" onClick={() => navigate('/admin/shoes/new')}>
          {t('admin.shoes.addNew')}
        </button>
      </div>

      {actionError && <div className="error">{actionError}</div>}

      <div className="shoes-table">
        <table>
          <thead>
            <tr>
              <th>{t('admin.shoes.table.id')}</th>
              <th>{t('admin.shoes.table.size')}</th>
              <th>{t('admin.shoes.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {shoes.length > 0 ? (
              shoes.map(shoe => (
                <tr key={shoe.Id}>
                  <td>{shoe.Id}</td>
                  <td>{shoeSizeLabels[Number(shoe.Size)] || t('admin.common.notAvailable')}</td>
                  <td className="actions">
                    <Link to={`/admin/shoes/details/${shoe.Id}`} className="btn-view">
                      {t('admin.common.viewDetails')}
                    </Link>
                    <Link to={`/admin/shoes/${shoe.Id}`} className="btn-edit">
                      {t('admin.common.edit')}
                    </Link>
                    <button className="btn-delete" onClick={() => handleDelete(shoe.Id)}>
                      {t('admin.common.delete')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-results">{t('admin.shoes.noShoes')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminShoesList;
