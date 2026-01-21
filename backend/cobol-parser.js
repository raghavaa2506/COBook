const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, 'temp');

// Generate short filename for temporary files
function generateShortId() {
  const timestamp = Date.now().toString(36);
  return `p${timestamp.slice(-5)}`.substring(0, 8);
}

// Parse COBOL code to extract AST-like structure
async function parseCobol(code) {
  const id = generateShortId();
  const sourceFile = path.join(TEMP_DIR, `${id}.cob`);
  const astFile = path.join(TEMP_DIR, `${id}.json`);

  try {
    // Write COBOL code to file
    await fs.writeFile(sourceFile, code, 'utf8');
    
    // For now, we'll use a simple regex-based parser
    // In a production environment, you would integrate ANTLR here
    const ast = await simpleCobolParser(code);
    
    // Cleanup
    await fs.unlink(sourceFile).catch(() => {});
    
    return ast;
  } catch (error) {
    console.error('COBOL parsing error:', error);
    throw error;
  }
}

// Simple COBOL parser (placeholder for ANTLR implementation)
async function simpleCobolParser(code) {
  const lines = code.split('\n');
  const divisions = {};
  let currentDivision = null;
  let currentSection = null;
  let currentParagraph = null;
  
  // Extract divisions
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match division headers
    const divisionMatch = trimmed.match(/([A-Z]+)\s+DIVISION\./);
    if (divisionMatch) {
      currentDivision = divisionMatch[1];
      divisions[currentDivision] = { sections: {}, content: [] };
      currentSection = null;
      currentParagraph = null;
      continue;
    }
    
    // Match section headers
    const sectionMatch = trimmed.match(/([A-Z-]+)\s+SECTION\./);
    if (sectionMatch && currentDivision) {
      currentSection = sectionMatch[1];
      divisions[currentDivision].sections[currentSection] = { paragraphs: {}, content: [] };
      currentParagraph = null;
      continue;
    }
    
    // Match paragraph headers
    const paragraphMatch = trimmed.match(/^([A-Z0-9-]+)\./);
    if (paragraphMatch && currentDivision && currentSection) {
      currentParagraph = paragraphMatch[1];
      divisions[currentDivision].sections[currentSection].paragraphs[currentParagraph] = { content: [] };
      continue;
    }
    
    // Add content to appropriate level
    if (currentDivision) {
      if (currentSection) {
        if (currentParagraph) {
          divisions[currentDivision].sections[currentSection].paragraphs[currentParagraph].content.push(trimmed);
        } else {
          divisions[currentDivision].sections[currentSection].content.push(trimmed);
        }
      } else {
        divisions[currentDivision].content.push(trimmed);
      }
    }
  }
  
  // Extract variables from WORKING-STORAGE
  const variables = {};
  if (divisions.DATA && divisions.DATA.sections['WORKING-STORAGE']) {
    const wsContent = divisions.DATA.sections['WORKING-STORAGE'].content.join('\n');
    
    // Simple regex to extract variable definitions
    const varMatches = wsContent.matchAll(/^\s+(\d+)\s+([A-Z0-9-]+)\s+(?:PIC|PICTURE)\s+(.+?)\./gm);
    for (const match of varMatches) {
      const [, level, name, pic] = match;
      variables[name] = {
        level: parseInt(level),
        pic: pic.trim(),
        type: determineType(pic.trim())
      };
    }
  }
  
  // Extract procedure flow
  const procedureFlow = [];
  if (divisions.PROCEDURE) {
    for (const [sectionName, section] of Object.entries(divisions.PROCEDURE.sections || {})) {
      for (const [paragraphName, paragraph] of Object.entries(section.paragraphs || {})) {
        const content = paragraph.content.join('\n');
        
        // Extract control flow statements
        const statements = extractControlFlow(content);
        
        procedureFlow.push({
          section: sectionName,
          paragraph: paragraphName,
          statements
        });
      }
    }
  }
  
  return {
    divisions,
    variables,
    procedureFlow
  };
}

// Determine variable type from PIC clause
function determineType(pic) {
  if (pic.includes('X')) return 'alphanumeric';
  if (pic.includes('9')) {
    if (pic.includes('V') || pic.includes('.')) return 'numeric-decimal';
    return 'numeric';
  }
  return 'unknown';
}

// Extract control flow statements from procedure content
function extractControlFlow(content) {
  const statements = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Match IF statements
    const ifMatch = trimmed.match(/IF\s+(.+?)\s+(.+?)/);
    if (ifMatch) {
      statements.push({
        type: 'IF',
        condition: ifMatch[1],
        content: ifMatch[2]
      });
      continue;
    }
    
    // Match PERFORM statements
    const performMatch = trimmed.match(/PERFORM\s+(.+?)(?:\s+UNTIL\s+(.+))?/);
    if (performMatch) {
      statements.push({
        type: 'PERFORM',
        target: performMatch[1],
        until: performMatch[2] || null
      });
      continue;
    }
    
    // Match EVALUATE statements
    const evaluateMatch = trimmed.match(/EVALUATE\s+(.+?)/);
    if (evaluateMatch) {
      statements.push({
        type: 'EVALUATE',
        target: evaluateMatch[1]
      });
      continue;
    }
    
    // Match MOVE statements
    const moveMatch = trimmed.match(/MOVE\s+(.+?)\s+TO\s+(.+?)/);
    if (moveMatch) {
      statements.push({
        type: 'MOVE',
        source: moveMatch[1],
        destination: moveMatch[2]
      });
      continue;
    }
    
    // Match DISPLAY statements
    const displayMatch = trimmed.match(/DISPLAY\s+(.+?)/);
    if (displayMatch) {
      statements.push({
        type: 'DISPLAY',
        content: displayMatch[1]
      });
      continue;
    }
    
    // Default statement
    statements.push({
      type: 'STATEMENT',
      content: trimmed
    });
  }
  
  return statements;
}

module.exports = { parseCobol };
