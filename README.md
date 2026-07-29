# Poker Calculator - Complete Setup Guide

## Prerequisites Setup (Brand New Computer)

### 1. Install Visual Studio Code
1. Download VS Code from https://code.visualstudio.com/
2. Run the installer and follow the setup wizard
3. Open VS Code after installation

### 2. Install Node.js
1. Download Node.js LTS version from https://nodejs.org/
2. Run the installer and follow the setup wizard
3. Verify installation by opening Command Prompt/PowerShell and running:
   ```
   node --version
   npm --version
   ```

### 3. Install Python (Required for C++ compilation)
1. Download Python 3.x from https://www.python.org/downloads/
2. Run the installer and **check "Add Python to PATH"**
3. Verify installation:
   ```
   python --version
   ```

### 4. Install Visual Studio Build Tools (Required for C++ compilation)
1. Download Visual Studio Build Tools from https://visualstudio.microsoft.com/downloads/
2. Select "Build Tools for Visual Studio 2019" (or latest)
3. During installation, select "Desktop development with C++"
4. This includes MSBuild compiler needed for native add-ons

### 5. Enable Devin (CLI Assistant)
1. Install Devin CLI by following instructions from https://devin.ai/
2. This enables AI-assisted development and code generation
3. Configure Devin to work with your project directory

## Project Setup

### 1. Clone/Download the Project
If starting from scratch, you'll need to:
- Clone the repository or download the project files
- Navigate to the project directory

### 2. Install Project Dependencies

#### Install Angular App Dependencies
1. Open Command Prompt/PowerShell
2. Navigate to the project root directory:
   ```
   cd C:\Users\<username>\Documents\Projects\poker-calc
   ```
   Replace `<username>` with your actual Windows username
3. Install Angular dependencies:
   ```
   npm install
   ```

#### Install Poker Simulator Dependencies
1. Navigate to the poker-simulator directory:
   ```
   cd poker-simulator
   ```
2. Install native add-on dependencies:
   ```
   npm install
   ```

### 3. Configure C++ IntelliSense
Add to `.vscode/c_cpp_properties.json` to prevent IntelliSense errors:
```json
"includePath": [
    "${workspaceFolder}/**",
    "C:\\Users\\<your-username>\\AppData\\Local\\node-gyp\\Cache\\<node-version>\\include\\node"
]
```
Replace `<your-username>` with your actual Windows username and `<node-version>` with your Node.js version (e.g., 22.14.0).

### 4. Download HandRanks.dat File
1. Go to https://github.com/christophschmalhofer/poker/blob/master/XPokerEval/XPokerEval.TwoPlusTwo/HandRanks.dat
2. Download the HandRanks.dat file
3. Place it in the `poker-simulator` directory (same level as binding.cpp)

### 5. Build Native C++ Add-on
1. Navigate to the poker-simulator directory:
   ```
   cd C:\Users\<username>\Documents\Projects\poker-calc\poker-simulator
   ```
   Replace `<username>` with your actual Windows username
2. Run the build script:
   ```
   npm run build
   ```
3. This compiles the C++ binding using node-gyp and Visual Studio Build Tools

## Starting the Applications

### Start the Poker Simulator Server
1. Open Command Prompt/PowerShell
2. Navigate to the poker-simulator directory:
   ```
   cd C:\Users\<username>\Documents\Projects\poker-calc\poker-simulator
   ```
   Replace `<username>` with your actual Windows username
3. Start the server:
   ```
   npm start
   ```
4. The server will start on http://localhost:3000
5. Keep this terminal window open

### Start the Angular App
1. Open a new Command Prompt/PowerShell window
2. Navigate to the project root directory:
   ```
   cd C:\Users\<username>\Documents\Projects\poker-calc
   ```
   Replace `<username>` with your actual Windows username
3. Start the Angular development server:
   ```
   npm start
   ```
4. The Angular app will open automatically in your browser at http://localhost:4200
5. Keep this terminal window open

## Development Workflow

### Recommended Terminal Setup
For development, it's recommended to have multiple terminal windows open:
- **Terminal 1**: Poker simulator server (running `npm start` in poker-simulator directory)
- **Terminal 2**: Angular development server (running `npm start` in project root)
- **Terminal 3**: For running build commands, git operations, etc.

### Using VS Code
1. Open the project folder in VS Code
2. Use the integrated terminal for running commands
3. VS Code will automatically detect the project structure
4. Use Devin CLI for AI-assisted code generation and debugging

### Common Development Tasks

#### Rebuild C++ Binding After Changes
If you modify `binding.cpp`:
```bash
cd poker-simulator
npm run build
```

#### Start Both Applications Quickly
You can start both applications by opening two terminal windows and running:
- Terminal 1: `cd poker-simulator && npm start`
- Terminal 2: `npm start` (from project root)

## Troubleshooting

### Build Errors
- **Python not found**: Ensure Python is installed and added to PATH
- **Build tools not found**: Install Visual Studio Build Tools with C++ support
- **node-gyp errors**: Try running `npm run configure` before `npm run build`

### Runtime Errors
- **HandRanks.dat not found**: Ensure the file is in the poker-simulator directory
- **Module not found**: Run `npm install` in both directories
- **Port already in use**: Kill existing Node.js processes with `taskkill /F /IM node.exe`

### Performance Issues
- **Large simulations (10B+)**: The system now supports up to 100 billion simulations with incremental statistics calculation
- **Memory crashes**: Ensure you have sufficient RAM for large simulations
- **Slow performance**: Check that OpenMP is working correctly (should use multiple CPU cores)

## Project Structure
```
poker-calc/
├── poker-simulator/          # Native C++ simulation engine
│   ├── binding.cpp          # C++ native add-on code
│   ├── binding.gyp          # Build configuration
│   ├── app.js               # Express server
│   ├── server.js            # HTTP server setup
│   └── package.json         # Dependencies
├── src/                     # Angular application
│   ├── app/
│   │   ├── app.component.ts # Main Angular component
│   │   ├── services/        # Angular services
│   │   └── models/          # Data models
│   └── ...
└── package.json             # Angular dependencies
```

## Current Performance
- **100M simulations**: ~23 seconds
- **1B simulations**: ~3.8 minutes  
- **10B simulations**: ~38 minutes
- **100B simulations**: ~6.4 hours (memory-efficient with incremental statistics)

## Known Issues
- Very large simulations (100B) may take several hours to complete
- Progress interpolation works best with 3-second polling interval
- Known card parameters (0,0,0) provide full random simulation