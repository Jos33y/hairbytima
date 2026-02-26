// ==========================================================================
// Hair Care Page - Comprehensive guides for different hair types
// ==========================================================================

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  Droplets,
  Wind,
  Moon,
  Sun,
  Scissors,
  Heart,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Waves,
  Crown,
  Shield,
  Clock,
  ThermometerSun,
  Brush,
  SprayCan
} from 'lucide-react';
import styles from '@styles/module/HairCarePage.module.css';

// Hair type categories with their care guides
const hairTypes = [
  {
    id: 'bundles',
    title: 'Human Hair Bundles',
    subtitle: 'Straight, Body Wave & Deep Wave',
    icon: Waves,
    color: 'pink',
    image: '/images/haircare/bundles.jpg',
    intro: 'Human hair bundles are an investment in quality. With proper care, your bundles can last 1-2 years or longer while maintaining their natural luster and bounce.',
    sections: [
      {
        title: 'Washing Your Bundles',
        icon: Droplets,
        tips: [
          'Wash every 1-2 weeks or when product buildup occurs',
          'Use lukewarm water - never hot water as it can damage the cuticle',
          'Apply sulfate-free shampoo from mid-length to ends, gently working through',
          'Rinse thoroughly and apply a moisturizing conditioner for 3-5 minutes',
          'Rinse with cool water to seal the cuticle and add shine',
          'Gently squeeze out excess water - never wring or twist'
        ]
      },
      {
        title: 'Conditioning & Moisture',
        icon: Sparkles,
        tips: [
          'Deep condition every 2 weeks to maintain softness and elasticity',
          'Use a leave-in conditioner after every wash',
          'Apply natural oils (argan, jojoba, or coconut) to ends to prevent dryness',
          'Avoid applying products directly to the weft to prevent shedding',
          'Use a protein treatment monthly if hair feels weak or over-processed'
        ]
      },
      {
        title: 'Drying & Styling',
        icon: Wind,
        tips: [
          'Air dry whenever possible to maintain hair health',
          'If blow drying, use low heat setting and a heat protectant spray',
          'Always use heat protectant before flat irons or curling wands',
          'Keep heat tools below 350°F (180°C) to prevent damage',
          'Detangle with a wide-tooth comb starting from ends, working up'
        ]
      },
      {
        title: 'Nighttime Care',
        icon: Moon,
        tips: [
          'Wrap hair in a silk or satin scarf before bed',
          'Use a silk or satin pillowcase to reduce friction',
          'Loosely braid or twist hair to prevent tangling',
          'Never sleep with wet hair as it causes matting'
        ]
      }
    ],
    dosDonts: {
      dos: [
        'Store unused bundles in a silk bag away from direct sunlight',
        'Brush gently from ends to roots with a paddle brush',
        'Trim ends every 6-8 weeks to prevent split ends',
        'Use a swim cap when swimming to protect from chlorine'
      ],
      donts: [
        'Never brush wet hair - use a wide-tooth comb instead',
        'Avoid sleeping with wet or damp hair',
        'Don\'t use products with alcohol, sulfates, or parabens',
        'Never apply excessive heat without protection'
      ]
    }
  },
  {
    id: 'wigs',
    title: 'Wigs & Frontals',
    subtitle: 'Lace Front, Full Lace & 360 Wigs',
    icon: Crown,
    color: 'gold',
    image: '/images/haircare/wigs.jpg',
    intro: 'Wigs offer versatility and protection for your natural hair. Proper maintenance keeps your wig looking fresh and extends its lifespan significantly.',
    sections: [
      {
        title: 'Washing Your Wig',
        icon: Droplets,
        tips: [
          'Wash every 7-10 wears or when product buildup is visible',
          'Detangle thoroughly before washing using a wide-tooth comb',
          'Fill a basin with cool water and add sulfate-free shampoo',
          'Submerge wig and gently swish - never rub or scrub',
          'Rinse thoroughly with cool water until water runs clear',
          'Apply conditioner avoiding the lace and cap area'
        ]
      },
      {
        title: 'Lace Care',
        icon: Shield,
        tips: [
          'Clean lace with a gentle makeup remover or alcohol-free cleanser',
          'Remove adhesive residue carefully with adhesive remover',
          'Never pull or tug on the lace - it\'s delicate',
          'Store wig on a mannequin head to maintain lace shape',
          'Avoid getting conditioner on the lace as it weakens adhesion'
        ]
      },
      {
        title: 'Styling Tips',
        icon: Brush,
        tips: [
          'Use wig-specific styling products for best results',
          'Apply mousse or light gel for definition',
          'Use low heat settings when heat styling',
          'Customize your hairline by plucking sparse hairs for natural look',
          'Use edge control or gel to lay edges without buildup on lace'
        ]
      },
      {
        title: 'Storage & Longevity',
        icon: Moon,
        tips: [
          'Store on a wig stand or mannequin head when not in use',
          'Keep in a cool, dry place away from direct sunlight',
          'Cover with a silk or satin bag to protect from dust',
          'Never store wet - always ensure wig is completely dry',
          'Avoid storing in plastic bags which can cause moisture buildup'
        ]
      }
    ],
    dosDonts: {
      dos: [
        'Give your wig a break - rotate between styles if possible',
        'Secure properly to avoid tension on your hairline',
        'Moisturize your natural hair underneath regularly',
        'Use a wig cap to protect your hair and secure the wig'
      ],
      donts: [
        'Don\'t sleep in your wig - it causes tangling and shortens lifespan',
        'Avoid swimming in your wig without protection',
        'Don\'t apply heavy oils near the lace',
        'Never use regular brushes on curly or wavy wigs'
      ]
    }
  },
  {
    id: 'curly',
    title: 'Curly & Kinky Hair',
    subtitle: 'Curly, Deep Curly & Kinky Textures',
    icon: Sparkles,
    color: 'pink',
    image: '/images/haircare/curly.jpg',
    intro: 'Curly and kinky textures require extra moisture and gentle handling to maintain their beautiful pattern. The key is hydration and minimizing manipulation.',
    sections: [
      {
        title: 'Co-Washing Method',
        icon: Droplets,
        tips: [
          'Co-wash (conditioner wash) between shampoos to retain moisture',
          'Use a clarifying shampoo once a month to remove buildup',
          'Apply shampoo to scalp only, let it rinse through the lengths',
          'Section hair and work through each section to ensure thorough cleansing',
          'Rinse with cool water to help seal the cuticle'
        ]
      },
      {
        title: 'Defining Your Curls',
        icon: Sparkles,
        tips: [
          'Apply styling products to soaking wet hair for best definition',
          'Use the "praying hands" method to distribute product evenly',
          'Scrunch curls upward to encourage curl pattern',
          'Use a diffuser on low heat to dry without disturbing curl pattern',
          'Don\'t touch hair while drying to avoid frizz'
        ]
      },
      {
        title: 'The LOC/LCO Method',
        icon: SprayCan,
        tips: [
          'L - Liquid (water or water-based leave-in)',
          'O - Oil (seal in moisture with natural oils)',
          'C - Cream (styling cream for hold and definition)',
          'Apply in order based on your hair porosity',
          'Low porosity: LCO method works better',
          'High porosity: LOC method helps retain moisture'
        ]
      },
      {
        title: 'Refresh & Revive',
        icon: Sun,
        tips: [
          'Spritz with water and leave-in conditioner mix to refresh day 2+ curls',
          'Use a satin bonnet or pineapple method at night',
          'Avoid re-wetting the entire head - focus on problem areas',
          'Finger coil any sections that have lost definition',
          'Use a light oil to add shine without weighing down curls'
        ]
      }
    ],
    dosDonts: {
      dos: [
        'Detangle only when hair is wet and saturated with conditioner',
        'Use a wide-tooth comb or fingers to detangle',
        'Trim regularly to prevent single strand knots',
        'Deep condition weekly for maximum hydration'
      ],
      donts: [
        'Never brush curly hair when dry - it causes frizz and breakage',
        'Avoid towel drying - use a microfiber towel or t-shirt instead',
        'Don\'t use products with silicones that cause buildup',
        'Avoid excessive manipulation which disrupts curl pattern'
      ]
    }
  },
  {
    id: 'braids',
    title: 'Braiding Hair',
    subtitle: 'Box Braids, Twists & Protective Styles',
    icon: Shield,
    color: 'gold',
    image: '/images/haircare/braids.jpg',
    intro: 'Braiding hair helps create stunning protective styles. Proper preparation and care ensures your braids look fresh longer and your natural hair stays healthy underneath.',
    sections: [
      {
        title: 'Preparing Braiding Hair',
        icon: Droplets,
        tips: [
          'Soak synthetic hair in apple cider vinegar and water (1:3 ratio) for 15-20 minutes',
          'This removes the alkaline coating that causes itching and irritation',
          'Rinse thoroughly and allow to air dry completely before use',
          'For kanekalon hair, you can also use a leave-in conditioner spray',
          'Store prepared hair in a clean, dry place until ready to use'
        ]
      },
      {
        title: 'Installation Tips',
        icon: Shield,
        tips: [
          'Don\'t braid too tightly - this causes tension alopecia',
          'Ensure edges aren\'t pulled too tight',
          'Take breaks during long installation sessions',
          'Keep natural hair moisturized before and during installation',
          'Use edge control sparingly to avoid buildup'
        ]
      },
      {
        title: 'Maintaining Your Braids',
        icon: SprayCan,
        tips: [
          'Moisturize scalp every 2-3 days with a light oil or braid spray',
          'Wrap braids in a satin scarf at night to prevent frizz',
          'Wash scalp every 2 weeks using diluted shampoo in a spray bottle',
          'Use a mousse or foam to tame flyaways and refresh braids',
          'Don\'t keep braids in for more than 6-8 weeks'
        ]
      },
      {
        title: 'Safe Removal',
        icon: Scissors,
        tips: [
          'Apply oil or conditioner to braids before removal for easier detangling',
          'Cut the braiding hair below where your natural hair ends',
          'Gently unravel each braid - never pull or rip',
          'Finger detangle first before using a wide-tooth comb',
          'Deep condition immediately after removal'
        ]
      }
    ],
    dosDonts: {
      dos: [
        'Give your hair a 1-2 week break between protective styles',
        'Keep your scalp clean and moisturized',
        'Use a satin pillowcase or bonnet',
        'Listen to your scalp - if it hurts, it\'s too tight'
      ],
      donts: [
        'Don\'t leave braids in longer than 8 weeks',
        'Avoid styles that are too heavy which cause tension',
        'Don\'t neglect your natural hair underneath',
        'Never reuse braiding hair that\'s matted or tangled'
      ]
    }
  },
  {
    id: 'closures',
    title: 'Closures & Frontals',
    subtitle: '4x4 Closures & 13x4/13x6 Frontals',
    icon: Crown,
    color: 'pink',
    image: '/images/haircare/closures.jpg',
    intro: 'Closures and frontals complete your install by providing a natural-looking parting or hairline. Special care ensures they blend seamlessly and last.',
    sections: [
      {
        title: 'Customizing Your Piece',
        icon: Scissors,
        tips: [
          'Bleach knots for a more natural scalp appearance',
          'Pluck the hairline gradually for a natural density',
          'Use a rat tail comb to create a natural part',
          'Apply concealer or foundation to lace matching your scalp',
          'Cut lace only after securing - never before installation'
        ]
      },
      {
        title: 'Installation & Adhesion',
        icon: Shield,
        tips: [
          'Clean and prep your hairline with alcohol or scalp protector',
          'Apply a thin layer of adhesive and allow to get tacky',
          'Press lace down firmly starting from center, working outward',
          'Use a scarf or band to set for 10-15 minutes',
          'Style edges with a small amount of edge control'
        ]
      },
      {
        title: 'Daily Maintenance',
        icon: Brush,
        tips: [
          'Use a soft brush to lay edges without disturbing lace',
          'Avoid getting water directly on the lace during daily styling',
          'Touch up adhesive edges as needed',
          'Keep the part area flat and styled',
          'Use a silk press technique for a sleek look'
        ]
      },
      {
        title: 'Removal & Care',
        icon: Sparkles,
        tips: [
          'Apply adhesive remover or oil around the hairline',
          'Wait 5-10 minutes for adhesive to dissolve',
          'Gently lift lace starting from edges',
          'Clean lace thoroughly with gentle cleanser',
          'Store on a mannequin head to maintain shape'
        ]
      }
    ],
    dosDonts: {
      dos: [
        'Test bleach on a small section first',
        'Allow adhesive to fully cure for best hold',
        'Keep spare adhesive and remover on hand',
        'Give your scalp breathing breaks between installs'
      ],
      donts: [
        'Don\'t over-bleach knots - it weakens the lace',
        'Avoid pulling on lace when removing',
        'Don\'t use harsh chemicals near the lace',
        'Never skip the scalp prep step'
      ]
    }
  }
];

