import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Phone, MessageCircle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { categoryService } from '@/services';
import styles from '@/styles/module/Footer.module.css'; 

// Custom TikTok Icon
const TikTokIcon = ({ size = 20, strokeWidth = 1.5 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// Custom Snapchat Icon
const SnapchatIcon = ({ size = 20, strokeWidth = 1.5 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 2c-2.5 0-4.5 1.5-5 4l-.5 3c-.2 1-1 1.5-2 1.5.5 1 1.5 1.5 2.5 1.5 0 1-1 2-2 3 1.5.5 3 1 4.5 1s2-.5 2.5-1c.5.5 1.5 1 2.5 1s3-.5 4.5-1c-1-1-2-2-2-3 1 0 2-.5 2.5-1.5-1 0-1.8-.5-2-1.5l-.5-3c-.5-2.5-2.5-4-5-4z" />
  </svg>
);

const supportLinks = [
  { path: '/track-order', label: 'Track Order' },
  { path: '/orders', label: 'My Orders' },
  { path: '/wishlist', label: 'Wishlist' },
  { path: '/hair-care', label: 'Hair Care Guide' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact Us' },
  { path: '/about', label: 'About Us' },
];

const socialLinks = [
  { 
    href: 'https://instagram.com/hair_by_timablaq', 
    icon: Instagram, 
    label: 'Instagram',
    color: '#E4405F'
  },
  { 
    href: 'https://tiktok.com/@timablaq_hair1', 
    icon: TikTokIcon, 
    label: 'TikTok',
    color: '#00f2ea'
  },
  { 
    href: 'https://snapchat.com/add/timablaq_hair1', 
    icon: SnapchatIcon, 
    label: 'Snapchat',
    color: '#FFFC00'
  },
  { 
    href: 'https://wa.me/380994500866', 
    icon: MessageCircle, 
    label: 'WhatsApp',
    color: '#25D366'
  },
];

const legalLinks = [
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/terms-of-service', label: 'Terms of Service' },
  { path: '/return-policy', label: 'Return Policy' },
  { path: '/shipping-policy', label: 'Shipping Policy' },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Main Footer Content */}
        <motion.div 
          className={styles.content}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Brand Section */}
          <motion.div className={styles.brand} variants={itemVariants}>
            <Link to="/" className={styles.logo}>
              <motion.img 
                src="/logo192.png" 
                alt="HairByTimaBlaq" 
                className={styles.logoImage}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              />
              <span className={styles.logoText}>HairByTimaBlaq</span>
            </Link>
            <p className={styles.tagline}>
              Premium luxury hair extensions for the modern queen.
            </p>
            <div className={styles.social}>
              {socialLinks.map((social, index) => (
                <motion.a 
                  key={social.label}
                  href={social.href}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={social.label}
                  whileHover={{ 
                    scale: 1.15,
                    backgroundColor: social.color,
                    color: social.label === 'Snapchat' ? '#000' : '#fff'
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <social.icon size={18} strokeWidth={1.5} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Shop Links - Dynamic Categories */}
          <motion.div className={styles.linkSection} variants={itemVariants}>
            <h4 className={styles.linkTitle}>Shop</h4>
            <ul className={styles.linkList}>
              {/* All Products - always first */}
              <motion.li 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
              >
                <Link to="/shop" className={styles.link}>
                  <motion.span whileHover={{ x: 4 }}>
                    All Products
                  </motion.span>
                </Link>
              </motion.li>
              
              {/* Dynamic categories from Supabase */}
              {categories.map((category, index) => (
                <motion.li 
                  key={category.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index + 1) * 0.05 }}
                >
                  <Link to={`/shop/${category.slug}`} className={styles.link}>
                    <motion.span whileHover={{ x: 4 }}>
                      {category.name}
                    </motion.span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div className={styles.linkSection} variants={itemVariants}>
            <h4 className={styles.linkTitle}>Support</h4>
            <ul className={styles.linkList}>
              {supportLinks.map((link, index) => (
                <motion.li 
                  key={link.path}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={link.path} className={styles.link}>
                    <motion.span whileHover={{ x: 4 }}>
                      {link.label}
                    </motion.span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div className={styles.linkSection} variants={itemVariants}>
            <h4 className={styles.linkTitle}>Contact</h4>
            <ul className={styles.contactList}>
              <motion.li 
                className={styles.contactItem}
                whileHover={{ x: 4 }}
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                <a 
                  href="https://wa.me/380994500866" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactLink}
                >
                  WhatsApp
                </a>
              </motion.li>
              <motion.li 
                className={styles.contactItem}
                whileHover={{ x: 4 }}
              >
                <Phone size={16} strokeWidth={1.5} />
                <a href="tel:+2207431514" className={styles.contactLink}>
                  +220 743 1514
                </a>
              </motion.li>
              <motion.li 
                className={styles.contactItem}
                whileHover={{ x: 4 }}
              >
                <Instagram size={16} strokeWidth={1.5} />
                <a 
                  href="https://instagram.com/hair_by_timablaq" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactLink}
                >
                  @hair_by_timablaq
                </a>
              </motion.li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className={styles.bottom}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.bottomTop}>
            <p className={styles.copyright}>
              © {currentYear} HairByTimaBlaq. All rights reserved.
            </p>
            <div className={styles.legal}>
              {legalLinks.map((link, index) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={styles.legalLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Credit */}
          <motion.div 
            className={styles.credit}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <span>Crafted with</span>
            <motion.span
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Heart size={14} fill="var(--accent-primary)" color="var(--accent-primary)" />
            </motion.span>
            <span>by</span>
            <a 
              href="https://instagram.com/the_brickdev" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.creditLink}
            >
              TheBrickDev
            </a>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

