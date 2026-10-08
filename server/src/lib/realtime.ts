import type { Server } from 'socket.io';

/** Socket.io server, set at startup. Emitting is a no-op in tests or before startup. */
let io: Server | null = null;
export const setIo = (s: Server) => { io = s; };
export const emitToUser = (userId: string, event: string, payload: unknown) => { io?.to(`user:${userId}`).emit(event, payload); };
