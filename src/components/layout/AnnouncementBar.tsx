'use client';

/* ============================================
   EIFA COUTURE — Announcement Bar
   Thin elegant bar with promotional message
   ============================================ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-maroon text-white overflow-hidden relative z-50"
        >
          <div className="luxury-container flex items-center justify-center py-2.5 relative">
            <p className="font-subheading text-[13px] sm:text-sm tracking-wide text-center text-white/90">
              <span className="hidden sm:inline">
                Complimentary Shipping on Orders Above ₹2,999
              </span>
              <span className="hidden sm:inline mx-3 text-gold/60">|</span>
              <span className="hidden sm:inline">
                Handcrafted with Love in Lucknow
              </span>
              {/* Mobile - shorter text */}
              <span className="sm:hidden">
                Free Shipping Above ₹2,999 · Handcrafted in Lucknow
              </span>
            </p>

            {/* Close button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white transition-colors duration-300"
              aria-label="Close announcement"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
