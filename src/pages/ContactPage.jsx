// ==========================================================================
// Contact Page - Get in Touch with form submission to Supabase
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Input } from '@components/common';
import { contactService } from '@services/contactService';
import { trackContactFormSubmit } from '@utils/analytics';
import styles from '@styles/module/ContactPage.module.css';

// Contact info data
const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@hairbytimablaq.com',
    href: 'mailto:hello@hairbytimablaq.com',
  },
  {
    icon: Phone,
    label: 'WhatsApp',
    value: '+380 994 50 0866',
    href: 'https://wa.me/380994500866',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: 'Serrekunda, Gambia',
    href: null,
  },
];

const businessHours = [
  { day: 'Mon to Fri:', time: '9am to 7pm WAT' },
  { day: 'Saturday:', time: '10am to 4pm WAT' },
  { day: 'Sunday:', time: 'Closed' },
];

// Minimum time (in ms) user must spend on form before submitting (anti-bot)
const MIN_FORM_TIME = 3000; // 3 seconds

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
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function ContactPage() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [submitMessage, setSubmitMessage] = useState('');

  // Anti-spam: Honeypot field (bots will fill this, humans won't see it)
  const [honeypot, setHoneypot] = useState('');
  
  // Anti-spam: Track when form was loaded
  const formLoadTime = useRef(Date.now());

  // Reset form load time when component mounts
  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Anti-spam validation
  const validateAntiSpam = () => {
    // Check honeypot - if filled, it's a bot
    if (honeypot) {
      console.warn('Honeypot triggered - bot detected');
      return false;
    }

    // Check time spent on form - bots submit instantly
    const timeSpent = Date.now() - formLoadTime.current;
    if (timeSpent < MIN_FORM_TIME) {
      console.warn('Form submitted too quickly - bot detected');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Silent fail for bots (they won't know they were caught)
    if (!validateAntiSpam()) {
      // Fake success for bots so they don't retry
      setSubmitStatus('success');
      setSubmitMessage('Thank you! Your message has been sent successfully.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await contactService.submitMessage(formData);
      
      // Track successful contact form submission
      trackContactFormSubmit(formData.subject);
      
      setSubmitStatus('success');
      setSubmitMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      // Reset form load time for next submission
      formLoadTime.current = Date.now();

      // Clear success message after 10 seconds
      setTimeout(() => {
        setSubmitStatus(null);
        setSubmitMessage('');
      }, 10000);

    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      setSubmitMessage('Something went wrong. Please try again or contact us directly via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className={styles.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Get in Touch
            </motion.h1>
            <motion.p 
              className={styles.subtitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Have questions? We would love to hear from you.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contact}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {/* Info Card */}
            <motion.div 
              className={styles.infoCard}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <h2 className={styles.infoTitle}>Contact Information</h2>
              
              <motion.div 
                className={styles.infoList}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {contactInfo.map((item, index) => (
                  <motion.div 
                    key={item.label}
                    className={styles.infoItem}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={styles.infoIcon}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon size={20} strokeWidth={1.5} />
                    </motion.div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>{item.label}</span>
                      {item.href ? (
                        <a 
                          href={item.href}
                          className={styles.infoValue}
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className={styles.infoValue}>{item.value}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className={styles.divider} />

              {/* Business Hours */}
              <motion.div 
                className={styles.hours}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className={styles.hoursTitle}>
                  <Clock size={14} strokeWidth={1.5} />
                  Business Hours
                </div>
                <div className={styles.hoursList}>
                  {businessHours.map((item, index) => (
                    <motion.div 
                      key={item.day}
                      className={styles.hoursItem}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <span className={styles.hoursDay}>{item.day}</span>
                      <span className={styles.hoursTime}>{item.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Form Card */}
            <motion.div 
              className={styles.formCard}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Send a Message</h2>
                <motion.div 
                  className={styles.formIcon}
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <MessageSquare size={24} strokeWidth={1.5} />
                </motion.div>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Honeypot field - hidden from humans, bots will fill it */}
                <div className={styles.honeypot} aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Name & Email Row */}
                <div className={styles.formRow}>
                  <Input
                    name="name"
                    label="Your Name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    disabled={isSubmitting}
                  />
                  <Input
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Subject */}
                <Input
                  name="subject"
                  label="Subject"
                  placeholder="What is this about?"
                  value={formData.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  disabled={isSubmitting}
                />

                {/* Message */}
                <div className={styles.textareaWrapper}>
                  <label className={styles.textareaLabel}>Message</label>
                  <textarea
                    name="message"
                    placeholder="Write your message here..."
                    value={formData.message}
                    onChange={handleChange}
                    className={`${styles.textarea} ${errors.message ? styles.textareaError : ''}`}
                    disabled={isSubmitting}
                    rows={5}
                  />
                  {errors.message && (
                    <span className={styles.errorText}>{errors.message}</span>
                  )}
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.div 
                      className={styles.successMessage}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <CheckCircle size={20} strokeWidth={1.5} />
                      <span>{submitMessage}</span>
                      <Sparkles size={16} className={styles.sparkle} />
                    </motion.div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <motion.div 
                      className={styles.errorMessage}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    >
                      <AlertCircle size={20} strokeWidth={1.5} />
                      <span>{submitMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={18} strokeWidth={1.5} />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}