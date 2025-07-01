import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  fallback?: boolean;
  source?: string;
}

interface AIInterviewPrepProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIInterviewPrep: React.FC<AIInterviewPrepProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hi! I'm your AI Interview Preparation Assistant. 🤖

I can help you prepare for interviews at specific companies by providing:
• Company-specific interview insights
• Top coding questions asked
• Interview tips and strategies
• Technical preparation guidance

Just tell me which company you're preparing for, and I'll provide tailored advice!

Example: "Help me prepare for Google software engineer interview"`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'fallback'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check AI service status when component mounts
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await api.get('/health');
      if (response.data.geminiConfigured) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('fallback');
      }
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setConnectionStatus('fallback');
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<{ response: string; fallback?: boolean; source?: string }> => {
    try {
      setError(null);
      
      // Send conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      console.log('Sending AI request...');
      const response = await api.post('/ai/chat', {
        message: userMessage,
        conversationHistory
      });

      console.log('AI Response received:', response.data);

      if (response.data.fallback) {
        setConnectionStatus('fallback');
        setError('Using fallback response - AI service temporarily unavailable');
      } else if (response.data.source === 'gemini') {
        setConnectionStatus('connected');
        setError(null);
      }

      return {
        response: response.data.response,
        fallback: response.data.fallback,
        source: response.data.source
      };
    } catch (error: any) {
      console.error('AI API Error:', error);
      setConnectionStatus('fallback');
      
      // Enhanced fallback based on user message
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('google')) {
        return {
          response: `🔍 **Google Interview Preparation**

**Interview Process:**
• Phone/Video screening (45 min)
• 4-5 onsite rounds (technical + behavioral)
• Focus on algorithms, system design, and Googleyness

**Top 3 Coding Questions:**
1. **Two Sum** (Easy) - Array manipulation and hash maps
2. **Longest Substring Without Repeating Characters** (Medium) - Sliding window
3. **Merge k Sorted Lists** (Hard) - Divide and conquer

**Key Tips:**
• Practice LeetCode medium/hard problems daily
• Study system design fundamentals
• Prepare STAR format behavioral stories
• Know Google's products and culture

**Technical Focus:**
• Data structures and algorithms
• System design at scale
• Code optimization
• Problem-solving approach`,
          fallback: true,
          source: 'fallback'
        };
      }
      
      if (lowerMessage.includes('microsoft')) {
        return {
          response: `💻 **Microsoft Interview Preparation**

**Interview Process:**
• Initial screening call
• 4-5 technical rounds
• Focus on problem-solving and collaboration

**Top 3 Coding Questions:**
1. **Reverse Linked List** (Easy) - Pointer manipulation
2. **Binary Tree Level Order Traversal** (Medium) - BFS/Queue
3. **Design LRU Cache** (Medium) - Hash map + doubly linked list

**Key Tips:**
• Emphasize teamwork and growth mindset
• Practice system design scenarios
• Know Microsoft's cloud services (Azure)
• Demonstrate leadership potential`,
          fallback: true,
          source: 'fallback'
        };
      }
      
      // Generic fallback
      setError('AI service temporarily unavailable - using cached response');
      return {
        response: `I'm having trouble connecting to the AI service right now. Here are some general interview tips:

• **Practice Daily:** Solve coding problems on LeetCode/GeeksforGeeks
• **Master Fundamentals:** Arrays, linked lists, trees, graphs, dynamic programming
• **Behavioral Prep:** Prepare STAR method stories
• **Company Research:** Study the company's products, culture, and recent news
• **Mock Interviews:** Practice explaining your thought process out loud

Try asking me again in a moment for AI-powered responses!`,
        fallback: true,
        source: 'fallback'
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponseData = await generateAIResponse(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponseData.response,
        timestamp: new Date(),
        fallback: aiResponseData.fallback,
        source: aiResponseData.source
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again!',
        timestamp: new Date(),
        fallback: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .split('\n')
      .map((line, index) => (
        <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
        </div>
      ));
  };

  const quickPrompts = [
    "Help me prepare for Google interview",
    "Top coding questions for FAANG",
    "System design interview tips",
    "Behavioral interview preparation",
    "Microsoft interview process",
    "Amazon leadership principles"
  ];

  const clearError = () => setError(null);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'fallback': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'fallback': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'AI Connected';
      case 'fallback': return 'Fallback Mode';
      default: return 'Checking...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Interview Preparation</h2>
              <div className={`flex items-center space-x-1 text-sm ${getStatusColor()}`}>
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                      {message.type === 'user' ? (
                        message.content
                      ) : (
                        <div className="space-y-1">
                          {formatMessage(message.content)}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs mt-2 flex items-center space-x-2 ${
                      message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.fallback && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Fallback
                        </span>
                      )}
                      {message.source === 'gemini' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-white">
            <p className="text-sm text-gray-600 mb-3">Quick start prompts:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-200 bg-white rounded-b-xl">
          <div className="flex space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about interview preparation for any company..."
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewPrep;