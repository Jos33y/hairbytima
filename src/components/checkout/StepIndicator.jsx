// ==========================================================================
// StepIndicator - Checkout Progress Steps with Counter
// ==========================================================================

import { motion } from 'framer-motion';
import { Check, User, Truck, CreditCard } from 'lucide-react';
import styles from '@styles/module/CheckoutPage.module.css';

const steps = [
  { id: 1, label: 'Details', icon: User },
  { id: 2, label: 'Shipping', icon: Truck },
  { id: 3, label: 'Payment', icon: CreditCard },
];

export const StepIndicator = ({ currentStep, onStepClick, completedSteps = [] }) => {
  return (
    <div className={styles.stepIndicatorWrapper}>
      {/* Step Counter */}
      <p className={styles.stepCounter}>Step {currentStep} of 3</p>
      
      {/* Step Icons */}
      <div className={styles.stepIndicator}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id) || currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const canClick = isCompleted || step.id <= currentStep;
          
          return (
            <div key={step.id} className={styles.stepWrapper}>
              <button
                type="button"
                className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                onClick={() => canClick && onStepClick(step.id)}
                disabled={!canClick}
              >
                <motion.div 
                  className={styles.stepIcon}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                </motion.div>
                <span className={styles.stepLabel}>{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`${styles.stepLine} ${isCompleted ? styles.completed : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

