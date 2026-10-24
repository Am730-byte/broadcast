import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });
let userCount = 0;
wss.on("connection", (socket) => {
    userCount = userCount + 1;
    console.log(userCount);
    socket.on("message", (message) => {
        console.log("message received " + message.toString());
        setTimeout(() => {
            socket.send(message.toString() + ": sent from the server");
        }, 1000);
    });
});
//# sourceMappingURL=index.js.map