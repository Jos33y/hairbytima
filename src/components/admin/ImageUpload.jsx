// ==========================================================================
// Image Upload Component - Drag & Drop with Preview
// ==========================================================================

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { storageService } from '@services/storageService';
import styles from '@styles/module/ImageUpload.module.css';

const ImageUpload = ({
  images = [],
  onChange,
  maxImages = 3,
  folder = 'products',
  label = 'Product Images',
  helpText = 'Upload up to 3 images. JPG, PNG, WebP or GIF. Max 5MB each.',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = async (files) => {
    setError(null);

    // Filter valid files
    const validFiles = [];
    for (const file of files) {
      const validation = storageService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        setError(validation.error);
        return;
      }
    }

    // Check max images limit
    const remainingSlots = maxImages - images.length;
    if (validFiles.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}.`);
      return;
    }

    if (validFiles.length === 0) return;

    // Upload files
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const result = await storageService.uploadImage(file, folder);
        uploadedImages.push({
          url: result.url,
          path: result.path,
        });
        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }

      // Update parent with new images
      onChange([...images, ...uploadedImages]);
    } catch (err) {
      setError(err.message || 'Failed to upload images.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    },
    [images, maxImages, folder, onChange]
  );

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (index) => {
    const imageToRemove = images[index];
    
    try {
      // Delete from storage if it has a path
      if (imageToRemove.path) {
        await storageService.deleteImage(imageToRemove.path);
      }
      
      // Update parent
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    } catch (err) {
      setError('Failed to remove image.');
    }
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return; // Already primary
    
    const newImages = [...images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    onChange(newImages);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className={styles.previewGrid}>
          {images.map((image, index) => (
            <div
              key={image.path || image.url || index}
              className={`${styles.previewItem} ${index === 0 ? styles.primary : ''}`}
            >
              <img src={image.url} alt={`Upload ${index + 1}`} />
              
              {index === 0 && (
                <span className={styles.primaryBadge}>Primary</span>
              )}
              
              <div className={styles.previewActions}>
                {index !== 0 && (
                  <button
                    type="button"
                    className={styles.setPrimaryBtn}
                    onClick={() => handleSetPrimary(index)}
                    title="Set as primary"
                  >
                    <ImageIcon size={14} strokeWidth={1.5} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemoveImage(index)}
                  title="Remove image"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={storageService.getAllowedTypes()}
            multiple={maxImages - images.length > 1}
            onChange={handleFileSelect}
            className={styles.fileInput}
            disabled={isUploading}
          />

          {isUploading ? (
            <div className={styles.uploadingState}>
              <Loader2 size={32} strokeWidth={1.5} className={styles.spinner} />
              <span className={styles.uploadingText}>Uploading...</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.dropzoneContent}>
              <div className={styles.iconWrapper}>
                <Upload size={24} strokeWidth={1.5} />
              </div>
              <span className={styles.dropzoneText}>
                {isDragging ? 'Drop images here' : 'Drag & drop or click to upload'}
              </span>
              <span className={styles.dropzoneSubtext}>
                {maxImages - images.length} image{maxImages - images.length !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {helpText && <p className={styles.helpText}>{helpText}</p>}

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <AlertCircle size={16} strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;