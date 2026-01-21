import React, { useState } from 'react';
import { X, Sparkles, Code, FileText, Bug, ArrowRight, FileJson, MessageSquare } from 'lucide-react';

const AIAssistant = ({ 
  isVisible, 
  onClose, 
  selectedCell, 
  onGenerateCode, 
  onExplainCode, 
  onFixError, 
  onConvertToPython, 
  onSummarizeProgram 
}) => {
  const [activeFeature, setActiveFeature] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const features = [
    { id: 'generate', name: 'Generate Code', icon: Code, description: 'Generate COBOL code from natural language' },
    { id: 'explain', name: 'Explain Code', icon: FileText, description: 'Get explanation of COBOL code in plain English' },
    { id: 'fix', name: 'Fix Error', icon: Bug, description: 'Get help fixing compilation errors' },
    { id: 'convert', name: 'Convert to Python', icon: ArrowRight, description: 'Convert COBOL code to Python' },
    { id: 'summarize', name: 'Summarize Program', icon: FileJson, description: 'Get a summary of the entire program' }
  ];
  
  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      switch (activeFeature) {
        case 'generate':
          await onGenerateCode(prompt);
          break;
        case 'explain':
          await onExplainCode(prompt);
          break;
        case 'fix':
          await onFixError(prompt);
          break;
        case 'convert':
          await onConvertToPython(prompt);
          break;
        case 'summarize':
          await onSummarizeProgram(prompt);
          break;
      }
      
      setPrompt('');
      onClose();
    } catch (error) {
      console.error('AI Assistant error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeFeature === feature.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{feature.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {features.find(f => f.id === activeFeature)?.description}
            </p>
            
            {activeFeature === 'explain' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  Select the code you want to explain in the notebook, then describe what you'd like to know about it.
                </p>
              </div>
            )}
            
            {activeFeature === 'fix' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">
                  Paste the compilation error message you're seeing, and I'll help you fix it.
                </p>
              </div>
            )}
            
            {activeFeature === 'convert' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                <p className="text-sm text-green-800">
                  Select the COBOL code you want to convert to Python.
                </p>
              </div>
            )}
            
            {activeFeature === 'summarize' && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-4">
                <p className="text-sm text-purple-800">
                  I'll analyze your entire notebook and provide a summary of what the program does.
                </p>
              </div>
            )}
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              activeFeature === 'generate' ? 'e.g., "Create a COBOL program to calculate factorial"' :
              activeFeature === 'explain' ? 'e.g., "What does this code do?"' :
              activeFeature === 'fix' ? 'Paste the error message here...' :
              activeFeature === 'convert' ? 'e.g., "Convert this COBOL code to Python"' :
              activeFeature === 'summarize' ? 'e.g., "Summarize this program"' :
              'Enter your prompt...'
            }
            className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
        
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Processing...' : 'Generate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
