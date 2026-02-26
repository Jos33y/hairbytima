import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { productService } from '@/services';
import ProductCard from '@/components/shop/ProductCard';

const ProductSkeleton = ({ styles, index }) => (
  <motion.div 
    className={styles.productSkeleton}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className={styles.productSkeletonImage} />
    <div className={styles.productSkeletonContent}>
      <div className={styles.productSkeletonTitle} />
      <div className={styles.productSkeletonPrice} />
    </div>
  </motion.div>
);

const BestsellersSection = ({ styles }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getFeatured(4);
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  if (error) return null;

  return (
    <section className={styles.bestsellers}>
      <div className={styles.container}>
        <motion.div 
          className={styles.sectionHeaderRow}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <div>
            <h2 className={styles.sectionTitle}>Bestsellers</h2>
            <p className={styles.sectionSubtitle}>Our most loved products</p>
          </div>
          <motion.div
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/shop" className={styles.viewAllLink}>
              View All
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div 
          className={styles.productGrid}
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} styles={styles} index={i} />
            ))
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))
          ) : (
            <p className={styles.emptyMessage}>
              Check back soon for our bestselling products!
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default BestsellersSection;