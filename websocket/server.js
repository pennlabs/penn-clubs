#!/usr/bin/env node

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

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
    this.authed = false;
    this.userInfo = {};

    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      const handler = this.handlers[data.id];
      if (handler)
      {
        handler(data);
      }
      else {
        this.sendError(`Unknown packet id: ${data.id}`);
      }
    });
  }

  addMessageHandler(id, callback) {
    if (id === 'close') {
      this.ws.on('close', callback);
    }
    this.handlers[id] = callback;
  }

  addAuthedMessageHandler(id, callback) {
    this.addMessageHandler(id, (data) => {
      if (!this.authed) {
        this.sendError(`Only authenticated clients can use this handler: ${id}`);
        return;
      }
      return callback(data)
    })
  }

  getId() {
    return this.id;
  }

  sendMessage(id, data) {
    this.ws.send(JSON.stringify({id, ...data}));
  }

  sendError(message) {
    this.sendMessage('error', { message: message });
  }

  sendToPeer(peer, id, data) {
    clients[peer].sendMessage(id, {from: this.id, ...data});
  }
}

wss.on('connection', (ws, req) => {
  console.log(`Connection from ${req.connection.remoteAddress}`);
  const handler = new ProtocolServer(ws);
  clients[handler.getId()] = handler;

  handler.addMessageHandler('auth', (data) => {
    const myid = handler.getId();
    jwt.verify(data.jwt, 'test_secret_CHANGE_ME_AND_MAKE_LONG', (err, decoded) => {
      if (err || !decoded) {
        return handler.sendError(`Invalid JWT received from client. Error: ${err}`);
      }
      handler.authed = true;
      handler.userInfo = decoded;
      const userInfos = {};
      Object.keys(clients).forEach(client => {
        userInfos[client] = clients[client].userInfo;
      });
      handler.sendMessage('users', { myid: myid, users: Object.keys(clients), userInfos: userInfos });
      Object.keys(clients).forEach(client => {
        if (client !== myid) {
          handler.sendToPeer(client, 'newUser', { peerId: myid, userInfo: decoded });
        }
      });
    });
  });

  handler.addAuthedMessageHandler('offer', (data) => {
    handler.sendToPeer(data.to, 'offer', { offer: data.offer });
  });

  handler.addAuthedMessageHandler('answer', (data) => {
    handler.sendToPeer(data.to, 'answer', { answer: data.answer });
  });

  handler.addAuthedMessageHandler('ice', (data) => {
    handler.sendToPeer(data.to, 'ice', { ice: data.ice });
  });

  handler.addMessageHandler('close', () => {
    const myid = handler.getId();
    delete clients[myid];
    Object.values(clients).forEach(client => client.sendMessage('peerClose', {peer: myid}));
  });
});