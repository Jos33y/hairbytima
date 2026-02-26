import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { newsletterService } from '@/services';
import { trackNewsletterSubscribe } from '@/utils/analytics';

const NewsletterSection = ({ styles }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    try {
      setStatus('loading');
      await newsletterService.subscribe(email.trim());
      
      // Track successful newsletter subscription
      trackNewsletterSubscribe(email.trim());
      
      setStatus('success');
      setMessage('Welcome to the Royal Family! Check your inbox for exclusive offers.');
      setEmail('');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again.');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      height: 0,
      transition: { duration: 0.2 }
    },
  };

  return (
    <section className={styles.newsletter}>
      <div className={styles.container}>
        <motion.div 
          className={styles.newsletterWrapper}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <div className={styles.newsletterContent}>
            <motion.h3 
              className={styles.newsletterTitle}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Join the Royal Family
            </motion.h3>
            <motion.p 
              className={styles.newsletterText}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Subscribe for exclusive offers, new arrivals, and hair care tips. 
              Get 10% off your first order.
            </motion.p>
          </div>

          <motion.form 
            className={styles.newsletterForm} 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.newsletterInputWrapper}>
              <motion.input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.newsletterInput}
                disabled={status === 'loading'}
                required
                whileFocus={{ 
                  borderColor: 'var(--accent-primary)',
                  boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.1)'
                }}
              />
              <motion.button
                type="submit"
                className={styles.newsletterBtn}
                disabled={status === 'loading'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {status === 'loading' ? (
                  <span className={styles.newsletterBtnLoading}>
                    <span className={styles.newsletterBtnDot} />
                    <span className={styles.newsletterBtnDot} />
                    <span className={styles.newsletterBtnDot} />
                  </span>
                ) : (
                  <>
                    Subscribe
                    <Send size={14} strokeWidth={1.5} />
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  className={`${styles.newsletterMessage} ${
                    status === 'success' 
                      ? styles.newsletterMessageSuccess 
                      : styles.newsletterMessageError
                  }`}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {status === 'success' ? (
                    <CheckCircle size={14} strokeWidth={1.5} />
                  ) : (
                    <AlertCircle size={14} strokeWidth={1.5} />
                  )}
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;