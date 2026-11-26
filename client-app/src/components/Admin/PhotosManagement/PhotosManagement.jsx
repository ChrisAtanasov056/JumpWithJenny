import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt, FaTrashAlt, FaImage, FaTimes } from 'react-icons/fa';
import axios, { API_BASE_URL } from '../../../api/axius';
import useModalAccessibility from '../../../services/useModalAccessibility';
import useOutsideClick from '../../../services/useOutsideClick';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import './PhotosManagement.scss';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;

const PhotosManagement = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [queuedFiles, setQueuedFiles] = useState([]); // { id, file, previewUrl }
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const fileInputRef = useRef(null);
  const lightboxRef = useRef(null);

  const closeLightbox = useCallback(() => setLightboxPhoto(null), []);
  useOutsideClick(lightboxRef, closeLightbox, Boolean(lightboxPhoto));
  useModalAccessibility({
    isOpen: Boolean(lightboxPhoto),
    onClose: closeLightbox,
    modalRef: lightboxRef,
  });

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get('/Gallery/all');
        const formatted = (response.data || []).map((img) => ({
          id: img.Id,
          url: `${API_BASE_URL}${img.Url}`,
          name: img.Name,
        }));
        setPhotos(formatted);
      } catch {
        setError(t('admin.photos.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhotos();
  }, [t]);

  useEffect(() => {
    return () => {
      queuedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [queuedFiles]);

  const enqueueFiles = (fileList) => {
    const nextItems = [];
    for (const file of Array.from(fileList || [])) {
      const validType = ALLOWED_TYPES.has(file.type) || ALLOWED_EXTENSIONS.test(file.name);
      if (!validType) {
        toast.error(t('admin.photos.invalidFileType', { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t('admin.photos.fileTooLarge', { name: file.name }));
        continue;
      }
      nextItems.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (nextItems.length > 0) {
      setQueuedFiles((prev) => [...prev, ...nextItems]);
    }
  };

  const removeQueued = (itemId) => {
    setQueuedFiles((prev) => {
      const found = prev.find((i) => i.id === itemId);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const clearQueue = () => {
    queuedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setQueuedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAll = async () => {
    if (queuedFiles.length === 0) {
      toast.warn(t('admin.photos.selectPhotoWarning'));
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const item of queuedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        const response = await axios.post('/Gallery/upload', formData);
        setPhotos((prev) => [
          {
            id: response.data.Id,
            url: `${API_BASE_URL}${response.data.Url}`,
            name: response.data.Name,
          },
          ...prev,
        ]);
        successCount += 1;
      } catch {
        toast.error(t('admin.photos.uploadError'));
      }
    }

    clearQueue();
    setIsUploading(false);

    if (successCount === 1) {
      toast.success(t('admin.photos.uploadSuccess'));
    } else if (successCount > 1) {
      toast.success(t('admin.photos.uploadBatchSuccess', { count: successCount }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/Gallery/${deleteTarget.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(t('admin.photos.deleteSuccess'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('admin.photos.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="adm-loading" role="status">{t('admin.photos.loading')}</div>;
  if (error) return <div className="adm-alert adm-alert--error">{error}</div>;

  return (
    <div className="admin-photos-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.photos.title')}</h1>
          <p>{t('admin.photos.subtitle')}</p>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={`adm-card upload-dropzone${isDragging ? ' dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          enqueueFiles(e.dataTransfer.files);
        }}
      >
        <FaCloudUploadAlt className="drop-icon" aria-hidden="true" />
        <div className="drop-copy">
          <strong>{t('admin.photos.dropzoneTitle')}</strong>
          <span>{t('admin.photos.dropzoneHint')}</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="visually-hidden"
          aria-label={t('admin.photos.uploadAriaLabel')}
          onChange={(e) => enqueueFiles(e.target.files)}
        />

        <button
          type="button"
          className="adm-btn adm-btn--secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {t('admin.photos.selectFilesBtn')}
        </button>
      </div>

      {queuedFiles.length > 0 && (
        <div className="adm-card upload-queue-card">
          <div className="queue-header">
            <strong>{t('admin.photos.queueTitle', { count: queuedFiles.length })}</strong>
            <div className="queue-actions">
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--sm"
                onClick={clearQueue}
                disabled={isUploading}
              >
                {t('admin.photos.clearQueueBtn')}
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--primary adm-btn--sm"
                onClick={handleUploadAll}
                disabled={isUploading}
              >
                {isUploading ? t('admin.photos.uploading') : t('admin.photos.uploadButton')}
              </button>
            </div>
          </div>

          <div className="queue-previews">
            {queuedFiles.map((item) => (
              <div key={item.id} className="queue-thumb">
                <img src={item.previewUrl} alt={item.file.name} />
                <button
                  type="button"
                  className="thumb-remove"
                  onClick={() => removeQueued(item.id)}
                  disabled={isUploading}
                  aria-label={t('admin.common.delete')}
                >
                  <FaTimes aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="adm-card photo-card">
              <button
                type="button"
                className="photo-preview-btn"
                onClick={() => setLightboxPhoto(photo)}
                aria-label={t('admin.photos.previewAria', { name: photo.name })}
              >
                <img src={photo.url} alt={photo.name} loading="lazy" />
              </button>
              <div className="photo-info">
                <span className="photo-name" title={photo.name}>{photo.name}</span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(photo)}
                  className="adm-btn adm-btn--danger-soft adm-btn--sm"
                  aria-label={t('admin.photos.deleteButton')}
                >
                  <FaTrashAlt aria-hidden="true" /> {t('admin.photos.deleteButton')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="adm-empty">
          <FaImage size={36} aria-hidden="true" />
          <p>{t('admin.photos.noPhotos')}</p>
        </div>
      )}

      {lightboxPhoto && (
        <div className="adm-modal-overlay" onClick={closeLightbox} role="presentation">
          <div
            ref={lightboxRef}
            className="lightbox-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={lightboxPhoto.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label={t('admin.common.close')}
            >
              <FaTimes aria-hidden="true" />
            </button>
            <img src={lightboxPhoto.url} alt={lightboxPhoto.name} />
          </div>
        </div>
      )}

      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={t('admin.photos.deleteModal.title')}
        message={
          deleteTarget
            ? t('admin.photos.deleteModal.prompt', { name: deleteTarget.name })
            : ''
        }
        warning={t('admin.photos.deleteModal.warning')}
        confirmLabel={t('admin.photos.deleteModal.confirm')}
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
};

export default PhotosManagement;
