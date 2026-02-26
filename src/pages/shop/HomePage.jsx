import { LazyMotion, domAnimation } from 'framer-motion';
import {
  HeroSection,
  TrustBar,
  CategoriesSection,
  BestsellersSection,
  HairCareSection,
  TestimonialsSection,
  StoreLocationSection,
  InstagramSection,
  NewsletterSection,
  CTASection,
  HelpSection,
} from './home_page';
import styles from '@/styles/module/HomePage.module.css';

const HomePage = () => {
  return (
    <LazyMotion features={domAnimation}>
      <div className={styles.page}>
        <HeroSection styles={styles} />
        <TrustBar styles={styles} />
        <CategoriesSection styles={styles} />
        <BestsellersSection styles={styles} />
        <HairCareSection styles={styles} />
        <TestimonialsSection styles={styles} />
        <StoreLocationSection />
        <HelpSection />
        <InstagramSection styles={styles} />
        <NewsletterSection styles={styles} />
        <CTASection styles={styles} />
      </div>
    </LazyMotion>
  );
};

export default HomePage;