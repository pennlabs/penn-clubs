#!/usr/bin/env node

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 4000;

const wss = new WebSocket.Server({
  port: PORT,
  clientTracking: true,
});

wss.on('listening', () => {
  console.log(`Web socket server started on port ${PORT}...`);
});

const clients = {};

class ProtocolServer {
  constructor(ws) {
    this.ws = ws;
    this.id = uuidv4();
    this.handlers = {};

    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      this.handlers[data.id](data);
    });
  }

  addMessageHandler(id, callback) {
    if (id === 'close') {
      this.ws.on('close', callback);
    }
    this.handlers[id] = callback;
  }

  getId() {
    return this.id;
  }

  sendMessage(id, data) {
    this.ws.send(JSON.stringify({id, ...data}));
  }

  sendToPeer(peer, id, data) {
    clients[peer].sendMessage(id, {from: this.id, ...data});
  }
}

wss.on('connection', (ws, req) => {
  console.log(`Connection from ${req.connection.remoteAddress}`);
  const handler = new ProtocolServer(ws);
  clients[handler.getId()] = handler;

  handler.addMessageHandler('hello', () => {
    handler.sendMessage('users', { myid: handler.getId(), users: Object.keys(clients) });
  });

  handler.addMessageHandler('offer', (data) => {
    handler.sendToPeer(data.to, 'offer', { offer: data.offer });
  });

  handler.addMessageHandler('answer', (data) => {
    handler.sendToPeer(data.to, 'answer', { answer: data.answer });
  });

  handler.addMessageHandler('ice', (data) => {
    handler.sendToPeer(data.to, 'ice', { ice: data.ice });
  });

  handler.addMessageHandler('close', () => {
    const myid = handler.getId();
    delete clients[myid];
    Object.values(clients).forEach(client => client.sendMessage('peerClose', {peer: myid}));
  });
});