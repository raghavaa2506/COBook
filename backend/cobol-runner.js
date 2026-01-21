const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, 'temp');

// Counter for generating short filenames
let fileCounter = 1;

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log('✓ Temp directory ready:', TEMP_DIR);
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

ensureTempDir();

// Clean up old temporary files (older than 1 hour)
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > oneHour) {
          await fs.unlink(filePath).catch(() => {});
        }
      } catch (err) {
        // File might have been deleted, continue
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Generate short filename (max 8 characters for COBOL compatibility)
function generateShortId() {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const counter = (fileCounter++).toString(36).padStart(2, '0');

  // Reset counter if it gets too large
  if (fileCounter > 1000) {
    fileCounter = 1;
  }

  // Return short ID (e.g., "p1a2b3c")
  return `p${timestamp.slice(-5)}${counter}`.substring(0, 8);
}

async function execCobol(code) {
  const startTime = Date.now();
  const id = generateShortId();
  const sourceFile = path.join(TEMP_DIR, `${id}.cob`);
  const executableFile = path.join(TEMP_DIR, `${id}`);

  try {
    // Write COBOL code to file with UTF-8 encoding
    await fs.writeFile(sourceFile, code, 'utf8');
    console.log(`\n📝 Compiling program: ${id}`);

    // Compile COBOL code with optimized settings for large programs
    const compileResult = await new Promise((resolve, reject) => {
      // Build compile command with proper flags
      const compileCmd = `cobc -x -free -std=cobol2014 -o "${executableFile}" "${sourceFile}" 2>&1`;

      exec(compileCmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for compilation output
        timeout: 60000, // 60 second timeout for compilation
        cwd: TEMP_DIR
      }, (error, stdout, stderr) => {
        const output = stdout + stderr;

        if (error) {
          console.log('❌ Compilation failed');
          resolve({
            success: false,
            output: output || error.message
          });
        } else {
          console.log('✅ Compilation successful');
          resolve({
            success: true,
            output: output
          });
        }
      });
    });

    if (!compileResult.success) {
      // Cleanup source file
      await fs.unlink(sourceFile).catch(() => {});

      // Format compilation error
      let errorMsg = compileResult.output;

      // Try to make error messages more readable
      if (errorMsg.includes('error:')) {
        const lines = errorMsg.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.includes('error:') ||
                 trimmed.includes('warning:') ||
                 (trimmed.length > 0 && !trimmed.startsWith('cobc:'));
        });
        errorMsg = lines.join('\n');
      }

      // Remove file path from error messages for cleaner output
      errorMsg = errorMsg.replace(new RegExp(sourceFile, 'g'), 'program.cob');

      return {
        output: '',
        error: errorMsg,
        executionTime: Date.now() - startTime
      };
    }

    console.log('▶️  Executing program...');

    // Execute compiled program with streaming output for large outputs
    const execResult = await new Promise((resolve, reject) => {
      const childProcess = spawn(executableFile, [], {
        timeout: 30000, // 30 second timeout for execution
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for program output
        env: { ...process.env, COB_SET_DEBUG: '0' },
        cwd: TEMP_DIR
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Collect stdout
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Prevent excessive output (limit to 1MB)
        if (stdout.length > 1024 * 1024) {
          if (!killed) {
            killed = true;
            childProcess.kill();
            resolve({
              success: false,
              output: stdout + '\n\n[Output truncated - exceeded 1MB limit]'
            });
          }
        }
      });

      // Collect stderr
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      childProcess.on('close', (code) => {
        if (!killed) {
          if (code === 0) {
            console.log('✅ Execution successful');
            resolve({ success: true, output: stdout, stderr: stderr });
          } else {
            console.log(`❌ Execution failed with code ${code}`);
            resolve({
              success: false,
              output: stderr || `Process exited with code ${code}\n${stdout}`
            });
          }
        }
      });

      // Handle timeout and errors
      childProcess.on('error', (error) => {
        if (!killed) {
          if (error.code === 'ETIMEDOUT') {
            console.log('⏱️  Execution timeout');
            resolve({
              success: false,
              output: 'Program execution timeout (30 seconds)\n\nLast output:\n' + stdout
            });
          } else {
            console.log('❌ Execution error:', error.message);
            resolve({ success: false, output: error.message });
          }
        }
      });
    });

    const executionTime = Date.now() - startTime;

    // Cleanup files
    try {
      await fs.unlink(sourceFile).catch(() => {});
      await fs.unlink(executableFile).catch(() => {});
      console.log('🧹 Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup warning:', cleanupError.message);
    }

    console.log(`⏱️  Total time: ${executionTime}ms\n`);

    return {
      output: execResult.output || 'Program executed successfully',
      error: execResult.success ? null : execResult.output,
      executionTime
    };

  } catch (error) {
    console.error('❌ Runtime error:', error);

    // Cleanup on error
    try {
      await fs.unlink(sourceFile).catch(() => {});
      await fs.unlink(executableFile).catch(() => {});
    } catch (cleanupError) {}

    return {
      output: '',
      error: `Runtime error: ${error.message}`,
      executionTime: Date.now() - startTime
    };
  }
}

// Test function to verify COBOL compiler is working
async function testCobolCompiler() {
  const testCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. Test.
       PROCEDURE DIVISION.
           DISPLAY 'COBOL Compiler Test OK'.
           STOP RUN.`;

  console.log('🧪 Testing COBOL compiler...');
  const result = await execCobol(testCode);

  if (result.error) {
    console.error('❌ COBOL compiler test failed:', result.error);
    console.error('⚠️  Make sure GnuCOBOL is installed: sudo apt install gnucobol');
  } else {
    console.log('✅ COBOL compiler test passed');
  }
}

// Run test on module load
testCobolCompiler();

module.exports = { execCobol };
