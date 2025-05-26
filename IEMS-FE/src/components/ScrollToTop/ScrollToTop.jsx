import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({
    showButton = false,
    autoScroll = true,
    threshold = 300,
    behavior = 'smooth'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const { pathname } = useLocation();

    // Auto scroll to top on route change
    useEffect(() => {
        if (autoScroll) {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: behavior
            });
        }
    }, [pathname, autoScroll, behavior]);

    // Show/hide scroll to top button based on scroll position
    useEffect(() => {
        if (!showButton) return;

        const toggleVisibility = () => {
            if (window.pageYOffset > threshold) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [showButton, threshold]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: behavior
        });
    };

    // If showButton is false, this component just handles auto-scroll
    if (!showButton) {
        return null;
    }

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
                    aria-label="Scroll to top"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                    </svg>
                </button>
            )}
        </>
    );
};

export default ScrollToTop; 