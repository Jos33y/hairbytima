import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { categoryService } from '@/services';

const CategorySkeleton = ({ styles, index }) => (
  <div className={styles.categorySkeleton}>
    <div className={styles.categorySkeletonImage} />
    <div className={styles.categorySkeletonContent}>
      <div className={styles.categorySkeletonTitle} />
      <div className={styles.categorySkeletonCount} />
    </div>
  </div>
);

const CategoriesSection = ({ styles }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoryService.getAllWithProductCounts();
        
        // Ensure we have data before processing
        if (data && Array.isArray(data)) {
          const sorted = data
            .filter(cat => cat.is_active !== false) // Only active categories
            .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
            .slice(0, 4);
          setCategories(sorted);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Animation variants for header
  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Don't render section if error or no categories after loading
  if (error) return null;
  if (!loading && categories.length === 0) return null;

  return (
    <section className={styles.categories}>
      <div className={styles.container}>
        <motion.div 
          className={styles.sectionHeader}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <p className={styles.sectionSubtitle}>
            Find the perfect hair for your desired look
          </p>
        </motion.div>

        {loading ? (
          // Skeleton loading state
          <div className={styles.categoryGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <CategorySkeleton key={i} styles={styles} index={i} />
            ))}
          </div>
        ) : (
          // Actual categories with staggered animation
          <motion.div 
            className={styles.categoryGrid}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.1,
                },
              },
            }}
          >
            {categories.map((category, index) => (
              <motion.div 
                key={category.id} 
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    },
                  },
                }}
              >
                <Link
                  to={`/shop/${category.slug}`}
                  className={styles.categoryCard}
                >
                  <motion.div 
                    className={styles.categoryImageWrapper}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                  >
                    {category.image ? (
                      <motion.img
                        src={category.image}
                        alt={category.name}
                        className={styles.categoryImage}
                        loading="lazy"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                    ) : (
                      <div className={styles.categoryImagePlaceholder} />
                    )}
                    <div className={styles.categoryOverlay} />
                    
                    {/* Floating product count badge */}
                    <motion.div 
                      className={styles.categoryBadge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        delay: 0.3 + index * 0.1,
                        type: 'spring',
                        stiffness: 400,
                        damping: 15
                      }}
                    >
                      {category.product_count || 0}
                    </motion.div>
                  </motion.div>
                  
                  <div className={styles.categoryContent}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    <span className={styles.categoryCount}>
                      {category.product_count || 0} products
                    </span>
                    <motion.span 
                      className={styles.categoryArrow}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight size={16} strokeWidth={1.5} />
                    </motion.span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;