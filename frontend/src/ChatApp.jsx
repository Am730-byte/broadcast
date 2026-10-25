import React, { useState, useEffect, useRef } from 'react'
import './ChatApp.css'

function ChatApp() {
  const [messages, setMessages] = useState([])
  const [username, setUsername] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
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
      setMessages(prev => [...prev, { user: 'System', text: 'Connected to chat room', timestamp: new Date().toLocaleTimeString() }])
    }

    wsRef.current.onmessage = (event) => {
      const message = event.data.toString()
      console.log('Received message:', message)
      
      // Parse message format: "message: sent from the server"
      const parts = message.split(': sent from the server')
      const text = parts[0] || message
      
      setMessages(prev => [...prev, { 
        user: 'Someone', 
        text: text, 
        timestamp: new Date().toLocaleTimeString() 
      }])
    }

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed')
      setIsConnected(false)
      setMessages(prev => [...prev, { user: 'System', text: 'Disconnected from chat room', timestamp: new Date().toLocaleTimeString() }])
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !wsRef.current) return

    const messageData = inputMessage.trim()
    
    wsRef.current.send(messageData)
    
    setMessages(prev => [...prev, { 
      user: username || 'Anonymous', 
      text: messageData, 
      timestamp: new Date().toLocaleTimeString(),
      isSelf: true
    }])
    
    setInputMessage('')
  }

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Broadcast Chat</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {!username && (
        <div className="login-screen">
          <h2>Join the Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={handleUsernameChange}
            onKeyDown={(e) => e.key === 'Enter' && username.trim() && handleUsernameChange(e)}
            className="username-input"
            autoFocus
          />
          <p className="login-hint">Press Enter or click "Join" to start chatting</p>
        </div>
      )}

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.isSelf ? 'message-self' : 'message-other'}`}
          >
            {!msg.isSelf && <span className="message-user">{msg.user}</span>}
            <div className="message-content">
              <span className="message-text">{msg.text}</span>
              <span className="message-time">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
        />
        <button 
          onClick={handleSendMessage}
          disabled={!isConnected || !inputMessage.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatApp
