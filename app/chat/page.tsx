'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// Simple SVG Icons to avoid extra dependencies
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
)

const StatusDot = ({ connected }: { connected: boolean }) => (
  <span className={`flex h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
)

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [message, setMessage] = useState('')

  type ChatMessage = {
    from: string
    message: string
    time: string
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      window.location.href = '/login'
      return
    }

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token },
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to WS')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('public-message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim() || !socket) return
    socket.emit('public-message', message)
    setMessage('')
    // Keep focus on input after sending
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 font-sans">
      {/* --- Header --- */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
            C
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Chat Room</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <StatusDot connected={isConnected} />
              <span>{isConnected ? 'Online' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- Message List --- */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="flex w-full">
                <div className="max-w-[80%] rounded-2xl bg-white px-5 py-3 shadow-sm border border-gray-100">
                  <p className="text-xs font-semibold text-blue-600">
                    {m.from}
                  </p>

                  <p className="text-sm leading-relaxed">
                    {m.message}
                  </p>

                  {/* <span className="text-[10px] text-gray-400">
                    {new Date(m.time).toLocaleTimeString()}
                  </span> */}
                  <span className="mt-1 block text-[10px] text-gray-400">
                    {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* --- Input Area --- */}
      <footer className="border-t border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-5 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !message.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </footer>
    </div>
  )
}