// ==========================================================================
// FAQ Page - Enhanced with animations, search, and luxury design
// ==========================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Package, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Scissors, 
  HelpCircle,
  Search,
  X,
  MessageCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import styles from '@styles/module/FAQPage.module.css';

// FAQ Data
const faqData = [
  {
    id: 'orders',
    category: 'Orders & Shipping',
    icon: Truck,
    color: 'pink',
    questions: [
      { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days within the US, 7-14 business days for international orders. Express shipping (2-3 business days) is available at checkout.' },
      { q: 'Do you ship internationally?', a: 'Yes! We ship to most countries worldwide. Shipping costs and delivery times vary by location. You can see the exact cost at checkout before completing your order.' },
      { q: 'How can I track my order?', a: 'Once your order ships, you\'ll receive a confirmation email with a tracking number. You can also track your order anytime using our Track Order page.' },
      { q: 'Can I change my shipping address after ordering?', a: 'If your order hasn\'t shipped yet, contact us immediately and we\'ll update your address. Once shipped, address changes aren\'t possible.' }
    ]
  },
  {
    id: 'returns',
    category: 'Returns & Refunds',
    icon: RotateCcw,
    color: 'gold',
    questions: [
      { q: 'What is your return policy?', a: 'We accept returns within 14 days of delivery for unused, unaltered hair in its original packaging. Custom orders and final sale items are non-returnable.' },
      { q: 'How do I initiate a return?', a: 'Email us at hello@hairbytimablaq.com with your order number and reason for return. We\'ll provide you with a return shipping label and instructions.' },
      { q: 'When will I receive my refund?', a: 'Once we receive and inspect your return, refunds are processed within 5-7 business days to your original payment method.' },
      { q: 'Can I exchange for a different length?', a: 'Yes! Contact us within 14 days of delivery to arrange an exchange. The hair must be unused and in original packaging.' }
    ]
  },
  {
    id: 'payment',
    category: 'Payment',
    icon: CreditCard,
    color: 'pink',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, Klarna (buy now, pay later), and bank transfers. All payments are processed securely.' },
      { q: 'Is my payment information secure?', a: 'Absolutely. We use industry-standard SSL encryption and never store your full credit card details.' },
      { q: 'Do you offer payment plans?', a: 'Yes! Through Klarna, you can split your purchase into 4 interest-free payments. Select Klarna at checkout.' },
      { q: 'Which currencies do you accept?', a: 'We accept USD, GBP, EUR, and NGN. Switch currencies using the selector in our header.' }
    ]
  },
  {
    id: 'products',
    category: 'Products & Quality',
    icon: Package,
    color: 'gold',
    questions: [
      { q: 'Is your hair 100% human hair?', a: 'Yes, all our extensions are 100% virgin human hair, ethically sourced and never chemically processed.' },
      { q: 'How long will the hair last?', a: 'With proper care, our extensions can last 12-24 months. Longevity depends on wear frequency and maintenance.' },
      { q: 'Can I dye or heat style the hair?', a: 'Yes! Our human hair can be colored, bleached, and heat styled. We recommend professional coloring for best results.' },
      { q: 'What\'s the difference between textures?', a: 'Body Wave has soft bouncy waves, Straight is sleek and smooth, Deep Wave has tighter defined waves, and Curly has a natural curl pattern.' }
    ]
  },
  {
    id: 'haircare',
    category: 'Hair Care',
    icon: Scissors,
    color: 'pink',
    questions: [
      { q: 'How do I wash my extensions?', a: 'Use sulfate-free shampoo with lukewarm water. Wash gently from root to tip, condition from mid-length to ends, and air dry or use low heat.' },
      { q: 'How often should I wash them?', a: 'Wash every 7-10 wears or when product buildup occurs. Over-washing can strip natural oils and reduce lifespan.' },
      { q: 'How should I store my extensions?', a: 'Store in a cool, dry place away from sunlight. Keep in a silk or satin bag to prevent tangling. Never store wet.' },
      { q: 'What products do you recommend?', a: 'Use sulfate-free, alcohol-free products. We recommend lightweight leave-in conditioners, argan oil, and heat protectant spray.' }
    ]
  },
  {
    id: 'other',
    category: 'Other Questions',
    icon: HelpCircle,
    color: 'gold',
    questions: [
      { q: 'How do I choose the right length?', a: 'Check our Length Guide on product pages. Consider your height and desired style. 16-18" is a safe starting point for most.' },
      { q: 'How many bundles do I need?', a: 'For full sew-in: 10-12" needs 2-3 bundles, 14-18" needs 3 bundles, 20-24" needs 3-4 bundles, 26"+ needs 4+ bundles.' },
      { q: 'Do you offer wholesale pricing?', a: 'Yes! Email wholesale@hairbytimablaq.com with your business details and products of interest.' },
      { q: 'How can I contact support?', a: 'Email hello@hairbytimablaq.com or use our Contact page. We respond within 24-48 hours on business days.' }
    ]
  }
];

