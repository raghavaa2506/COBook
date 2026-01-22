// backend/visualization.js
const { parseCobol } = require('./cobol-parser');

// Generate flowchart data from COBOL code
async function generateFlowchart(code) {
  try {
    console.log('Generating flowchart for code:', code.substring(0, 100) + '...');
    
    const ast = await parseCobol(code);
    const nodes = [];
    const edges = [];
    
    // Add start node
    nodes.push({
      id: 'node_start',
      type: 'start',
      label: 'START',
      position: { x: 100, y: 50 }
    });
    
    // Process procedure flow
    let prevNodeId = 'node_start';
    let nodeId = 1;
    let yPosition = 150;
    
    // Check if we have any procedure flow
    if (!ast.procedureFlow || ast.procedureFlow.length === 0) {
      // Create a simple flowchart for basic programs
      nodes.push({
        id: 'node_main',
        type: 'process',
        label: 'Main Program',
        position: { x: 100, y: 150 }
      });
      
      edges.push({
        id: 'edge_start_main',
        source: 'node_start',
        target: 'node_main'
      });
      
      prevNodeId = 'node_main';
      nodeId = 2;
      yPosition = 250;
    } else {
      // Process actual procedure flow
      for (const section of ast.procedureFlow) {
        for (const paragraph of section.paragraphs) {
          for (const statement of paragraph.statements) {
            const currentNodeId = `node_${nodeId++}`;
            
            // Create node based on statement type
            let nodeType = 'process';
            let label = '';
            
            switch (statement.type) {
              case 'IF':
                nodeType = 'decision';
                label = `IF ${statement.condition}`;
                break;
              case 'PERFORM':
                nodeType = 'process';
                label = `PERFORM ${statement.target}`;
                if (statement.until) {
                  label += `\nUNTIL ${statement.until}`;
                }
                break;
              case 'EVALUATE':
                nodeType = 'decision';
                label = `EVALUATE ${statement.target}`;
                break;
              case 'MOVE':
                nodeType = 'process';
                label = `MOVE ${statement.source} TO ${statement.destination}`;
                break;
              case 'DISPLAY':
                nodeType = 'output';
                label = `DISPLAY ${statement.content}`;
                break;
              default:
                label = statement.content || 'Statement';
                // Truncate very long statements
                if (label.length > 30) {
                  label = label.substring(0, 27) + '...';
                }
            }
            
            // Add node
            nodes.push({
              id: currentNodeId,
              type: nodeType,
              label: label,
              position: { x: 100, y: yPosition }
            });
            
            // Add edge from previous node
            edges.push({
              id: `edge_${nodeId}`,
              source: prevNodeId,
              target: currentNodeId,
              label: statement.type === 'IF' ? 'Yes' : ''
            });
            
            prevNodeId = currentNodeId;
            yPosition += 100;
          }
        }
      }
    }
    
    // Add end node
    nodes.push({
      id: 'node_end',
      type: 'end',
      label: 'END',
      position: { x: 100, y: yPosition }
    });
    
    edges.push({
      id: 'edge_end',
      source: prevNodeId,
      target: 'node_end'
    });
    
    console.log('Generated flowchart:', { nodes: nodes.length, edges: edges.length });
    
    return { nodes, edges };
  } catch (error) {
    console.error('Error generating flowchart:', error);
    
    // Return a simple flowchart even if parsing fails
    return {
      nodes: [
        { id: 'node_start', type: 'start', label: 'START' },
        { id: 'node_process', type: 'process', label: 'Process' },
        { id: 'node_end', type: 'end', label: 'END' }
      ],
      edges: [
        { id: 'edge_1', source: 'node_start', target: 'node_process' },
        { id: 'edge_2', source: 'node_process', target: 'node_end' }
      ]
    };
  }
}

// Generate data flow diagram from COBOL code
async function generateDataFlow(code) {
  try {
    const ast = await parseCobol(code);
    const nodes = [];
    const edges = [];
    
    // Add variable nodes
    let nodeId = 0;
    const varNodes = {};
    
    for (const [varName, varInfo] of Object.entries(ast.variables)) {
      const id = `var_${nodeId++}`;
      varNodes[varName] = id;
      
      nodes.push({
        id,
        type: 'variable',
        label: `${varName}\\nPIC ${varInfo.pic}`,
        position: { x: 100, y: 100 + nodeId * 80 }
      });
    }
    
    // Add process nodes and data flow edges
    let processNodeId = 0;
    const processNodes = {};
    
    for (const section of ast.procedureFlow) {
      for (const paragraph of section.paragraphs) {
        for (const statement of paragraph.statements) {
          if (statement.type === 'MOVE') {
            const source = statement.source.trim();
            const destination = statement.destination.trim();
            
            // Create process node if it doesn't exist
            const processId = `process_${processNodeId++}`;
            processNodes[processId] = {
              id: processId,
              label: `MOVE ${source} TO ${destination}`,
              position: { x: 400, y: 100 + processNodeId * 80 }
            };
            
            nodes.push(processNodes[processId]);
            
            // Add edges from source variables to process
            if (varNodes[source]) {
              edges.push({
                id: `edge_${source}_to_${processId}`,
                source: varNodes[source],
                target: processId,
                label: 'reads'
              });
            }
            
            // Add edges from process to destination variables
            if (varNodes[destination]) {
              edges.push({
                id: `edge_${processId}_to_${destination}`,
                source: processId,
                target: varNodes[destination],
                label: 'writes'
              });
            }
          }
        }
      }
    }
    
    return { nodes, edges };
  } catch (error) {
    console.error('Error generating data flow:', error);
    // Return empty data flow on error
    return { nodes: [], edges: [] };
  }
}

// Generate memory layout visualization from COBOL code
async function generateMemoryLayout(code) {
  try {
    const ast = await parseCobol(code);
    const memoryLayout = [];
    
    // Group variables by level
    const groupedVars = {};
    
    for (const [varName, varInfo] of Object.entries(ast.variables)) {
      if (!groupedVars[varInfo.level]) {
        groupedVars[varInfo.level] = [];
      }
      
      groupedVars[varInfo.level].push({
        name: varName,
        pic: varInfo.pic,
        type: varInfo.type,
        size: calculateSize(varInfo.pic)
      });
    }
    
    // Sort levels
    const sortedLevels = Object.keys(groupedVars).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Build memory layout
    let offset = 0;
    
    for (const level of sortedLevels) {
      const group = {
        level: parseInt(level),
        variables: [],
        offset,
        size: 0
      };
      
      for (const variable of groupedVars[level]) {
        const varOffset = offset;
        offset += variable.size;
        
        group.variables.push({
          ...variable,
          offset: varOffset
        });
        
        group.size += variable.size;
      }
      
      memoryLayout.push(group);
    }
    
    return memoryLayout;
  } catch (error) {
    console.error('Error generating memory layout:', error);
    // Return empty memory layout on error
    return [];
  }
}

// Calculate size of variable based on PIC clause
function calculateSize(pic) {
  // Simple implementation - in a real parser, this would be more complex
  const match = pic.match(/9\((\d+)\)|X\((\d+)\)/);
  if (match) {
    return parseInt(match[1] || match[2]);
  }
  
  // Count digits and X's
  const digits = (pic.match(/9/g) || []).length;
  const letters = (pic.match(/X/g) || []).length;
  
  return digits + letters;
}

// Generate division structure tree from COBOL code
async function generateDivisionStructure(code) {
  try {
    const ast = await parseCobol(code);
    const tree = [];
    
    for (const [divisionName, division] of Object.entries(ast.divisions)) {
      const divisionNode = {
        id: divisionName,
        name: `${divisionName} DIVISION`,
        type: 'division',
        children: []
      };
      
      // Add sections
      for (const [sectionName, section] of Object.entries(division.sections || {})) {
        const sectionNode = {
          id: `${divisionName}_${sectionName}`,
          name: `${sectionName} SECTION`,
          type: 'section',
          children: []
        };
        
        // Add paragraphs
        for (const [paragraphName, paragraph] of Object.entries(section.paragraphs || {})) {
          const paragraphNode = {
            id: `${divisionName}_${sectionName}_${paragraphName}`,
            name: `${paragraphName}.`,
            type: 'paragraph',
            children: []
          };
          
          sectionNode.children.push(paragraphNode);
        }
        
        divisionNode.children.push(sectionNode);
      }
      
      tree.push(divisionNode);
    }
    
    return tree;
  } catch (error) {
    console.error('Error generating division structure:', error);
    // Return empty tree on error
    return [];
  }
}

// Generate execution trace from COBOL code
async function generateExecutionTrace(code) {
  try {
    const ast = await parseCobol(code);
    const trace = [];
    
    // For each statement in the procedure division, create a trace step
    let stepId = 0;
    
    for (const section of ast.procedureFlow) {
      for (const paragraph of section.paragraphs) {
        for (const statement of paragraph.statements) {
          trace.push({
            id: stepId++,
            section: section.section,
            paragraph: paragraph.paragraph,
            statement: statement.content || '',
            type: statement.type,
            variables: extractVariables(statement)
          });
        }
      }
    }
    
    return trace;
  } catch (error) {
    console.error('Error generating execution trace:', error);
    // Return empty trace on error
    return [];
  }
}

// Extract variables referenced in a statement
function extractVariables(statement) {
  const variables = [];
  
  if (statement.type === 'MOVE') {
    variables.push({
      name: statement.source,
      action: 'read'
    });
    variables.push({
      name: statement.destination,
      action: 'write'
    });
  } else if (statement.type === 'DISPLAY') {
    // Extract variables from display statement
    const varMatches = statement.content.matchAll(/([A-Z0-9-]+)/g);
    for (const match of varMatches) {
      variables.push({
        name: match[1],
        action: 'read'
      });
    }
  }
  
  return variables;
}

// Export all functions
module.exports = {
  generateFlowchart,
  generateDataFlow,
  generateMemoryLayout,
  generateDivisionStructure,
  generateExecutionTrace
};
