const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });
const waitingUsers = [];

wss.on('connection', (ws) => {
    if (waitingUsers.length > 0) {
        const pair = waitingUsers.pop();
        ws.partner = pair;
        pair.partner = ws;

        ws.send("🔗 Connected to a stranger!");
        pair.send("🔗 Connected to a stranger!");
    } else {
        waitingUsers.push(ws);
        ws.send("⌛ Waiting for a stranger to connect...");
    }

    ws.on('message', async (msg) => {
        const messageText = typeof msg === 'string' ? msg : await msg.text();
        if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
            ws.partner.send(messageText);
        }
        if (messageText === '__typing__' && ws.partner && ws.partner.readyState === WebSocket.OPEN) {
            ws.partner.send('__typing__');
        }
    });

    ws.on('close', () => {
        if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
            ws.partner.send("❌ Stranger disconnected.");
            ws.partner.partner = null;
        } else {
            const index = waitingUsers.indexOf(ws);
            if (index !== -1) waitingUsers.splice(index, 1);
        }
    });
});

console.log(`WebSocket server running on port ${PORT}`);
