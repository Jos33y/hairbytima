// ==========================================================================
// Shipping Policy Page
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Globe,
  Package,
  AlertTriangle,
  Calendar,
  Mail,
  Gift
} from 'lucide-react';
import { LegalLayout, fadeInUp } from '@components/layout';
import styles from '@styles/module/LegalPage.module.css';

export default function ShippingPolicyPage() {
  return (
    <LegalLayout title="Shipping Policy" lastUpdated="December 2024">

      <motion.div className={styles.highlight} variants={fadeInUp}>
        <Gift className={styles.highlightIcon} size={24} strokeWidth={1} />
        <p>
          <strong>Free Shipping:</strong> Enjoy free standard shipping on all orders 
          over $150 USD (or equivalent in your currency).
        </p>
      </motion.div>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Clock size={16} strokeWidth={1.5} /></span>
          Processing Time
        </h2>
        <p className={styles.text}>
          Orders are typically processed within 1-2 business days. During peak seasons 
          or promotional periods, processing may take an additional 1-2 days.
        </p>
        <p className={styles.text}>
          You will receive an email with tracking information once your order has shipped.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Truck size={16} strokeWidth={1.5} /></span>
          Shipping Rates &amp; Delivery Times
        </h2>

        {/* Nigeria */}
        <h3 className={styles.tableRegion}>Nigeria</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Shipping Method</th>
                <th>Delivery Time</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Standard Delivery</td>
                <td>3-5 business days</td>
                <td>₦3,000</td>
              </tr>
              <tr>
                <td>Express Delivery</td>
                <td>1-2 business days</td>
                <td>₦5,000</td>
              </tr>
              <tr>
                <td>Lagos Same-Day</td>
                <td>Same day (order before 12pm)</td>
                <td>₦4,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* United States */}
        <h3 className={styles.tableRegion}>United States</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Shipping Method</th>
                <th>Delivery Time</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Standard Shipping</td>
                <td>7-10 business days</td>
                <td>$15</td>
              </tr>
              <tr>
                <td>Express Shipping</td>
                <td>3-5 business days</td>
                <td>$30</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* United Kingdom */}
        <h3 className={styles.tableRegion}>United Kingdom</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Shipping Method</th>
                <th>Delivery Time</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Standard Shipping</td>
                <td>7-12 business days</td>
                <td>£12</td>
              </tr>
              <tr>
                <td>Express Shipping</td>
                <td>4-6 business days</td>
                <td>£25</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Other Countries */}
        <h3 className={styles.tableRegion}>Other Countries</h3>
        <p className={styles.text}>
          We ship worldwide! International shipping rates and delivery times vary by 
          destination. Contact us for a shipping quote to your country.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Package size={16} strokeWidth={1.5} /></span>
          Order Tracking
        </h2>
        <p className={styles.text}>
          Once your order ships, you will receive an email with your tracking number. 
          You can also track your order anytime by visiting our{' '}
          <Link to="/track-order" className={styles.contactLink}>
            Track Order
          </Link>{' '}
          page.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Globe size={16} strokeWidth={1.5} /></span>
          Customs &amp; Import Duties
        </h2>
        <p className={styles.text}>
          For international orders, customs duties and import taxes may apply. These 
          charges are the responsibility of the customer and are not included in our 
          shipping costs or product prices.
        </p>
        <p className={styles.text}>
          We are not responsible for any delays caused by customs processing.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><AlertTriangle size={16} strokeWidth={1.5} /></span>
          Delivery Issues
        </h2>
        <p className={styles.text}>
          If your package is lost, damaged, or significantly delayed, please contact 
          us within 7 days of the expected delivery date. We will work with the 
          shipping carrier to resolve the issue.
        </p>
        <p className={styles.text}>
          Please ensure your shipping address is correct and complete. We are not 
          responsible for packages delivered to incorrect addresses provided by the customer.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Calendar size={16} strokeWidth={1.5} /></span>
          Holiday Shipping
        </h2>
        <p className={styles.text}>
          During holiday seasons, shipping carriers may experience delays. We recommend 
          placing orders early to ensure timely delivery. Check our website for specific 
          holiday shipping deadlines.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Mail size={16} strokeWidth={1.5} /></span>
          Questions?
        </h2>
        <p className={styles.text}>
          Have questions about shipping? Feel free to{' '}
          <Link to="/contact" className={styles.contactLink}>
            contact us
          </Link>{' '}
          and we'll be happy to help.
        </p>
      </motion.section>

    </LegalLayout>
  );
}