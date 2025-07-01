const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

let url = null

class pixel {
    constructor(r, g, b) {
        this.r = parseInt(r) % 256,
        this.g = parseInt(g) % 256,
        this.b = parseInt(b) % 256
    }
}

const CANVAS_SIZE = 800;
const canvas = new Array(CANVAS_SIZE * CANVAS_SIZE).fill(new pixel(255, 255, 255));

// Paint events
const PAINT_EVENTS = {
    DRAW_PIXELS_BATCH: 'draw_pixels_batch',
    CANVAS_UPDATE: 'canvas_update',
    GET_CANVAS: 'get_canvas',
    CLEAR_CANVAS: 'clear_canvas'
};

function canvas_draw_batch(pixelsData) {
    const validPixels = [];
    
    for (const data of pixelsData) {
        if (
            !Number.isInteger(data.x) ||
            !Number.isInteger(data.y) ||
            data.x < 0 || data.x >= CANVAS_SIZE ||
            data.y < 0 || data.y >= CANVAS_SIZE
        ) {
            continue;
        }
        
        canvas[data.x + data.y * CANVAS_SIZE] = new pixel(data.pixel.r, data.pixel.g, data.pixel.b);
        validPixels.push(data);
    }
    
    return validPixels;
}

function canvas_clear() {
    for (let i = 0; i < canvas.length; i++) {
        canvas[i] = new pixel(255, 255, 255);
    }
}

function gancho_discord() {
    if (url) {
        const noti = {
            content: "Nuevo usuario!🥳🥳"
        };

        fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noti)
        });
        console.log("Notificado por discord.")
    }
}

function add_url(new_url) {
    url = new_url
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

    gancho_discord();

    socket.emit(PAINT_EVENTS.CANVAS_UPDATE, {
        canvas: canvas,
        width: CANVAS_SIZE,
        height: CANVAS_SIZE
    });

    socket.on(PAINT_EVENTS.DRAW_PIXELS_BATCH, (pixelsData) => {
        try {
            console.log(`Received pixel batch from ${socket.id}: ${pixelsData.length} pixels`);
            
            // Process all pixels in the batch
            const validPixels = canvas_draw_batch(pixelsData);
            
            if (validPixels.length > 0) {
                // Broadcast the batch update to all connected clients
                io.emit(PAINT_EVENTS.CANVAS_UPDATE, {
                    pixels: validPixels,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`Broadcasted batch update: ${validPixels.length} pixels`);
            }
        } catch (error) {
            console.error(`Error processing pixel batch from ${socket.id}:`, error);
            socket.emit('error', { message: 'Failed to process pixel batch' });
        }
    });

    // Handle canvas clear events
    socket.on(PAINT_EVENTS.CLEAR_CANVAS, () => {
        try {
            console.log(`Received clear canvas from ${socket.id}`);
            
            // Clear the canvas
            canvas_clear();
            
            // Broadcast the clear to all connected clients
            io.emit(PAINT_EVENTS.CANVAS_UPDATE, {
                canvas: canvas,
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                timestamp: new Date().toISOString()
            });
            
            console.log('Broadcasted canvas clear');
        } catch (error) {
            console.error(`Error processing canvas clear from ${socket.id}:`, error);
            socket.emit('error', { message: 'Failed to clear canvas' });
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

async function initPaint() {
    try {
        console.log('Initializing the best Paint WebSocket Service...');

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

        // leer jsons
        app.use(express.json());

        // Basic route for testing
        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/../public/index.html');
        });

        // Handle socket connections
        io.on('connection', (socket) => {
            handleConnection(socket, io);
        });

        app.post("/", (req, res) => {
            const { url } = req.body
            add_url(url)
            console.log(`Hook ${url}`)
        });

        const PORT = 3000;

        server
            .listen(PORT)
            .on('listening', () => {
                console.log(`Paint service running on port ${PORT} in development mode`);
                console.log('Paint service started successfully', {
                    port: PORT,
                    environment: 'development',
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
        console.error(`Failed to initialize Paint Service: ${error.message}`, {
            stack: error.stack,
        });
        process.exit(1);
    }
}

initPaint();
