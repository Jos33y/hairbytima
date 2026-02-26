import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Play, Pause, Package } from 'lucide-react';
import storeInfo from '@/data/storeInfo.json';
import styles from '@/styles/module/home/StoreLocation.module.css';

const STORE_VIDEO_URL = 'https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/videos/store/shop-video-gmb.mp4';

const StoreLocationSection = () => {
  const { mainStore, comingSoon } = storeInfo;
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className={styles.storeLocation}>
      <div className={styles.container}>
        <div className={styles.storeLocationWrapper}>
          <div className={styles.storeLocationMedia}>
            <div className={styles.storeLocationVideo}>
              <video 
                ref={videoRef}
                src={STORE_VIDEO_URL}
                className={styles.storeLocationVideoPlayer}
                loop
                muted
                playsInline
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <button 
                className={styles.storeLocationPlayBtn}
                onClick={toggleVideo}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
              </button>
            </div>
          </div>

          <div className={styles.storeLocationContent}>
            <span className={styles.storeLocationLabel}>Visit Us</span>
            <h2 className={styles.sectionTitle}>Our Store in {mainStore.address.country}</h2>
            
            <div className={styles.storeLocationDetails}>
              <div className={styles.storeLocationDetail}>
                <MapPin size={18} strokeWidth={1.5} />
                <div>
                  <span className={styles.storeLocationDetailLabel}>Address</span>
                  <span className={styles.storeLocationDetailValue}>
                    {mainStore.address.full}
                  </span>
                </div>
              </div>
              
              <div className={styles.storeLocationDetail}>
                <Clock size={18} strokeWidth={1.5} />
                <div>
                  <span className={styles.storeLocationDetailLabel}>Hours</span>
                  <span className={styles.storeLocationDetailValue}>
                    Mon-Fri: {mainStore.hours.weekdays}
                  </span>
                  <span className={styles.storeLocationDetailValue}>
                    Sat: {mainStore.hours.saturday}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.storeLocationPickup}>
              <div className={styles.storeLocationPickupHeader}>
                <Package size={16} strokeWidth={1.5} />
                <h4 className={styles.storeLocationPickupTitle}>
                  Local Pickup Available
                </h4>
              </div>
              <p className={styles.storeLocationPickupText}>
                Live in The Gambia? Order online and pick up at our store. Save on shipping costs!
              </p>
            </div>

            <Link to="/about" className={styles.storeLocationLink}>
              Learn More About Us
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>

            {comingSoon.length > 0 && (
              <div className={styles.storeLocationComingSoon}>
                <span>Coming soon to </span>
                {comingSoon.map((location, index) => (
                  <span key={index} className={styles.storeLocationComingSoonCity}>
                    {location.city}, {location.country}
                    {index < comingSoon.length - 1 && ' • '}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreLocationSection;