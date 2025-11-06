import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect, ClipboardEvent } from 'react';
import Spinner from './Spinner';

interface ChatInputProps {
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  imagePreview: string | null;
  videoPreview: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
}

// Fix: Add type definitions for the Web Speech API to resolve "Cannot find name 'SpeechRecognition'" errors.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
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

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

interface IWindow extends Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}
declare const window: IWindow;


const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    imagePreview, 
    videoPreview,
    onImageSelect, 
    onImageRemove,
    onVideoSelect,
    onVideoRemove
}) => {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const basePromptRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings to use this feature.');
        }
        setIsRecording(false);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const separator = basePromptRef.current.length > 0 ? ' ' : '';
        setPrompt(basePromptRef.current + separator + finalTranscript + interimTranscript);
        
        if (finalTranscript) {
          basePromptRef.current += separator + finalTranscript;
        }
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
            setShowOptions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      } else if (file.type.startsWith('video/')) {
        onVideoSelect(file);
      }
    }
    // Reset file input to allow selecting the same file again
    if (e.target) e.target.value = '';
    setShowOptions(false);
  };
  
  const handleRemoveMedia = () => {
    if (imagePreview) {
        onImageRemove();
    } else if (videoPreview) {
        onVideoRemove();
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSend = () => {
    if ((prompt.trim() || imagePreview || videoPreview) && !isLoading) {
      recognitionRef.current?.stop();
      onSendMessage(prompt.trim());
      setPrompt('');
      basePromptRef.current = '';
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
            e.preventDefault();
            onImageSelect(file);
        } else if (file.type.startsWith('video/')) {
            e.preventDefault();
            onVideoSelect(file);
        }
    }
  };
  
  const toggleRecording = () => {
    if (!isSpeechSupported) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      basePromptRef.current = prompt; // Store current text
      recognitionRef.current?.start();
    }
  };

  const handleAttachClick = (type: 'image' | 'video') => {
      if (fileInputRef.current) {
          fileInputRef.current.accept = `${type}/*`;
          fileInputRef.current.click();
      }
  }

  return (
    <div className="bg-gray-800 p-4 border-t border-gray-700">
      <div className="max-w-4xl mx-auto">
        {(imagePreview || videoPreview) && (
          <div className="mb-3 relative w-28">
            <div className="w-28 h-28 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />}
                {videoPreview && <video src={videoPreview} muted autoPlay loop className="w-full h-full object-cover" />}
            </div>
            <button
              onClick={handleRemoveMedia}
              className="absolute -top-2 -right-2 bg-gray-900 rounded-full p-1 text-white hover:bg-red-600 transition-colors shadow-md"
              aria-label="Remove media"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-end bg-gray-700 rounded-xl p-2 gap-2">
          <div className="relative self-end" ref={optionsMenuRef}>
            <button
              onClick={() => setShowOptions(prev => !prev)}
              className="p-2 text-gray-400 hover:text-white transition-all duration-200"
              aria-label="Attach file"
              aria-haspopup="true"
              aria-expanded={showOptions}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${showOptions ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {showOptions && (
                 <div 
                    className="absolute bottom-12 left-0 bg-gray-600 rounded-lg shadow-lg p-1 flex flex-col gap-1 animate-fade-in"
                 >
                    <button onClick={() => handleAttachClick('image')} className="w-full p-2 text-gray-300 hover:text-white hover:bg-gray-500/50 rounded-md flex items-center gap-3 text-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                         <span>Image</span>
                    </button>
                    <button onClick={() => handleAttachClick('video')} className="w-full p-2 text-gray-300 hover:text-white hover:bg-gray-500/50 rounded-md flex items-center gap-3 text-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                         <span>Video</span>
                    </button>
                </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            placeholder={isRecording ? "Listening..." : "Message Shown Ai..."}
            className="flex-grow bg-transparent focus:outline-none resize-none text-white placeholder-gray-400 max-h-40"
            rows={1}
            disabled={isLoading}
          />
          {isSpeechSupported && (
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-lg text-white transition-colors self-end ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.5a.5.5 0 01.5.5v1a4 4 0 004 4h0a4 4 0 004-4v-1a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h3a.5.5 0 010 1h-7a.5.5 0 010-1h3v-1.525A5 5 0 014.5 11.5v-1a.5.5 0 01.5-.5z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={isLoading || (!prompt.trim() && !imagePreview && !videoPreview)}
            className="p-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors self-end"
            aria-label="Send message"
          >
            {isLoading ? (
              <Spinner />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;