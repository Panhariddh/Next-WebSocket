'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')

    const newSocket = io('http://localhost:3000', {
      auth: {
        token,
      },
    })

    newSocket.on('connect', () => {
      console.log('Connected to WS')
    })

    newSocket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const sendMessage = () => {
    socket?.emit('message', message)
    setMessage('')
  }

  return (
    <div>
      <h1>Chat</h1>

      <div>
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  )
}
