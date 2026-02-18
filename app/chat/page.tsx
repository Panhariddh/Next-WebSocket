'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const UserIcon = ({ name, isOnline }: { name: string; isOnline?: boolean }) => {
  const initial = name?.charAt(0).toUpperCase() || '?'
  return (
    <div className="relative flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                      flex items-center justify-center text-white font-semibold text-sm">
        {initial}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 
                         border-2 border-white rounded-full" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Helper: Format time
// ─────────────────────────────────────────────────────────────
const formatTime = (timestamp: string | number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────
// Message Bubble Component
// ─────────────────────────────────────────────────────────────
const MessageBubble = ({ 
  message, 
  isMine, 
  showSender 
}: { 
  message: any; 
  isMine: boolean; 
  showSender?: boolean 
}) => {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} group`}>
      
      {/* Avatar - only show for received messages */}
      {!isMine && <UserIcon name={message.from} isOnline={true} />}
      
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
        
        {/* Sender name for private messages */}
        {showSender && !isMine && (
          <span className="text-xs font-medium text-gray-500 ml-1 mb-0.5">
            {message.from}
          </span>
        )}
        
        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-150
            ${isMine 
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-md' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md hover:shadow-md'
            }`}
        >
          <p className="text-sm leading-relaxed break-words">{message.message}</p>
          
          {/* Time */}
          <span className={`text-[10px] block mt-1 text-right ${
            isMine ? 'text-blue-100' : 'text-gray-400'
          }`}>
            {formatTime(message.time)}
          </span>
        </div>
      </div>
      
      {/* Spacer for alignment */}
      {isMine && <div className="w-8" />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [message, setMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [myName, setMyName] = useState<string>('Me')
  const [isLoading, setIsLoading] = useState(true)
  const [myId, setMyId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  type ChatMessage = {
    id: number
    from: string
    senderId: number
    message: string
    time: string
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])

  // ───────── Socket Setup ─────────
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
      setIsLoading(false)
      newSocket.emit('load-messages')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      setIsLoading(true)
    })

    newSocket.on('public-message', msg =>
      setMessages(prev => [...prev, msg])
    )

    newSocket.on('private-message', msg =>
      setMessages(prev => [...prev, msg])
    )

    newSocket.on('load-messages', msgs => {
      setMessages(msgs)
      setIsLoading(false)
    })

    newSocket.on('private-history', msgs => {
      setMessages(msgs)
      setIsLoading(false)
    })

    newSocket.on('online-users', users =>
      setOnlineUsers(users)
    )

    newSocket.on('me', user => {
      setMyName(user.name);
      setMyId(user.id);
    });


    newSocket.on('typing', name => {
      console.log(name + ' is typing...');
    });

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // ───────── Auto-scroll ─────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ───────── Send Message ─────────
  const sendMessage = () => {
    if (!message.trim() || !socket) return

    if (selectedUser) {
      socket.emit('private-message', {
        targetUserId: selectedUser,
        message,
      })
    } else {
      socket.emit('public-message', message)
    }

    setMessage('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ───────── Get current chat partner name ─────────
  const getChatTitle = () => {
    if (selectedUser) {
      return onlineUsers.find((u: any) => u.id === selectedUser)?.name || 'User'
    }
    return 'Public Chat'
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Chats
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {onlineUsers.length} online
          </p>
        </div>

        {/* Public Chat Option */}
        <button
          onClick={() => {
            setSelectedUser(null)
            socket?.emit('load-messages')
          }}
          className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-xl transition-all duration-200
            ${selectedUser === null 
              ? 'bg-blue-50 border border-blue-200 text-blue-700' 
              : 'hover:bg-gray-50 text-gray-700'
            }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 
                          flex items-center justify-center text-white font-bold">
            🌍
          </div>
          <div className="text-left flex-1">
            <p className="font-medium text-sm">Public Chat</p>
            <p className="text-xs text-gray-500">Everyone</p>
          </div>
        </button>

        {/* Online Users List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Direct Messages
          </p>
          
          {onlineUsers.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">
              No users online
            </p>
          ) : (
            onlineUsers.map((user: any) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUser(user.id)
                  socket?.emit('load-private-messages', user.id)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                  ${selectedUser === user.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                  }`}
              >
                <UserIcon name={user.name} isOnline={true} />
                <div className="text-left flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    selectedUser === user.id ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedUser === user.id ? 'Active now' : 'Online'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => {
              socket?.disconnect()
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                      text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= CHAT PANEL ================= */}
      <main className="flex flex-1 flex-col">

        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {selectedUser ? (
              <>
                <UserIcon 
                  name={getChatTitle()} 
                  isOnline={onlineUsers.some((u: any) => u.id === selectedUser)} 
                />
                <div>
                  <h2 className="font-semibold text-gray-800">{getChatTitle()}</h2>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Online
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 
                                flex items-center justify-center text-white text-lg">
                  🌍
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Public Chat</h2>
                  <p className="text-xs text-gray-500">{onlineUsers.length + 1} participants</p>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <section className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-transparent">
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
            </div>
          )}

          {/* Message List */}
          {messages.map((m, i) => {
            const isMine = m.senderId === myId;
            const showSender = !isMine && selectedUser === null // Show sender name in public chat
            
            return (
              <MessageBubble 
                key={`${m.id}-${i}`}
                message={m} 
                isMine={isMine} 
                showSender={showSender}
              />
            )
          })}
          
          <div ref={messagesEndRef} />
        </section>

        {/* Connection Status Banner */}
        {!isConnected && !isLoading && (
          <div className="px-6 py-2 bg-amber-50 border-t border-amber-200 text-amber-800 text-xs text-center">
            Reconnecting...
          </div>
        )}

        {/* Input Area */}
        <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  socket?.emit('typing', selectedUser);
                }}
                onKeyDown={handleKeyDown}
                placeholder={selectedUser ? `Message ${getChatTitle()}...` : "Type a message..."}
                disabled={!isConnected}
                className="w-full border border-gray-300 rounded-2xl px-5 py-3 pr-12 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          disabled:bg-gray-100 disabled:cursor-not-allowed transition-all
                          placeholder:text-gray-400 text-gray-800"
              />
              {/* Character hint (optional) */}
              {message.length > 0 && (
                <span className="absolute right-4 bottom-3 text-[10px] text-gray-400">
                  {message.length}/500
                </span>
              )}
            </div>

            <button
              onClick={sendMessage}
              disabled={!message.trim() || !isConnected}
              className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl 
                        hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          
          {/* Helper text */}
          <p className="text-center text-[10px] text-gray-400 mt-2">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Enter</kbd> to send
          </p>
        </footer>

      </main>
    </div>
  )
}