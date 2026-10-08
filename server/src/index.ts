import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { setIo } from './lib/realtime';
import { verifyToken } from './middlewares/auth';

const server = http.createServer(createApp());
const io = new Server(server, { path: '/api/socket.io', cors: { origin: config.corsOrigins, credentials: true } });

// Each user joins a private room; the API emits messages and notifications to it.
io.use((socket, next) => {
  try {
    const token = String(socket.handshake.auth?.token ?? '');
    const u = verifyToken(token);
    socket.data.userId = u.id;
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});
io.on('connection', socket => { socket.join(`user:${socket.data.userId}`); });
setIo(io);

server.listen(config.port, () => console.log(`API on http://localhost:${config.port}`));
