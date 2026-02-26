import React from 'react';

// SVG Flag Components (work on ALL platforms including Windows)
const FlagUSA = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="14">
    <rect width="512" height="512" fill="#bf0a30" />
    <rect y="39.4" width="512" height="38.4" fill="#fff" />
    <rect y="116.9" width="512" height="38.4" fill="#fff" />
    <rect y="194.5" width="512" height="38.4" fill="#fff" />
    <rect y="272" width="512" height="38.4" fill="#fff" />
    <rect y="349.6" width="512" height="38.4" fill="#fff" />
    <rect y="427.1" width="512" height="38.4" fill="#fff" />
    <rect width="256" height="275.7" fill="#002868" />
  </svg>
);

const FlagUK = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="14">
    <rect width="60" height="30" fill="#012169" />
    <path d="m0,0 60,30m0,-30-60,30" stroke="#fff" strokeWidth="6" />
    <path d="m0,0 60,30m0,-30-60,30" stroke="#C8102E" strokeWidth="4" />
    <path d="m30,0v30m-30,-15h60" stroke="#fff" strokeWidth="10" />
    <path d="m30,0v30m-30,-15h60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

const FlagEU = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 810 540" width="20" height="14">
    <rect width="810" height="540" fill="#003399" />
    <g fill="#FFCC00">
      {[...Array(12)].map((_, i) => (
        <polygon
          key={i}
          points="405,76 412,98 435,98 416,112 423,134 405,120 387,134 394,112 375,98 398,98"
          transform={`rotate(${i * 30} 405 270)`}
        />
      ))}
    </g>
  </svg>
);

const FlagNigeria = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="20" height="14">
    <rect width="1" height="2" fill="#008751" />
    <rect x="1" width="1" height="2" fill="#fff" />
    <rect x="2" width="1" height="2" fill="#008751" />
  </svg>
);

const FlagGambia = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 300" width="20" height="14">
    <rect width="450" height="75" fill="#CE1126" />
    <rect y="75" width="450" height="25" fill="#fff" />
    <rect y="100" width="450" height="100" fill="#0C1C8C" />
    <rect y="200" width="450" height="25" fill="#fff" />
    <rect y="225" width="450" height="75" fill="#3A7728" />
  </svg>
);

const FlagPortugal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="20" height="14">
    <rect width="600" height="400" fill="#FF0000" />
    <rect width="240" height="400" fill="#006600" />
    <circle cx="240" cy="200" r="60" fill="#FFCC00" />
    <circle cx="240" cy="200" r="50" fill="#FF0000" />
    <circle cx="240" cy="200" r="40" fill="#fff" />
  </svg>
);

// Map currency codes to flag components
const CurrencyFlags = {
  USD: FlagUSA,
  GBP: FlagUK,
  EUR: FlagEU,
  NGN: FlagNigeria,
  GMD: FlagGambia,
};


const CountryFlags = {
  NG: FlagNigeria,
  US: FlagUSA,
  GB: FlagUK,
  PT: FlagPortugal,
  GM: FlagGambia,
};
// Helper to render flag by currency code
export const getCurrencyFlag = (currency) => {
  const FlagComponent = CurrencyFlags[currency];
  return FlagComponent ? <FlagComponent /> : null;
};

export const getCountryFlag = (countryCode) => {
  const FlagComponent = CountryFlags[countryCode];
  return FlagComponent ? <FlagComponent /> : null;
};

