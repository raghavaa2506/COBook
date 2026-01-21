import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const DataFlow = ({ data }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (data && chartRef.current) {
      // Generate Mermaid syntax from data flow data
      let mermaidSyntax = 'graph LR;\n';
      
      // Add nodes with proper syntax
      data.nodes.forEach(node => {
        let nodeShape = '[';
        let nodeEnd = ']';
        
        if (node.type === 'variable') {
          nodeShape = '((';
          nodeEnd = '))';
        } else if (node.type === 'process') {
          nodeShape = '[';
          nodeEnd = ']';
        }
        
        // Escape special characters in labels
        const escapedLabel = node.label.replace(/"/g, '&quot;');
        mermaidSyntax += `  ${node.id}${nodeShape}"${escapedLabel}"${nodeEnd};\n`;
      });
      
      // Add edges
      data.edges.forEach(edge => {
        if (edge.label) {
          const escapedLabel = edge.label.replace(/"/g, '&quot;');
          mermaidSyntax += `  ${edge.source} -->|"${escapedLabel}" ${edge.target};\n`;
        } else {
          mermaidSyntax += `  ${edge.source} --> ${edge.target};\n`;
        }
      });
      
      // Render the chart
      mermaid.render('dataflow', mermaidSyntax).then((result) => {
        chartRef.current.innerHTML = result.svg;
      }).catch(error => {
        console.error('Error rendering data flow:', error);
        chartRef.current.innerHTML = `<div class="text-red-500">Error rendering data flow: ${error.message}</div>`;
      });
    }
  }, [data]);
  
  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#dbeafe',
        primaryTextColor: '#1e40af',
        primaryBorderColor: '#93c5fd',
        lineColor: '#6b7280',
        secondaryColor: '#e5e7eb',
        tertiaryColor: '#f9fafb'
      }
    });
  }, []);
  
  return (
    <div className="h-96 overflow-auto border border-gray-200 rounded-md p-4">
      <div ref={chartRef} className="flex justify-center">
        {data ? null : (
          <div className="text-gray-500 text-center py-8">
            No data flow information available. Please compile the code first.
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFlow;
