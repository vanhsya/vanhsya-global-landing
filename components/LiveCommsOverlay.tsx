import React, { useEffect, useRef } from 'react';
import type { LiveCommsOverlayProps } from '../types';

const LiveCommsOverlay: React.FC<LiveCommsOverlayProps> = ({ onClose, transcription, isConnecting }) => {
    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [transcription.history, transcription.model, transcription.user]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4 md:p-10 font-mono">
            <div className="w-full max-w-4xl h-full flex flex-col border-2 border-pink-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,20,147,0.5)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-pink-400">Live Communication Channel</h2>
                    {isConnecting ? (
                         <div className="flex items-center gap-2 text-yellow-300">
                            <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
                            <span>Connecting...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-400">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Link Established</span>
                        </div>
                    )}
                </div>

                <div ref={historyRef} className="flex-grow bg-black/30 rounded-lg p-4 overflow-y-auto space-y-4 mb-4">
                    {transcription.history.map((line, index) => {
                        const isUser = line.startsWith("You:");
                        return (
                            <p key={index} className={isUser ? "text-yellow-300" : "text-cyan-300"}>
                                {line}
                            </p>
                        );
                    })}
                    {transcription.user && <p className="text-yellow-300/70">You: {transcription.user}...</p>}
                    {transcription.model && <p className="text-cyan-300/70">AI: {transcription.model}...</p>}
                </div>
                
                <div className="text-center">
                    <button 
                        onClick={onClose} 
                        className="py-3 px-8 rounded-full font-bold uppercase bg-gradient-to-r from-pink-600 to-purple-600 text-white transition-transform duration-300 hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,20,147,0.5)]"
                    >
                        End Comms
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveCommsOverlay;
