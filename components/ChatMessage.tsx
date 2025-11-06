
import React from 'react';
import { Message, Sender } from '../types';
import Spinner from './Spinner';

// Simple Markdown to HTML converter. For a production app, a more robust library like 'react-markdown' is recommended.
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const createMarkup = (inputText: string) => {
        let html = inputText
            // Escape HTML to prevent XSS
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            // Convert markdown to HTML
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-pink-400 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
            .replace(/^\s*[-*]\s(.*)/gm, '<li class="list-disc list-inside ml-4">$1</li>')
            .replace(/\n/g, '<br />');

        // This is a basic way to group list items.
        html = html.replace(/<li/g, '</li><li').replace('</li>', '');

        return { __html: `<div>${html}</div>` };
    };

    return <div className="text-gray-200 leading-relaxed" dangerouslySetInnerHTML={createMarkup(text)} />;
};

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white flex-shrink-0">
        U
    </div>
);

const ModelIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    </div>
);


const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  const isError = message.sender === Sender.Error;

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl'
    : isError ? 'bg-red-500/20 text-red-300 border border-red-500/50 rounded-xl' : 'bg-gray-700 text-gray-200 rounded-r-xl rounded-bl-xl';
  const orderClasses = isUser ? 'order-last' : 'order-first';

  return (
    <div className={`flex items-start gap-3 ${containerClasses} my-4 animate-fade-in`}>
        {!isUser && <ModelIcon />}
        <div className={`p-4 max-w-lg md:max-w-xl lg:max-w-2xl ${bubbleClasses} ${orderClasses}`}>
            {message.image && (
                <img
                    src={message.image}
                    alt="User upload"
                    className="rounded-lg mb-3 max-w-xs h-auto"
                />
            )}
            {isError ? (
                <p><strong className="font-semibold">Error:</strong> {message.text}</p>
            ) : message.text === '...' && message.sender === Sender.Model ? (
                <div className="flex items-center space-x-2 text-gray-400">
                    <Spinner />
                    <span>Thinking...</span>
                </div>
            ) : (
                <SimpleMarkdown text={message.text} />
            )}
        </div>
        {isUser && <UserIcon />}
    </div>
  );
};

export default ChatMessage;
