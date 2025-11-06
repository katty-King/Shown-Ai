
import React from 'react';

const WelcomeScreen: React.FC<{ onPromptClick: (prompt: string) => void }> = ({ onPromptClick }) => {
  const examplePrompts = [
    { title: 'Analyze an image', prompt: 'Describe this image in detail. What objects do you see?' },
    { title: 'Plan a detailed itinerary', prompt: 'Create a 5-day itinerary for a first-time visitor to Rome, including must-see sights and food recommendations.' },
    { title: 'Get creative', prompt: 'Write a haiku about a rainy day.' },
    { title: 'Solve a problem', prompt: 'I have tomatoes, basil, and mozzarella. What can I make for dinner?' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 min-h-[calc(100vh-10rem)]">
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-200 mb-4">How can I help you today?</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-3xl">
        {examplePrompts.map(({title, prompt}) => (
          <button
            key={title}
            onClick={() => onPromptClick(prompt)}
            className="bg-gray-800 p-4 rounded-lg text-left hover:bg-gray-700/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <p className="font-semibold text-gray-200">{title}</p>
            <p className="text-gray-400 text-sm">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
