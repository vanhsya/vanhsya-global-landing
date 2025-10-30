import React, { useRef, useEffect, useState } from 'react';

// Reusable hook to animate elements when they scroll into view
const useScrollAnimate = (ref: React.RefObject<HTMLElement>) => {
    useEffect(() => {
        const targetElement = ref.current;
        if (!targetElement) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    targetElement.classList.add('is-visible');
                    observer.unobserve(targetElement); // Animate only once
                }
            },
            {
                root: document.querySelector('.scroll-container'),
                threshold: 0.1, // Trigger when 10% of the element is visible
            }
        );

        observer.observe(targetElement);

        return () => {
            if (targetElement) {
                observer.unobserve(targetElement);
            }
        };
    }, [ref]);
};


const CountdownTimer = () => {
    const calculateTimeLeft = () => {
        // Set a fixed future date for the launch
        const difference = +new Date("2024-10-01T00:00:00") - +new Date();
        let timeLeft: { [key: string]: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = Object.keys(timeLeft).map((interval) => {
        const value = timeLeft[interval];
        return (
            <div key={interval} className="countdown-box">
                <span className="countdown-number">{String(value).padStart(2, '0')}</span>
                <span className="countdown-label">{interval}</span>
            </div>
        );
    });

    return (
        <div className="countdown-container">
            {timerComponents.length ? timerComponents : <span className="text-2xl font-cinzel">The Universe Has Arrived!</span>}
        </div>
    );
};


const LandingPageContent: React.FC<{ onAskAI: () => void; }> = ({ onAskAI }) => {
    // State for the new modal
    const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
    
    // Refs for scroll-triggered animations
    const heroTitleRef = useRef<HTMLHeadingElement>(null);
    const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
    const countdownTitleRef = useRef<HTMLHeadingElement>(null);
    const countdownSubtitleRef = useRef<HTMLParagraphElement>(null);
    const countdownTimerRef = useRef<HTMLDivElement>(null);
    const migrationTitleRef = useRef<HTMLHeadingElement>(null);
    const migrationContentRef = useRef<HTMLDivElement>(null);
    const migrationTextRef = useRef<HTMLParagraphElement>(null);
    const phoenixTitleRef = useRef<HTMLHeadingElement>(null);
    const phoenixContainerRef = useRef<HTMLDivElement>(null);
    const phoenixTextRef = useRef<HTMLParagraphElement>(null);
    const oraclePulsingIconRef = useRef<HTMLDivElement>(null);
    const oracleTitleRef = useRef<HTMLHeadingElement>(null);
    const oracleTextRef = useRef<HTMLParagraphElement>(null);
    const oracleButtonRef = useRef<HTMLButtonElement>(null);

    // Apply animation hooks to elements
    useScrollAnimate(heroTitleRef);
    useScrollAnimate(heroSubtitleRef);
    useScrollAnimate(countdownTitleRef);
    useScrollAnimate(countdownSubtitleRef);
    useScrollAnimate(countdownTimerRef);
    useScrollAnimate(migrationTitleRef);
    useScrollAnimate(migrationContentRef);
    useScrollAnimate(migrationTextRef);
    useScrollAnimate(phoenixTitleRef);
    useScrollAnimate(phoenixContainerRef);
    useScrollAnimate(phoenixTextRef);
    useScrollAnimate(oraclePulsingIconRef);
    useScrollAnimate(oracleTitleRef);
    useScrollAnimate(oracleTextRef);
    useScrollAnimate(oracleButtonRef);

    return (
        <div className="relative text-white">
            <section className="h-screen flex flex-col items-center justify-end pb-24 text-center">
                <h1 ref={heroTitleRef} className="font-cinzel text-lg tracking-widest text-purple-200 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>COSMIC ELEGANCE, REDEFINED</h1>
                <p ref={heroSubtitleRef} className="mt-4 text-purple-300/70 reveal-on-scroll" style={{ transitionDelay: '300ms' }}>Scroll to discover the universe within.</p>
            </section>
            
            <section className="py-32 flex flex-col items-center space-y-12 text-center">
                <h2 ref={countdownTitleRef} className="section-title font-cinzel text-4xl mb-4 text-center reveal-on-scroll">A New Universe Awaits</h2>
                <p ref={countdownSubtitleRef} className="max-w-2xl mx-auto text-purple-200/80 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                    The official launch of Vanhsya Global is on the horizon. Prepare for an experience that transcends beauty.
                </p>
                <div ref={countdownTimerRef} className="reveal-on-scroll" style={{ transitionDelay: '400ms' }}>
                    <CountdownTimer />
                </div>
            </section>

            <section className="py-32 flex flex-col items-center justify-center text-center">
                <h2 ref={migrationTitleRef} className="section-title font-cinzel text-4xl mb-16 text-center reveal-on-scroll">A Global Migration of Beauty</h2>
                <div ref={migrationContentRef} className="relative w-[500px] h-[500px] flex items-center justify-center reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                    <svg width="500" height="500" viewBox="0 0 200 200" className="opacity-50 animate-spin-slow">
                        <defs>
                            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                <stop offset="0%" style={{stopColor: 'rgba(219, 39, 119, 0.4)'}} />
                                <stop offset="100%" style={{stopColor: 'rgba(138, 43, 226, 0)'}} />
                            </radialGradient>
                        </defs>
                        <circle cx="100" cy="100" r="98" fill="url(#grad1)" stroke="#8a2be2" strokeWidth="0.5"/>
                        <ellipse className="globe-line" cx="100" cy="100" rx="98" ry="40" stroke="#db2777" strokeWidth="0.25" fill="none" />
                        <ellipse className="globe-line globe-line-2" cx="100" cy="100" rx="98" ry="70" stroke="#db2777" strokeWidth="0.25" fill="none" />
                        <ellipse className="globe-line globe-line-3" cx="100" cy="100" rx="40" ry="98" stroke="#db2777" strokeWidth="0.25" fill="none" transform="rotate(90 100 100)" />
                        <ellipse className="globe-line globe-line-4" cx="100" cy="100" rx="70" ry="98" stroke="#db2777" strokeWidth="0.25" fill="none" transform="rotate(90 100 100)" />
                    </svg>

                    {/* Hotspot 1: South America */}
                    <div className="absolute" style={{ top: '65%', left: '30%' }}>
                        <div className="w-4 h-4 bg-pink-400 rounded-full animate-pulse group cursor-pointer">
                            <div className="absolute bottom-full mb-2 w-48 p-3 bg-purple-900/70 backdrop-blur-md rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <h4 className="font-bold text-pink-300">Andean Rosehip</h4>
                                <p className="text-xs text-purple-200/80">From Chilean peaks, a seed oil rich in regenerative properties.</p>
                            </div>
                        </div>
                    </div>

                    {/* Hotspot 2: Asia */}
                    <div className="absolute" style={{ top: '35%', left: '75%' }}>
                        <div className="w-4 h-4 bg-pink-400 rounded-full animate-pulse group cursor-pointer">
                            <div className="absolute bottom-full mb-2 w-48 p-3 bg-purple-900/70 backdrop-blur-md rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <h4 className="font-bold text-pink-300">Japanese Sakura</h4>
                                <p className="text-xs text-purple-200/80">Cherry blossom extracts that soothe and brighten for a flawless complexion.</p>
                            </div>
                        </div>
                    </div>

                    {/* Hotspot 3: Africa */}
                     <div className="absolute" style={{ top: '45%', left: '48%' }}>
                        <div className="w-4 h-4 bg-pink-400 rounded-full animate-pulse group cursor-pointer">
                            <div className="absolute bottom-full mb-2 w-48 p-3 bg-purple-900/70 backdrop-blur-md rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <h4 className="font-bold text-pink-300">Moroccan Argan</h4>
                                <p className="text-xs text-purple-200/80">Liquid gold from North Africa, providing intense hydration and nourishment.</p>
                            </div>
                        </div>
                    </div>

                    {/* Hotspot 4: Europe */}
                    <div className="absolute" style={{ top: '30%', left: '55%' }}>
                        <div className="w-4 h-4 bg-pink-400 rounded-full animate-pulse group cursor-pointer">
                            <div className="absolute bottom-full mb-2 w-48 p-3 bg-purple-900/70 backdrop-blur-md rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <h4 className="font-bold text-pink-300">French Lavender</h4>
                                <p className="text-xs text-purple-200/80">Sourced from Provence, its essential oil calms the skin and spirit.</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <p ref={migrationTextRef} className="max-w-2xl mx-auto text-center mt-12 text-purple-200/80 reveal-on-scroll" style={{ transitionDelay: '400ms' }}>
                    We journey across continents and cultures, sourcing the most potent and cherished natural ingredients. Vanhsya is a convergence of ancient wisdom and cosmic innovation, bringing the world's beauty secrets to you.
                </p>
            </section>

            <section className="py-32 flex flex-col items-center justify-center text-center overflow-hidden">
                <h2 ref={phoenixTitleRef} className="section-title font-cinzel text-4xl mb-12 text-center reveal-on-scroll">The Phoenix Within</h2>
                <div ref={phoenixContainerRef} className="relative w-[500px] h-[500px] flex items-center justify-center reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                    <img src="https://i.pinimg.com/originals/e8/56/6b/e8566bdf531156e273a58a748981c004.jpg" alt="Phoenix" className="phoenix-image w-full h-full object-contain"/>
                    {/* Ember Particles */}
                    <div className="ember" style={{ top: '80%', left: '50%', animationDelay: '0s', '--tx': '-40px', '--ty': '-200px' } as React.CSSProperties}></div>
                    <div className="ember" style={{ top: '70%', left: '30%', animationDelay: '1s', '--tx': '30px', '--ty': '-180px' } as React.CSSProperties}></div>
                    <div className="ember" style={{ top: '75%', left: '70%', animationDelay: '2s', '--tx': '-50px', '--ty': '-220px' } as React.CSSProperties}></div>
                    <div className="ember" style={{ top: '85%', left: '40%', animationDelay: '3s', '--tx': '60px', '--ty': '-160px' } as React.CSSProperties}></div>
                    <div className="ember" style={{ top: '65%', left: '60%', animationDelay: '4s', '--tx': '20px', '--ty': '-250px' } as React.CSSProperties}></div>
                </div>
                <p ref={phoenixTextRef} className="max-w-2xl mx-auto text-center mt-12 text-purple-200/80 reveal-on-scroll" style={{ transitionDelay: '400ms' }}>
                    Like the mythical phoenix, our formulas are born of fire and light, designed to renew, restore, and unveil the radiant being within. Embrace the cycle of rebirth and let your true beauty emerge from the ashes of the everyday.
                </p>
            </section>

            <section className="py-32 flex flex-col items-center justify-center text-center">
                <div ref={oraclePulsingIconRef} className="relative flex items-center justify-center w-48 h-48 mb-6 reveal-on-scroll">
                    <div className="absolute w-full h-full bg-pink-500 rounded-full opacity-30 animate-ping"></div>
                    <div className="absolute w-3/4 h-3/4 bg-purple-500 rounded-full opacity-50 animate-pulse"></div>
                    <div className="absolute w-1/2 h-1/2 bg-white rounded-full"></div>
                </div>
                <h2 ref={oracleTitleRef} className="font-cinzel text-3xl mb-4 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>Consult the Oracle</h2>
                <p ref={oracleTextRef} className="max-w-md mx-auto text-purple-200/80 mb-8 reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
                    Our AI-powered cosmetic guide, Vanhsya AI, is here to help you navigate your cosmic beauty journey and find the perfect alignment for your skin.
                </p>
                <button 
                    ref={oracleButtonRef}
                    onClick={onAskAI}
                    className="font-cinzel bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 px-8 rounded-full text-lg tracking-wider transform hover:scale-105 transition-transform duration-300 reveal-on-scroll"
                    style={{ transitionDelay: '300ms' }}
                >
                    Ask Vanhsya AI
                </button>
            </section>
            
            <footer className="text-center py-12 text-sm text-purple-300/50">
                <p>&copy; 2024 Vanhsya Beauty. All rights reserved.</p>
                <button 
                    onClick={() => setIsComingSoonModalOpen(true)}
                    className="footer-button"
                >
                    COMING SOON
                </button>
            </footer>

            {isComingSoonModalOpen && (
                <div className="coming-soon-modal-overlay">
                    <div className="coming-soon-modal-content">
                        <button onClick={() => setIsComingSoonModalOpen(false)} className="modal-close-button" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <h2 className="font-cinzel text-4xl text-center text-pink-300 mb-8 section-title">Vanhsya Global</h2>
                        
                        <div className="mb-8">
                            <h3 className="modal-title">
                                <svg className="modal-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5a4.5 4.5 0 11-4.5 4.5A4.5 4.5 0 0112 7.5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75a8.25 8.25 0 1114.335-5.335" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25a8.25 8.25 0 11-14.335 5.335" />
                                </svg>
                                <span>Our Cosmic Vision</span>
                            </h3>
                            <p className="modal-text mb-4">
                                Vanhsya was born from a singular vision: to blend the timeless wisdom of nature with the boundless possibilities of the cosmos. We believe beauty is not merely skin deep; it is a radiant energy that emanates from within, a personal universe waiting to be discovered.
                            </p>
                            <p className="modal-text">
                                Our journey has taken us to every corner of the globe, from the serene lavender fields of Provence to the mystical sakura groves of Japan. We meticulously source the world's most potent ingredients, each chosen for its unique ability to renew, restore, and reveal your innate elegance.
                            </p>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-purple-400/20 text-center">
                            <p className="text-sm text-purple-300/80">
                                For inquiries, contact: <a href="mailto:contact@vanhsya.global" className="font-semibold text-pink-300 hover:underline">contact@vanhsya.global</a>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default LandingPageContent;