// Quick tips for all hair types
const quickTips = [
  { icon: ThermometerSun, title: 'Heat Protection', text: 'Always use a heat protectant before any hot tool styling' },
  { icon: Moon, title: 'Silk at Night', text: 'Sleep on silk/satin to reduce friction and breakage' },
  { icon: Droplets, title: 'Hydration is Key', text: 'Keep hair moisturized with quality leave-in products' },
  { icon: Clock, title: 'Patience Pays', text: 'Take your time detangling to prevent unnecessary shedding' },
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
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Animated section component
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

// Hair type card component
const HairTypeCard = ({ type, isActive, onClick }) => {
  const IconComponent = type.icon;
  
  return (
    <motion.button
      className={`${styles.typeCard} ${isActive ? styles.typeCardActive : ''} ${styles[`typeCard${type.color}`]}`}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={styles.typeCardIcon}>
        <IconComponent size={24} strokeWidth={1.5} />
      </div>
      <div className={styles.typeCardContent}>
        <h3 className={styles.typeCardTitle}>{type.title}</h3>
        <p className={styles.typeCardSubtitle}>{type.subtitle}</p>
      </div>
      <ChevronRight className={styles.typeCardArrow} size={20} strokeWidth={2} />
    </motion.button>
  );
};

// Expandable section component
const ExpandableSection = ({ section, isOpen, onToggle }) => {
  const IconComponent = section.icon;
  
  return (
    <div className={styles.expandableSection}>
      <button 
        className={`${styles.expandableHeader} ${isOpen ? styles.expandableHeaderOpen : ''}`}
        onClick={onToggle}
      >
        <div className={styles.expandableIcon}>
          <IconComponent size={18} strokeWidth={1.5} />
        </div>
        <span>{section.title}</span>
        <ChevronDown 
          className={`${styles.expandableArrow} ${isOpen ? styles.expandableArrowOpen : ''}`} 
          size={20} 
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.expandableContent}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className={styles.tipsList}>
              {section.tips.map((tip, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {tip}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HairCarePage() {
  const [activeType, setActiveType] = useState(hairTypes[0]);
  const [openSections, setOpenSections] = useState([0]); // First section open by default
  const guideRef = useRef(null);

  const toggleSection = (index) => {
    setOpenSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    setOpenSections([0]); // Reset to first section open
    
    // Scroll to guide section smoothly
    setTimeout(() => {
      guideRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

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
              <Heart size={14} strokeWidth={1.5} />
              Expert Guides
            </span>
          </motion.div>
          
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Hair Care <span className={styles.highlight}>Guide</span>
          </motion.h1>
          
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Everything you need to know to keep your hair looking flawless
          </motion.p>
        </div>
      </section>

      {/* Quick Tips Bar */}
      <section className={styles.quickTips}>
        <div className={styles.container}>
          <div className={styles.quickTipsGrid}>
            {quickTips.map((tip, index) => (
              <motion.div 
                key={index}
                className={styles.quickTip}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <tip.icon className={styles.quickTipIcon} size={20} strokeWidth={1.5} />
                <div>
                  <h4 className={styles.quickTipTitle}>{tip.title}</h4>
                  <p className={styles.quickTipText}>{tip.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.mainContent}>
          {/* Hair Type Selector */}
          <AnimatedSection className={styles.typeSelector}>
            <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
              Select Your Hair Type
            </motion.h2>
            <div className={styles.typeGrid}>
              {hairTypes.map((type) => (
                <HairTypeCard
                  key={type.id}
                  type={type}
                  isActive={activeType.id === type.id}
                  onClick={() => handleTypeChange(type)}
                />
              ))}
            </div>
          </AnimatedSection>

          {/* Active Hair Type Guide */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeType.id}
              ref={guideRef}
              className={styles.guideSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Guide Header */}
              <div className={styles.guideHeader}>
                <div className={styles.guideHeaderContent}>
                  <h2 className={styles.guideTitle}>{activeType.title}</h2>
                  <p className={styles.guideSubtitle}>{activeType.subtitle}</p>
                  <p className={styles.guideIntro}>{activeType.intro}</p>
                </div>
              </div>

              {/* Care Sections */}
              <div className={styles.careSections}>
                {activeType.sections.map((section, index) => (
                  <ExpandableSection
                    key={index}
                    section={section}
                    isOpen={openSections.includes(index)}
                    onToggle={() => toggleSection(index)}
                  />
                ))}
              </div>

              {/* Do's and Don'ts */}
              <div className={styles.dosDonts}>
                <div className={styles.dosSection}>
                  <h3 className={styles.dosTitle}>
                    <CheckCircle size={20} strokeWidth={2} />
                    Do's
                  </h3>
                  <ul className={styles.dosList}>
                    {activeType.dosDonts.dos.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.dontsSection}>
                  <h3 className={styles.dontsTitle}>
                    <AlertCircle size={20} strokeWidth={2} />
                    Don'ts
                  </h3>
                  <ul className={styles.dontsList}>
                    {activeType.dosDonts.donts.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CTA Section */}
          <AnimatedSection className={styles.ctaSection}>
            <motion.div className={styles.ctaCard} variants={fadeInUp}>
              <div className={styles.ctaGlow} />
              <Sparkles className={styles.ctaIcon} size={32} strokeWidth={1} />
              <h2 className={styles.ctaTitle}>Ready to Transform Your Look?</h2>
              <p className={styles.ctaText}>
                Shop our premium collection of human hair extensions and find your perfect match.
              </p>
              <Link to="/shop" className={styles.ctaBtn}>
                <span>Shop Collection</span>
                <ChevronRight size={18} strokeWidth={2} />
              </Link>
            </motion.div>
          </AnimatedSection>

          {/* Help Section */}
          <AnimatedSection className={styles.helpSection}>
            <motion.div className={styles.helpCard} variants={fadeInUp}>
              <h3 className={styles.helpTitle}>Need Personalized Advice?</h3>
              <p className={styles.helpText}>
                Our hair experts are here to help you find the perfect products and care routine for your needs.
              </p>
              <Link to="/contact" className={styles.helpLink}>
                Contact Us
                <ChevronRight size={16} strokeWidth={2} />
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </main>
  );
}