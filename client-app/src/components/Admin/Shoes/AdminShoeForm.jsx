import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ShoeService from '../../../services/ShoeService';
import './AdminShoes.scss';

const AdminShoeForm = () => {
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
          setError(typeof serverMessage === 'string' ? serverMessage : 'Failed to load shoe data');
        } finally {
          setLoading(false);
        }
      };
      fetchShoe();
    }
  }, [id]);

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
      setError(typeof serverMessage === 'string' ? serverMessage : 'Failed to save shoe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading form...</div>;

  return (
    <div className="admin-shoe-form">
      <h2>{id ? 'Edit Shoe' : 'Add New Shoe'}</h2>
      {error && <div className="error">Error: {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Size</label>
          <select name="Size" value={shoe.Size} onChange={handleChange} required>
            <option value={1}>S</option>
            <option value={2}>M</option>
            <option value={3}>L</option>
            <option value={4}>XL</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading}>
            Save Shoe
          </button>
          <button type="button" className="btn-cancel-form" onClick={() => navigate('/admin/shoes')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminShoeForm;
