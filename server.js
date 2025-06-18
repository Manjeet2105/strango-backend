
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });
const waitingUsers = [];

function broadcastOnlineCount() {
    const countMsg = `__count__${wss.clients.size}`;
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(countMsg);
        }
    }
}

wss.on('connection', (ws) => {
    broadcastOnlineCount();

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

    ws.on('message', (msg) => {
        try {
            if (typeof msg === 'string' && msg.startsWith("__count__")) return;

            // Handle signaling JSON messages
            const data = JSON.parse(msg);
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        } catch (e) {
            // Fallback to plain text messages
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(msg);
            }
        }
    });

    ws.on('close', () => {
        broadcastOnlineCount();

        if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
            ws.partner.send("❌ Stranger disconnected.");
            ws.partner.partner = null;
        } else {
            const index = waitingUsers.indexOf(ws);
            if (index !== -1) waitingUsers.splice(index, 1);
        }
    });
});

console.log(`WebSocket server with signaling running on port ${PORT}`);
