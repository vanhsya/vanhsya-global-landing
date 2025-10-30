import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Removed `LiveSession` from import as it is not an exported member of '@google/genai'.
import { GoogleGenAI, Modality, Type, Chat, GenerateContentResponse, Blob as GenAIBlob } from "@google/genai";
import type { AIOracleProps, TranscriptionState } from '../types';
import { fileToBase64, encode, decode, decodeAudioData } from '../utils/media';
import LiveCommsOverlay from './LiveCommsOverlay';

// FIX: Defined a minimal LiveSession interface as it's not exported from the library, providing type safety for session handling.
interface LiveSession {
  close(): void;
  sendRealtimeInput(input: { media: GenAIBlob }): void;
}

// --- HELPER & UI COMPONENTS ---

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = '8' }) => (
    <div className="flex justify-center items-center p-4">
        <div className={`w-${size} h-${size} border-4 border-pink-400 border-t-transparent rounded-full animate-spin`}></div>
    </div>
);

const ToolButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`font-cinzel text-sm md:text-base px-4 py-2 rounded-t-lg transition-all duration-300 border-b-2 whitespace-nowrap ${
            isActive
                ? 'bg-purple-900/50 border-pink-400 text-white'
                : 'bg-transparent border-transparent text-purple-300/70 hover:bg-purple-900/30 hover:text-white'
        }`}
        aria-pressed={isActive}
    >
        {label}
    </button>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg">
        <p className="font-bold">An Error Occurred</p>
        <p className="text-sm">{message}</p>
    </div>
);

// --- AI TOOL IMPLEMENTATIONS ---

