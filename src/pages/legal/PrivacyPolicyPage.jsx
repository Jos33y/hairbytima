// ==========================================================================
// Privacy Policy Page
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, Share2, Lock, UserCheck, Cookie, Mail } from 'lucide-react';
import { LegalLayout, fadeInUp } from '@components/layout';
import styles from '@styles/module/LegalPage.module.css';

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="December 2024">
      
      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Eye size={16} strokeWidth={1.5} /></span>
          Introduction
        </h2>
        <p className={styles.text}>
          At HairByTimaBlaq, we respect your privacy and are committed to protecting 
          your personal data. This privacy policy explains how we collect, use, and 
          safeguard your information when you visit our website or make a purchase.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Shield size={16} strokeWidth={1.5} /></span>
          Information We Collect
        </h2>
        <p className={styles.text}>We collect information that you provide directly to us, including:</p>
        <ul className={styles.list}>
          <li>Contact information (name, email address, phone number)</li>
          <li>Shipping address and billing information</li>
          <li>Order history and preferences</li>
          <li>Communications you send to us</li>
        </ul>
        <p className={styles.text}>
          We also automatically collect certain information when you visit our site, 
          including your IP address, browser type, and browsing behavior.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><UserCheck size={16} strokeWidth={1.5} /></span>
          How We Use Your Information
        </h2>
        <p className={styles.text}>We use the information we collect to:</p>
        <ul className={styles.list}>
          <li>Process and fulfill your orders</li>
          <li>Send order confirmations and shipping updates</li>
          <li>Respond to your questions and provide customer support</li>
          <li>Send promotional communications (with your consent)</li>
          <li>Improve our website and services</li>
          <li>Prevent fraud and enhance security</li>
        </ul>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Share2 size={16} strokeWidth={1.5} /></span>
          Information Sharing
        </h2>
        <p className={styles.text}>
          We do not sell, trade, or rent your personal information to third parties. 
          We may share your information with:
        </p>
        <ul className={styles.list}>
          <li>Shipping carriers to deliver your orders</li>
          <li>Payment processors to complete transactions</li>
          <li>Service providers who assist our operations</li>
        </ul>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Lock size={16} strokeWidth={1.5} /></span>
          Data Security
        </h2>
        <p className={styles.text}>
          We implement appropriate security measures to protect your personal information 
          against unauthorized access, alteration, disclosure, or destruction. However, 
          no method of transmission over the internet is 100% secure.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>Your Rights</h2>
        <p className={styles.text}>You have the right to:</p>
        <ul className={styles.list}>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt out of marketing communications</li>
        </ul>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Cookie size={16} strokeWidth={1.5} /></span>
          Cookies
        </h2>
        <p className={styles.text}>
          We use cookies to enhance your browsing experience, remember your preferences, 
          and analyze site traffic. You can control cookie settings through your browser.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Mail size={16} strokeWidth={1.5} /></span>
          Contact Us
        </h2>
        <p className={styles.text}>
          If you have any questions about this privacy policy or our data practices, 
          please contact us at{' '}
          <Link to="/contact" className={styles.contactLink}>
            hello@hairbytimablaq.com
          </Link>
        </p>
      </motion.section>

    </LegalLayout>
  );
}