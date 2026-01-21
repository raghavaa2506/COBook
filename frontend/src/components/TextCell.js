import React, { useState, useRef, useEffect } from 'react';
import { FileText, Trash2, Plus, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

const TextCell = ({ 
  cell, 
  index, 
  onUpdateContent, 
  onDeleteCell, 
  onAddCell, 
  comments, 
  onToggleComments, 
  onAddComment 
}) => {
  const [showOutput, setShowOutput] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(cell.content);
  const editorRef = useRef(null);
  const lastContentRef = useRef(cell.content);
  const processingTimeoutRef = useRef(null);
  
  // Convert markdown to HTML
  const convertMarkdownToHTML = (text) => {
    // Handle headings
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-3 mb-2 text-gray-800">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-gray-900">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-3 text-gray-900">$1</h1>');
    
    // Handle bold text - non-greedy matching
    text = text.replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*([^*\n]+?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Handle inline code
    text = text.replace(/`([^`\n]+?)`/g, '<code class="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono text-indigo-600">$1</code>');
    
    // Handle lists
    text = text.replace(/\n-\s(.*)/g, '\n<li class="ml-4 text-gray-700">$1</li>');
    text = text.replace(/(<li.*<\/li>)/s, '<ul class="list-disc ml-6 my-2 text-gray-700">$1</ul>');
    
    // Handle paragraphs
    text = text.replace(/\n\n/g, '</p><p class="mb-2">');
    text = '<p class="mb-2">' + text + '</p>';
    
    // Clean up empty paragraphs
    text = text.replace(/<p class="mb-2"><\/p>/g, '');
    text = text.replace(/<p class="mb-2">(<\/?(h[1-6]|ul|li|p)>)/g, '$1');
    text = text.replace(/(<\/?(h[1-6]|ul|li|p)>)<\/p>/g, '$1');
    
    return text;
  };
  
  // Process markdown in real-time
  const processMarkdown = () => {
    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Set a new timeout to process after typing stops
    processingTimeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        const plainText = editorRef.current.innerText || editorRef.current.textContent || '';
        const htmlContent = convertMarkdownToHTML(plainText);
        
        // Only update if the HTML is different
        if (htmlContent !== editorRef.current.innerHTML) {
          // Update content
          editorRef.current.innerHTML = htmlContent;
          setContent(htmlContent);
          onUpdateContent(cell.id, htmlContent);
        }
      }
    }, 500); // Wait 500ms after typing stops
  };
  
  const handleInput = () => {
    processMarkdown();
  };
  
  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case '`':
          e.preventDefault();
          document.execCommand('formatBlock', false, 'pre');
          break;
      }
    }
  };
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      if (newContent && newContent !== lastContentRef.current) {
        lastContentRef.current = newContent;
        setContent(newContent);
        onUpdateContent(cell.id, newContent);
      }
    }
  };
  
  // Initialize editor when component mounts
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
      lastContentRef.current = content;
    }
  }, []);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-all group shadow-sm hover:shadow-md">
      {/* Cell Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-1.5 rounded-md">
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600 font-semibold">TEXT</span>
            <div className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              [{index + 1}]
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleComments(cell.id)}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors relative"
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
            {comments[cell.id]?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {comments[cell.id].length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => onAddCell('text', cell.id)}
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
      
      {/* Cell Content */}
      <div className="p-4">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          className={`min-h-[120px] text-gray-700 prose max-w-none focus:outline-none ${
            isEditing ? 'cursor-text' : 'cursor-pointer'
          }`}
          style={{
            minHeight: '120px',
            outline: 'none',
            lineHeight: '1.6'
          }}
        />
      </div>
      
      {/* Comments Section */}
      {comments[cell.id] && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div 
            className="px-4 py-2 flex items-center justify-between border-b border-gray-200 cursor-pointer"
            onClick={() => setShowOutput(!showOutput)}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-mono text-gray-600 font-semibold">COMMENTS</span>
              <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                {comments[cell.id].length}
              </span>
            </div>
            {showOutput ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
          
          {showOutput && (
            <div className="p-4">
              <div className="space-y-3 mb-3">
                {comments[cell.id].map(comment => (
                  <div key={comment.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600">
                            {comment.user.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{comment.user}</span>
                      </div>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      onAddComment(cell.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    if (input.value.trim()) {
                      onAddComment(cell.id, input.value);
                      input.value = '';
                    }
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextCell;