const ChatTool: React.FC = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string; sources?: any[] }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Config Toggles
    const [useThinking, setUseThinking] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            setAi(genAI);
        } catch (e) {
            setError("Failed to initialize AI. Ensure API Key is configured.");
            console.error(e);
        }
    }, []);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const startNewChat = useCallback(() => {
        if (!ai) return;
        const model = useThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        let tools: any[] = [];
        if(useSearch) tools.push({googleSearch: {}});
        if(useMaps) tools.push({googleMaps: {}});

        const config: any = {};
        if (useThinking) config.thinkingConfig = { thinkingBudget: 32768 };
        if(tools.length > 0) config.tools = tools;

        setChat(ai.chats.create({ model, config }));
        setChatHistory([]);
    }, [ai, useThinking, useSearch, useMaps]);

    useEffect(() => {
        startNewChat();
    }, [startNewChat]);
    
    const handleSendMessage = async () => {
        if (!prompt.trim() || !chat) return;
        setIsLoading(true);
        setError(null);
        
        const currentPrompt = prompt;
        setChatHistory(prev => [...prev, { role: 'user', text: currentPrompt }]);
        setPrompt('');

        try {
            const response = await chat.sendMessage({ message: currentPrompt });
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            setChatHistory(prev => [...prev, { role: 'model', text: response.text, sources }]);
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
            setChatHistory(prev => [...prev, { role: 'user', text: currentPrompt }]); // Restore prompt on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const playTTS = async (text: string) => {
        if (!ai) return;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: { responseModalities: [Modality.AUDIO] },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            }
        } catch (e: any) {
            setError("TTS failed: " + e.message);
        }
    };

    return (
        <div className="p-4 flex flex-col h-full">
             {error && <ErrorDisplay message={error} />}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2" ref={chatContainerRef}>
                {chatHistory.map((entry, index) => (
                    <div key={index} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${entry.role === 'user' ? 'bg-pink-800/50' : 'bg-purple-800/50'}`}>
                           <p className="whitespace-pre-wrap">{entry.text}</p>
                           {entry.role === 'model' && entry.sources && (
                               <div className="mt-2 border-t border-white/20 pt-2">
                                   <h4 className="text-xs font-bold text-purple-200 mb-1">Sources:</h4>
                                   <ul className="text-xs list-disc list-inside">
                                       {entry.sources.map((source: any, i: number) => (
                                          <li key={i}><a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-pink-300 hover:underline">{source.web?.title || source.maps?.title}</a></li>
                                       ))}
                                   </ul>
                               </div>
                           )}
                           {entry.role === 'model' && (
                               <button onClick={() => playTTS(entry.text)} className="mt-2 text-pink-300 hover:text-white transition-colors" aria-label="Read aloud">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                               </button>
                           )}
                        </div>
                    </div>
                ))}
                {isLoading && <LoadingSpinner />}
            </div>
            <div className="flex-shrink-0 pt-4">
                <div className="flex items-center gap-2 mb-2 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={useThinking} onChange={(e) => setUseThinking(e.target.checked)} className="accent-pink-500"/> Deep Thinking</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="accent-pink-500"/> Web Search</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={useMaps} onChange={(e) => setUseMaps(e.target.checked)} className="accent-pink-500"/> Places Search</label>
                </div>
                <div className="flex gap-2">
                    <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything..." className="w-full bg-black/30 border border-white/20 rounded-lg p-2 focus:ring-2 focus:ring-pink-400 focus:outline-none"/>
                    <button onClick={handleSendMessage} disabled={isLoading} className="bg-pink-600 px-4 rounded-lg hover:bg-pink-500 transition-colors disabled:bg-gray-500">Send</button>
                </div>
            </div>
        </div>
    );
};

const ImageStudioTool: React.FC = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [mode, setMode] = useState<'generate' | 'edit' | 'analyze'>('generate');
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [originalImage, setOriginalImage] = useState<string | null>(null);

    useEffect(() => {
        try {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));
        } catch (e) {
            setError("Failed to initialize AI. Ensure API Key is configured.");
            console.error(e);
        }
    }, []);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setOriginalImage(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!ai || !prompt.trim() || isLoading) return;
        if ((mode === 'edit' || mode === 'analyze') && !imageFile) {
            setError("Please upload an image for this operation.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            if (mode === 'generate') {
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt,
                    config: { numberOfImages: 1, aspectRatio },
                });
                const base64Image = response.generatedImages[0].image.imageBytes;
                setResult(`data:image/png;base64,${base64Image}`);
            } else if (mode === 'edit') {
                const base64Data = await fileToBase64(imageFile!);
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ inlineData: { data: base64Data, mimeType: imageFile!.type } }, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
                });
                const part = response.candidates?.[0]?.content.parts[0];
                if (part?.inlineData) {
                    setResult(`data:image/png;base64,${part.inlineData.data}`);
                }
            } else if (mode === 'analyze') {
                const base64Data = await fileToBase64(imageFile!);
                 const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [{ inlineData: { data: base64Data, mimeType: imageFile!.type } }, { text: prompt }] },
                });
                setResult(response.text);
            }
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex-shrink-0 flex border-b border-white/20 mb-4">
                 <button onClick={() => setMode('generate')} className={`px-4 py-2 ${mode === 'generate' ? 'border-b-2 border-pink-400' : ''}`}>Generate</button>
                 <button onClick={() => setMode('edit')} className={`px-4 py-2 ${mode === 'edit' ? 'border-b-2 border-pink-400' : ''}`}>Edit</button>
                 <button onClick={() => setMode('analyze')} className={`px-4 py-2 ${mode === 'analyze' ? 'border-b-2 border-pink-400' : ''}`}>Analyze</button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4">
                {error && <ErrorDisplay message={error} />}
                {(mode === 'edit' || mode === 'analyze') && (
                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                )}
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Enter your prompt..." className="w-full bg-black/30 border border-white/20 rounded-lg p-2 focus:ring-2 focus:ring-pink-400 focus:outline-none"/>
                {mode === 'generate' && (
                     <div className="flex gap-2">
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-3 py-1 text-sm rounded-full ${aspectRatio === ratio ? 'bg-pink-600' : 'bg-purple-800/50'}`}>{ratio}</button>
                        ))}
                     </div>
                )}
                 <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-pink-600 p-2 rounded-lg hover:bg-pink-500 transition-colors disabled:bg-gray-500">
                    {isLoading ? 'Processing...' : `Submit for ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
                 </button>
                 {isLoading && <LoadingSpinner />}
                 {result && (
                     <div className="mt-4">
                         {mode === 'analyze' ? <p className="whitespace-pre-wrap bg-black/20 p-3 rounded-lg">{result}</p> : <img src={result} alt="Generated result" className="max-w-full mx-auto rounded-lg"/>}
                     </div>
                 )}
                 {mode === 'edit' && originalImage && (
                    <div className="mt-4">
                        <h4 className="font-cinzel text-lg mb-2">Original</h4>
                        <img src={originalImage} alt="Original" className="max-w-full mx-auto rounded-lg"/>
                    </div>
                 )}
            </div>
        </div>
    );
};

const VideoSuiteTool: React.FC = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [mode, setMode] = useState<'generate' | 'analyze'>('generate');
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [analysisVideoFile, setAnalysisVideoFile] = useState<File | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [apiKeySelected, setApiKeySelected] = useState(false);

    useEffect(() => {
        try {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));
        } catch (e) {
            setError("Failed to initialize AI. Ensure API Key is configured.");
            console.error(e);
        }
    }, []);

    const checkApiKey = useCallback(async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
        return true;
      }
      setApiKeySelected(false);
      return false;
    }, []);

    useEffect(() => {
       if (mode === 'generate') {
           checkApiKey();
       }
    }, [mode, checkApiKey]);

    const handleGenerate = async () => {
        if (!prompt.trim() && !imageFile) {
            setError("A text prompt or starting image is required for video generation.");
            return;
        }
        if (!await checkApiKey()) {
            setError("Please select an API key to use the Veo generation service.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setLoadingMessage("Initializing generation...");
        
        try {
            const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            let operation = await currentAi.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                ...(imageFile && { image: { imageBytes: await fileToBase64(imageFile), mimeType: imageFile.type } }),
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio },
            });

            setLoadingMessage("Video is processing... this can take a few minutes. Polling for results.");
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await currentAi.operations.getVideosOperation({ operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                 const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                 const videoBlob = await response.blob();
                 setResult(URL.createObjectURL(videoBlob));
            } else {
                throw new Error("Generation finished but no video link was found.");
            }
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found")) {
                setError("API Key validation failed. Please re-select your key.");
                setApiKeySelected(false);
            } else {
                setError(e.message || "An unexpected error occurred during video generation.");
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleAnalyze = async () => {
        if (!ai || !prompt.trim() || !analysisVideoFile) {
            setError("A video file and a prompt are required for analysis.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        setLoadingMessage("Analyzing video... This may take some time depending on the video length.");
    
        try {
            const base64Data = await fileToBase64(analysisVideoFile);
            const videoPart = { inlineData: { data: base64Data, mimeType: analysisVideoFile.type } };
            const textPart = { text: prompt };
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [videoPart, textPart] },
            });
    
            setResult(response.text);
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred during video analysis.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    return (
        <div className="p-4 flex flex-col h-full">
            {!apiKeySelected && mode === 'generate' && (
                <div className="p-4 bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 rounded-lg mb-4">
                    <p className="font-bold">Veo API Key Required</p>
                    <p className="text-sm mb-2">Video generation requires a user-selected API key. Please select one to proceed. For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">billing documentation</a>.</p>
                    <button onClick={async () => { await window.aistudio.openSelectKey(); setApiKeySelected(true); }} className="bg-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors">Select API Key</button>
                </div>
            )}
             <div className="flex-shrink-0 flex border-b border-white/20 mb-4">
                 <button onClick={() => setMode('generate')} className={`px-4 py-2 ${mode === 'generate' ? 'border-b-2 border-pink-400' : ''}`}>Generate</button>
                 <button onClick={() => setMode('analyze')} className={`px-4 py-2 ${mode === 'analyze' ? 'border-b-2 border-pink-400' : ''}`}>Analyze</button>
            </div>
            {error && <ErrorDisplay message={error}/>}
            
            {mode === 'generate' && (
                <div className="overflow-y-auto space-y-4">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Enter your prompt... e.g., A majestic cosmic whale swimming through a nebula" className="w-full bg-black/30 border border-white/20 rounded-lg p-2 focus:ring-2 focus:ring-pink-400 focus:outline-none"/>
                    <label className="block">Optional Starting Image:
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setAspectRatio('16:9')} className={`px-3 py-1 text-sm rounded-full ${aspectRatio === '16:9' ? 'bg-pink-600' : 'bg-purple-800/50'}`}>Landscape (16:9)</button>
                        <button onClick={() => setAspectRatio('9:16')} className={`px-3 py-1 text-sm rounded-full ${aspectRatio === '9:16' ? 'bg-pink-600' : 'bg-purple-800/50'}`}>Portrait (9:16)</button>
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading || (mode === 'generate' && !apiKeySelected)} className="w-full bg-pink-600 p-2 rounded-lg hover:bg-pink-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Generating...' : 'Generate Video'}
                    </button>
                    {isLoading && <div className="text-center"><LoadingSpinner/><p>{loadingMessage}</p></div>}
                    {result && <video src={result} controls autoPlay loop className="w-full rounded-lg mt-4"></video>}
                </div>
            )}

            {mode === 'analyze' && (
                <div className="overflow-y-auto space-y-4">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="What do you want to know about the video? e.g., Summarize this video." className="w-full bg-black/30 border border-white/20 rounded-lg p-2 focus:ring-2 focus:ring-pink-400 focus:outline-none"/>
                    <label className="block">Video to Analyze:
                        <input type="file" accept="video/*" onChange={(e) => setAnalysisVideoFile(e.target.files?.[0] || null)} className="block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                    </label>
                    <button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-pink-600 p-2 rounded-lg hover:bg-pink-500 transition-colors disabled:bg-gray-500">
                        {isLoading ? 'Analyzing...' : 'Analyze Video'}
                    </button>
                    {isLoading && <div className="text-center"><LoadingSpinner/><p>{loadingMessage}</p></div>}
                    {result && <div className="mt-4 p-4 bg-black/30 rounded-lg text-left whitespace-pre-wrap">{result}</div>}
                </div>
            )}
        </div>
    );
};

const LiveConversationTool: React.FC = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<TranscriptionState>({ history: [], user: '', model: '' });
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);

    useEffect(() => {
        try {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));
        } catch (e) {
            setError("Failed to initialize AI.");
            console.error(e);
        }
        return () => { // Cleanup on component unmount
            if(sessionPromiseRef.current) {
                sessionPromiseRef.current.then(s => s.close());
            }
            if(mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startConversation = async () => {
        if (!ai) return;
        setIsLive(true);
        setIsConnecting(true);
        setError(null);
        setTranscription({ history: [], user: '', model: '' });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const currentInputCtx = inputAudioContextRef.current;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        const source = currentInputCtx.createMediaStreamSource(stream);
                        scriptProcessorRef.current = currentInputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: GenAIBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(currentInputCtx.destination);
                    },
                    onmessage: async (message) => {
                        // Handle transcription
                        let userText = '';
                        let modelText = '';
                        if (message.serverContent?.inputTranscription) {
                            userText = message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                           modelText = message.serverContent.outputTranscription.text;
                        }

                        setTranscription(prev => ({ ...prev, user: prev.user + userText, model: prev.model + modelText }));

                        if (message.serverContent?.turnComplete) {
                            setTranscription(prev => {
                                const newHistory = [...prev.history, `You: ${prev.user}`, `AI: ${prev.model}`];
                                return { history: newHistory, user: '', model: '' };
                            });
                        }

                        // Handle audio playback
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const currentOutputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentOutputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), currentOutputCtx, 24000, 1);
                            const source = currentOutputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(currentOutputCtx.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onerror: (e) => {
                        console.error("Live error:", e);
                        setError("A connection error occurred.");
                        endConversation();
                    },
                    onclose: () => endConversation(),
                },
            });

        } catch (e: any) {
            setError(e.message || "Failed to start microphone.");
            setIsLive(false);
            setIsConnecting(false);
        }
    };
    
    const endConversation = () => {
        sessionPromiseRef.current?.then(s => s.close());
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        sessionPromiseRef.current = null;
        setIsLive(false);
        setIsConnecting(false);
    };

    return (
        <div className="p-4 flex flex-col items-center justify-center h-full text-center">
             {isLive && <LiveCommsOverlay onClose={endConversation} transcription={transcription} isConnecting={isConnecting} />}
             {error && <ErrorDisplay message={error} />}
            <h3 className="font-cinzel text-xl mb-4">Real-time Voice Conversation</h3>
            <p className="max-w-md mx-auto text-purple-200/80 mb-8">
                Establish a direct voice link to the Oracle. Speak naturally and receive instant, spoken responses.
            </p>
            <button onClick={startConversation} className="bg-pink-600 px-6 py-3 rounded-lg hover:bg-pink-500 transition-colors">Start Live Conversation</button>
        </div>
    );
};

const AudioTranscriptionTool: React.FC = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        try {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));
        } catch (e) {
            setError("Failed to initialize AI.");
            console.error(e);
        }
    }, []);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = handleTranscribe;
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setTranscript('');
            setError(null);
        } catch (err) {
            setError("Microphone access denied or not available.");
        }
    };

    const handleStopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setIsLoading(true);
    };
    
    const handleTranscribe = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
            const base64Data = await fileToBase64(audioBlob as File); // This works because Blob and File are similar
            const response = await ai!.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { parts: [{ inlineData: { data: base64Data, mimeType: audioBlob.type } }, { text: "Transcribe this audio." }] }
                ]
            });
            setTranscript(response.text);
        } catch (e: any) {
            setError(e.message || "Failed to transcribe audio.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 text-center">
            {error && <ErrorDisplay message={error}/>}
            <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`px-6 py-3 rounded-lg transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-pink-600 hover:bg-pink-500'}`}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            {isLoading && <LoadingSpinner />}
            {transcript && <div className="mt-4 p-4 bg-black/30 rounded-lg text-left whitespace-pre-wrap">{transcript}</div>}
        </div>
    );
};

// --- MAIN ORACLE COMPONENT ---

const AIOracle: React.FC<AIOracleProps> = ({ onClose }) => {
    const [activeTool, setActiveTool] = useState('chat');

    const renderTool = () => {
        switch (activeTool) {
            case 'chat': return <ChatTool />;
            case 'image': return <ImageStudioTool />;
            case 'video': return <VideoSuiteTool />;
            case 'live': return <LiveConversationTool />;
            case 'transcribe': return <AudioTranscriptionTool />;
            default: return <ChatTool />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="w-full h-full max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/20">
                <header className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="font-cinzel text-xl text-pink-300">The Oracle</h2>
                    <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors" aria-label="Close Oracle">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <nav className="flex-shrink-0 flex space-x-2 border-b border-white/10 px-4 overflow-x-auto">
                    <ToolButton label="AI Chat" isActive={activeTool === 'chat'} onClick={() => setActiveTool('chat')} />
                    <ToolButton label="Image Studio" isActive={activeTool === 'image'} onClick={() => setActiveTool('image')} />
                    <ToolButton label="Video Suite" isActive={activeTool === 'video'} onClick={() => setActiveTool('video')} />
                    <ToolButton label="Live Conversation" isActive={activeTool === 'live'} onClick={() => setActiveTool('live')} />
                    <ToolButton label="Transcribe Audio" isActive={activeTool === 'transcribe'} onClick={() => setActiveTool('transcribe')} />
                </nav>

                <main className="flex-grow overflow-y-auto overflow-x-hidden">
                    {renderTool()}
                </main>
            </div>
        </div>
    );
};

export default AIOracle;
