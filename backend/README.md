# Paint WebSocket Service

A simple real-time collaborative painting application with AI image generation capabilities.

## Features

- Real-time collaborative painting over WebSocket
- AI-powered image generation based on canvas drawings
- Simple REST API for canvas state and health checks

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Set your Google Gemini API key in `.env`:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /generate-image
Generate an AI image prompt based on canvas data or custom prompt.

**Body:**
```json
{
  "canvasData": {...}, // Optional: Canvas drawing data
  "prompt": "string"   // Optional: Custom prompt
}
```

**Response:**
```json
{
  "success": true,
  "generatedPrompt": "AI-generated prompt based on canvas",
  "message": "Image generation prompt created successfully",
  "timestamp": "2025-07-01T..."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-01T...",
  "activeUsers": 3,
  "totalDrawings": 15
}
```

### GET /canvas-state
Get current canvas state.

**Response:**
```json
{
  "drawings": [...],
  "activeUsers": 3,
  "timestamp": "2025-07-01T..."
}
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

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)
- `GEMINI_API_KEY`: Google Gemini API key for AI features

## Canvas Data Format

Drawing data includes:
- `x`, `y`: Coordinates
- `userId`: User identifier
- `timestamp`: When the drawing was made
- Additional stroke properties (color, width, etc.)
