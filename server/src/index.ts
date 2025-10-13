import app from './app';
import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { prisma } from './prisma';

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ['http://localhost:4200'] } });

io.on('connection', (socket) => {
  socket.on('join', (matchId: string) => socket.join(matchId));
});

app.post('/messages/create-socket', async (req, res) => {
  const senderId = (req as any).user?.id;
  const { matchId, content } = req.body || {};
  if (!senderId || !matchId || !content) return res.status(400).json({ message: 'missing fields' });

  const msg = await prisma.message.create({ data: { matchId, senderId, content }, include: { sender: true } });
  io.to(matchId).emit('message:new', msg);
  res.status(201).json(msg);
});

server.listen(port, () => console.log(`API running on http://localhost:${port}`));
