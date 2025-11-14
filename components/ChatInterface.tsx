// Fix: Add types for the Web Speech API to fix TypeScript errors.
// These types are not included by default in standard TypeScript DOM libraries.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Fix: Use `declare global` to augment the Window interface within a module.
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    webkitAudioContext: typeof AudioContext;
  }
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ConversationBranch } from '../App';
import { INITIAL_QUESTION } from '../constants';
import { getNextQuestion, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

export interface Message {
    id: number;
    sender: 'ai' | 'user';
    content: React.ReactNode;
    isFeedback?: boolean;
    audioState?: 'loading' | 'playing' | 'played' | 'error';
}


interface ChatInterfaceProps {
  onSubmit: (history: Message[], branch: ConversationBranch) => void;
  onApiError: (error: Error) => void;
}

type StagedImage = { dataUrl: string; file: File };

const ENCOURAGEMENTS = [
    "Tuyệt vời!",
    "Câu trả lời rất thú vị!",
    "Cảm ơn bạn đã chia sẻ.",
    "Tôi hiểu rồi.",
    "Điều đó thật ý nghĩa.",
    "Cảm ơn bạn đã cởi mở nhé."
];

const AiAvatar = () => (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
         <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
       </svg>
    </div>
);

const AudioStatusIcon: React.FC<{ state?: 'loading' | 'playing' | 'played' | 'error' }> = ({ state }) => {
    if (!state || state === 'played') return null;

    const iconClass = "w-4 h-4 ml-2";

    switch (state) {
        case 'loading':
            return (
                <svg className={`animate-spin ${iconClass} text-slate-400`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        case 'playing':
            return (
                <svg className={`${iconClass} text-violet-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5 5 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            );
        case 'error':
             return (
                <svg className={`${iconClass} text-red-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
             );
        default:
            return null;
    }
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSubmit, onApiError }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentBranch, setCurrentBranch] = useState<ConversationBranch | null>(null);
    const [isWaitingForUser, setIsWaitingForUser] = useState(true);
    const [isAwaitingNextQuestion, setIsAwaitingNextQuestion] = useState(false);
    const [textInputValue, setTextInputValue] = useState('');
    const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isFastMode, setIsFastMode] = useState(true);
    const [showInitialOptions, setShowInitialOptions] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechRecognition = useRef<SpeechRecognition | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const setupRun = useRef(false);
    const messagesRef = useRef<Message[]>([]);
    const encouragementAudioCache = useRef<Map<string, string>>(new Map());
    const isAudioEnabledRef = useRef(isAudioEnabled);
    const messageIdCounter = useRef(0);

    useEffect(() => {
        isAudioEnabledRef.current = isAudioEnabled;
    }, [isAudioEnabled]);
    
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const cacheEncouragementAudio = async () => {
            for (const text of ENCOURAGEMENTS) {
                if (encouragementAudioCache.current.has(text)) continue;
                try {
                    const audioData = await generateSpeech(text);
                    if (audioData) {
                        encouragementAudioCache.current.set(text, audioData);
                    }
                } catch (error) {
                    console.error(`Failed to pre-cache audio for "${text}":`, error);
                }
            }
        };
        
        if (isAudioEnabled) {
            cacheEncouragementAudio();
        }
    }, [isAudioEnabled]);


    const playAudio = useCallback(async (base64Audio: string | null, messageId: number) => {
        if (!isAudioEnabledRef.current || !base64Audio || !window.AudioContext) {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioState: 'played' } : m));
            return;
        }
        
        activeSources.current.forEach(source => source.stop());
        activeSources.current.clear();
        setMessages(prev => prev.map(m => m.audioState === 'playing' ? { ...m, audioState: 'played' } : m));

        try {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioState: 'playing' } : m));
            const decodedData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedData, ctx, 24000, 1);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
            activeSources.current.add(source);
            source.addEventListener('ended', () => {
                activeSources.current.delete(source);
                setMessages(prev => prev.map(m => 
                    (m.id === messageId && m.audioState === 'playing') ? { ...m, audioState: 'played' } : m
                ));
            });
        } catch (error) {
            console.error("Failed to play audio:", error);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioState: 'error' } : m));
        }
    }, []);
    
    const addAiMessage = useCallback((text: string, isFeedback = false) => {
        const messageId = messageIdCounter.current++;
        const newMessage: Message = { id: messageId, sender: 'ai', content: text, isFeedback, audioState: 'loading' };
        setMessages(prev => [...prev, newMessage]);
        
        (async () => {
            if (!isAudioEnabledRef.current) {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioState: 'played' } : m));
                return;
            };

            let audioData: string | null = null;
            try {
                if (isFeedback && encouragementAudioCache.current.has(text)) {
                    audioData = encouragementAudioCache.current.get(text) || null;
                } else {
                    audioData = await generateSpeech(text);
                    if (isFeedback && audioData) {
                        encouragementAudioCache.current.set(text, audioData);
                    }
                }
                 playAudio(audioData, messageId);
            } catch (err) {
                console.error("Speech generation failed:", err);
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioState: 'error' } : m));
            }
        })();
    }, [playAudio]);

    const toggleAudio = useCallback(() => {
        const willBeEnabled = !isAudioEnabled;
        setIsAudioEnabled(willBeEnabled);

        if (!willBeEnabled) {
            activeSources.current.forEach(source => source.stop());
            activeSources.current.clear();
            setMessages(prev => prev.map(m => ({ ...m, audioState: 'played' })));
        } else {
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }
    }, [isAudioEnabled]);


    useEffect(() => {
        if (setupRun.current) return;
        setupRun.current = true;
        
        addAiMessage(INITIAL_QUESTION.text);
        
        const timer = setTimeout(() => {
            setShowInitialOptions(true);
        }, 1200);
        
        return () => clearTimeout(timer);
    }, [addAiMessage]);


    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWaitingForUser, isAwaitingNextQuestion, currentOptions]);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.lang = 'vi-VN';
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            if (speechError) setSpeechError(null);
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            setTextInputValue(transcript);
        };

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'no-speech') {
                setSpeechError("Tôi không nghe thấy bạn nói. Vui lòng thử lại.");
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setSpeechError("Quyền truy cập micro đã bị từ chối. Vui lòng kiểm tra cài đặt trình duyệt.");
            } else {
                setSpeechError("Đã xảy ra lỗi với tính năng nhận diện giọng nói.");
            }
            setIsListening(false);
        };
        speechRecognition.current = recognition;
    }, [speechError]);
    
    const addImageFile = (file: File) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const dataUrl = loadEvent.target?.result as string;
          setStagedImages(prev => [...prev, { dataUrl, file }]);
        };
        reader.readAsDataURL(file);
      }
    };
    
    useEffect(() => {
      const handlePaste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              addImageFile(blob);
              event.preventDefault();
              return;
            }
          }
        }
      };
      window.addEventListener('paste', handlePaste);
      return () => {
        window.removeEventListener('paste', handlePaste);
      };
    }, []);

    const fetchAndAskNextQuestion = useCallback(async (history: Message[], branch: ConversationBranch) => {
        if (!branch) return;

        setIsAwaitingNextQuestion(true);
        setCurrentOptions([]);
        try {
            const { nextQuestion, options, isComplete } = await getNextQuestion(history, branch, isFastMode);

            if (isComplete) {
                addAiMessage("Cảm ơn bạn đã chia sẻ. Tôi đã có đủ thông tin cần thiết. Giờ tôi sẽ phân tích để đưa ra những gợi ý phù hợp nhất. Vui lòng chờ trong giây lát...");
                onSubmit(history, branch);
            } else {
                addAiMessage(nextQuestion);
                setCurrentOptions(options);
                setIsWaitingForUser(true);
            }
        } catch (error) {
            console.error(error);
            onApiError(error as Error);
        } finally {
            setIsAwaitingNextQuestion(false);
        }
    }, [onSubmit, onApiError, addAiMessage, isFastMode]);

     const handleAnswer = useCallback(async (answerContent: string | React.ReactNode) => {
        if (!currentBranch) return;
        setIsWaitingForUser(false);
        setTextInputValue('');
        setStagedImages([]);
        setCurrentOptions([]);
        
        const messageId = messageIdCounter.current++;
        const newMessages: Message[] = [
            ...messages,
            { id: messageId, sender: 'user', content: typeof answerContent === 'string' ? answerContent : <>{answerContent}</> }
        ];
        setMessages(newMessages);

        const randomEncouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        
        addAiMessage(randomEncouragement, true);
        
        const historyForNextQuestion: Message[] = messagesRef.current;
        
        fetchAndAskNextQuestion(historyForNextQuestion, currentBranch);

    }, [messages, fetchAndAskNextQuestion, currentBranch, addAiMessage]);

    const handleInitialChoice = useCallback((branch: ConversationBranch) => {
        const choiceText = INITIAL_QUESTION.options.find(opt => opt.branch === branch)!.text;
        setIsWaitingForUser(false);
        const messageId = messageIdCounter.current++;
        const newMessages: Message[] = [
            ...messages,
            { id: messageId, sender: 'user', content: choiceText }
        ];
        setMessages(newMessages);
        setCurrentBranch(branch);
        fetchAndAskNextQuestion(newMessages, branch);
    }, [messages, fetchAndAskNextQuestion]);
    
    const handleSend = () => {
        if (textInputValue.trim() === '' && stagedImages.length === 0) return;

        const displayText = (
            <div className="flex flex-col gap-2">
                {stagedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {stagedImages.map((img, idx) => (
                            <img key={idx} src={img.dataUrl} className="max-w-[100px] max-h-[100px] rounded-lg object-cover" alt="Uploaded content" />
                        ))}
                    </div>
                )}
                {textInputValue && <p className="whitespace-pre-wrap">{textInputValue}</p>}
            </div>
        );
        
        handleAnswer(displayText);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             addImageFile(file);
        }
         if(e.target) e.target.value = '';
    };

    const handleRemoveStagedImage = (indexToRemove: number) => {
        setStagedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const toggleListening = () => {
        if (isListening) {
            speechRecognition.current?.stop();
        } else {
            speechRecognition.current?.start();
        }
    };

    const renderUserInput = () => {
        if (!isWaitingForUser) return null;
        if (!currentBranch) {
            if (!showInitialOptions) return null; // Only show options after a delay
            return (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch p-4">
                    <div onClick={() => handleInitialChoice('has_direction')} className="flex-1 p-5 bg-white/10 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/50 cursor-pointer transition-all duration-300 hover:bg-white/20 hover:dark:bg-slate-700 hover:scale-[1.03] shadow-lg text-center flex flex-col items-center justify-center">
                        <div className="flex justify-center mb-3 text-slate-800 dark:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-base text-gray-800 dark:text-white mb-1">
                            {INITIAL_QUESTION.options[0].text}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Cùng nhau xác thực và xây dựng lộ trình chi tiết.
                        </p>
                    </div>
                    <div onClick={() => handleInitialChoice('no_direction')} className="flex-1 p-5 bg-white/10 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/50 cursor-pointer transition-all duration-300 hover:bg-white/20 hover:dark:bg-slate-700 hover:scale-[1.03] shadow-lg text-center flex flex-col items-center justify-center">
                        <div className="flex justify-center mb-3 text-slate-800 dark:text-white">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-base text-gray-800 dark:text-white mb-1">
                             {INITIAL_QUESTION.options[1].text}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                             Bắt đầu hành trình khám phá bản thân và cơ hội.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-2 sm:p-4">
                <div className="flex justify-end items-center px-2 pb-2">
                     <div className="flex items-center">
                        <label htmlFor="fast-ai-toggle" className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Phản hồi nhanh</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="fast-ai-toggle" checked={isFastMode} onChange={() => setIsFastMode(prev => !prev)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                        </label>
                    </div>
                </div>
                {renderTextInputBar()}
            </div>
        );
    };
    
    const renderTextInputBar = () => {
        return (
            <div className="w-full flex flex-col gap-1">
                {stagedImages.length > 0 && (
                    <div className="px-2 pt-1 flex flex-wrap gap-2">
                        {stagedImages.map((image, index) => (
                            <div key={index} className="relative">
                                <img src={image.dataUrl} alt="Staged" className="w-20 h-20 object-cover rounded-lg shadow-md" />
                                <button onClick={() => handleRemoveStagedImage(index)} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold border-2 border-white dark:border-slate-800 hover:bg-red-500 transition-colors">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <button type="button" title={isAudioEnabled ? "Tắt phản hồi âm thanh" : "Bật phản hồi âm thanh"} onClick={toggleAudio} className={`flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-colors ${isAudioEnabled ? 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-slate-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                        {isAudioEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5 5 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <button type="button" title="Đính kèm tệp" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <textarea
                       value={textInputValue}
                       onChange={(e) => setTextInputValue(e.target.value)}
                       onKeyDown={handleKeyDown}
                       placeholder={"Nhập câu trả lời..."}
                       rows={1}
                       className="flex-grow shadow-sm sm:text-sm border-gray-300 rounded-2xl bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white p-2.5 resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                       style={{maxHeight: '120px'}}
                       onInput={(e) => {
                           const target = e.target as HTMLTextAreaElement;
                           target.style.height = 'auto';
                           target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                       }}
                    />
                     <button type="button" title="Ghi âm" onClick={toggleListening} className={`flex-shrink-0 p-2.5 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors ${isListening ? 'bg-red-500 focus:ring-red-400' : 'bg-gray-400 dark:bg-slate-600 hover:bg-gray-500 focus:ring-slate-400'}`}>
                         <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" /></svg>
                     </button>
                     <button type="button" onClick={handleSend} className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold p-3 rounded-full hover:from-indigo-600 hover:to-violet-700 transition duration-300 self-end flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-slate-800">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" transform="rotate(10)"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"></path></svg>
                     </button>
                </div>
                {speechError && <p className="text-center text-red-500 text-xs px-4 pt-1">{speechError}</p>}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full flex-grow">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.sender === 'ai' && <AiAvatar />}
                       <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm flex items-center ${msg.sender === 'user' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-lg' : 'bg-slate-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-lg'} ${msg.isFeedback ? 'italic bg-slate-100 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400' : ''}`}>
                          <div className="flex-grow">{msg.content}</div>
                          {msg.sender === 'ai' && <AudioStatusIcon state={msg.audioState} />}
                       </div>
                   </div>
                ))}
                {isAwaitingNextQuestion && (
                    <div className="flex items-end gap-3 justify-start">
                        <AiAvatar />
                        <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-lg">
                             <div className="flex items-center gap-2">
                                <div className="typing-indicator">
                                    <div className="typing-circle"></div>
                                    <div className="typing-circle"></div>
                                    <div className="typing-circle"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                 {isWaitingForUser && currentOptions.length > 0 && (
                     <div className="flex flex-col gap-3 pt-2">
                         {currentOptions.map((option, index) => (
                             <button
                                 key={index}
                                 onClick={() => handleAnswer(option)}
                                 className="w-full text-left p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600/50 cursor-pointer transition-all duration-200 hover:bg-violet-50 hover:dark:bg-slate-700 hover:border-violet-400 dark:hover:border-violet-500 shadow-sm"
                             >
                                 {option}
                             </button>
                         ))}
                     </div>
                 )}
                <div ref={chatEndRef}></div>
                <style>{`
                    .typing-indicator {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 20px;
                    }
                    .typing-circle {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background-color: #94a3b8;
                        animation: typing-animation 1.2s infinite ease-in-out;
                        margin: 0 2px;
                    }
                    .dark .typing-circle {
                         background-color: #94a3b8;
                    }
                    .typing-circle:nth-child(1) { animation-delay: -0.2s; }
                    .typing-circle:nth-child(2) { animation-delay: -0.1s; }
                    @keyframes typing-animation {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1.0); }
                    }
                `}</style>
            </div>
            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 sticky bottom-0">
                {renderUserInput()}
            </div>
        </div>
    );
};

export default ChatInterface;