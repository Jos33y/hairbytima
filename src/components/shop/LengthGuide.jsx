// ==========================================================================
// LengthGuide - Modal with visual length reference
// ==========================================================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Lightbulb } from 'lucide-react';
import styles from '@styles/module/LengthGuide.module.css'; 

const lengthData = [
  { inches: '10"', cm: '25cm', description: 'Above shoulders', position: 15 },
  { inches: '12"', cm: '30cm', description: 'Shoulder length', position: 22 },
  { inches: '14"', cm: '35cm', description: 'Below shoulders', position: 29 },
  { inches: '16"', cm: '40cm', description: 'Mid-back', position: 36 },
  { inches: '18"', cm: '45cm', description: 'Bra strap length', position: 43 },
  { inches: '20"', cm: '50cm', description: 'Below bra strap', position: 50 },
  { inches: '22"', cm: '55cm', description: 'Mid-lower back', position: 57 },
  { inches: '24"', cm: '60cm', description: 'Waist length', position: 64 },
  { inches: '26"', cm: '65cm', description: 'Below waist', position: 71 },
  { inches: '28"', cm: '70cm', description: 'Hip length', position: 78 },
  { inches: '30"', cm: '75cm', description: 'Below hips', position: 85 },
];

const tips = [
  'Measurements are taken when hair is straight',
  'Curly/wavy hair will appear 1-2 inches shorter',
  'Consider your height when choosing length',
  'First time? Start with 16-18" for a natural look',
];

const LengthGuide = ({ isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay} 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <Ruler size={20} strokeWidth={1.5} />
                <h2>Hair Length Guide</h2>
              </div>
              <button 
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close length guide"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {/* Visual Guide */}
              <div className={styles.visualGuide}>
                <div className={styles.silhouette}>
                  <svg viewBox="0 0 120 300" className={styles.personSvg}>
                    <ellipse cx="60" cy="25" rx="20" ry="25" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                    <path d="M40 25 Q40 5 60 5 Q80 5 80 25" fill="var(--accent-primary)" opacity="0.3"/>
                    <rect x="52" y="48" width="16" height="12" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                    <path d="M35 60 L50 60 L52 140 L68 140 L70 60 L85 60 L90 160 L30 160 Z" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                    <path d="M35 60 L20 120 L25 122 L42 70" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                    <path d="M85 60 L100 120 L95 122 L78 70" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                    <path d="M40 160 L35 280 L45 280 L55 160" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                    <path d="M65 160 L75 280 L85 280 L80 160" fill="var(--bg-elevated)" stroke="var(--border-default)" strokeWidth="1"/>
                  </svg>
                  
                  {lengthData.map((length) => (
                    <div 
                      key={length.inches}
                      className={styles.lengthMarker}
                      style={{ top: `${length.position}%` }}
                    >
                      <span className={styles.markerLine} />
                      <span className={styles.markerLabel}>{length.inches}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Length Table */}
              <div className={styles.lengthTable}>
                <h3 className={styles.tableTitle}>Length Reference</h3>
                <div className={styles.tableContent}>
                  {lengthData.map((length) => (
                    <div key={length.inches} className={styles.tableRow}>
                      <span className={styles.tableInches}>{length.inches}</span>
                      <span className={styles.tableCm}>{length.cm}</span>
                      <span className={styles.tableDesc}>{length.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className={styles.tips}>
              <div className={styles.tipsHeader}>
                <Lightbulb size={16} strokeWidth={1.5} />
                <h3 className={styles.tipsTitle}>Helpful Tips</h3>
              </div>
              <ul className={styles.tipsList}>
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LengthGuide;