// ==========================================================================
// Location Constants - Countries & States/Regions
// ==========================================================================
// Supported shipping destinations for HairByTimaBlaq
// ==========================================================================

// Supported countries with dial codes and flags
export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', currency: 'NGN' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', currency: 'GBP' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', currency: 'USD' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', currency: 'EUR' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲', currency: 'GMD' },
];

// States/Regions per country
const STATES = {
  // Nigeria - 36 States + FCT
  NG: [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
    'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 
    'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 
    'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ],
  
  // United Kingdom - Regions/Counties
  GB: [
    'England', 'Scotland', 'Wales', 'Northern Ireland',
    'Greater London', 'West Midlands', 'Greater Manchester', 'West Yorkshire',
    'Kent', 'Essex', 'Hampshire', 'Surrey', 'Hertfordshire', 'Lancashire',
    'South Yorkshire', 'Merseyside', 'Norfolk', 'Nottinghamshire', 'Devon',
    'Leicestershire', 'Staffordshire', 'Derbyshire', 'Suffolk', 'Oxfordshire',
    'Cambridgeshire', 'Berkshire', 'Buckinghamshire', 'Bristol', 'Cornwall',
    'Cumbria', 'Dorset', 'Durham', 'East Sussex', 'Gloucestershire',
    'Isle of Wight', 'Lincolnshire', 'North Yorkshire', 'Northamptonshire',
    'Northumberland', 'Shropshire', 'Somerset', 'Warwickshire', 'West Sussex',
    'Wiltshire', 'Worcestershire'
  ],
  
  // United States - 50 States + DC
  US: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
  ],
  
  // Portugal - Districts + Autonomous Regions
  PT: [
    'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
    'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto',
    'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu',
    'Região Autónoma dos Açores', 'Região Autónoma da Madeira'
  ],
  
  // Gambia - Local Government Areas
  GM: [
    'Banjul', 'Kanifing', 'Brikama (West Coast)', 'Mansakonko (Lower River)',
    'Kerewan (North Bank)', 'Kuntaur (Central River)', 
    'Janjanbureh (Central River)', 'Basse (Upper River)'
  ],
};

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Get country by code
 */
export const getCountryByCode = (code) => {
  return COUNTRIES.find(c => c.code === code);
};

/**
 * Get country name by code
 */
const getCountryName = (code) => {
  const country = getCountryByCode(code);
  return country ? country.name : code;
};

/**
 * Get dial code by country code
 */
const getDialCode = (code) => {
  const country = getCountryByCode(code);
  return country ? country.dialCode : '';
};

/**
 * Get states for a country
 */
export const getStatesForCountry = (countryCode) => {
  return STATES[countryCode] || [];
};

/**
 * Check if country has states
 */
const countryHasStates = (countryCode) => {
  return STATES[countryCode] && STATES[countryCode].length > 0;
};

/**
 * Get currency for country
 */
const getCurrencyForCountry = (countryCode) => {
  const country = getCountryByCode(countryCode);
  return country ? country.currency : 'USD';
};

/**
 * Format full phone number
 */
const formatFullPhone = (countryCode, phoneNumber) => {
  const dialCode = getDialCode(countryCode);
  const cleaned = phoneNumber.replace(/[^0-9]/g, '');
  return `${dialCode}${cleaned}`;
};

/**
 * Validate phone number (minimum digits)
 */
const isValidPhone = (phoneNumber, minDigits = 7) => {
  const cleaned = phoneNumber.replace(/[^0-9]/g, '');
  return cleaned.length >= minDigits;
};

