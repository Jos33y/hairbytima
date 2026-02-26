// ==========================================================================
// CheckoutPage - Premium Multi-Step Checkout
// Uses modular components from @components/checkout
// ==========================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, CreditCard, Building2, Lock, Tag, X, Shield, 
  RotateCcw, Truck, Loader2, AlertCircle, Package, MapPin, Mail, User, 
  Home, Globe, Sparkles, Gift, Store, Calendar, MapPinned
} from 'lucide-react';

// Stores
import { useCartStore } from '@store/cartStore';
import { useCurrencyStore } from '@store/currencyStore';

// Services
import { couponService } from '@services/couponService';
import { calculateShipping } from '@services/shippingService'; 

// Constants
import { COUNTRIES, getCountryByCode, getStatesForCountry } from '@constants/locationConstants';

// Checkout Components
import {
  StepIndicator,
  SavingsBanner,
  InputField,
  Dropdown,
  PhoneInput,
  GambiaPickupOption,
  OrderItem,
  WelcomeBackBanner,
} from '@components/checkout'; 

// Analytics
import { trackBeginCheckout, trackCheckoutStep, trackSelectPaymentMethod } from '@utils/analytics';

// Styles
import styles from '@styles/module/CheckoutPage.module.css';

// ==========================================================================
// Helpers
// ==========================================================================
const getDeliveryDateRange = (minDays, maxDays) => {
  const today = new Date();
  const min = new Date(today);
  const max = new Date(today);
  min.setDate(today.getDate() + (minDays || 5));
  max.setDate(today.getDate() + (maxDays || 10));
  const fmt = { month: 'short', day: 'numeric' };
  return `${min.toLocaleDateString('en-US', fmt)} - ${max.toLocaleDateString('en-US', fmt)}`;
};

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
const validatePhone = (v) => (v || '').length >= 7;
const validateName = (v) => (v || '').length >= 2;
const validateRequired = (v) => (v || '').length > 0;

// ==========================================================================
// Default Form
// ==========================================================================
const DEFAULT_FORM = {
  email: '', phone: '', phoneCountry: 'NG',
  firstName: '', lastName: '',
  address: '', apartment: '', city: '', state: '', country: 'NG', postalCode: '',
  paymentMethod: 'bank_transfer',
  customerNotes: '', isGift: false, giftMessage: '',
};

const loadForm = () => {
  try {
    const s = localStorage.getItem('checkoutFormData');
    return s ? { ...DEFAULT_FORM, ...JSON.parse(s) } : DEFAULT_FORM;
  } catch { return DEFAULT_FORM; }
};

