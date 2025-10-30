import React, { useState, useEffect } from 'react';
import type { MousePosition } from './types';
import ThreeCanvas from './components/ThreeCanvas';
import LandingPageContent from './components/NexusCommandCenter';
import AIOracle from './components/AIOracle';
import ComingSoonLanding from './components/ComingSoonLanding';

const App: React.FC = () => {
    const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(true); // Set to true to show landing page by default

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition({
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Toggle between coming soon and full experience
    if (showComingSoon) {
        return (
            <>
                <ComingSoonLanding />
                <button 
                    onClick={() => setShowComingSoon(false)}
                    className="fixed top-4 right-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
                >
                    View Full Experience
                </button>
            </>
        );
    }

    return (
        <main className="w-screen h-screen overflow-hidden bg-[#0c001f]">
            {/* Toggle button for coming soon page */}
            <button 
                onClick={() => setShowComingSoon(true)}
                className="fixed top-4 left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
            >
                Coming Soon View
            </button>

            {/* The 3D canvas is fixed in the background */}
            <ThreeCanvas mousePosition={mousePosition} />

            {/* Background video element as requested */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-20"
                src="https://v1.pinimg.com/videos/mc/720p/63/d5/39/63d5390441a7772fc63aa40b4cc06295.mp4"
            >
                {/* Fallback for browsers that don't support the video tag */}
                Your browser does not support the video tag.
            </video>
            
            {/* Semi-transparent purple veil over the video with new animation class */}
            <div className="animated-veil absolute top-0 left-0 w-full h-full z-10"></div>
            
            {/* Scrollable content container */}
            <div className="scroll-container absolute top-0 left-0 w-full h-full overflow-y-auto z-20">
                <LandingPageContent onAskAI={() => setIsOracleOpen(true)} />
            </div>

            {isOracleOpen && <AIOracle onClose={() => setIsOracleOpen(false)} />}
        </main>
    );
};

export default App;