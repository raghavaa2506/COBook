import React, { useState, useRef, useEffect } from 'react';
import { Play, Trash2, Plus, Terminal, Zap, BarChart3, ChevronDown, ChevronUp, Send } from 'lucide-react';

const CodeCell = ({
  cell,
  index,
  onUpdateContent,
  onRunCell,
  onDeleteCell,
  onAddCell,
  onShowAIAssistant,
  onToggleVisualization,
  onProvideInput
}) => {
  const [showOutput, setShowOutput] = useState(true);
  const [showVisualization, setShowVisualization] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputHistory, setInputHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef(null);
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onRunCell(cell.id);
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const newContent = cell.content.substring(0, start) + '       ' + cell.content.substring(end);

      onUpdateContent(cell.id, newContent);

      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 7;
      }, 0);
    }
  };

  const handleInputSubmit = async () => {
    if (!inputValue.trim() && inputValue !== '') return;

    // Add to input history
    const newHistory = [...inputHistory, inputValue];
    setInputHistory(newHistory);
    setHistoryIndex(-1);

    try {
      await onProvideInput(cell.id, inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Error providing input:', error);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const newIndex = historyIndex < inputHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(inputHistory[inputHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(inputHistory[inputHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  useEffect(() => {
    if (cell.needsInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [cell.needsInput]);

  useEffect(() => {
    if (cell.output) {
      setShowOutput(true);
    }
  }, [cell.output]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all group shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-1.5 rounded-md">
            <Terminal className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-gray-600 font-semibold">CODE</span>
            <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              [{index + 1}]
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRunCell(cell.id)}
            disabled={cell.isRunning}
            className="p-2 hover:bg-indigo-50 rounded-md text-indigo-600 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
            title="Run cell"
          >
            {cell.isRunning ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => onShowAIAssistant(cell.id)}
            className="p-2 hover:bg-indigo-50 rounded-md text-indigo-600 transition-colors"
            title="AI assist"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setShowVisualization(!showVisualization);
              onToggleVisualization(cell.id, !showVisualization);
            }}
            className={`p-2 rounded-md transition-colors ${
              showVisualization
                ? 'bg-indigo-50 text-indigo-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Toggle visualization"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddCell('code', cell.id)}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
            title="Add cell below"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteCell(cell.id)}
            className="p-2 hover:bg-red-50 rounded-md text-red-600 transition-colors"
            title="Delete cell"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-1">
        <textarea
          ref={textareaRef}
          value={cell.content}
          onChange={(e) => onUpdateContent(cell.id, e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[300px] max-h-[600px] bg-gray-900 text-teal-400 font-mono text-sm p-4 outline-none resize-y"
          spellCheck={false}
          style={{ tabSize: 7 }}
          disabled={cell.isRunning}
        />
      </div>

      {cell.output && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div
            className="px-4 py-2 flex items-center justify-between border-b border-gray-200 cursor-pointer"
            onClick={() => setShowOutput(!showOutput)}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 p-1 rounded">
                <Terminal className="w-3 h-3 text-gray-600" />
              </div>
              <span className="text-xs font-mono text-gray-600 font-semibold">OUTPUT</span>
              {cell.needsInput && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Waiting for input
                </span>
              )}
            </div>
            {showOutput ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>

          {showOutput && (
            <div className="p-4">
              <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                {cell.output}
              </pre>

              {cell.needsInput && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-indigo-900">
                      Program is waiting for your input
                    </p>
                  </div>
                  <p className="text-xs text-indigo-600 mb-3">
                    Enter your response below and press Enter or click Send
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Type your input here..."
                      className="flex-1 px-3 py-2 border border-indigo-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={handleInputSubmit}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-1 font-medium"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Press Enter to send input quickly, use Up/Down arrows for input history
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeCell;
