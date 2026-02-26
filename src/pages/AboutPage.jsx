// ==========================================================================
// About Page - Enhanced with animations, founder section, luxury design
// ==========================================================================

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  Shield, 
  Sparkles, 
  Heart, 
  ArrowRight,
  Crown,
  Star,
  Gem,
  Instagram
} from 'lucide-react';
import styles from '@styles/module/AboutPage.module.css';

// Values data
const values = [
  {
    icon: Shield,
    title: 'Quality First',
    description: 'Every bundle, closure, and wig is carefully inspected to ensure it meets our premium standards before reaching you.',
    color: 'pink'
  },
  {
    icon: Sparkles,
    title: 'Authenticity',
    description: '100% virgin human hair, unprocessed and ethically sourced. What you see is what you get.',
    color: 'gold'
  },
  {
    icon: Heart,
    title: 'Customer Care',
    description: 'Your satisfaction is our priority. We guide you through your hair journey every step of the way.',
    color: 'pink'
  }
];

// Stats data
const stats = [
  { value: '5K+', label: 'Happy Clients', icon: Heart },
  { value: '100%', label: 'Human Hair', icon: Gem },
  { value: '4.9', label: 'Rating', icon: Star },
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

// Animated section wrapper
const AnimatedSection = ({ children, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.section
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
};

export default function AboutPage() {
  const [imageError, setImageError] = useState(false);

  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.heroLabel}>
              <Crown size={14} strokeWidth={1.5} />
              Our Story
            </span>
          </motion.div>
          
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            About <span className={styles.highlight}>HairByTimaBlaq</span>
          </motion.h1>
          
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Crafting luxury hair experiences for the modern queen
          </motion.p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className={styles.statsBar}>
        <div className={styles.container}>
          <motion.div 
            className={styles.statsGrid}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className={styles.statItem}
                variants={fadeInUp}
              >
                <stat.icon className={styles.statIcon} size={20} strokeWidth={1.5} />
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <AnimatedSection className={styles.founder}>
        <div className={styles.container}>
          <div className={styles.founderGrid}>
            {/* Image Side */}
            <motion.div 
              className={styles.founderImageWrapper}
              variants={scaleIn}
            >
              <div className={styles.founderImage}>
                {/* Actual founder image */}
                {!imageError ? (
                  <img 
                    src="/images/founder-fatou.jpg" 
                    alt="Fatou Marong - Founder of HairByTimaBlaq"
                    className={styles.founderImg}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className={styles.founderImagePlaceholder}>
                    <Crown size={48} strokeWidth={1} />
                  </div>
                )}
                {/* Crown overlay */}
                <div className={styles.founderImageOverlay}>
                  <Crown size={32} strokeWidth={1} />
                </div>
                {/* Decorative elements */}
                <div className={styles.founderImageDecor} />
                <div className={styles.founderImageRing} />
              </div>
              
              {/* Floating badge */}
              <motion.div 
                className={styles.founderBadge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Crown size={16} strokeWidth={1.5} />
                <span>Founder & CEO</span>
              </motion.div>
            </motion.div>

            {/* Content Side */}
            <motion.div 
              className={styles.founderContent}
              variants={fadeInUp}
            >
              <h2 className={styles.founderName}>Fatou Marong</h2>
              <p className={styles.founderHandle}>@tima_blaq</p>
              
              <blockquote className={styles.founderQuote}>
                "Sufficient for us is Allah, and He is the best Disposer of affairs."
              </blockquote>
              
              <div className={styles.founderStory}>
                <p>
                  HairByTimaBlaq was born from a passion for helping women feel confident 
                  and beautiful in their own skin. What started as a small venture has 
                  grown into a trusted name in premium hair extensions.
                </p>
                <p>
                  We source only the finest human hair from around the world, ensuring 
                  each strand meets our exacting standards for quality, durability, and 
                  natural beauty.
                </p>
              </div>

              <a 
                href="https://www.instagram.com/tima_blaq/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.founderSocial}
              >
                <Instagram size={18} strokeWidth={1.5} />
                <span>Follow @tima_blaq</span>
                <ArrowRight size={16} strokeWidth={2} />
              </a>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection className={styles.values}>
        <div className={styles.container}>
          <motion.div className={styles.sectionHeader} variants={fadeInUp}>
            <h2 className={styles.sectionTitle}>What We Stand For</h2>
            <p className={styles.sectionSubtitle}>
              Our core values guide everything we do
            </p>
          </motion.div>

          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <motion.div 
                key={index} 
                className={`${styles.valueCard} ${styles[`valueCard${value.color}`]}`}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <div className={styles.valueIconWrapper}>
                  <value.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
                
                {/* Decorative corner */}
                <div className={styles.valueDecor} />
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Promise Section */}
      <AnimatedSection className={styles.promise}>
        <div className={styles.container}>
          <motion.div 
            className={styles.promiseCard}
            variants={scaleIn}
          >
            {/* Background decoration */}
            <div className={styles.promiseGlow} />
            
            <motion.div variants={fadeInUp}>
              <Gem className={styles.promiseIcon} size={32} strokeWidth={1} />
            </motion.div>
            
            <motion.h2 
              className={styles.promiseTitle}
              variants={fadeInUp}
            >
              Our Promise
            </motion.h2>
            
            <motion.p 
              className={styles.promiseText}
              variants={fadeInUp}
            >
              When you choose HairByTimaBlaq, you're not just buying hair extensions. 
              You're investing in quality that lasts, confidence that shows, and a 
              partner who cares about your beauty journey.
            </motion.p>
            
            <motion.div variants={fadeInUp}>
              <Link to="/shop" className={styles.promiseBtn}>
                <span>Shop Collection</span>
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>
    </main>
  );
}