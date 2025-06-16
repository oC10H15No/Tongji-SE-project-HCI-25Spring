# Vue.js 3D Map with Gesture & Voice Control System

An interactive 3D map application built with Vue.js + Mapbox GL JS + Voice Recognition + Gesture Recognition.

## Installation & Setup

### Quick Start

1. **Clone or Download Project**
   ```bash
   # Clone the git repository
   git clone git@github.com:oC10H15No/Tongji-SE-project-HCI-25Spring.git
   cd final
   
   # Or navigate directly to project directory
   cd /mnt/data/Data/Desktop/Homework/HCI/final
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open browser and visit: `http://localhost:3000`
   - Allow microphone and camera permissions

### Production Build

```bash
# Build for production
npm run build
```

## Features

### 3D Map Capabilities
- High-performance 3D map rendering powered by Mapbox GL JS
- Support for map zooming, rotation, tilting and other 3D operations
- Smooth map animations and transitions

### Voice Control
- Real-time voice recognition (based on Web Speech API)
- Support for Chinese voice commands
- Voice-powered location search
- Voice-controlled map navigation (zoom in/out, directional movement)
- Voice-activated positioning

### Gesture Recognition
- Real-time gesture recognition powered by MediaPipe
- Support for multiple gesture operations:
  - Open palm - Zoom in
  - OK gesture - Zoom out
  - Swipe gestures - Move map
- Live camera preview with gesture detection feedback

## Tech Stack

- **Frontend Framework**: Vue.js 3 (Composition API)
- **Map Engine**: Mapbox GL JS
- **Gesture Recognition**: MediaPipe Hands
- **Voice Recognition**: Web Speech API
- **Map Search**: Baidu Map JavaScript API
- **Build Tool**: Vite
- **Styling**: CSS3 + Gradient Animations



## Project Structure

```
final/
├── index.html              # Main HTML file
├── package.json            # Project config and dependencies
├── vite.config.js          # Vite build configuration
├── src/
│   ├── App.vue             # Main application component
│   ├── main.js             # Application entry point
│   ├── components/         # Vue components directory
│   │   ├── ControlPanel.vue      # Control panel
│   │   ├── VoiceComponent.vue    # Voice control component
│   │   ├── GestureComponent.vue  # Gesture control component
│   │   ├── SearchComponent.vue   # Search component
│   │   └── MapComponent.vue      # Map component
│   ├── services/           # Business logic services
│   │   ├── VoiceManager.js       # Voice recognition manager
│   │   ├── GestureManager.js     # Gesture recognition manager
│   │   ├── MapManager.js         # Map operation manager
│   │   ├── VoiceCommandProcessor.js   # Voice command processor
│   │   ├── GestureCommandProcessor.js # Gesture command processor
│   │   └── BaiduMapSearchService.js   # Baidu map search service
│   ├── utils/              # Utility functions
│   │   └── coordinateTransform.js # Coordinate transformation tools
│   └── config/             # Configuration files
│       └── systemConfig.js      # System configuration
└── README.md               # Project documentation
```



