import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShoeService from '../../../services/ShoeService';
import './AdminShoes.scss';

const AdminShoesList = () => {

  const shoeSizeLabels = {
    1: 'S',
    2: 'M',
    3: 'L',
    4: 'XL',
  }
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShoes = async () => {
      try {
        const data = await ShoeService.getAllShoes();
        setShoes(data);
      } catch (err) {
        setError(err.message || 'Failed to load shoes');
      } finally {
        setLoading(false);
      }
    };
    fetchShoes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shoe?')) return;
    try {
      await ShoeService.deleteShoe(id);
      setShoes(shoes.filter(shoe => shoe.id !== id));
      alert('Shoe deleted successfully!');
    } catch (error) {
      setError(error.message || 'Failed to delete shoe');
    }
  };

  if (loading) return <div>Loading shoes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-shoes">
      <div className="header">
        <h2>Shoes Management</h2>
        <button className="btn-add" onClick={() => navigate('/admin/shoes/new')}>
          + Add New Shoe
        </button>
      </div>

      <div className="shoes-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shoes.length > 0 ? (
              shoes.map(shoe => (
                <tr key={shoe.Id}>
                  <td>{shoe.Id}</td>
                  <td>{shoeSizeLabels[Number(shoe.Size)] || 'N/A'}</td>
                  <td className="actions">
                    {/* Добавен бутон за преглед на детайли */}
                    <Link to={`/admin/shoes/details/${shoe.Id}`} className="btn-view"> 
                      View Details
                    </Link>
                    <Link to={`/admin/shoes/${shoe.Id}`} className="btn-edit">
                      Edit
                    </Link>
                    <button className="btn-delete" onClick={() => handleDelete(shoe.Id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-results">No shoes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminShoesList;