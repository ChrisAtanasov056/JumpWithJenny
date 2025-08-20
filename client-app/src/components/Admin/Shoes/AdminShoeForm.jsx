import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ShoeService from '../../../services/ShoeService';
import './AdminShoes.scss';

const AdminShoeForm = () => {
  const [shoe, setShoe] = useState({ size: 'S' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const fetchShoe = async () => {
        setLoading(true);
        try {
          const data = await ShoeService.getShoeById(id);
          setShoe(data);
        } catch (err) {
          setError(err.message || 'Failed to load shoe data');
        } finally {
          setLoading(false);
        }
      };
      fetchShoe();
    }
  }, [id]);

  const handleChange = (e) => {
    setShoe({ size: e.target.value });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (id) {
          await ShoeService.updateShoe(id, shoe);
        } else {
          await ShoeService.addShoe(shoe);
        }
        navigate('/admin/shoes');
      } catch (err) {
        setError(err.message || 'Failed to save shoe');
      } finally {
        setLoading(false);
      }
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-shoe-form">
      <h2>{id ? 'Edit Shoe' : 'Add New Shoe'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Size</label>
          <select name="size" value={shoe.size} onChange={handleChange} required>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-save">Save Shoe</button>
          <button type="button" className="btn-cancel-form" onClick={() => navigate('/admin/shoes')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminShoeForm;