const { io } = require('socket.io-client');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected! ID:', socket.id);
  console.log('Sending create_room...');
  socket.emit('create_room', { playerName: 'Test Node Client', totalRounds: 3 });
});

socket.on('room_created', (data) => {
  console.log('Room created successfully:', data);
  socket.disconnect();
  process.exit(0);
});

socket.on('room_updated', (data) => {
  console.log('Room updated:', data);
});

socket.on('error', (err) => {
  console.error('Error received from server:', err);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('Timed out waiting for response');
  socket.disconnect();
  process.exit(1);
}, 5000);
