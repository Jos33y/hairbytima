// ==========================================================================
// PaymentProofUpload - Drag & Drop Upload Component
// ==========================================================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileImage,
  FileText,
  X,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';
import styles from '@styles/module/PaymentProofUpload.module.css'; 

// ==========================================================================
// Main Component
// ==========================================================================
const PaymentProofUpload = ({
  orderId,
  orderNumber,
  onUploadSuccess,
  onUploadError,
}) => {
  const fileInputRef = useRef(null);
  
  // State
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // ==========================================================================
  // File Handling
  // ==========================================================================
  const handleFileSelect = (file) => {
    setUploadError('');
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload an image (JPG, PNG, WebP) or PDF file.');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    setProofFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeFile = (e) => {
    e?.stopPropagation();
    setProofFile(null);
    setPreviewUrl(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==========================================================================
  // Upload Handler
  // ==========================================================================
  const handleUploadProof = async () => {
    if (!proofFile || isUploading) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', proofFile);
      formData.append('orderId', orderId);
      formData.append('orderNumber', orderNumber);

      const res = await fetch('/api/orders/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Success
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload. Please try again.');
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Upload size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h2>Upload Payment Proof</h2>
          <p>Screenshot or receipt of transfer</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''} ${proofFile ? styles.hasFile : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !proofFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileInput}
          className={styles.fileInput}
        />

        {proofFile ? (
          <div className={styles.filePreview}>
            {previewUrl ? (
              <img src={previewUrl} alt="Payment proof preview" />
            ) : (
              <div className={styles.pdfPreview}>
                <FileText size={48} strokeWidth={1} />
                <span>PDF Document</span>
              </div>
            )}
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{proofFile.name}</span>
              <span className={styles.fileSize}>
                {(proofFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <button className={styles.removeFile} onClick={removeFile}>
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <motion.div 
              className={styles.uploadIcon}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FileImage size={36} strokeWidth={1} />
            </motion.div>
            <p className={styles.uploadText}>
              Drop your payment proof here
            </p>
            <p className={styles.uploadSubtext}>
              or <span>tap to browse</span>
            </p>
            <p className={styles.uploadFormats}>
              JPG, PNG, WebP, PDF • Max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            className={styles.uploadError}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle size={16} strokeWidth={1.5} />
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        className={`${styles.submitBtn} ${!proofFile ? styles.disabled : ''}`}
        onClick={handleUploadProof}
        disabled={!proofFile || isUploading}
        whileHover={proofFile ? { scale: 1.02 } : {}}
        whileTap={proofFile ? { scale: 0.98 } : {}}
      >
        {isUploading ? (
          <>
            <Loader2 size={18} className={styles.spinner} />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={18} />
            Submit Payment Proof
          </>
        )}
      </motion.button>

      {/* Helper Text */}
      <p className={styles.helperText}>
        Make the bank transfer first, then upload your proof.
      </p>

      {/* Support */}
      <div className={styles.support}>
        <p>Need assistance?</p>
        <div className={styles.supportLinks}>
          <a href="mailto:support@hairbytimablaq.com">
            <Mail size={14} strokeWidth={1.5} />
            Email
          </a>
          <a href="https://wa.me/2207431514" target="_blank" rel="noopener noreferrer">
            <Phone size={14} strokeWidth={1.5} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofUpload;