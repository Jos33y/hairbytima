// ==========================================================================
// Product Data Constants - Care Instructions, Trust Features, etc.
// ==========================================================================

import { Sparkles, Award, Zap, Scissors, Droplets, Truck, Info } from 'lucide-react';

// Trust banner features shown on product page
export const trustFeatures = [
  { icon: Sparkles, title: 'Tangle-Free', desc: 'Premium quality' },
  { icon: Award, title: '100% Human Hair', desc: 'Never processed' },
  { icon: Zap, title: 'Long Lasting', desc: '12-24 months' },
  { icon: Scissors, title: 'Customizable', desc: 'Color & style' },
];

// Product tabs configuration
export const productTabs = [
  { id: 'description', label: 'Description', icon: Info },
  { id: 'care', label: 'Hair Care', icon: Droplets },
  { id: 'shipping', label: 'Shipping', icon: Truck },
];

// Care instructions by category
const careInstructions = {
  bundles: [
    'Wash with sulfate-free shampoo every 7-10 wears',
    'Always use lukewarm water, never hot',
    'Apply conditioner from mid-length to ends',
    'Air dry or use low heat with protectant spray',
    'Store in silk or satin bag when not in use',
    'Detangle gently with wide-tooth comb',
  ],
  wigs: [
    'Wash every 7-10 wears with wig-specific shampoo',
    'Never rub or twist - gently squeeze water out',
    'Use wig stand for drying and storage',
    'Apply leave-in conditioner for moisture',
    'Use low heat settings when styling',
    'Store on mannequin head to maintain shape',
  ],
  braiding: [
    'Soak in apple cider vinegar solution before use',
    'Rinse thoroughly with cool water',
    'Let air dry completely before braiding',
    'Moisturize scalp regularly while installed',
    'Keep braids for maximum 6-8 weeks',
    'Wrap in silk scarf at night',
  ],
  closures: [
    'Clean lace gently with mild cleanser',
    'Remove adhesive with oil-based remover',
    'Store on mannequin head when not wearing',
    'Avoid heavy products near the lace',
    'Use edge control sparingly on hairline',
    'Have lace professionally customized',
  ],
  frontals: [
    'Clean lace gently with mild cleanser',
    'Remove adhesive with oil-based remover',
    'Store on mannequin head when not wearing',
    'Avoid heavy products near the lace',
    'Use edge control sparingly on hairline',
    'Bleach knots carefully for natural look',
  ],
  curly: [
    'Co-wash between shampoos to retain moisture',
    'Use the LOC method: Liquid, Oil, Cream',
    'Scrunch with microfiber towel, never rub',
    'Apply products to soaking wet hair',
    'Sleep with pineapple method or satin bonnet',
    'Refresh curls with water and leave-in spray',
  ],
  straight: [
    'Wash with sulfate-free shampoo weekly',
    'Use heat protectant before flat ironing',
    'Wrap hair at night to maintain sleekness',
    'Apply lightweight serum for shine',
    'Avoid over-washing to prevent dryness',
    'Trim ends regularly to prevent splits',
  ],
  wavy: [
    'Wash every 7-10 days with moisturizing shampoo',
    'Scrunch with mousse or curl cream when wet',
    'Air dry or diffuse on low heat',
    'Sleep on silk pillowcase to reduce frizz',
    'Refresh waves with water and sea salt spray',
    'Deep condition bi-weekly for softness',
  ],
};

/**
 * Get care instructions based on category name
 * @param {string} category - Product category
 * @returns {string[]} Array of care instructions
 */
export const getCareInstructions = (category) => {
  if (!category) return careInstructions.bundles;
  
  const cat = category.toLowerCase();
  
  if (cat.includes('wig')) return careInstructions.wigs;
  if (cat.includes('braid')) return careInstructions.braiding;
  if (cat.includes('closure')) return careInstructions.closures;
  if (cat.includes('frontal')) return careInstructions.frontals;
  if (cat.includes('curly') || cat.includes('kinky')) return careInstructions.curly;
  if (cat.includes('straight')) return careInstructions.straight;
  if (cat.includes('wavy') || cat.includes('wave')) return careInstructions.wavy;
  
  // Default to bundles
  return careInstructions.bundles;
};

// Length guide data
const lengthData = [
  { inches: '10"', cm: '25cm', description: 'Above shoulders', position: 15 },
  { inches: '12"', cm: '30cm', description: 'Shoulder length', position: 22 },
  { inches: '14"', cm: '35cm', description: 'Below shoulders', position: 29 },
  { inches: '16"', cm: '40cm', description: 'Mid-back', position: 36 },
  { inches: '18"', cm: '45cm', description: 'Bra strap length', position: 43 },
  { inches: '20"', cm: '50cm', description: 'Below bra strap', position: 50 },
  { inches: '22"', cm: '55cm', description: 'Mid-lower back', position: 57 },
  { inches: '24"', cm: '60cm', description: 'Waist length', position: 64 },
  { inches: '26"', cm: '65cm', description: 'Below waist', position: 71 },
  { inches: '28"', cm: '70cm', description: 'Hip length', position: 78 },
  { inches: '30"', cm: '75cm', description: 'Below hips', position: 85 },
];

// Length guide tips
const lengthGuideTips = [
  'Measurements are taken when hair is straight',
  'Curly/wavy hair will appear 1-2 inches shorter',
  'Consider your height when choosing length',
  'First time? Start with 16-18" for a natural look',
];

// Default product specifications
const defaultSpecs = {
  material: '100% Luxury Human Hair',
  weight: '100g per bundle',
  color: 'Natural Black',
  origin: 'Ethically Sourced',
};