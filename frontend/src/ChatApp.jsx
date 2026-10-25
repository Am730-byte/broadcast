import React, { useState, useEffect, useRef } from 'react'
import './ChatApp.css'

const ROOMS = [
  { id: 'red', name: 'Red Room', color: '#ef4444' },
  { id: 'blue', name: 'Blue Room', color: '#3b82f6' },
  { id: 'green', name: 'Green Room', color: '#22c55e' }
]

function ChatApp() {
  const [messages, setMessages] = useState([])
  const [username, setUsername] = useState('')
  const [inputUsername, setInputUsername] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [currentRoom, setCurrentRoom] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomColor, setRoomColor] = useState('')
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080')

    wsRef.current.onopen = () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
    }

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data.toString())
      
      if (message.type === 'message') {
        setMessages(prev => [...prev, { 
          user: username || 'Anonymous', 
          text: message.payload.text,
          room: message.payload.room,
          timestamp: message.payload.timestamp,
          isSelf: false
        }])
      }
    }

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed')
      setIsConnected(false)
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [username])

  const handleJoin = (roomId) => {
    if (!username.trim()) {
      alert('Please enter a username first')
      return
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Not connected to server')
      return
    }

    const joinMessage = {
      type: 'join',
      payload: { roomId }
    }

    wsRef.current.send(JSON.stringify(joinMessage))
    setCurrentRoom(roomId)
    setRoomColor(ROOMS.find(r => r.id === roomId)?.color || '')
    
    setMessages([{ 
      user: 'System', 
      text: `You joined ${ROOMS.find(r => r.id === roomId)?.name}`, 
      timestamp: new Date().toLocaleTimeString(),
      isSelf: true 
    }])
  }

  const handleLeave = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setCurrentRoom(null)
    setMessages([])
    setInputUsername('')
    setUsername('')
  }

  const handleBackToUsername = () => {
    setUsername('')
    setInputUsername('')
    setMessages([])
  }

  const handleBack = () => {
    setCurrentRoom(null)
    setMessages([])
    setInputMessage('')
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !wsRef.current || !currentRoom) return

    const sendMessage = {
      type: 'message',
      payload: inputMessage.trim()
    }
    
    wsRef.current.send(JSON.stringify(sendMessage))
    
    setMessages(prev => [...prev, { 
      user: username || 'Anonymous', 
      text: inputMessage.trim(),
      room: currentRoom,
      timestamp: new Date().toLocaleTimeString(),
      isSelf: true
    }])
    
    setInputMessage('')
  }

  const getRoomName = (roomId) => {
    return ROOMS.find(r => r.id === roomId)?.name || roomId
  }

  if (!username) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h1 style={{ color: '#1f2937' }}>Broadcast Chat</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="login-screen">
          <h2 style={{ color: '#1f2937' }}>Join the Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputUsername.trim()) {
                setUsername(inputUsername)
              }
            }}
            className="username-input"
            autoFocus
          />
          <p className="login-hint">Enter a username and press Enter</p>
        </div>
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h1 style={{ color: '#1f2937' }}>Broadcast Chat</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="login-screen">
          <h2 style={{ color: '#1f2937' }}>Select a Room</h2>
          <div className="room-selection">
            {ROOMS.map(room => (
              <button
                key={room.id}
                onClick={() => handleJoin(room.id)}
                className="room-button"
                style={{ border: `2px solid ${room.color}`, background: '#fff' }}
              >
                <span className="room-name" style={{ color: room.color }}>
                  {room.name}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
              onClick={handleBackToUsername}
              className="room-button"
              style={{ 
                border: '2px solid #6b7280', 
                background: '#f3f4f6', 
                color: '#374151',
                maxWidth: '200px' 
              }}
            >
              Back to Username
            </button>
          </div>
          <p className="login-hint">Choose a room to enter and start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-header" style={{ background: roomColor }}>
        <h1 style={{ color: '#fff' }}>{getRoomName(currentRoom)}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button 
            onClick={handleLeave}
            className="leave-button"
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#fff', 
              color: roomColor, 
              border: 'none', 
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Leave
          </button>
        </div>
      </div>

      <div className="messages-container" style={{ background: '#f9fafb' }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.isSelf ? 'message-self' : 'message-other'}`}
          >
            {!msg.isSelf && <span className="message-user" style={{ color: '#6b7280' }}>{msg.user}</span>}
            <div className="message-content">
              <span className="message-text">{msg.text}</span>
              <span className="message-time">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '0.5rem 1.5rem', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={handleBack}
          style={{ 
            padding: '0.5rem 1rem',
            background: '#e5e7eb',
            color: '#1f2937',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Back
        </button>
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
          disabled={!isConnected}
          className="message-input"
          style={{ color: '#1f2937', background: '#fff' }}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!isConnected || !inputMessage.trim()}
          className="send-button"
          style={{ background: roomColor }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatApp
