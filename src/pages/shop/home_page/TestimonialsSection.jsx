import { Star, BadgeCheck, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';
import testimonialData from '@/data/testimonials.json';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const TestimonialsSection = ({ styles }) => {
  const { testimonials, stats } = testimonialData;

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.5,
        delay: 0.2,
      },
    },
  };

  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <motion.div 
          className={styles.sectionHeader}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <h2 className={styles.sectionTitle}>What Our Queens Say</h2>
          <p className={styles.sectionSubtitle}>Real reviews from real customers</p>
        </motion.div>

        <motion.div 
          className={styles.testimonialStats}
          variants={statsVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <div className={styles.testimonialStat}>
            <motion.span 
              className={styles.testimonialStatValue}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {stats.averageRating}
            </motion.span>
            <div className={styles.testimonialStatStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <Star size={12} fill="#D4AF37" color="#D4AF37" />
                </motion.div>
              ))}
            </div>
            <span className={styles.testimonialStatLabel}>Average Rating</span>
          </div>
          <div className={styles.testimonialStatDivider} />
          <div className={styles.testimonialStat}>
            <motion.span 
              className={styles.testimonialStatValue}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {stats.fiveStarPercentage}%
            </motion.span>
            <div className={styles.testimonialStatStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <Star size={12} fill="#D4AF37" color="#D4AF37" />
                </motion.div>
              ))}
            </div>
            <span className={styles.testimonialStatLabel}>5-Star Reviews</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className={styles.testimonialSlider}
        >
          <Swiper
            modules={[Autoplay, Pagination, EffectCoverflow]}
            spaceBetween={24}
            slidesPerView={1}
            centeredSlides={true}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              bulletClass: styles.testimonialDot,
              bulletActiveClass: styles.testimonialDotActive,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                centeredSlides: false,
              },
              1024: {
                slidesPerView: 3,
                centeredSlides: false,
              },
            }}
            className={styles.testimonialSwiper}
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={testimonial.id}>
                <motion.div 
                  className={styles.testimonialCard}
                  whileHover={{ 
                    y: -5,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Quote size={24} className={styles.testimonialQuote} strokeWidth={1} />
                  
                  <div className={styles.testimonialStars}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="#D4AF37" color="#D4AF37" />
                    ))}
                  </div>
                  
                  <p className={styles.testimonialText}>{testimonial.text}</p>
                  
                  <div className={styles.testimonialAuthor}>
                    <div className={styles.testimonialAuthorInfo}>
                      <span className={styles.testimonialName}>{testimonial.name}</span>
                      <span className={styles.testimonialLocation}>{testimonial.location}</span>
                    </div>
                    {testimonial.verified && (
                      <motion.div 
                        className={styles.testimonialVerified}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, type: 'spring' }}
                      >
                        <BadgeCheck size={14} strokeWidth={1.5} />
                        <span>Verified</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;