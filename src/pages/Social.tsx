import { useState, useRef, useEffect } from 'react'
import { 
  Users, 
  MapPin, 
  MessageCircle, 
  Bell,
  UserPlus,
  Settings,
  Shield,
  Clock,
  Search,
  MoreVertical,
  Send,
  Heart,
  Share2,
  Camera,
  Video,
  Phone,
  X,
  Plus,
  Crown,
  Star,
  TrendingUp,
  Calendar,
  Filter,
  Hash
} from 'lucide-react'
import { useTransit } from '../contexts/TransitContext'
import toast from 'react-hot-toast'

interface Friend {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  currentLocation?: { lat: number; lng: number }
  currentLine?: string
  lastSeen: string
  status?: string
  level: number
  points: number
}

interface Group {
  id: string
  name: string
  description: string
  icon: string
  memberCount: number
  isActive: boolean
  lastActivity: string
  isAdmin: boolean
  members: Friend[]
}

interface Post {
  id: string
  author: Friend
  content: string
  image?: string
  timestamp: Date
  likes: number
  comments: number
  isLiked: boolean
  type: 'status' | 'achievement' | 'trip' | 'photo'
}

interface ChatMessage {
  id: string
  sender: Friend
  message: string
  timestamp: Date
  type: 'text' | 'image' | 'location'
}

const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Chinese Beaver',
    avatar: '🦫',
    isOnline: true,
    currentLocation: { lat: 43.6532, lng: -79.3832 },
    currentLine: '501 Queen',
    lastSeen: '2 min ago',
    status: 'On my way to work! 🚋',
    level: 5,
    points: 1250
  },
  {
    id: '2',
    name: 'Kevin Li',
    avatar: '🚌',
    isOnline: true,
    currentLocation: { lat: 43.6540, lng: -79.3840 },
    currentLine: '510 Spadina',
    lastSeen: '5 min ago',
    status: 'Great ride this morning!',
    level: 4,
    points: 980
  },
  {
    id: '3',
    name: 'Sarah Chen',
    avatar: '🚇',
    isOnline: false,
    lastSeen: '1 hour ago',
    status: 'Offline',
    level: 3,
    points: 750
  },
  {
    id: '4',
    name: 'Mike Johnson',
    avatar: '🚋',
    isOnline: true,
    currentLine: '504 King',
    lastSeen: '1 min ago',
    status: 'Heading to campus',
    level: 4,
    points: 920
  }
]

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Morning Commute',
    description: 'Daily commuters sharing tips and updates',
    icon: '🚌',
    memberCount: 12,
    isActive: true,
    lastActivity: '2 min ago',
    isAdmin: true,
    members: mockFriends.slice(0, 3)
  },
  {
    id: '2',
    name: 'Campus Crew',
    description: 'University students and staff',
    icon: '🎓',
    memberCount: 8,
    isActive: false,
    lastActivity: '1 hour ago',
    isAdmin: false,
    members: mockFriends.slice(1, 4)
  },
  {
    id: '3',
    name: 'Transit Enthusiasts',
    description: 'Fans of public transportation',
    icon: '🚋',
    memberCount: 25,
    isActive: true,
    lastActivity: '5 min ago',
    isAdmin: false,
    members: mockFriends
  }
]

const mockPosts: Post[] = [
  {
    id: '1',
    author: mockFriends[0],
    content: 'Just earned 50 points for my morning commute! 🚋 #transit #points',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    likes: 12,
    comments: 3,
    isLiked: true,
    type: 'achievement'
  },
  {
    id: '2',
    author: mockFriends[1],
    content: 'Beautiful sunrise from the 510 Spadina streetcar this morning! ☀️',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    likes: 8,
    comments: 1,
    isLiked: false,
    type: 'photo'
  },
  {
    id: '3',
    author: mockFriends[3],
    content: 'Completed my 100th trip today! 🎉 Thanks to everyone in the Morning Commute group for the support!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likes: 25,
    comments: 7,
    isLiked: true,
    type: 'achievement'
  }
]

