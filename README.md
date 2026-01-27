# COBook – An AI-Assisted Interactive COBOL Notebook with Visualization
## 🎯 Tool Description

**COBook** is a browser-based COBOL development and learning environment that combines the power of interactive notebooks, AI-powered assistance, and real-time code visualization. Designed specifically for novice programmers and students learning legacy programming languages, COBook transforms traditional COBOL education into an engaging, modern experience.

Inspired by the success of computational notebooks like Jupyter and Google Colab, COBook is the first comprehensive notebook-style platform built specifically for COBOL, empowering the next generation of developers to learn, experiment, and master critical legacy programming skills through an intuitive, feature-rich interface.

---

## 🌟 Key Features

- 📝 **Interactive Notebooks** – Mix executable COBOL code with rich documentation using Markdown  
- 🤖 **AI-Powered Assistance** – Get instant help with code generation, debugging, and explanations  
- 📊 **Real-Time Visualizations** – Flowcharts, data flow diagrams, and program structure analysis  
- ⚡ **Live Code Execution** – Compile and run COBOL programs instantly with GnuCOBOL  
- 🔄 **Interactive I/O** – Handle user input seamlessly within the notebook environment  
- 🎨 **Modern UI** – Clean, intuitive interface with syntax highlighting and auto-formatting  

---

## 💻 Installation

### Requirements (Accessing Deployed Version)

#### Software Requirements

**Web Browser (latest version recommended):**
- Google Chrome  
- Mozilla Firefox  
- Microsoft Edge  
- Safari (macOS/iOS)  
- Brave, Opera, etc.

**Operating System (any with browser support):**
- Windows 10/11  
- macOS 12+  
- Linux (Ubuntu 20.04+)  
- Android  
- iOS  

**Internet Connection:**
- Stable connection (recommended: ≥ 2 Mbps for optimal AI features)

#### Hardware Requirements

**Supported Devices:**
- Laptop or Desktop (Windows/macOS/Linux)  
- Tablet (iPad, Android tablets)

**Minimum Specifications:**
- RAM: At least 4 GB (8 GB recommended)  
- CPU: Any modern processor (Intel Core i3+, AMD Ryzen 3+, Apple M1+)  
- Screen Resolution: 1280×720 or higher (1920×1080 recommended)  
- Storage: 50 MB free space for cached notebooks  

---

## Requirements (Setting Up Locally)

### Hardware and Operating System

- OS: Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)  
- Processor: Intel Core i5/i7/i9, AMD Ryzen 5+, or Apple Silicon (M1/M2/M3)  
- RAM: Minimum 8 GB (16 GB recommended for development)  
- Storage: At least 2 GB free space  

> The software was tested on Ubuntu 22.04 LTS with 16 GB RAM and macOS Sonoma with 32 GB RAM.

### Software Dependencies

#### Backend
- Node.js version 18 or higher  
- GnuCOBOL 3.2+ (for COBOL compilation)  
- npm or yarn package manager  

#### Frontend
- React 18.2+  
- Modern web browser (Chrome/Firefox/Edge recommended)

#### AI Services (Optional)
- Groq API key (for AI assistance features)  
- Internet connection for AI-powered code generation  

### Required Node.js Packages

**Backend:**
- `express` (^4.18.0)  
- `cors` (^2.8.5)  
- `body-parser` (^1.20.0)  
- `ws` (WebSocket support)  
- `uuid` (session management)  
- `dotenv` (environment variables)  

**Frontend:**
- `react` (^18.2.0)  
- `react-dom` (^18.2.0)  
- `lucide-react` (icons)  
- `tailwindcss` (styling)  

---

## 🚀 Usage

COBook consists of a React-based frontend and a Node.js/Express backend with GnuCOBOL integration.

### 🌐 Live Demo

Visit the deployed version:  
`https://co-book-final.vercel.app/`

---

# 📦 Local Installation

Follow these steps to run COBook locally on your machine:

## 1. Clone the Repository

```bash
git clone https://github.com/raghavaa2506/COBook.git
cd COBook
```

## 2. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
npm install
```

Install GnuCOBOL on any system (if not already installed):

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install gnucobol
```

**macOS:**
```bash
brew install gnucobol
```

**Windows-WSL:**
```bash
# Open WSL terminal (Ubuntu)
sudo apt update
sudo apt install gnucobol
```

## 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# backend/.env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here  
```

## 4. Start the Backend Server

```bash
# In the backend directory
npm start
```

You should see:

```
🚀 COBook Server Running
📡 API Server: http://localhost:5000
```

## 5. Install Frontend Dependencies

Open a new terminal and navigate to the frontend directory:

```bash
cd ../frontend
npm install
```

## 6. Start the React Frontend

```bash
npm start
```

The application will automatically open in your browser at:

```
http://localhost:3000
```

## 7. Start Using COBook!

Once both servers are running:

1. Create code cells and text cells
2. Write COBOL programs
3. Run code and see instant output
4. Use AI assistance for help
5. Generate visualizations
6. Save and load notebooks

## 🏗️ **Architecture**

### **System Architecture Diagram**
![COBook](https://github.com/user-attachments/assets/0da97388-1d51-4a00-b7ff-a660a92ed4b5)

# Component Architecture

## Frontend (React)

* **App.js** - Main application orchestrator
* **CodeCell.js** - Code editor with syntax highlighting
* **TextCell.js** - Markdown editor with live preview
* **AIAssistant.js** - AI-powered code assistance panel
* **VisualizationPanel.js** - Flowchart and diagram renderer

## Backend (Node.js/Express)

* **server.js** - Main API server
* **cobol-runner.js** - COBOL compilation and execution handler
* **ai-assistant.js** - AI integration layer
* **visualization.js** - Code analysis and visualization generator

## Key Technologies

* **Frontend:** React, TailwindCSS, Lucide Icons
* **Backend:** Node.js, Express, WebSocket
* **Compiler:** GnuCOBOL 3.2+
* **AI:** Groq API (Llama models)
* **Storage:** Local file system, JSON-based notebooks

## 📸 Screenshots
### Main Frame
<img width="1291" height="889" alt="image" src="https://github.com/user-attachments/assets/ec671f69-3be5-48f8-9aab-04595b5f9a7d" />

### AI-Assisted features
<img width="1605" height="828" alt="image" src="https://github.com/user-attachments/assets/13e03bf9-a697-4098-9f2c-69f17534f682" />

### Visualisation
<img width="1536" height="891" alt="image" src="https://github.com/user-attachments/assets/c7b08534-191b-4041-be1b-bf9309030ba9" />

# 🎥 Demo Video
`https://youtu.be/kjdzJsCq_Lc`

# 👥 Contributors
### Raghavendra Pappu, Satish Pati, Dr.Sridhar Chimalakonda


