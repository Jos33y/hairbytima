// ==========================================================================
// Return Policy Page
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  ArrowLeftRight,
  Truck,
  CreditCard,
  RefreshCcw,
  AlertCircle,
  Mail,
  Shield
} from 'lucide-react';
import { LegalLayout, fadeInUp } from '@components/layout';
import styles from '@styles/module/LegalPage.module.css';

export default function ReturnPolicyPage() {
  return (
    <LegalLayout title="Return Policy" lastUpdated="December 2024">

      <motion.div className={styles.highlight} variants={fadeInUp}>
        <Shield className={styles.highlightIcon} size={24} strokeWidth={1} />
        <p>
          <strong>Our Guarantee:</strong> We want you to love your hair! If you're 
          not completely satisfied with your purchase, we're here to help make it right.
        </p>
      </motion.div>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><CheckCircle size={16} strokeWidth={1.5} /></span>
          Return Eligibility
        </h2>
        <p className={styles.text}>
          Items may be returned within 14 days of delivery if they meet the following conditions:
        </p>
        <ul className={styles.list}>
          <li>Hair must be in its original, unopened packaging</li>
          <li>Hair must not have been washed, colored, cut, or altered in any way</li>
          <li>All tags and bands must be intact</li>
          <li>Original receipt or proof of purchase is required</li>
        </ul>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><XCircle size={16} strokeWidth={1.5} /></span>
          Non-Returnable Items
        </h2>
        <p className={styles.text}>The following items cannot be returned:</p>
        <ul className={styles.list}>
          <li>Hair that has been installed, washed, or altered</li>
          <li>Hair with removed or damaged packaging</li>
          <li>Hair purchased during final sale or clearance promotions</li>
          <li>Custom or special order items</li>
        </ul>
        <p className={styles.text}>
          For hygiene reasons, we cannot accept returns on hair that shows any signs of use.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Package size={16} strokeWidth={1.5} /></span>
          How to Initiate a Return
        </h2>
        <p className={styles.text}>To start your return:</p>
        <ul className={styles.list}>
          <li>
            Contact us at{' '}
            <Link to="/contact" className={styles.contactLink}>
              hello@hairbytimablaq.com
            </Link>{' '}
            with your order number
          </li>
          <li>Include photos of the item(s) you wish to return</li>
          <li>Explain the reason for your return</li>
          <li>Wait for our team to approve your return request</li>
          <li>Once approved, ship the item(s) back to us</li>
        </ul>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Truck size={16} strokeWidth={1.5} /></span>
          Return Shipping
        </h2>
        <p className={styles.text}>
          Customers are responsible for return shipping costs unless the return is 
          due to our error (wrong item, damaged in transit, or defective product).
        </p>
        <p className={styles.text}>
          We recommend using a trackable shipping service and purchasing shipping 
          insurance. We are not responsible for items lost or damaged during return shipping.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><CreditCard size={16} strokeWidth={1.5} /></span>
          Refunds
        </h2>
        <p className={styles.text}>
          Once we receive and inspect your return, we will notify you of the approval 
          or rejection of your refund.
        </p>
        <p className={styles.text}>
          If approved, your refund will be processed to your original payment method 
          within 5-10 business days. Please note that your bank may take additional 
          time to post the refund to your account.
        </p>
        <div className={styles.highlight}>
          <p>
            <strong>Note:</strong> Original shipping charges are non-refundable unless 
            the return is due to our error.
          </p>
        </div>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><RefreshCcw size={16} strokeWidth={1.5} /></span>
          Exchanges
        </h2>
        <p className={styles.text}>
          We're happy to exchange items for a different length or texture, subject 
          to availability. To request an exchange, follow the same process as a return 
          and indicate the item you would like instead.
        </p>
        <p className={styles.text}>
          If there is a price difference, you will either receive a refund for the 
          difference or be charged the additional amount.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><AlertCircle size={16} strokeWidth={1.5} /></span>
          Damaged or Defective Items
        </h2>
        <p className={styles.text}>
          If you receive a damaged or defective item, please contact us immediately 
          (within 48 hours of delivery) with photos of the damage. We will arrange 
          a replacement or full refund at no additional cost to you.
        </p>
      </motion.section>

      <motion.section className={styles.section} variants={fadeInUp}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><Mail size={16} strokeWidth={1.5} /></span>
          Questions?
        </h2>
        <p className={styles.text}>
          If you have any questions about our return policy, please don't hesitate 
          to{' '}
          <Link to="/contact" className={styles.contactLink}>
            contact us
          </Link>
          . We're here to help!
        </p>
      </motion.section>

    </LegalLayout>
  );
}