// ==========================================================================
// Component
// ==========================================================================
function CheckoutPage() {
  const navigate = useNavigate();
  
  // Stores
  const items = useCartStore(s => s.items);
  const appliedCoupon = useCartStore(s => s.appliedCoupon);
  const applyCouponFn = useCartStore(s => s.applyCoupon);
  const removeCouponFn = useCartStore(s => s.removeCoupon);
  const clearCart = useCartStore(s => s.clearCart);
  const formatPrice = useCurrencyStore(s => s.formatPrice);
  const currency = useCurrencyStore(s => s.currency);
  const getExchangeRate = useCurrencyStore(s => s.getExchangeRate);

  // State
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [form, setForm] = useState(loadForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [lookingUp, setLookingUp] = useState(false);
  const [returning, setReturning] = useState(null);
  
  const [couponInput, setCouponInput] = useState('');
  const [couponErr, setCouponErr] = useState('');
  const [validating, setValidating] = useState(false);
  
  const [shipping, setShipping] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [calcShipping, setCalcShipping] = useState(false);
  const [gambiaPickup, setGambiaPickup] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  // ==========================================================================
  // Computed Values
  // ==========================================================================
  const subtotal = useMemo(() => 
    items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  
  // Unique item count (for display: "4 items")
  const itemCount = useMemo(() => items.length, [items]);
  
  // Total quantity (for shipping calculation)
  const totalQuantity = useMemo(() => 
    items.reduce((s, i) => s + i.quantity, 0), [items]);
  
  const productSavings = useMemo(() => {
    return items.reduce((total, item) => {
      if (item.compareAtPrice && item.compareAtPrice > item.price) {
        return total + (item.compareAtPrice - item.price) * item.quantity;
      }
      return total;
    }, 0);
  }, [items]);
  
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * appliedCoupon.discountValue) / 100;
    }
    return Math.min(appliedCoupon.discountValue || 0, subtotal);
  }, [appliedCoupon, subtotal]);
  
  const total = useMemo(() => 
    Math.max(0, subtotal - couponDiscount + shippingCost), 
    [subtotal, couponDiscount, shippingCost]);

  const stateOptions = useMemo(() => getStatesForCountry(form.country), [form.country]);

  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Track checkout start (only once when page loads with items)
  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(items, subtotal);
    }
  }, []); // Empty deps - only run once on mount
  
  // Save form
  useEffect(() => {
    localStorage.setItem('checkoutFormData', JSON.stringify(form));
  }, [form]);

  // Customer lookup
  useEffect(() => {
    if (!form.email || !validateEmail(form.email)) {
      setReturning(null);
      return;
    }
    
    const t = setTimeout(async () => {
      setLookingUp(true);
      try {
        const res = await fetch(`/api/customers/lookup?email=${encodeURIComponent(form.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.first_name) {
            setReturning(data);
            
            // Fill all available customer data
            setForm(p => ({
              ...p,
              // Contact info
              firstName: data.first_name || p.firstName,
              lastName: data.last_name || p.lastName,
              phone: data.phone || p.phone,
              phoneCountry: data.phone_country || p.phoneCountry,
              // Address from last order (if API returns it)
              address: data.last_address?.address || p.address,
              apartment: data.last_address?.apartment || p.apartment,
              city: data.last_address?.city || p.city,
              state: data.last_address?.state || p.state,
              country: data.last_address?.country_code || p.country,
              postalCode: data.last_address?.postal_code || p.postalCode,
            }));
          } else {
            setReturning(null);
          }
        } else {
          setReturning(null);
        }
      } catch {
        setReturning(null);
      }
      setLookingUp(false);
    }, 800);
    
    return () => clearTimeout(t);
  }, [form.email]);

  // Shipping calculation
  useEffect(() => {
    if (!form.country) return;
    
    if (form.country === 'GM' && gambiaPickup) {
      setShipping({ zone: 'Store Pickup', minDays: 1, maxDays: 1 });
      setShippingCost(0);
      return;
    }
    
    let cancelled = false;
    setCalcShipping(true);
    
    const hasFreeShipping = appliedCoupon?.discountType === 'free_shipping';
    
    calculateShipping(form.country, subtotal, totalQuantity, hasFreeShipping)
      .then(result => {
        if (cancelled) return;
        if (result.error) {
          setShipping({ error: result.error });
          setShippingCost(0);
        } else {
          setShipping({
            zone: result.zone || 'Standard',
            minDays: parseInt(result.estimatedDays?.split('-')[0]) || 5,
            maxDays: parseInt(result.estimatedDays?.split('-')[1]) || 10,
            isFree: result.isFree,
          });
          setShippingCost(result.cost || 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShipping({ error: 'Unable to calculate' });
          setShippingCost(0);
        }
      })
      .finally(() => {
        if (!cancelled) setCalcShipping(false);
      });
    
    return () => { cancelled = true; };
  }, [form.country, gambiaPickup, subtotal, totalQuantity, appliedCoupon]);

  // ==========================================================================
  // Handlers
  // ==========================================================================
  const update = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => { const n = { ...p }; delete n[field]; return n; });
    
    // Track payment method selection
    if (field === 'paymentMethod') {
      trackSelectPaymentMethod(value);
    }
  }, []);

  const touch = useCallback((field) => {
    setTouched(p => ({ ...p, [field]: true }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    update(name, value);
  }, [update]);

  const handleInputBlur = useCallback((e) => {
    touch(e.target.name);
  }, [touch]);

  const validate1 = useCallback(() => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Invalid email';
    if (!validatePhone(form.phone)) e.phone = 'Phone is required';
    if (!validateName(form.firstName)) e.firstName = 'First name is required';
    if (!validateName(form.lastName)) e.lastName = 'Last name is required';
    return e;
  }, [form.email, form.phone, form.firstName, form.lastName]);

  const validate2 = useCallback(() => {
    if (form.country === 'GM' && gambiaPickup) return {};
    const e = {};
    if (!validateRequired(form.country)) e.country = 'Country is required';
    if (!validateRequired(form.state)) e.state = 'State is required';
    if (!validateRequired(form.address)) e.address = 'Address is required';
    if (!validateRequired(form.city)) e.city = 'City is required';
    return e;
  }, [form.country, form.state, form.address, form.city, gambiaPickup]);

  const goNext = useCallback(() => {
    const fields = step === 1 
      ? ['email', 'phone', 'firstName', 'lastName']
      : ['country', 'state', 'address', 'city'];
    fields.forEach(touch);
    
    const errs = step === 1 ? validate1() : validate2();
    setErrors(errs);
    
    if (!Object.keys(errs).length) {
      setCompletedSteps(p => p.includes(step) ? p : [...p, step]);
      const nextStep = Math.min(step + 1, 3);
      setStep(nextStep);
      
      // Track checkout step completion
      const stepNames = { 1: 'contact', 2: 'shipping', 3: 'payment' };
      trackCheckoutStep(stepNames[nextStep] || `step_${nextStep}`, nextStep);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, validate1, validate2, touch]);

  const goBack = useCallback(() => {
    setStep(p => Math.max(p - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToStep = useCallback((s) => {
    if (completedSteps.includes(s) || s <= step) setStep(s);
  }, [completedSteps, step]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setValidating(true);
    setCouponErr('');
    try {
      const r = await couponService.validate(couponInput, subtotal);
      if (r.valid) {
        applyCouponFn({
          code: couponInput,
          discountType: r.coupon.discount_type,
          discountValue: r.coupon.discount_value,
        }, r.discount);
        setCouponInput('');
      } else {
        setCouponErr(r.error || 'Invalid code');
      }
    } catch {
      setCouponErr('Validation failed');
    }
    setValidating(false);
  }, [couponInput, subtotal, applyCouponFn]);

  const handleRemoveCoupon = useCallback(() => {
    removeCouponFn();
    setCouponErr('');
  }, [removeCouponFn]);

  const handleCountryChange = useCallback((code) => {
    update('country', code);
    update('state', '');
    update('phoneCountry', code);
    setGambiaPickup(false);
  }, [update]);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    
    const allErrs = { ...validate1(), ...validate2() };
    setErrors(allErrs);
    
    if (Object.keys(allErrs).length) {
      setSubmitErr('Please fill all required fields');
      return;
    }
    
    if (shipping?.error) {
      setSubmitErr('Invalid shipping destination');
      return;
    }
    
    setProcessing(true);
    setSubmitErr('');
    
    try {
      const selectedCountry = getCountryByCode(form.phoneCountry) || COUNTRIES[0];
      const shippingCountry = getCountryByCode(form.country);
      
      // Build flat payload matching API expectations
      const orderPayload = {
        // Customer info
        email: form.email,
        phone: `${selectedCountry.dialCode}${form.phone}`,
        
        // Shipping address
        firstName: form.firstName,
        lastName: form.lastName,
        address: gambiaPickup ? 'Store Pickup' : form.address,
        apartment: form.apartment || null,
        city: gambiaPickup ? 'Bakau' : form.city,
        state: gambiaPickup ? null : form.state,
        postalCode: form.postalCode || null,
        country: shippingCountry?.name || form.country,
        countryCode: form.country,
        
        // Cart items
        items: items.map(i => ({
          id: i.id,
          variantId: i.variantId || null,
          name: i.name,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
          length: i.length,
          sku: i.sku || null,
        })),
        
        // Totals
        subtotal,
        discount: couponDiscount,
        couponCode: appliedCoupon?.code || null,
        couponId: appliedCoupon?.id || null,
        shipping: shippingCost,
        total,
        currency,
        
        // Payment
        paymentMethod: form.paymentMethod,
        
        // Optional
        isGift: form.isGift,
        giftMessage: form.isGift ? form.giftMessage : null,
        customerNotes: form.customerNotes || null,
      };
      
      // DEBUG: Log payload to see what's being sent
      console.log('📦 Order Payload:', JSON.stringify(orderPayload, null, 2));
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      
      // DEBUG: Log response status
      console.log('📬 Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      const { order: created, bankAccount } = await res.json();
      localStorage.removeItem('checkoutFormData');
      
      // Clear cart after successful order
      clearCart();
      
      // Navigate to payment page with order data
      navigate('/checkout/payment', {
        state: {
          order: {
            id: created.id,
            orderNumber: created.orderNumber,
            total: total,
            currency: currency,
            createdAt: created.createdAt,
          },
          bankAccount: bankAccount,
          customerEmail: form.email,
          exchangeRate: getExchangeRate(),
        }
      });
    } catch (err) {
      console.error('Order submission error:', err);
      setSubmitErr(err.message || 'Something went wrong. Please try again.');
    }
    setProcessing(false);
  }, [form, gambiaPickup, items, subtotal, couponDiscount, shippingCost, total, currency, appliedCoupon, shipping, validate1, validate2, navigate, clearCart, getExchangeRate]);

  // ==========================================================================
  // Empty Cart
  // ==========================================================================
  if (!items.length) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <div className={styles.emptyContent}>
            <Package size={48} strokeWidth={1} />
            <h2>Your cart is empty</h2>
            <p>Add some beautiful hair to get started</p>
            <Link to="/shop" className={styles.shopBtn}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className={styles.page}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <Link to="/cart" className={styles.backBtn}><ArrowLeft size={20} /></Link>
        <h1 className={styles.mobileTitle}>Checkout</h1>
        <div className={styles.headerSpacer} />
      </header>

      <div className={styles.container}>
        {/* Desktop Header */}
        <header className={styles.desktopHeader}>
          <Link to="/cart" className={styles.backLink}>
            <ArrowLeft size={16} /><span>Back to cart</span>
          </Link>
          <h1 className={styles.title}>Checkout</h1>
        </header>

        {/* Step Indicator */}
        <StepIndicator 
          currentStep={step} 
          onStepClick={goToStep} 
          completedSteps={completedSteps} 
        />

        {/* Main Layout */}
        <form onSubmit={submit} className={styles.layout}>
          {/* Form Column */}
          <div className={styles.formColumn}>
            
            {/* Savings Banner - INSIDE form column */}
            <SavingsBanner 
              savings={couponDiscount} 
              couponCode={appliedCoupon?.code} 
              formatPrice={formatPrice} 
            />

            {/* Welcome Back */}
            {returning && returning.first_name && step === 1 && (
              <WelcomeBackBanner customerName={returning.first_name} />
            )}

            {/* STEP 1: Contact Details */}
            {step === 1 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <User size={16} /><h2>Contact Details</h2>
                </div>
                <div className={styles.sectionBody}>
                  <InputField
                    icon={Mail}
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="your@email.com"
                    error={errors.email}
                    touched={touched.email}
                    required
                    autoComplete="email"
                    isValid={validateEmail(form.email) && touched.email}
                  />
                  
                  {lookingUp && (
                    <div className={styles.lookupIndicator}>
                      <Loader2 size={14} className={styles.spinner} />
                      <span>Finding your details...</span>
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Phone<span className={styles.required}>*</span>
                    </label>
                    <PhoneInput
                      value={form.phone}
                      onChange={(v) => update('phone', v)}
                      countryCode={form.phoneCountry}
                      onCountryChange={(c) => update('phoneCountry', c)}
                      error={errors.phone}
                      touched={touched.phone}
                      isValid={validatePhone(form.phone) && touched.phone}
                    />
                  </div>

                  <div className={styles.row}>
                    <InputField
                      icon={User}
                      label="First name"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      error={errors.firstName}
                      touched={touched.firstName}
                      required
                      autoComplete="given-name"
                      isValid={validateName(form.firstName) && touched.firstName}
                    />
                    <InputField
                      label="Last name"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      error={errors.lastName}
                      touched={touched.lastName}
                      required
                      autoComplete="family-name"
                      isValid={validateName(form.lastName) && touched.lastName}
                    />
                  </div>

                  <button type="button" className={styles.nextBtn} onClick={goNext}>
                    Continue to Shipping <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* STEP 2: Shipping */}
            {step === 2 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Truck size={16} /><h2>Shipping Address</h2>
                </div>
                <div className={styles.sectionBody}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Country<span className={styles.required}>*</span>
                    </label>
                    <Dropdown
                      value={form.country}
                      onChange={handleCountryChange}
                      options={COUNTRIES}
                      placeholder="Select country"
                      icon={Globe}
                      error={errors.country}
                      touched={touched.country}
                      isValid={!!form.country}
                    />
                  </div>

                  {form.country === 'GM' && (
                    <GambiaPickupOption 
                      selected={gambiaPickup} 
                      onSelect={setGambiaPickup} 
                    />
                  )}

                  {!(form.country === 'GM' && gambiaPickup) && (
                    <>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                          State / Region<span className={styles.required}>*</span>
                        </label>
                        <Dropdown
                          value={form.state}
                          onChange={(v) => update('state', v)}
                          options={stateOptions}
                          placeholder="Select state"
                          icon={MapPinned}
                          error={errors.state}
                          touched={touched.state}
                          disabled={!form.country}
                          isValid={!!form.state}
                        />
                      </div>

                      <InputField
                        icon={Home}
                        label="Address"
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder="Street address"
                        error={errors.address}
                        touched={touched.address}
                        required
                        autoComplete="street-address"
                        isValid={validateRequired(form.address) && touched.address}
                      />

                      <InputField
                        label="Apartment, suite (optional)"
                        name="apartment"
                        value={form.apartment}
                        onChange={handleInputChange}
                        placeholder="Apt, suite, floor"
                        autoComplete="address-line2"
                      />

                      <div className={styles.row}>
                        <InputField
                          icon={MapPin}
                          label="City"
                          name="city"
                          value={form.city}
                          onChange={handleInputChange}
                          onBlur={handleInputBlur}
                          error={errors.city}
                          touched={touched.city}
                          required
                          autoComplete="address-level2"
                          isValid={validateRequired(form.city) && touched.city}
                        />
                        <InputField
                          label="Postal code"
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleInputChange}
                          placeholder="Postal / ZIP"
                          autoComplete="postal-code"
                        />
                      </div>
                    </>
                  )}

                  {/* Shipping Estimate */}
                  {shipping && !shipping.error && (
                    <div className={styles.shippingEstimate}>
                      <div className={styles.shippingIcon}>
                        {gambiaPickup ? <Store size={16} /> : <Truck size={16} />}
                      </div>
                      <div className={styles.shippingDetails}>
                        <span className={styles.shippingZone}>{shipping.zone}</span>
                        <span className={styles.deliveryDate}>
                          <Calendar size={12} />
                          {gambiaPickup 
                            ? 'Ready in 24 hours' 
                            : `Est. ${getDeliveryDateRange(shipping.minDays, shipping.maxDays)}`}
                        </span>
                      </div>
                      {(shipping.isFree || shippingCost === 0) && (
                        <span className={styles.freeShippingBadge}>FREE</span>
                      )}
                    </div>
                  )}

                  {shipping?.error && (
                    <div className={styles.shippingError}>
                      <AlertCircle size={14} /> {shipping.error}
                    </div>
                  )}

                  {/* Gift Option */}
                  <div className={styles.giftSection}>
                    <label className={styles.giftCheckbox}>
                      <input 
                        type="checkbox" 
                        checked={form.isGift} 
                        onChange={(e) => update('isGift', e.target.checked)} 
                      />
                      <div className={styles.checkbox}>
                        {form.isGift && <Check size={10} />}
                      </div>
                      <Gift size={14} />
                      <span>This is a gift</span>
                    </label>
                    {form.isGift && (
                      <textarea
                        value={form.giftMessage}
                        onChange={(e) => update('giftMessage', e.target.value)}
                        placeholder="Gift message (optional)"
                        maxLength={200}
                        className={styles.giftMessage}
                      />
                    )}
                  </div>

                  {/* Order Notes */}
                  <div className={styles.orderNotesSection}>
                    <label className={styles.inputLabel}>Order notes (optional)</label>
                    <textarea
                      value={form.customerNotes}
                      onChange={(e) => update('customerNotes', e.target.value)}
                      placeholder="Special instructions..."
                      maxLength={500}
                      className={styles.orderNotesInput}
                    />
                  </div>

                  <div className={styles.stepButtons}>
                    <button type="button" className={styles.backStepBtn} onClick={goBack}>
                      <ArrowLeft size={20} strokeWidth={2.5} /> Back
                    </button>
                    <button type="button" className={styles.nextBtn} onClick={goNext}>
                      Continue to Payment <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3: Payment */}
            {step === 3 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <CreditCard size={16} /><h2>Payment Method</h2>
                </div>
                <div className={styles.sectionBody}>
                  <div className={styles.paymentOptions}>
                    <label className={`${styles.paymentOption} ${form.paymentMethod === 'bank_transfer' ? styles.selected : ''}`}>
                      <input 
                        type="radio" 
                        value="bank_transfer" 
                        checked={form.paymentMethod === 'bank_transfer'} 
                        onChange={(e) => update('paymentMethod', e.target.value)} 
                      />
                      <div className={styles.paymentRadio}><div className={styles.radioDot} /></div>
                      <Building2 size={18} />
                      <div className={styles.paymentText}>
                        <span className={styles.paymentName}>Bank Transfer</span>
                        <span className={styles.paymentDesc}>Pay directly to our bank</span>
                      </div>
                    </label>
                    <label className={`${styles.paymentOption} ${styles.disabled}`}>
                      <input type="radio" disabled />
                      <div className={styles.paymentRadio}><div className={styles.radioDot} /></div>
                      <CreditCard size={18} />
                      <div className={styles.paymentText}>
                        <span className={styles.paymentName}>Klarna</span>
                        <span className={styles.paymentDesc}>Coming soon</span>
                      </div>
                    </label>
                  </div>

                  {/* Order Review */}
                  <div className={styles.orderReview}>
                    <h3>Order Review</h3>
                    <div className={styles.reviewRow}>
                      <span>Name</span>
                      <span>{form.firstName} {form.lastName}</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span>Email</span>
                      <span>{form.email}</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span>Phone</span>
                      <span>{getCountryByCode(form.phoneCountry)?.dialCode || ''} {form.phone}</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span>Ship to</span>
                      <span>
                        {gambiaPickup 
                          ? 'Store Pickup — Bakau, The Gambia' 
                          : `${form.address}${form.apartment ? `, ${form.apartment}` : ''}, ${form.city}, ${form.state}, ${getCountryByCode(form.country)?.name || form.country}`
                        }
                      </span>
                    </div>
                  </div>

                  {submitErr && (
                    <div className={styles.submitError}>
                      <AlertCircle size={14} /> {submitErr}
                    </div>
                  )}

                  <div className={styles.stepButtons}>
                    <button type="button" className={styles.backStepBtn} onClick={goBack}>
                      <ArrowLeft size={20} strokeWidth={2.5} /> Back
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={processing || calcShipping}>
                      {processing 
                        ? <><Loader2 size={16} className={styles.spinner} /> Processing...</>
                        : <><Lock size={14} /> Pay {formatPrice(total)}</>
                      }
                    </button>
                  </div>

                  <div className={styles.trustBadges}>
                    <span><Shield size={12} /> Secure</span>
                    <span><RotateCcw size={12} /> 14-day returns</span>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Summary Column */}
          <div className={styles.summaryColumn}>
            <div className={styles.summary}>
              <div className={styles.summaryHeader}>
                <h3><Package size={16} /> Order Summary</h3>
                <span className={styles.itemCount}>{itemCount}</span>
              </div>

              <div className={styles.summaryItems}>
                {items.map(item => (
                  <OrderItem 
                    key={`${item.id}-${item.length}`} 
                    item={item} 
                    formatPrice={formatPrice} 
                  />
                ))}
              </div>

              {/* Coupon */}
              <div className={styles.couponSection}>
                {!appliedCoupon ? (
                  <div className={styles.couponInput}>
                    <Tag size={14} />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                    />
                    <button type="button" onClick={handleApplyCoupon} disabled={validating}>
                      {validating ? <Loader2 size={12} className={styles.spinner} /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className={styles.appliedCoupon}>
                    <Sparkles size={12} />
                    <span>{appliedCoupon.code}</span>
                    <button type="button" onClick={handleRemoveCoupon}><X size={12} /></button>
                  </div>
                )}
                {couponErr && <span className={styles.couponError}>{couponErr}</span>}
              </div>

              {/* Totals */}
              <div className={styles.summaryTotals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {productSavings > 0 && (
                  <div className={`${styles.totalRow} ${styles.savings}`}>
                    <span>Product Savings</span>
                    <span>-{formatPrice(productSavings)}</span>
                  </div>
                )}
                
                {couponDiscount > 0 && (
                  <div className={`${styles.totalRow} ${styles.discount}`}>
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                
                <div className={styles.totalRow}>
                  <span>Shipping</span>
                  <span>
                    {calcShipping 
                      ? <Loader2 size={12} className={styles.spinner} />
                      : shipping?.error 
                        ? '—' 
                        : shippingCost === 0 
                          ? <span className={styles.free}>Free</span>
                          : formatPrice(shippingCost)
                    }
                  </span>
                </div>

                <div className={styles.grandTotal}>
                  <span>TOTAL</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className={styles.secureBadge}>
                <Shield size={14} /> 256-bit SSL Encrypted
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className={styles.mobileFooter}>
            <div className={styles.mobileTotal}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            {step < 3 ? (
              <button type="button" className={styles.mobileSubmitBtn} onClick={goNext}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className={styles.mobileSubmitBtn} disabled={processing}>
                {processing 
                  ? <Loader2 size={16} className={styles.spinner} />
                  : <><Lock size={14} /> Pay {formatPrice(total)}</>
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;