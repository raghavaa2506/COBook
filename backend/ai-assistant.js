require('dotenv').config();

let groq = null;
let aiEnabled = false;

try {
  if (process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    aiEnabled = true;
    console.log('✓ AI Assistant enabled with Groq API');
  } else {
    console.log('⚠ AI Assistant disabled - No API key found');
  }
} catch (error) {
  console.log('⚠ AI Assistant disabled - Groq SDK error:', error.message);
}

async function getAIAssistance(prompt, context = '', cellType = 'code', feature = 'generate') {
  if (!aiEnabled || !groq) {
    return generateFallbackResponse(prompt, context, cellType, feature);
  }

  try {
    let systemPrompt = '';

    switch (feature) {
      case 'explain':
        systemPrompt = `You are an expert COBOL programmer assistant. Explain the selected COBOL code in plain English.

Rules:
1. Provide a clear, concise explanation of what the code does
2. Explain any COBOL-specific concepts
3. Break down complex logic into simple steps
4. Mention any potential issues or improvements

Context: ${context ? 'User has existing code' : 'No context provided'}`;
        break;
        
      case 'fix':
        systemPrompt = `You are an expert COBOL programmer assistant. Fix the COBOL code based on the error message.

Rules:
1. Identify the cause of the error
2. Provide the corrected code
3. Explain what was wrong and how it was fixed
4. Ensure the code follows COBOL syntax rules

Error: ${context ? context : 'No error message provided'}`;
        break;
        
      case 'generate':
        systemPrompt = `You are an expert COBOL programmer assistant.

Rules:
1. Generate valid COBOL code
2. Always include IDENTIFICATION DIVISION and PROCEDURE DIVISION
3. Use clear variable names
4. Always end with STOP RUN
5. Format code properly

Context: ${context ? 'User has existing code' : 'Starting new program'}`;
        break;
        
      case 'convert':
        systemPrompt = `You are an expert COBOL and Python programmer assistant. Convert COBOL code to equivalent Python code.

Rules:
1. Provide functionally equivalent Python code
2. Explain any differences in behavior
3. Use Python best practices
4. Handle COBOL-specific constructs appropriately

COBOL Code: ${context ? context : 'No COBOL code provided'}`;
        break;
        
      case 'summarize':
        systemPrompt = `You are an expert COBOL programmer assistant. Summarize the COBOL program in one paragraph.

Rules:
1. Provide a concise summary of what the program does
2. Mention the main functionality
3. Highlight any important features or algorithms
4. Keep it to one paragraph

Program: ${context ? context : 'No program provided'}`;
        break;
        
      default:
        systemPrompt = `You are a helpful assistant for COBOL programming.`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content || '';

    let code = response;
    const codeBlockMatch = response.match(/```(?:cobol|python)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1].trim();
    }

    return {
      code: (cellType === 'code' || feature === 'convert') ? code : response,
      suggestion: response,
      explanation: 'AI-generated response',
      feature
    };

  } catch (error) {
    console.error('AI Assistant error:', error);
    return generateFallbackResponse(prompt, context, cellType, feature);
  }
}

function generateFallbackResponse(prompt, context, cellType, feature) {
  if (feature === 'explain') {
    return {
      code: `This COBOL code appears to be a program that performs basic operations. Without AI assistance, I cannot provide a detailed explanation.`,
      suggestion: 'AI unavailable',
      explanation: 'Add your Groq API key to enable AI.',
      feature
    };
  } else if (feature === 'fix') {
    return {
      code: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. Fixed.
       PROCEDURE DIVISION.
           DISPLAY 'AI Assistant unavailable for error fixing'.
           DISPLAY 'Add GROQ_API_KEY to backend .env'.
           STOP RUN.`,
      suggestion: 'AI unavailable',
      explanation: 'Add your Groq API key to enable AI.',
      feature
    };
  } else if (feature === 'convert') {
    return {
      code: `# Python equivalent
print("AI Assistant unavailable for code conversion")
print("Add GROQ_API_KEY to backend .env")`,
      suggestion: 'AI unavailable',
      explanation: 'Add your Groq API key to enable AI.',
      feature
    };
  } else if (feature === 'summarize') {
    return {
      code: `This is a COBOL program, but AI assistance is unavailable for summarization. Please add your Groq API key to enable this feature.`,
      suggestion: 'AI unavailable',
      explanation: 'Add your Groq API key to enable AI.',
      feature
    };
  } else {
    return {
      code: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. Demo.
       PROCEDURE DIVISION.
           DISPLAY 'AI Assistant unavailable'.
           DISPLAY 'Add GROQ_API_KEY to backend .env'.
           STOP RUN.`,
      suggestion: 'AI unavailable',
      explanation: 'Add your Groq API key to enable AI.',
      feature
    };
  }
}

module.exports = { getAIAssistance };
