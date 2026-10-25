import { WebSocketServer, WebSocket } from "ws"

const wss = new WebSocketServer({ port: 8080 })

interface Room {
  id: string
  name: string
  color: string
}

const rooms: Room[] = [
  { id: 'red', name: 'Red Room', color: '#ef4444' },
  { id: 'blue', name: 'Blue Room', color: '#3b82f6' },
  { id: 'green', name: 'Green Room', color: '#22c55e' }
]

const roomSockets: Record<string, WebSocket[]> = {
  red: [],
  blue: [],
  green: []
}

wss.on('connection', (socket) => {
  let currentRoom: string | null = null

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      if (message.type === 'join' && message.payload?.roomId) {
        // Leave previous room if exists
        if (currentRoom) {
          roomSockets[currentRoom] = roomSockets[currentRoom].filter(s => s !== socket)
        }
        
        // Join new room
        currentRoom = message.payload.roomId
        roomSockets[currentRoom]?.push(socket)
        
        console.log(`User joined room: ${currentRoom}`)
      }
      
      if (message.type === 'message' && currentRoom && message.payload) {
        const broadcastMessage = {
          type: 'message',
          payload: {
            text: message.payload,
            room: currentRoom,
            timestamp: new Date().toLocaleTimeString()
          }
        }
        
        // Send to all sockets in the room
        roomSockets[currentRoom]?.forEach(s => {
          if (s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify(broadcastMessage))
          }
        })
      }
    } catch (error) {
      console.error('Error processing message:', error)
    }
  })

  socket.on('close', () => {
    if (currentRoom) {
      roomSockets[currentRoom] = roomSockets[currentRoom].filter(s => s !== socket)
    }
  })
})
