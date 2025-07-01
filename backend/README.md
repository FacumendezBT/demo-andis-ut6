# Paint WebSocket Service

A simple real-time collaborative painting application

## Features

- Real-time collaborative painting over WebSocket
- Simple REST API for canvas state and health checks

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## WebSocket Events

### Client to Server
- `draw-start`: Start drawing a new stroke
- `draw-move`: Continue drawing (mouse move with drawing)
- `draw-end`: Finish drawing a stroke
- `clear-canvas`: Clear the entire canvas

### Server to Client
- `canvas-state`: Initial canvas state when connecting
- `draw-start`: Another user started drawing
- `draw-move`: Another user is drawing
- `draw-end`: Another user finished a stroke
- `canvas-cleared`: Canvas was cleared
- `user-left`: Another user disconnected

## Canvas Data Format

Drawing data includes:
- `x`, `y`: Coordinates
- `userId`: User identifier
- `timestamp`: When the drawing was made
- Additional stroke properties (color, width, etc.)
