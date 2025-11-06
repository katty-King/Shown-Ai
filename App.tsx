
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from './types';
import { runGemini } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';

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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  
  const handleSendMessage = async (prompt: string, imageFile?: File) => {
    if ((!prompt && !imageFile) || isLoading) return;

    setIsLoading(true);

    let imageForDisplay: string | undefined;
    if (imageFile) {
        try {
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
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: prompt,
      image: imageForDisplay,
    };

    setMessages(prev => [...prev, userMessage]);

    try {
        const responseText = await runGemini(prompt, imageFile);
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

  const handlePromptClick = (prompt: string) => {
      const chatInput = document.querySelector('textarea');
      if (chatInput) {
          chatInput.value = prompt;
          handleSendMessage(prompt);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
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
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;
