// ==========================================================================
// ProductReviews - Customer reviews with rating summary
// ==========================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ChevronDown, MessageSquare } from 'lucide-react';
import styles from '@styles/module/ProductReviews.module.css';  

// Mock reviews data - will be replaced with API/Supabase data
const mockReviews = [
  {
    id: 1,
    author: 'Sarah M.',
    rating: 5,
    date: '2024-12-10',
    length: '18"',
    verified: true,
    title: 'Absolutely stunning hair!',
    content: 'This is by far the best hair I\'ve ever purchased. The texture is so soft and natural-looking. I\'ve gotten so many compliments! Minimal shedding after washing and it blends perfectly with my natural hair.',
    helpful: 24,
  },
  {
    id: 2,
    author: 'Michelle K.',
    rating: 5,
    date: '2024-12-05',
    length: '22"',
    verified: true,
    title: 'Worth every penny',
    content: 'I was hesitant about the price at first, but this hair is truly premium quality. It\'s been 3 months and it still looks brand new. The customer service was also excellent when I had questions about care.',
    helpful: 18,
  },
  {
    id: 3,
    author: 'Jasmine T.',
    rating: 4,
    date: '2024-11-28',
    length: '16"',
    verified: true,
    title: 'Great quality, fast shipping',
    content: 'The hair quality is excellent and arrived faster than expected. Only giving 4 stars because I wish there were more color options. Otherwise, perfect!',
    helpful: 12,
  },
  {
    id: 4,
    author: 'Destiny W.',
    rating: 5,
    date: '2024-11-20',
    length: '20"',
    verified: true,
    title: 'My go-to for hair extensions',
    content: 'This is my third order and I keep coming back. The consistency in quality is amazing. My stylist always asks where I get my hair from!',
    helpful: 31,
  },
];

// Rating Stars Component
const RatingStars = ({ rating, size = 16 }) => (
  <div className={styles.stars}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        strokeWidth={1.5}
        fill={star <= rating ? 'currentColor' : 'none'}
        className={star <= rating ? styles.starFilled : styles.starEmpty}
      />
    ))}
  </div>
);

// Single Review Card
const ReviewCard = ({ review }) => {
  const [isHelpful, setIsHelpful] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div 
      className={styles.reviewCard}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.reviewHeader}>
        <div className={styles.reviewerInfo}>
          <span className={styles.reviewerName}>{review.author}</span>
          {review.verified && (
            <span className={styles.verifiedBadge}>Verified Purchase</span>
          )}
        </div>
        <RatingStars rating={review.rating} />
      </div>

      <div className={styles.reviewMeta}>
        <span className={styles.reviewDate}>{formatDate(review.date)}</span>
        {review.length && (
          <span className={styles.reviewLength}>Length: {review.length}</span>
        )}
      </div>

      <h4 className={styles.reviewTitle}>{review.title}</h4>
      <p className={styles.reviewContent}>{review.content}</p>

      <div className={styles.reviewFooter}>
        <button 
          className={`${styles.helpfulBtn} ${isHelpful ? styles.helpfulBtnActive : ''}`}
          onClick={() => setIsHelpful(!isHelpful)}
        >
          <ThumbsUp size={14} strokeWidth={1.5} />
          Helpful ({isHelpful ? review.helpful + 1 : review.helpful})
        </button>
      </div>
    </motion.div>
  );
};

// Main ProductReviews Component
const ProductReviews = ({ productId }) => {
  const [showAll, setShowAll] = useState(false);
  
  // In production, fetch reviews based on productId from Supabase
  const reviews = mockReviews;
  const displayedReviews = showAll ? reviews : reviews.slice(0, 2);
  
  // Calculate rating summary
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    rating => reviews.filter(r => r.rating === rating).length
  );

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.reviewsHeader}>
        <h2 className={styles.reviewsTitle}>
          <MessageSquare size={24} strokeWidth={1.5} />
          Customer Reviews
        </h2>
      </div>

      <div className={styles.reviewsContent}>
        {/* Summary */}
        <motion.div 
          className={styles.reviewsSummary}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.averageRating}>
            <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
            <div className={styles.ratingDetails}>
              <RatingStars rating={Math.round(averageRating)} size={20} />
              <span className={styles.totalReviews}>Based on {totalReviews} reviews</span>
            </div>
          </div>

          <div className={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((rating, index) => {
              const count = ratingCounts[index];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className={styles.ratingBar}>
                  <span className={styles.ratingLabel}>{rating} stars</span>
                  <div className={styles.barContainer}>
                    <motion.div 
                      className={styles.barFill} 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                  <span className={styles.ratingCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Reviews List */}
        <div className={styles.reviewsList}>
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      {/* Show More Button */}
      {reviews.length > 2 && !showAll && (
        <motion.button 
          className={styles.showMoreBtn}
          onClick={() => setShowAll(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Show All {totalReviews} Reviews
          <ChevronDown size={18} strokeWidth={1.5} />
        </motion.button>
      )}
    </section>
  );
};

export default ProductReviews;