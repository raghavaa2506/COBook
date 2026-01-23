// backend/server.js (fixed double response issue)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const { execCobol, provideInput } = require('./cobol-runner');
const { getAIAssistance } = require('./ai-assistant');
const {
  generateFlowchart,
  generateDataFlow,
  generateMemoryLayout,
  generateDivisionStructure,
  generateExecutionTrace
} = require('./visualization');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

const activeSessions = new Map();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const connections = new Map();
const notebooks = new Map();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'COBook API is running',
    connections: connections.size,
    notebooks: notebooks.size,
    activeSessions: activeSessions.size,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/execute', async (req, res) => {
  const { code, cellId } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 Execution Request - Cell ID: ${cellId || 'N/A'}`);
  console.log(`📏 Code size: ${code.length} characters`);
  console.log(`${'='.repeat(60)}`);

  const startTime = Date.now();
  let responseSent = false;

  try {
    const onInputNeeded = (sessionId, output) => {
      if (responseSent) {
        console.log('⚠️  Response already sent, ignoring input callback');
        return;
      }

      activeSessions.set(cellId, sessionId);
      responseSent = true;
      
      console.log(`⌨️  Input needed for cell ${cellId}, session ${sessionId}`);

      res.json({
        success: true,
        output: output,
        needsInput: true,
        sessionId: sessionId,
        executionTime: Date.now() - startTime
      });
    };

    const result = await execCobol(code, onInputNeeded);

    // Only send response if we haven't already sent one
    if (!responseSent) {
      responseSent = true;

      res.json({
        success: !result.error,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        needsInput: false,
        sessionId: null
      });

      console.log(`✓ Response sent - Success: ${!result.error}`);
    } else {
      console.log(`✓ Response already sent (input needed)`);
    }

  } catch (error) {
    console.error('❌ Execution error:', error);
    
    if (!responseSent) {
      responseSent = true;
      res.status(500).json({
        success: false,
        error: error.message,
        needsInput: false,
        sessionId: null
      });
    }
  }
});

app.post('/api/provide-input', async (req, res) => {
  const { cellId, input, sessionId } = req.body;

  if (input === undefined || input === null) {
    return res.status(400).json({ error: 'Missing input' });
  }

  if (!cellId && !sessionId) {
    return res.status(400).json({ error: 'Missing session identifier' });
  }

  const programSessionId = sessionId || activeSessions.get(cellId);

  if (!programSessionId) {
    return res.status(400).json({ 
      error: 'No active program waiting for input',
      debug: { 
        cellId, 
        sessionId, 
        activeSessions: Array.from(activeSessions.keys()) 
      }
    });
  }

  console.log(`📝 Providing input to session ${programSessionId}: "${input}"`);

  try {
    const result = await provideInput(programSessionId, input);

    // Only delete session if program is complete (not waiting for more input)
    if (!result.needsInput) {
      activeSessions.delete(cellId);
    } else {
      // Keep session active for next input
      console.log(`⌨️  Program still needs more input, keeping session active`);
    }

    if (!result.success) {
      activeSessions.delete(cellId);
      return res.status(200).json({
        success: false,
        error: result.error || 'Program terminated unexpectedly',
        output: result.output || '',
        stderr: result.stderr || '',
        needsInput: false,
        sessionId: null
      });
    }

    res.json({
      success: true,
      output: result.output,
      error: null,
      stderr: result.stderr || '',
      needsInput: result.needsInput || false,
      sessionId: result.needsInput ? result.sessionId : null
    });

    console.log(`✓ Input processed - Need more input: ${result.needsInput || false}`);

  } catch (error) {
    console.error('❌ Error providing input:', error);
    activeSessions.delete(cellId);
    res.status(500).json({
      success: false,
      error: error.message,
      needsInput: false,
      sessionId: null
    });
  }
});

app.post('/api/ai-assist', async (req, res) => {
  const { prompt, context, cellType, feature } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  console.log(`\n🤖 AI Assist Request: "${prompt.substring(0, 50)}..."`);
  console.log(`Feature: ${feature || 'generate'}`);

  try {
    const result = await getAIAssistance(prompt, context, cellType, feature || 'generate');
    res.json({
      success: true,
      generatedCode: result.code,
      suggestion: result.suggestion,
      explanation: result.explanation,
      feature: result.feature
    });

    console.log('✓ AI response generated');

  } catch (error) {
    console.error('❌ AI error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/visualization/flowchart', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log('\n📊 Generating flowchart visualization...');

  try {
    const flowchart = await generateFlowchart(code);
    console.log(`✓ Flowchart generated: ${flowchart.nodes.length} nodes, ${flowchart.edges.length} edges`);
    res.json({
      success: true,
      flowchart
    });
  } catch (error) {
    console.error('❌ Flowchart generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/visualization/dataflow', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log('\n📊 Generating data flow visualization...');

  try {
    const dataflow = await generateDataFlow(code);
    console.log(`✓ Data flow generated: ${dataflow.nodes.length} nodes, ${dataflow.edges.length} edges`);
    res.json({
      success: true,
      dataflow
    });
  } catch (error) {
    console.error('❌ Data flow generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/visualization/memory', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log('\n📊 Generating memory layout visualization...');

  try {
    const memoryLayout = await generateMemoryLayout(code);
    console.log(`✓ Memory layout generated: ${memoryLayout.length} variable groups`);
    res.json({
      success: true,
      memoryLayout
    });
  } catch (error) {
    console.error('❌ Memory layout generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/visualization/structure', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log('\n📊 Generating division structure visualization...');

  try {
    const structure = await generateDivisionStructure(code);
    console.log(`✓ Division structure generated: ${structure.length} divisions`);
    res.json({
      success: true,
      structure
    });
  } catch (error) {
    console.error('❌ Division structure generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/visualization/trace', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  console.log('\n📊 Generating execution trace visualization...');

  try {
    const trace = await generateExecutionTrace(code);
    console.log(`✓ Execution trace generated: ${trace.length} steps`);
    res.json({
      success: true,
      trace
    });
  } catch (error) {
    console.error('❌ Execution trace generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/notebooks/save', (req, res) => {
  const { id, name, cells, comments } = req.body;

  notebooks.set(id, {
    id,
    name,
    cells,
    comments,
    updatedAt: new Date().toISOString()
  });

  console.log(`💾 Notebook saved: ${name} (${id})`);
  res.json({ success: true, id });
});

app.get('/api/notebooks/:id', (req, res) => {
  const notebook = notebooks.get(req.params.id);

  if (notebook) {
    console.log(`📂 Notebook loaded: ${notebook.name}`);
    res.json(notebook);
  } else {
    res.status(404).json({ error: 'Notebook not found' });
  }
});

wss.on('connection', (ws, req) => {
  const userId = req.headers['sec-websocket-key'];
  connections.set(userId, ws);

  console.log(`🔌 New connection: ${userId.substring(0, 8)}... (Total: ${connections.size})`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      connections.forEach((client, id) => {
        if (id !== userId && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    connections.delete(userId);
    console.log(`🔌 Connection closed: ${userId.substring(0, 8)}... (Total: ${connections.size})`);
  });

  ws.send(JSON.stringify({
    type: 'welcome',
    userId,
    connections: connections.size
  }));
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║           🚀 COBook Server Running                 ║
╠════════════════════════════════════════════════════╣
║  📡 API Server:     http://localhost:${PORT}       ║
║  🔌 WebSocket:      ws://localhost:${PORT}         ║
║  📝 Status:         Ready                          ║
║  🤖 AI Assistant:   ${process.env.GROQ_API_KEY ? '✓ Enabled' : '✗ Disabled'}                      ║
║  💾 Max Code Size:  50 MB                          ║
║  ⏱️  Compile Time:   60s timeout                   ║
║  ⚡ Execute Time:   30s timeout                    ║
║  📊 Visualization:  Flowchart, Data Flow, Memory   ║
║  🔢 Interactive I/O: ✓ Enabled                      ║
╚════════════════════════════════════════════════════╝
  `);

  console.log('\n📚 Available endpoints:');
  console.log('  POST /api/execute - Execute COBOL code');
  console.log('  POST /api/provide-input - Provide input to waiting program');
  console.log('  POST /api/ai-assist - Get AI assistance');
  console.log('  POST /api/visualization/flowchart - Generate flowchart');
  console.log('  POST /api/visualization/dataflow - Generate data flow');
  console.log('  POST /api/visualization/memory - Generate memory layout');
  console.log('  POST /api/visualization/structure - Generate division structure');
  console.log('  POST /api/visualization/trace - Generate execution trace');
  console.log('  GET  /api/health - Health check');
  console.log('  POST /api/notebooks/save - Save notebook');
  console.log('  GET  /api/notebooks/:id - Load notebook');
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');

  connections.forEach((ws) => {
    ws.close();
  });

  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');

  connections.forEach((ws) => {
    ws.close();
  });

  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
