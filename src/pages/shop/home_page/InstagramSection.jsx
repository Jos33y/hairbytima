import { Instagram, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const INSTAGRAM_URL = 'https://www.instagram.com/hair_by_timablaq/';

// 6 Instagram posts
const instagramPosts = [
  { 
    id: 1, 
    image: 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/insta_image_1.jpg',
    likes: 234,
    comments: 18
  },
  { 
    id: 2, 
    image: 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/insta_image_2.jpg',
    likes: 189,
    comments: 24
  },
  { 
    id: 3, 
    image: 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/insta_image_3.jpg',
    likes: 312,
    comments: 31
  },
  { 
    id: 4, 
    image: 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/insta_image_4.jpg',
    likes: 276,
    comments: 22
  },
  { 
    id: 5, 
    image: 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/insta_image_5.jpg',
    likes: 198,
    comments: 15
  },
  { 
    id: 6, 
    image: 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/insta_image_6.jpg',
    likes: 245,
    comments: 28
  },
];

const InstagramSection = ({ styles }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section className={styles.instagram}>
      <div className={styles.container}>
        <motion.div 
          className={styles.instagramHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className={styles.instagramTitle}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Instagram size={20} strokeWidth={1.5} />
            </motion.div>
            <span>Follow us @hair_by_timablaq</span>
          </motion.div>
          <motion.a 
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagramFollow}
            whileHover={{ 
              scale: 1.05,
              borderColor: 'var(--accent-primary)',
              color: 'var(--accent-primary)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            Follow Us
          </motion.a>
        </motion.div>

        <motion.div 
          className={styles.instagramGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {instagramPosts.map((post, index) => (
            <motion.a
              key={post.id}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramPost}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <motion.img 
                src={post.image} 
                alt={`Instagram post ${post.id}`}
                className={styles.instagramImage}
                loading="lazy"
                initial={{ scale: 1.1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.4 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add(styles.instagramPostPlaceholder);
                }}
              />
              <motion.div 
                className={styles.instagramOverlay}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.instagramStats}>
                  <span className={styles.instagramStat}>
                    <Heart size={16} fill="white" />
                    {post.likes}
                  </span>
                  <span className={styles.instagramStat}>
                    <MessageCircle size={16} fill="white" />
                    {post.comments}
                  </span>
                </div>
              </motion.div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default InstagramSection;