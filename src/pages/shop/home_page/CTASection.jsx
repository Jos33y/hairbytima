import { Link } from 'react-router-dom';
import { ArrowRight, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const INSTAGRAM_URL = 'https://www.instagram.com/hair_by_timablaq/';

const CTASection = ({ styles }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
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

  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <motion.div 
          className={styles.ctaContent}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.h2 
            className={styles.ctaTitle}
            variants={itemVariants}
          >
            Ready to Transform Your Look?
          </motion.h2>
          <motion.p 
            className={styles.ctaDescription}
            variants={itemVariants}
          >
            Join thousands of queens who trust HairByTimaBlaq for their hair journey.
          </motion.p>
          <motion.div 
            className={styles.ctaButtons}
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/shop" className={styles.ctaPrimaryBtn}>
                Start Shopping
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <a 
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaSecondaryBtn}
              >
                <Instagram size={16} strokeWidth={1.5} />
                Follow Us
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;