const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    sender: mockFriends[0],
    message: 'Hey everyone! How was your commute today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    type: 'text'
  },
  {
    id: '2',
    sender: mockFriends[1],
    message: 'Great! The 510 was running smoothly this morning',
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    type: 'text'
  },
  {
    id: '3',
    sender: mockFriends[3],
    message: 'Anyone else notice the new digital displays on the 501?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'text'
  }
]

export default function Social() {
  const { state } = useTransit()
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'chat'>('feed')
  const [friends] = useState<Friend[]>(mockFriends)
  const [groups] = useState<Group[]>(mockGroups)
  const [posts] = useState<Post[]>(mockPosts)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [showPokeModal, setShowPokeModal] = useState(false)
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [parentTracking, setParentTracking] = useState(state.user.parentTracking)
  const [newPostContent, setNewPostContent] = useState('')
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handlePoke = (friend: Friend) => {
    setSelectedFriend(friend)
    setShowPokeModal(true)
  }

  const sendPoke = () => {
    if (selectedFriend) {
      toast.success(`Poked ${selectedFriend.name}!`)
      setShowPokeModal(false)
    }
  }

  const toggleParentTracking = () => {
    setParentTracking(!parentTracking)
    toast.success(parentTracking ? 'Parent tracking disabled' : 'Parent tracking enabled')
  }

  const handleAddFriends = () => {
    setShowAddFriendModal(true)
  }

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true)
  }

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group)
    setActiveTab('chat')
  }

  const handleMessageFriend = (friend: Friend) => {
    setSelectedFriend(friend)
    setActiveTab('chat')
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: {
        id: state.user.id || 'user',
        name: state.user.name,
        avatar: state.user.avatar,
        isOnline: true,
        lastSeen: 'now',
        level: state.user.level || 1,
        points: state.user.points || 0
      },
      message: chatInput.trim(),
      timestamp: new Date(),
      type: 'text'
    }

    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  const toggleLike = (post: Post) => {
    post.isLiked = !post.isLiked
    post.likes += post.isLiked ? 1 : -1
    toast.success(post.isLiked ? 'Post liked!' : 'Post unliked')
  }

  const createNewPost = () => {
    if (!newPostContent.trim()) return

    const newPost: Post = {
      id: Date.now().toString(),
      author: state.user,
      content: newPostContent.trim(),
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      isLiked: false,
      type: 'status'
    }

    // In a real app, this would be added to the posts array
    toast.success('Post created successfully!')
    setNewPostContent('')
    setShowNewPostModal(false)
  }

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'feed', label: 'Feed', icon: TrendingUp },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'groups', label: 'Groups', icon: Hash },
    { id: 'chat', label: 'Chat', icon: MessageCircle }
  ]

  return (
    <div className="space-y-6">
      {/* Social Header */}
      <div className="card transit-card">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Social Transit</h2>
          <p className="text-slate-700 dark:text-slate-400 mb-4">Connect with friends and family</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={handleAddFriends}
              className="btn-primary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friends
            </button>
            <button 
              onClick={handleCreateGroup}
              className="btn-secondary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search friends, groups, or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 input-modern"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`nav-item ${activeTab === tab.id ? 'nav-item-active' : ''}`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* New Post Button */}
          <div className="card">
            <button
              onClick={() => setShowNewPostModal(true)}
              className="w-full p-4 text-left text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{state.user.avatar}</div>
                <span>What's on your mind?</span>
              </div>
            </button>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="card">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="text-2xl">{post.author.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{post.author.name}</span>
                      <span className="text-sm text-slate-500">•</span>
                      <span className="text-sm text-slate-500">{post.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-300 mt-1">{post.content}</p>
                    {post.image && (
                      <img src={post.image} alt="Post" className="w-full h-48 object-cover rounded-lg mt-3" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => toggleLike(post)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        post.isLiked 
                          ? 'text-red-500' 
                          : 'text-slate-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-slate-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-slate-500 hover:text-green-500 transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Parent Tracking */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Parent Tracking</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-400">Share location with parents</p>
                </div>
              </div>
              <button
                onClick={toggleParentTracking}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  parentTracking ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    parentTracking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Friends List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Friends ({filteredFriends.length})</h3>
            
            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 glass rounded-xl hover:bg-white/90 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="text-2xl">{friend.avatar}</div>
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${
                        friend.isOnline ? 'bg-green-500' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{friend.name}</span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                          Level {friend.level}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-400 flex items-center">
                        {friend.isOnline ? (
                          <>
                            <MapPin className="h-3 w-3 mr-1" />
                            {friend.currentLine || 'Online'}
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {friend.lastSeen}
                          </>
                        )}
                      </div>
                      {friend.status && (
                        <div className="text-xs text-slate-500 mt-1">{friend.status}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePoke(friend)}
                      disabled={!friend.isOnline}
                      className={`p-2 rounded-lg transition-colors ${
                        friend.isOnline
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 cursor-not-allowed'
                      }`}
                      title="Poke"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleMessageFriend(friend)}
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors"
                      title="Message"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Groups ({filteredGroups.length})</h3>
            
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="glass rounded-xl p-4 hover:bg-white/90 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{group.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{group.name}</span>
                          {group.isAdmin && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-400">{group.description}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {group.memberCount} members • {group.lastActivity}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      group.isActive 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewGroup(group)}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => handleViewGroup(group)}
                      className="flex-1 btn-primary text-sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          {selectedGroup ? (
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{selectedGroup.icon}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedGroup.name}</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-400">{selectedGroup.memberCount} members</p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="ml-auto p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Chat Messages */}
              <div ref={chatContainerRef} className="h-64 overflow-y-auto space-y-3 mb-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender.id === (state.user.id || 'user') ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender.id === (state.user.id || 'user')
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{message.sender.avatar}</span>
                        <span className="text-xs opacity-75">{message.sender.name}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 input-modern"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : selectedFriend ? (
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-2xl">{selectedFriend.avatar}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedFriend.name}</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-400">
                    {selectedFriend.isOnline ? 'Online' : selectedFriend.lastSeen}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="ml-auto p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Chat Messages */}
              <div ref={chatContainerRef} className="h-64 overflow-y-auto space-y-3 mb-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender.id === (state.user.id || 'user') ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender.id === (state.user.id || 'user')
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 input-modern"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Active Chat</h3>
              <p className="text-slate-700 dark:text-slate-400 mb-4">Select a friend or group to start chatting</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTab('friends')}
                  className="btn-primary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Browse Friends
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="btn-secondary"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Browse Groups
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showPokeModal && selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Poke {selectedFriend.name}</h3>
            
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{selectedFriend.avatar}</div>
              <p className="text-slate-700 dark:text-slate-400">Send a friendly reminder to hurry up!</p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowPokeModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={sendPoke}
                className="flex-1 btn-primary"
              >
                Send Poke
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Create New Post</h3>
            
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-32 p-3 border border-slate-200 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex space-x-3 mt-4">
              <button 
                onClick={() => setShowNewPostModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={createNewPost}
                disabled={!newPostContent.trim()}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Friends</h3>
            
            <div className="text-center mb-6">
              <UserPlus className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-700 dark:text-slate-400">Find friends by username or scan QR code</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter username"
                className="w-full input-modern"
              />
              <button className="w-full btn-primary">
                <Camera className="h-4 w-4 mr-2" />
                Scan QR Code
              </button>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button 
                onClick={() => setShowAddFriendModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.success('Friend request sent!')
                  setShowAddFriendModal(false)
                }}
                className="flex-1 btn-primary"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-100 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-900 mb-4">Create New Group</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Group name"
                className="w-full input-modern"
              />
              <textarea
                placeholder="Group description"
                className="w-full h-20 p-3 border border-slate-200 dark:border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-slate-900 dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500"
              />
              <div className="flex space-x-2">
                {['🚌', '🎓', '🚋', '🚇', '🚎', '🚐'].map((icon) => (
                  <button
                    key={icon}
                    className="text-2xl p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-200 transition-colors"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button 
                onClick={() => setShowCreateGroupModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.success('Group created successfully!')
                  setShowCreateGroupModal(false)
                }}
                className="flex-1 btn-primary"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 