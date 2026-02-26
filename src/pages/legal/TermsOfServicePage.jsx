// ==========================================================================
// Terms of Service Page
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle,
  Truck,
  RefreshCcw,
  Copyright,
  AlertTriangle,
  Edit3,
  Mail
} from 'lucide-react';
import { LegalLayout, fadeInUp } from '@components/layout';
import styles from '@styles/module/LegalPage.module.css';

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="December 2024">

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FileText size={16} strokeWidth={1.5} /></span>
          Agreement to Terms
        </h2>
        <p className={styles.text}>
          By accessing or using HairByTimaBlaq's website and services, you agree to 
          be bound by these Terms of Service. If you do not agree to these terms, 
          please do not use our website.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><ShoppingBag size={16} strokeWidth={1.5} /></span>
          Products and Services
        </h2>
        <p className={styles.text}>
          We strive to display our products as accurately as possible. However, we 
          cannot guarantee that colors and details shown on your screen will exactly 
          match the actual product due to monitor variations.
        </p>
        <p className={styles.text}>
          All products are subject to availability. We reserve the right to limit 
          quantities and discontinue products at any time.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><CreditCard size={16} strokeWidth={1.5} /></span>
          Pricing and Payment
        </h2>
        <p className={styles.text}>
          All prices are listed in the selected currency and are subject to change 
          without notice. Payment must be received in full before orders are shipped.
        </p>
        <p className={styles.text}>
          We accept payments via Klarna and bank transfer. By providing payment 
          information, you represent that you are authorized to use the payment method.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><CheckCircle size={16} strokeWidth={1.5} /></span>
          Order Acceptance
        </h2>
        <p className={styles.text}>
          Your order is an offer to purchase. We reserve the right to accept or 
          decline your order for any reason, including product availability, errors 
          in pricing or product information, or suspected fraud.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Truck size={16} strokeWidth={1.5} /></span>
          Shipping and Delivery
        </h2>
        <p className={styles.text}>
          Shipping times and costs vary by destination. Please refer to our{' '}
          <Link to="/shipping-policy" className={styles.contactLink}>
            Shipping Policy
          </Link>{' '}
          for detailed information.
        </p>
        <p className={styles.text}>
          We are not responsible for delays caused by customs, weather, or carrier 
          issues beyond our control.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><RefreshCcw size={16} strokeWidth={1.5} /></span>
          Returns and Refunds
        </h2>
        <p className={styles.text}>
          Please review our{' '}
          <Link to="/return-policy" className={styles.contactLink}>
            Return Policy
          </Link>{' '}
          for information on returns, exchanges, and refunds.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Copyright size={16} strokeWidth={1.5} /></span>
          Intellectual Property
        </h2>
        <p className={styles.text}>
          All content on this website, including text, images, logos, and graphics, 
          is the property of HairByTimaBlaq and is protected by copyright and 
          trademark laws. You may not use, reproduce, or distribute any content 
          without our written permission.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>User Conduct</h2>
        <p className={styles.text}>You agree not to:</p>
        <ul className={styles.list}>
          <li>Use the website for any unlawful purpose</li>
          <li>Interfere with the website's security features</li>
          <li>Transmit viruses or harmful code</li>
          <li>Collect user information without consent</li>
          <li>Engage in fraudulent activities</li>
        </ul>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><AlertTriangle size={16} strokeWidth={1.5} /></span>
          Limitation of Liability
        </h2>
        <p className={styles.text}>
          To the fullest extent permitted by law, HairByTimaBlaq shall not be liable 
          for any indirect, incidental, special, or consequential damages arising 
          from your use of our website or products.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Edit3 size={16} strokeWidth={1.5} /></span>
          Changes to Terms
        </h2>
        <p className={styles.text}>
          We reserve the right to modify these terms at any time. Changes will be 
          effective immediately upon posting. Your continued use of the website 
          constitutes acceptance of the updated terms.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Mail size={16} strokeWidth={1.5} /></span>
          Contact Us
        </h2>
        <p className={styles.text}>
          If you have questions about these Terms of Service, please contact us at{' '}
          <Link to="/contact" className={styles.contactLink}>
            hello@hairbytimablaq.com
          </Link>
        </p>
      </motion.section>

    </LegalLayout>
  );
}