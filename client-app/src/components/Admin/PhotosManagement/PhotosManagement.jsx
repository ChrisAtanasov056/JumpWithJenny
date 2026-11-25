import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios, { API_BASE_URL } from "../../../api/axius";
import "./PhotosManagement.scss";
import { FaTrashAlt, FaImage, FaPlus, FaSpinner } from "react-icons/fa";

import { toast } from "react-toastify";

const PhotosManagement = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get("/Gallery/all");

        const formattedPhotos = response.data.map((img) => ({
          id: img.Id,
          url: `${API_BASE_URL}${img.Url}`,
          name: img.Name,
        }));

        setPhotos(formattedPhotos);
      } catch (err) {
        setError(t("admin.photos.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [t]);

  const handleDelete = (photoId) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p>{t("admin.photos.deleteConfirm")}</p>
          <button
            onClick={async () => {
              try {
                await axios.delete(`/Gallery/${photoId}`);
                setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
                toast.success(t("admin.photos.deleteSuccess"));
                closeToast();
              } catch {
                toast.error(t("admin.photos.deleteError"));
                closeToast();
              }
            }}
            className="toast-btn"
          >
            {t("admin.common.yes")}
          </button>
          <button onClick={closeToast} className="toast-btn cancel">
            {t("admin.common.no")}
          </button>
        </div>
      ),
      { autoClose: false }
    );
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warn(t("admin.photos.selectPhotoWarning"));
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", description);

      const response = await axios.post("/Gallery/upload", formData);

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
      toast.success(t("admin.photos.uploadSuccess"));
    } catch (err) {
      toast.error(t("admin.photos.uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <p className="loading">{t("admin.photos.loading")}</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="photos-management">
      <h2>{t("admin.photos.title")}</h2>

      <form className="upload-form" onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          aria-label={t("admin.photos.uploadAriaLabel")}
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? <FaSpinner className="spin" /> : <FaPlus />}
          {isUploading ? ` ${t("admin.photos.uploading")}` : ` ${t("admin.photos.uploadButton")}`}
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
                  <FaTrashAlt /> {t("admin.photos.deleteButton")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-photos">
          <FaImage size={40} aria-hidden="true" />
          <p>{t("admin.photos.noPhotos")}</p>
        </div>
      )}
    </div>
  );
};

export default PhotosManagement;
