import React from 'react';
import { Play, Trash2, Plus, Terminal, FileText, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import CodeCell from './CodeCell';
import TextCell from './TextCell';

const Cell = ({ 
  cell, 
  index, 
  onUpdateContent, 
  onRunCell, 
  onDeleteCell, 
  onAddCell, 
  onShowAIAssistant, 
  onToggleVisualization,
  comments, 
  onToggleComments, 
  onAddComment 
}) => {
  // Render the appropriate cell type
  if (cell.type === 'code') {
    return (
      <CodeCell
        cell={cell}
        index={index}
        onUpdateContent={onUpdateContent}
        onRunCell={onRunCell}
        onDeleteCell={onDeleteCell}
        onAddCell={onAddCell}
        onShowAIAssistant={onShowAIAssistant}
        onToggleVisualization={onToggleVisualization}
      />
    );
  } else {
    return (
      <TextCell
        cell={cell}
        index={index}
        onUpdateContent={onUpdateContent}
        onDeleteCell={onDeleteCell}
        onAddCell={onAddCell}
        comments={comments}
        onToggleComments={onToggleComments}
        onAddComment={onAddComment}
      />
    );
  }
};

export default Cell;
