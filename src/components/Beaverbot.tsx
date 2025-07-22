import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, HelpCircle, MapPin, Clock, Star, TrendingUp, Minimize2, Maximize2, Move } from 'lucide-react'
import toast from 'react-hot-toast'

interface BeaverbotProps {
  onClose: () => void
}

interface ChatMessage {
  type: 'user' | 'bot'
  message: string
  timestamp: Date
  id: string
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

export default function Beaverbot({ onClose }: BeaverbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: "Hi there! I'm Beaverbot, your friendly transit assistant! 🦫 How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 })
  const [size, setSize] = useState<Size>({ width: 400, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState<Size>({ width: 0, height: 0 })
  const [resizeOffset, setResizeOffset] = useState<Position>({ x: 0, y: 0 })
  const [isDragActive, setIsDragActive] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const dragTimeoutRef = useRef<number | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Save position and size to localStorage
  useEffect(() => {
    localStorage.setItem('beaverbotPosition', JSON.stringify(position))
    localStorage.setItem('beaverbotSize', JSON.stringify(size))
  }, [position, size])

  // Load saved position and size
  useEffect(() => {
    const savedPosition = localStorage.getItem('beaverbotPosition')
    const savedSize = localStorage.getItem('beaverbotSize')
    
    if (savedPosition) {
      const pos = JSON.parse(savedPosition)
      // Validate saved position is within current viewport
      const maxX = window.innerWidth - (savedSize ? JSON.parse(savedSize).width : 400)
      const maxY = window.innerHeight - (savedSize ? JSON.parse(savedSize).height : 600)
      
      if (pos.x >= 0 && pos.x <= maxX && pos.y >= 0 && pos.y <= maxY) {
        setPosition(pos)
      } else {
        // Reset to safe position if saved position is invalid
        setPosition({ x: 20, y: 20 })
      }
    }
    if (savedSize) {
      const size = JSON.parse(savedSize)
      // Ensure size is reasonable
      if (size.width >= 300 && size.height >= 400) {
        setSize(size)
      }
    }
  }, [])

  // Handle mouse events for dragging with improved performance
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Use requestAnimationFrame for smooth dragging
        requestAnimationFrame(() => {
          const newX = e.clientX - dragOffset.x
          const newY = e.clientY - dragOffset.y
          
          // Constrain to viewport boundaries with padding
          const maxX = window.innerWidth - size.width - 10
          const maxY = window.innerHeight - size.height - 10
          
          setPosition({
            x: Math.max(10, Math.min(newX, maxX)),
            y: Math.max(10, Math.min(newY, maxY))
          })
        })
      }
      if (isResizing) {
        requestAnimationFrame(() => {
          const newWidth = Math.max(300, Math.min(window.innerWidth - position.x - 10, resizeStart.width + (e.clientX - resizeOffset.x)))
          const newHeight = Math.max(400, Math.min(window.innerHeight - position.y - 10, resizeStart.height + (e.clientY - resizeOffset.y)))
          setSize({ width: newWidth, height: newHeight })
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setIsDragActive(false)
      
      // Clear any pending drag timeout
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
        dragTimeoutRef.current = null
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('mouseleave', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [isDragging, isResizing, isDragActive, dragOffset, resizeStart, resizeOffset, size, position])

  // Ensure window stays within viewport bounds
  useEffect(() => {
    const maxX = window.innerWidth - size.width - 10
    const maxY = window.innerHeight - size.height - 10
    
    if (position.x < 10 || position.x > maxX || position.y < 10 || position.y > maxY) {
      setPosition({
        x: Math.max(10, Math.min(position.x, maxX)),
        y: Math.max(10, Math.min(position.y, maxY))
      })
    }
  }, [position, size])

  // Handle window resize to keep chat window visible
  useEffect(() => {
    const handleWindowResize = () => {
      const maxX = window.innerWidth - size.width - 10
      const maxY = window.innerHeight - size.height - 10
      
      setPosition({
        x: Math.max(10, Math.min(position.x, maxX)),
        y: Math.max(10, Math.min(position.y, maxY))
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + R to reset position
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        resetPosition()
      }
      // Escape to close
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('resize', handleWindowResize)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('resize', handleWindowResize)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [position, size, onClose])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from header area
    if (headerRef.current?.contains(e.target as Node) && !isDragging) {
      e.preventDefault()
      e.stopPropagation()
      
      const rect = chatRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
        setIsDragging(true)
        
        // Add a small delay before activating drag to prevent accidental dragging
        dragTimeoutRef.current = setTimeout(() => {
          setIsDragActive(true)
        }, 50)
      }
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    const rect = chatRef.current?.getBoundingClientRect()
    if (rect) {
      setResizeStart({ width: size.width, height: size.height })
      setResizeOffset({
        x: e.clientX - rect.right,
        y: e.clientY - rect.bottom
      })
      setIsResizing(true)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    setIsMaximized(false)
  }

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false)
      setSize({ width: 400, height: 600 })
      // Ensure restored position is within viewport
      const maxX = window.innerWidth - 400 - 10
      const maxY = window.innerHeight - 600 - 10
      setPosition({ 
        x: Math.max(10, Math.min(20, maxX)), 
        y: Math.max(10, Math.min(20, maxY)) 
      })
    } else {
      setIsMaximized(true)
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 })
      setPosition({ x: 20, y: 20 })
    }
    setIsMinimized(false)
  }

  // Reset position if window is off-screen
  const resetPosition = () => {
    const maxX = window.innerWidth - size.width - 10
    const maxY = window.innerHeight - size.height - 10
    
    setPosition({
      x: Math.max(10, Math.min(maxX - 10, 20)),
      y: Math.max(10, Math.min(maxY - 10, 20))
    })
  }

  // Transit knowledge base
  const transitKnowledge = {
    routes: {
      '501': 'The 501 Queen streetcar runs from Neville Park to Long Branch, serving major destinations like Queen Street, the Beaches, and High Park.',
      '504': 'The 504 King streetcar runs from Dundas West to Broadview, serving downtown Toronto and the King Street corridor.',
      '510': 'The 510 Spadina streetcar runs from Union Station to Spadina Station, serving the University of Toronto and Chinatown.',
      '509': 'The 509 Harbourfront streetcar runs from Union Station to Exhibition Place, serving the waterfront and entertainment district.'
    },
    tips: [
      'Use the TransitLines page to see real-time updates and route information',
      'Tap the info button on any transit line to see detailed information',
      'Earn points by rating your transit experience',
      'Check the Rewards page for exclusive deals and perks',
      'Join groups in the Social section to connect with fellow commuters'
    ],
    features: [
      'Live transit tracking',
      'Route planning and navigation',
      'Real-time updates and delays',
      'Points and rewards system',
      'Social features and groups',
      'Premium features for enhanced experience'
    ]
  }

  // Generate AI-like response
  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! 👋 How can I assist you with your transit journey today?"
    }
    
    // Help responses
    if (message.includes('help') || message.includes('support')) {
      return "I'm here to help! 🦫 You can ask me about:\n• Transit routes and schedules\n• App features and navigation\n• Points and rewards\n• General transit questions\n\nWhat would you like to know?"
    }
    
    // Route information
    if (message.includes('route') || message.includes('line') || message.includes('bus') || message.includes('streetcar')) {
      if (message.includes('501')) {
        return `🚋 The 501 Queen streetcar:\n\n${transitKnowledge.routes['501']}\n\nThis is one of our most popular routes! You can track it in real-time on the TransitLines page.`
      }
      if (message.includes('504')) {
        return `🚋 The 504 King streetcar:\n\n${transitKnowledge.routes['504']}\n\nThis route is great for downtown travel and has frequent service!`
      }
      if (message.includes('510')) {
        return `🚋 The 510 Spadina streetcar:\n\n${transitKnowledge.routes['510']}\n\nPerfect for university students and Chinatown visitors!`
      }
      if (message.includes('509')) {
        return `🚋 The 509 Harbourfront streetcar:\n\n${transitKnowledge.routes['509']}\n\nGreat for waterfront activities and events at Exhibition Place!`
      }
      return "I can help you with route information! 🚋 Which specific route are you interested in? You can ask about routes like 501 Queen, 504 King, 510 Spadina, or 509 Harbourfront."
    }
    
    // Taubits and rewards
    if (message.includes('point') || message.includes('reward') || message.includes('earn')) {
      return "🎁 Taubits & Rewards:\n\n• Earn taubits by rating your transit experience\n• Complete trips to gain XP and level up\n• Redeem taubits for exclusive rewards\n• Premium users get bonus taubits\n\nCheck the Rewards page for current offers!"
    }
    
    // App features
    if (message.includes('feature') || message.includes('app') || message.includes('what can you do')) {
      return "🚀 App Features:\n\n" + transitKnowledge.features.map(feature => `• ${feature}`).join('\n') + "\n\nIs there a specific feature you'd like to learn more about?"
    }
    
    // Tips
    if (message.includes('tip') || message.includes('advice') || message.includes('how to')) {
      const randomTip = transitKnowledge.tips[Math.floor(Math.random() * transitKnowledge.tips.length)]
      return `💡 Pro Tip:\n\n${randomTip}\n\nWould you like more tips?`
    }
    
    // Premium features
    if (message.includes('premium') || message.includes('upgrade')) {
      return "✨ Premium Features:\n\n• Priority support and faster responses\n• Exclusive rewards and deals\n• Advanced route planning\n• Ad-free experience\n• Custom themes and avatars\n\nUpgrade anytime in your Profile settings!"
    }
    
    // General transit questions
    if (message.includes('schedule') || message.includes('time') || message.includes('when')) {
      return "⏰ For real-time schedules and updates, check the TransitLines page! You can see live arrival times and any service disruptions."
    }
    
    if (message.includes('delay') || message.includes('problem') || message.includes('issue')) {
      return "🚨 For service issues and delays, I recommend:\n\n• Check the TransitLines page for real-time updates\n• Contact transit support for specific issues\n• Use the app's reporting feature\n\nIs there a specific route or issue you're experiencing?"
    }
    
    // Default responses
    const defaultResponses = [
      "I'm not sure I understood that. Could you rephrase your question? 🤔",
      "That's an interesting question! Let me help you find the right information. What specifically would you like to know about transit?",
      "I'm here to help with transit-related questions! Try asking about routes, points, app features, or general transit tips.",
      "I'm still learning! Could you ask me about transit routes, app features, points, or general transit questions?"
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = generateResponse(userMessage.message)
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botResponse,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickReplies = [
    "How do I earn points?",
    "Tell me about route 501",
    "What are the app features?",
    "I need help with delays"
  ]

  if (isMinimized) {
    // Calculate safe position for minimized window
    const minWidth = 200
    const minHeight = 60
    const safeX = Math.max(20, Math.min(window.innerWidth - minWidth - 20, position.x))
    const safeY = Math.max(20, Math.min(window.innerHeight - minHeight - 20, position.y))
    
    return (
      <div 
        className="fixed z-50"
        style={{ left: safeX, top: safeY }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600">
          <div className="flex items-center space-x-2 p-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Beaverbot</span>
            <button
              onClick={toggleMinimize}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Restore"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={chatRef}
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: 300,
        minHeight: 400
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div 
        ref={headerRef}
        className={`flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600 cursor-move bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-2xl transition-all duration-200 ${
          isDragging ? 'shadow-2xl scale-[1.02] opacity-90' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDragging ? 'scale-110' : ''
          }`}>
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Beaverbot</h3>
            <p className="text-xs text-blue-100">{isDragging ? 'Dragging...' : 'Transit Assistant'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
            disabled={isDragging}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
            disabled={isDragging}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={resetPosition}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Reset Position"
            disabled={isDragging}
          >
            <Move className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
            disabled={isDragging}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.message}</div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 bg-slate-50 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(reply)}
                className="text-xs bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-b-2xl">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about transit..."
            className="flex-1 input-modern"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-slate-400 rounded-br"></div>
      </div>
    </div>
  )
} 