// Single FAQ Item
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className={styles.faqItem}>
      <button 
        type="button"
        className={`${styles.faqQuestion} ${isOpen ? styles.faqQuestionOpen : ''}`}
        onClick={onToggle}
      >
        <span className={styles.faqQuestionText}>{question}</span>
        <div className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}>
          <ChevronDown size={18} strokeWidth={2} />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.faqAnswer}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Single Category Block
function FAQCategory({ category, openItems, onToggle }) {
  const IconComponent = category.icon;
  
  return (
    <motion.div 
      className={`${styles.faqCategory} ${styles[`faqCategory${category.color}`]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.faqCategoryHeader}>
        <div className={styles.faqCategoryIcon}>
          <IconComponent size={20} strokeWidth={1.5} />
        </div>
        <h2 className={styles.faqCategoryTitle}>{category.category}</h2>
        <span className={styles.faqCategoryCount}>
          {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className={styles.faqItems}>
        {category.questions.map((item, idx) => {
          const itemKey = `${category.id}-${idx}`;
          return (
            <FAQItem
              key={itemKey}
              question={item.q}
              answer={item.a}
              isOpen={openItems[itemKey] || false}
              onToggle={() => onToggle(itemKey)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({});

  // Filter logic
  const filteredData = faqData
    .filter(cat => activeCategory === 'all' || cat.id === activeCategory)
    .map(cat => ({
      ...cat,
      questions: cat.questions.filter(q => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return q.q.toLowerCase().includes(query) || q.a.toLowerCase().includes(query);
      })
    }))
    .filter(cat => cat.questions.length > 0);

  const totalQuestions = faqData.reduce((sum, cat) => sum + cat.questions.length, 0);
  const totalResults = filteredData.reduce((sum, cat) => sum + cat.questions.length, 0);

  const handleToggle = (itemKey) => {
    setOpenItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setOpenItems({});
  };

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.container}>
          <motion.span 
            className={styles.heroLabel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HelpCircle size={14} strokeWidth={1.5} />
            Help Center
          </motion.span>
          
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Frequently Asked <span className={styles.highlight}>Questions</span>
          </motion.h1>
          
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Find quick answers to common questions about our products and services
          </motion.p>

          {/* Search */}
          <motion.div 
            className={styles.searchWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className={styles.searchIcon} size={18} strokeWidth={1.5} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className={styles.searchClear} onClick={() => setSearchQuery('')}>
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Category Tabs */}
          <motion.div 
            className={styles.categoryNav}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="button"
              className={`${styles.categoryPill} ${activeCategory === 'all' ? styles.categoryPillActive : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              <Sparkles size={16} strokeWidth={1.5} />
              <span>All</span>
              <span className={styles.categoryCount}>{totalQuestions}</span>
            </button>
            
            {faqData.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryPill} ${activeCategory === cat.id ? styles.categoryPillActive : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{cat.category}</span>
                  <span className={styles.categoryCount}>{cat.questions.length}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Results Count */}
          {searchQuery && (
            <div className={styles.resultsCount}>
              Found <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}

          {/* FAQ List */}
          <div className={styles.faqList}>
            {filteredData.length === 0 ? (
              <div className={styles.noResults}>
                <HelpCircle size={48} strokeWidth={1} />
                <h3>No results found</h3>
                <p>Try adjusting your search or browse all categories</p>
                <button 
                  type="button"
                  className={styles.clearFiltersBtn}
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredData.map((cat) => (
                <FAQCategory
                  key={cat.id}
                  category={cat}
                  openItems={openItems}
                  onToggle={handleToggle}
                />
              ))
            )}
          </div>

          {/* CTA */}
          <motion.section 
            className={styles.ctaSection}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className={styles.ctaGlow} />
            <MessageCircle className={styles.ctaIcon} size={32} strokeWidth={1} />
            <h2 className={styles.ctaTitle}>Still have questions?</h2>
            <p className={styles.ctaText}>
              Can't find what you're looking for? Our team is here to help.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/contact" className={styles.ctaPrimaryBtn}>
                <span>Contact Us</span>
                <ChevronRight size={18} strokeWidth={2} />
              </Link>
              <Link to="/hair-care" className={styles.ctaSecondaryBtn}>
                Hair Care Guide
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}