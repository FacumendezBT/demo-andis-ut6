require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class pixel {
    constructor(r, g, b) {
        this.r = Math.max(0, Math.min(255, parseInt(r))),
        this.g = Math.max(0, Math.min(255, parseInt(g))),
        this.b = Math.max(0, Math.min(255, parseInt(b)))
    }
}

const CANVAS_SIZE = 800;
const canvas = new Array(CANVAS_SIZE * CANVAS_SIZE).fill(new pixel(255, 255, 255));

// Paint AI events
const PAINT_EVENTS = {
    DRAW_PIXEL: 'draw_pixel',
    CANVAS_UPDATE: 'canvas_update',
    GET_CANVAS: 'get_canvas'
};

/**
 * recibe un json tipo
 * {
 *   x: 0,
 *   y: 0,
 *   pixel: {
 *     r: 0,
 *     g: 0,
 *     b: 0
 *   }
 * }
 */
function canvas_draw(data) {
    if (
        !Number.isInteger(data.x) ||
        !Number.isInteger(data.y)
    )
        return false;

    if (
        data.x < 0 || data.x >= CANVAS_SIZE ||
        data.y < 0 || data.y >= CANVAS_SIZE
    )
        return false;

    canvas[data.x + data.y * CANVAS_SIZE] = new pixel(data.pixel.r, data.pixel.g, data.pixel.b);
    return true;
}

/**
 * Handle new socket connecti {
 *   x: 0,
 *   y: 0,
 *   pixel: {
 *     r: 0,
 *     g: 0,
 *     b: 0
 *   }
 * }
 */
function handleConnection(socket, io) {
    console.log(`Client connected: ${socket.id}`);
    
    // Send current canvas state to newly connected client
    socket.emit(PAINT_EVENTS.CANVAS_UPDATE, {
        canvas: canvas,
        width: CANVAS_SIZE,
        height: CANVAS_SIZE
    });

    // Handle pixel drawing events
    socket.on(PAINT_EVENTS.DRAW_PIXEL, (data) => {
        try {
            console.log(`Received draw pixel from ${socket.id}:`, data);
            
            // Validate and draw pixel
            if (canvas_draw(data)) {
                // Broadcast the pixel update to all connected clients
                io.emit(PAINT_EVENTS.CANVAS_UPDATE, {
                    x: data.x,
                    y: data.y,
                    pixel: data.pixel,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`Broadcasted pixel update: (${data.x}, ${data.y})`);
            } else {
                socket.emit('error', { message: 'Invalid pixel coordinates' });
            }
        } catch (error) {
            console.error(`Error processing pixel draw from ${socket.id}:`, error);
            socket.emit('error', { message: 'Failed to process pixel draw' });
        }
    });

    // Handle request for full canvas
    socket.on(PAINT_EVENTS.GET_CANVAS, () => {
        socket.emit(PAINT_EVENTS.CANVAS_UPDATE, {
            canvas: canvas,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE
        });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
}

async function initPaintAI() {
    try {
        console.log('Initializing the best Paint AI WebSocket Service...');

        const app = express();
        const server = http.createServer(app);
        const io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Serve static files for testing
        app.use(express.static('public'));
        
        // Basic route for testing
        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/../public/index.html');
        });

        // Handle socket connections
        io.on('connection', (socket) => {
            handleConnection(socket, io);
        });

        const PORT = process.env.PORT || 3000;
        
        server
            .listen(PORT)
            .on('listening', () => {
                console.log(`Paint AI service running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
                console.log('Paint AI service started successfully', {
                    port: PORT,
                    environment: process.env.NODE_ENV || 'development',
                    timestamp: new Date().toISOString(),
                });
            })
            .on('error', error => {
                console.error(`Server failed to start on port ${PORT}`, {
                    error: error.message,
                });
                process.exit(1);
            });

        return server;
    } catch (error) {
        console.error(`Failed to initialize Paint AI Service: ${error.message}`, {
            stack: error.stack,
        });
        process.exit(1);
    }
}

module.exports = initPaintAI;

// Start the service if this file is run directly
if (require.main === module) {
    initPaintAI();
}