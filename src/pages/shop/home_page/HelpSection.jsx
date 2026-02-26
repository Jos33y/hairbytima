// ==========================================================================
// HelpSection - FAQ CTA Banner for Homepage
// ==========================================================================

import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { HelpCircle, ChevronRight, MessageCircle, BookOpen } from 'lucide-react';
import styles from '@styles/module/home/HelpSection.module.css';

const helpItems = [
  {
    icon: BookOpen,
    title: 'Hair Care Guide',
    description: 'Learn how to maintain your extensions',
    link: '/hair-care',
  },
  {
    icon: HelpCircle,
    title: 'FAQs',
    description: 'Quick answers to common questions',
    link: '/faq',
  },
  {
    icon: MessageCircle,
    title: 'Contact Us',
    description: 'Get personalized support',
    link: '/contact',
  },
];

const HelpSection = () => {
  return (
    <section className={styles.help}>
      <div className={styles.container}>
        <m.div
          className={styles.helpWrapper}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.helpHeader}>
            <h2 className={styles.helpTitle}>Need Help?</h2>
            <p className={styles.helpSubtitle}>
              We're here to support your hair journey
            </p>
          </div>

          <div className={styles.helpGrid}>
            {helpItems.map((item, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link to={item.link} className={styles.helpCard}>
                  <div className={styles.helpCardIcon}>
                    <item.icon size={22} strokeWidth={1.5} />
                  </div>
                  <div className={styles.helpCardContent}>
                    <h3 className={styles.helpCardTitle}>{item.title}</h3>
                    <p className={styles.helpCardText}>{item.description}</p>
                  </div>
                  <ChevronRight 
                    className={styles.helpCardArrow} 
                    size={18} 
                    strokeWidth={2} 
                  />
                </Link>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
};

export default HelpSection;