import React, { useState, useRef, useEffect } from 'react';
import { Play, Plus, Trash2, Save, Download, Upload, Code, Terminal, FileText, Share2, MessageSquare, Sparkles, Type, Settings, Users, PlayCircle, StopCircle, ChevronDown, Copy, Link2, Edit3, Hash, Braces, File, Zap, User, Clock, Send, X, Check } from 'lucide-react';
import Cell from './components/Cell';
import AIAssistant from './components/AIAssistant';
import VisualizationPanel from './components/VisualizationPanel';

const COBook = () => {
  const [cells, setCells] = useState([
    {
      id: 1,
      type: 'text',
      content: '<h1>Welcome to COBook</h1><p>A modern <strong>COBOL development environment</strong> in your browser. Features:</p><ul><li>Write and execute COBOL programs of any size</li><li>Add formatted documentation with Markdown</li><li>AI-powered code assistance</li><li>Real-time collaboration</li><li>Interactive visualizations</li></ul>',
      output: '',
      isRunning: false
    },
    {
      id: 2,
      type: 'code',
      content: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. HelloWorld.
       PROCEDURE DIVISION.
           DISPLAY 'Hello from COBook!'.
           STOP RUN.`,
      output: '',
      isRunning: false
    }
  ]);
  const [nextId, setNextId] = useState(3);
  const [notebookName, setNotebookName] = useState('Untitled Notebook');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [collaborators] = useState([
    { id: 1, name: 'You', color: '#4F46E5', active: true }
  ]);
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [showVisualization, setShowVisualization] = useState({});
  const [activeVisualizationCell, setActiveVisualizationCell] = useState(null);
  
  const addCell = (type = 'code', afterId = null) => {
    const newCell = {
      id: nextId,
      type: type,
      content: type === 'code'
        ? `       IDENTIFICATION DIVISION.
       PROGRAM-ID. Program${nextId}.
       PROCEDURE DIVISION.
           DISPLAY 'New COBOL Program'.
           STOP RUN.`
        : '<h2>New Text Section</h2><p>Click to edit and add your documentation...</p>',
      output: '',
      isRunning: false
    };

    if (afterId) {
      const index = cells.findIndex(c => c.id === afterId);
      const newCells = [...cells];
      newCells.splice(index + 1, 0, newCell);
      setCells(newCells);
    } else {
      setCells([...cells, newCell]);
    }
    setNextId(nextId + 1);
  };

  const deleteCell = (id) => {
    if (cells.length > 1) {
      setCells(cells.filter(cell => cell.id !== id));
    }
  };

  const updateContent = (id, newContent) => {
    // Only update if content actually changed
    const currentCell = cells.find(c => c.id === id);
    if (currentCell && currentCell.content !== newContent) {
      setCells(cells.map(cell =>
        cell.id === id ? { ...cell, content: newContent } : cell
      ));
    }
  };

  const runCell = async (id) => {
    const cell = cells.find(c => c.id === id);
    if (!cell || cell.type !== 'code') return;

    setCells(cells.map(c =>
      c.id === id ? { ...c, isRunning: true, output: 'Compiling COBOL program...' } : c
    ));

    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cell.content, cellId: id })
      });

      const data = await response.json();

      let output = `GnuCOBOL Compiler v3.2.0\n`;

      if (data.success) {
        output += `Compilation successful\n\n${'─'.repeat(50)}\nProgram Output:\n${'─'.repeat(50)}\n${data.output}\n${'─'.repeat(50)}\n\nExecution time: ${data.executionTime}ms\nExit code: 0`;
      } else {
        output += `Compilation failed\n\n${data.error}`;
      }

      setCells(cells.map(c =>
        c.id === id ? { ...c, isRunning: false, output } : c
      ));
    } catch (error) {
      setCells(cells.map(c =>
        c.id === id ? {
          ...c,
          isRunning: false,
          output: `Connection Error\n\nCouldn't connect to backend server.\nMake sure the server is running on http://localhost:5000\n\nError: ${error.message}`
        } : c
      ));
    }
  };

  const runAllCells = async () => {
    for (const cell of cells) {
      if (cell.type === 'code') {
        await runCell(cell.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  // AI Assistant functions
  const showAIAssistantForCell = (cellId) => {
    setSelectedCell(cellId);
    setShowAIAssistant(true);
  };

  const handleGenerateCode = async (prompt) => {
    try {
      const response = await fetch('http://localhost:5000/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: '',
          cellType: 'code',
          feature: 'generate'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add a new code cell with the generated code
        const newCell = {
          id: nextId,
          type: 'code',
          content: data.generatedCode,
          output: '',
          isRunning: false
        };

        setCells([...cells, newCell]);
        setNextId(nextId + 1);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Error generating code. Please try again.');
    }
  };

  const handleExplainCode = async (prompt) => {
    const cell = cells.find(c => c.id === selectedCell);
    if (!cell) return;

    try {
      const response = await fetch('http://localhost:5000/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: cell.content,
          cellType: 'code',
          feature: 'explain'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add a new text cell with the explanation
        const newCell = {
          id: nextId,
          type: 'text',
          content: `<h2>Code Explanation</h2><p>${data.suggestion}</p>`,
          output: '',
          isRunning: false
        };

        // Find the index of the selected cell and add the new cell after it
        const index = cells.findIndex(c => c.id === selectedCell);
        const newCells = [...cells];
        newCells.splice(index + 1, 0, newCell);
        setCells(newCells);
        setNextId(nextId + 1);
      }
    } catch (error) {
      console.error('Error explaining code:', error);
      alert('Error explaining code. Please try again.');
    }
  };

  const handleFixError = async (prompt) => {
    const cell = cells.find(c => c.id === selectedCell);
    if (!cell) return;

    try {
      const response = await fetch('http://localhost:5000/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: cell.output, // Pass the error message as context
          cellType: 'code',
          feature: 'fix'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the selected cell with the fixed code
        setCells(cells.map(c =>
          c.id === selectedCell ? { ...c, content: data.generatedCode } : c
        ));
      }
    } catch (error) {
      console.error('Error fixing code:', error);
      alert('Error fixing code. Please try again.');
    }
  };

  const handleConvertToPython = async (prompt) => {
    const cell = cells.find(c => c.id === selectedCell);
    if (!cell) return;

    try {
      const response = await fetch('http://localhost:5000/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: cell.content,
          cellType: 'code',
          feature: 'convert'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add a new text cell with the Python code
        const newCell = {
          id: nextId,
          type: 'text',
          content: `<h2>Python Equivalent</h2><pre><code>${data.generatedCode}</code></pre>`,
          output: '',
          isRunning: false
        };

        // Find the index of the selected cell and add the new cell after it
        const index = cells.findIndex(c => c.id === selectedCell);
        const newCells = [...cells];
        newCells.splice(index + 1, 0, newCell);
        setCells(newCells);
        setNextId(nextId + 1);
      }
    } catch (error) {
      console.error('Error converting to Python:', error);
      alert('Error converting to Python. Please try again.');
    }
  };

  const handleSummarizeProgram = async (prompt) => {
    try {
      // Combine all code cells into a single program
      const codeCells = cells.filter(c => c.type === 'code');
      const combinedCode = codeCells.map(c => c.content).join('\n\n');

      const response = await fetch('http://localhost:5000/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: combinedCode,
          cellType: 'code',
          feature: 'summarize'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add a new text cell with the summary
        const newCell = {
          id: nextId,
          type: 'text',
          content: `<h2>Program Summary</h2><p>${data.suggestion}</p>`,
          output: '',
          isRunning: false
        };

        setCells([...cells, newCell]);
        setNextId(nextId + 1);
      }
    } catch (error) {
      console.error('Error summarizing program:', error);
      alert('Error summarizing program. Please try again.');
    }
  };

  const toggleVisualization = (cellId, show) => {
    setShowVisualization(prev => ({
      ...prev,
      [cellId]: show
    }));
    
    if (show) {
      setActiveVisualizationCell(cellId);
    } else if (activeVisualizationCell === cellId) {
      setActiveVisualizationCell(null);
    }
  };

  const addComment = (cellId, comment) => {
    setComments({
      ...comments,
      [cellId]: [...(comments[cellId] || []), {
        id: Date.now(),
        user: 'You',
        text: comment,
        timestamp: new Date().toLocaleTimeString()
      }]
    });
  };

  const toggleComments = (cellId) => {
    setShowComments({
      ...showComments,
      [cellId]: !showComments[cellId]
    });
  };

  const saveNotebook = () => {
    const notebook = {
      name: notebookName,
      cells,
      comments,
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notebookName.replace(/\s+/g, '_')}.cobook`;
    a.click();
  };

  const loadNotebook = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const notebook = JSON.parse(event.target.result);
          setNotebookName(notebook.name || 'Loaded Notebook');
          setCells(notebook.cells || []);
          setComments(notebook.comments || {});
          setNextId(Math.max(...notebook.cells.map(c => c.id)) + 1);
        } catch (error) {
          alert('Error loading notebook file');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText('https://cobook.dev/notebook/abc123');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">COBook</span>
              </div>

              {isEditingName ? (
                <input
                  type="text"
                  value={notebookName}
                  onChange={(e) => setNotebookName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="text-sm text-gray-700 border-b-2 border-indigo-500 outline-none px-2 py-1"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{notebookName}</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>AI Assist</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300"
              >
                <Link2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{collaborators.length}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => addCell('code')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
            >
              <div className="bg-indigo-100 p-1 rounded">
                <Braces className="w-3 h-3 text-indigo-600" />
              </div>
              <span>Code Cell</span>
              <Plus className="w-3 h-3 text-gray-500" />
            </button>

            <button
              onClick={() => addCell('text')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
            >
              <div className="bg-green-100 p-1 rounded">
                <FileText className="w-3 h-3 text-green-600" />
              </div>
              <span>Text Cell</span>
              <Plus className="w-3 h-3 text-gray-500" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
              onClick={runAllCells}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
            >
              <div className="bg-blue-100 p-1 rounded">
                <PlayCircle className="w-3 h-3 text-blue-600" />
              </div>
              <span>Run All</span>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
              onClick={saveNotebook}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
            >
              <div className="bg-amber-100 p-1 rounded">
                <Save className="w-3 h-3 text-amber-600" />
              </div>
              <span>Save</span>
            </button>

            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors cursor-pointer">
              <div className="bg-purple-100 p-1 rounded">
                <Upload className="w-3 h-3 text-purple-600" />
              </div>
              <span>Load</span>
              <input
                type="file"
                accept=".cobook,.json"
                onChange={loadNotebook}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {cells.map((cell, index) => (
            <div key={cell.id}>
              <Cell
                cell={cell}
                index={index}
                onUpdateContent={updateContent}
                onRunCell={runCell}
                onDeleteCell={deleteCell}
                onAddCell={addCell}
                onShowAIAssistant={showAIAssistantForCell}
                onToggleVisualization={toggleVisualization}
                comments={comments}
                onToggleComments={toggleComments}
                onAddComment={addComment}
              />
              
              {/* Visualization Panel */}
              {cell.type === 'code' && showVisualization[cell.id] && (
                <VisualizationPanel
                  code={cell.content}
                  isVisible={activeVisualizationCell === cell.id}
                  onClose={() => toggleVisualization(cell.id, false)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant
        isVisible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        selectedCell={selectedCell}
        onGenerateCode={handleGenerateCode}
        onExplainCode={handleExplainCode}
        onFixError={handleFixError}
        onConvertToPython={handleConvertToPython}
        onSummarizeProgram={handleSummarizeProgram}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Share Notebook</h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Share link</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value="https://cobook.dev/notebook/abc123"
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center space-x-1"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Collaborators</label>
                <div className="space-y-2">
                  {collaborators.map(collab => (
                    <div key={collab.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold" style={{backgroundColor: collab.color}}>
                        {collab.name[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{collab.name}</span>
                      {collab.active && (
                        <span className="ml-auto text-xs text-green-600 font-medium flex items-center space-x-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <p className="text-sm text-gray-500">COBook - Interactive COBOL Development Environment</p>
        <p className="text-xs text-gray-400 mt-1">Powered by GnuCOBOL • AI-Assisted • Real-time Collaboration • Interactive Visualizations</p>
        <div className="mt-2 text-xs text-gray-400">
          Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+` for code, or type **bold**, *italic*, `code`
        </div>
      </div>
    </div>
  );
};

export default COBook;
