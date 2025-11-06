import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { runGemini } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';
import ConfirmDialog from './components/ConfirmDialog';

// Helper to convert file to base64 for display
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Media state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreview, videoPreview]);
  
  const handleSendMessage = async (prompt: string) => {
    const fileToSend = imageFile || videoFile;
    if ((!prompt && !fileToSend) || isLoading) return;

    setIsLoading(true);

    let imageForDisplay: string | undefined;
    let videoForDisplay: string | undefined;

    if (imageFile) {
        try {
            // Base64 is needed for messages to persist if reloaded, but object URL is fine for immediate display
            imageForDisplay = await fileToBase64(imageFile);
        } catch (error) {
            console.error("Error converting file to base64", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: Sender.Error,
                text: "Failed to load image for display."
            }]);
            setIsLoading(false);
            return;
        }
    } else if (videoFile) {
        videoForDisplay = videoPreview!; // Use the existing object URL
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: prompt,
      image: imageForDisplay,
      video: videoForDisplay,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Clear previews right after adding the message
    handleImageRemove();
    handleVideoRemove();

    try {
        const responseText = await runGemini(prompt, fileToSend || undefined);
        const modelMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: Sender.Model,
            text: responseText,
        };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: Sender.Error,
            text: error instanceof Error ? error.message : "An unexpected error occurred."
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const clearMedia = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
  }

  const handleImageSelect = (file: File | null) => {
      clearMedia();
      if (file && file.type.startsWith('image/')) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const handleImageRemove = () => {
      setImageFile(null);
      if(imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
  };
  
  const handleVideoSelect = (file: File | null) => {
      clearMedia();
      if (file && file.type.startsWith('video/')) {
          setVideoFile(file);
          setVideoPreview(URL.createObjectURL(file));
      }
  };

  const handleVideoRemove = () => {
      setVideoFile(null);
      if(videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
  };


  const handlePromptClick = (prompt: string) => {
      const chatInput = document.querySelector('textarea');
      if (chatInput) {
          chatInput.value = prompt;
          handleSendMessage(prompt);
      }
  };

  const handleClearChatRequest = () => {
    if (messages.length > 0) {
        setShowClearConfirm(true);
    }
  };

  const handleConfirmClear = () => {
      setMessages([]);
      clearMedia();
      setShowClearConfirm(false);
  };
  
  const handleCancelClear = () => {
      setShowClearConfirm(false);
  };

  const handleDropFile = (file: File) => {
    if (file.type.startsWith('image/')) {
        handleImageSelect(file);
    } else if (file.type.startsWith('video/')) {
        handleVideoSelect(file);
    } else {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: Sender.Error,
            text: `Unsupported file type: "${file.type}". Please upload an image or video.`
        }]);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDropFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div 
        className="flex flex-col h-screen bg-gray-900 text-white relative"
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
    >
      <Header onClearChat={handleClearChatRequest} isChatEmpty={messages.length === 0} />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto pt-20 pb-4 scroll-smooth">
        <div className="max-w-4xl mx-auto px-4">
            {messages.length === 0 && !isLoading ? (
                <WelcomeScreen onPromptClick={handlePromptClick} />
            ) : (
                messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
            )}
            {isLoading && (
                 <ChatMessage key="loading" message={{ id: 'loading', sender: Sender.Model, text: '...' }} />
            )}
        </div>
      </main>
      <div className="sticky bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm">
        <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            imagePreview={imagePreview}
            videoPreview={videoPreview}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onVideoSelect={handleVideoSelect}
            onVideoRemove={handleVideoRemove}
        />
      </div>
      <ConfirmDialog
        isOpen={showClearConfirm}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        title="Clear Chat History"
      >
        <p>Are you sure you want to delete all messages in this chat? This action cannot be undone.</p>
      </ConfirmDialog>
      {isDragging && (
        <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none animate-fade-in">
            <div className="border-4 border-dashed border-blue-400 rounded-2xl p-12 text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-4 text-2xl font-bold text-white">Drop image or video to upload</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;