// ==========================================================================
// ImageLightbox - Fullscreen image viewer with navigation
// ==========================================================================

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import styles from '@styles/module/ImageLightbox.module.css'; 

const ImageLightbox = ({ 
  isOpen, 
  onClose, 
  images = [], 
  activeIndex = 0, 
  onNavigate,
  productName = 'Product'
}) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (images.length > 1) {
          onNavigate((activeIndex - 1 + images.length) % images.length);
        }
        break;
      case 'ArrowRight':
        if (images.length > 1) {
          onNavigate((activeIndex + 1) % images.length);
        }
        break;
      default:
        break;
    }
  }, [isOpen, onClose, onNavigate, activeIndex, images.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handlePrev = (e) => {
    e.stopPropagation();
    onNavigate((activeIndex - 1 + images.length) % images.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    onNavigate((activeIndex + 1) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Close Button */}
          <button 
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close lightbox"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className={styles.counter}>
              {activeIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Image */}
          <motion.div 
            className={styles.imageContainer}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeIndex}
                src={images[activeIndex]}
                alt={`${productName} - Image ${activeIndex + 1}`}
                className={styles.image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                draggable={false}
              />
            </AnimatePresence>
          </motion.div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button 
                className={`${styles.navBtn} ${styles.navPrev}`}
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <ChevronLeft size={32} strokeWidth={1.5} />
              </button>
              <button 
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight size={32} strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(index);
                  }}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          <div className={styles.hint}>
            Press ESC to close, arrow keys to navigate
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;