import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export const initializeSocket = (server: Server) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');

    socket.on('disconnect', () => {
      console.log('Bir kullanıcı ayrıldı');
    });
  });

  return io;
};

export { io }; 