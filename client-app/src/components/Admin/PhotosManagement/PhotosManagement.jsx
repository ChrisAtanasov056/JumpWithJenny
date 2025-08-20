import React, { useState, useEffect } from "react";
import axios from "../../../api/axius";
import { API_BASE_URL } from "../../../api/axius";
import "./PhotosManagement.scss";
import { FaTrashAlt, FaImage, FaPlus, FaSpinner } from "react-icons/fa";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = API_BASE_URL;

const PhotosManagement = () => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/Gallery/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedPhotos = response.data.map((img) => ({
          id: img.Id,
          url: `${API_BASE_URL}${img.Url}`,
          name: img.Name,
        }));

        setPhotos(formattedPhotos);
      } catch (err) {
        setError("Възникна грешка при зареждането на снимките.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  const handleDelete = (photoId) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p>Сигурни ли сте, че искате да изтриете тази снимка?</p>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_URL}/Gallery/${photoId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
                toast.success("Снимката е изтрита успешно!");
                closeToast();
              } catch {
                toast.error("Възникна грешка при изтриването на снимката.");
                closeToast();
              }
            }}
            className="toast-btn"
          >
            Да
          </button>
          <button onClick={closeToast} className="toast-btn cancel">
            Не
          </button>
        </div>
      ),
      { autoClose: false }
    );
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warn("Моля изберете снимка!");
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", description);

      const response = await axios.post(`${API_URL}/Gallery/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setPhotos((prev) => [
        ...prev,
        {
          id: response.data.Id,
          url: `${API_BASE_URL}${response.data.Url}`,
          name: response.data.Name,
        },
      ]);

      setSelectedFile(null);
      setDescription("");
      e.target.reset();
      toast.success("Снимката е качена успешно!");
    } catch (err) {
      toast.error("Възникна грешка при качването на снимката.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <p className="loading">Зареждане на снимките...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="photos-management">
      <h2>Управление на снимки</h2>

      <form className="upload-form" onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? <FaSpinner className="spin" /> : <FaPlus />}
          {isUploading ? " Качване..." : " Качи снимка"}
        </button>
      </form>

      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <img src={photo.url} alt={photo.name} />
              <div className="photo-info">
                <p>{photo.name}</p>
                <button onClick={() => handleDelete(photo.id)} className="delete-btn">
                  <FaTrashAlt /> Изтрий
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-photos">
          <FaImage size={40} />
          <p>Няма качени снимки.</p>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PhotosManagement;
