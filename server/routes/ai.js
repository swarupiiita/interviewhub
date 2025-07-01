import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini AI
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI initialized successfully');
} else {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

// Chat with AI for interview preparation
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!genAI || !process.env.GEMINI_API_KEY) {
      console.log('❌ Gemini API not available, using fallback');
      return provideFallbackResponse(message, res);
    }

    console.log('🤖 Processing AI request with Gemini...');

    // Get the generative model - using the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create system prompt for interview preparation
    const systemPrompt = `You are an AI Interview Preparation Assistant for IIITA students. Your role is to help students prepare for technical interviews at top companies.

IMPORTANT GUIDELINES:
- Keep responses MINIMAL and CONCISE (max 300 words)
- Always provide exactly 2-3 top coding questions when asked about a company
- Focus on actionable advice and specific preparation tips
- Use bullet points and clear formatting
- Be encouraging but realistic

RESPONSE FORMAT for company-specific questions:
1. Brief interview process overview (2-3 lines)
2. Exactly 2-3 top coding questions with difficulty levels
3. 3-4 key preparation tips
4. Technical focus areas (3-4 items)

COMPANIES TO FOCUS ON:
- Google (algorithm-heavy, system design)
- Microsoft (collaboration, problem-solving)
- Amazon (leadership principles, scalability)
- Meta/Facebook (social platforms, connections)
- Apple (product-focused, user experience)
- Netflix (scale, performance)
- Uber (real-world problems, optimization)

Keep responses practical and student-friendly. Always encourage practice and preparation.`;

    // Build conversation context with proper structure
    const contents = [];
    
    // Add system prompt as first message
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I\'m ready to help IIITA students with interview preparation. Please ask me about any company or interview topic!' }]
    });

    // Add recent conversation history (last 6 messages to keep context manageable)
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.type === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log('📤 Sending request to Gemini with', contents.length, 'messages');

    // Generate response using the correct API structure
    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    const aiResponse = response.text();

    if (!aiResponse || aiResponse.trim().length === 0) {
      console.log('❌ Empty response from Gemini, using fallback');
      return provideFallbackResponse(message, res);
    }

    console.log('✅ Successfully got response from Gemini');

    // Log the interaction (optional, for monitoring)
    console.log(`AI Chat - User: ${req.user.id}, Message length: ${message.length}, Response length: ${aiResponse.length}`);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      source: 'gemini'
    });

  } catch (error) {
    console.error('❌ Gemini AI Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      code: error.code
    });
    
    // Provide fallback response
    return provideFallbackResponse(req.body.message, res);
  }
});

// Get interview tips for specific companies
router.get('/company-tips/:company', authenticateToken, async (req, res) => {
  try {
    const { company } = req.params;
    
    if (!genAI || !process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Provide concise interview preparation tips for ${company}. Include:
1. Brief interview process (2-3 lines)
2. Exactly 3 most asked coding questions with difficulty
3. 4 key preparation tips
4. Technical focus areas

Keep response under 250 words and use bullet points.`;

    const result = await model.generateContent({
      contents: [{ 
        role: 'user',
        parts: [{ text: prompt }] 
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    });

    const response = await result.response;
    const tips = response.text();
    
    res.json({
      company,
      tips,
      timestamp: new Date().toISOString(),
      source: 'gemini'
    });

  } catch (error) {
    console.error('Company tips error:', error);
    res.status(500).json({ error: 'Failed to get company tips' });
  }
});

// Add a test endpoint to check available models
router.get('/test-models', authenticateToken, async (req, res) => {
  try {
    if (!genAI || !process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Test with a simple prompt
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'Hello, can you help with interview preparation?' }]
      }]
    });

    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      model: 'gemini-1.5-flash',
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Model test error:', error);
    res.status(500).json({ 
      error: 'Model test failed',
      details: error.message
    });
  }
});

// Fallback response function
function provideFallbackResponse(message, res) {
  const lowerMessage = message.toLowerCase();
  let fallbackResponse = "I'm having trouble connecting to the AI service right now. Here's some helpful information:\n\n";

  if (lowerMessage.includes('google')) {
    fallbackResponse = `🔍 **Google Interview Preparation**

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
• Study system design fundamentals (scalability, load balancing)
• Prepare STAR format behavioral stories
• Know Google's products and engineering culture

**Technical Focus:**
• Data structures and algorithms
• System design at scale
• Code optimization
• Problem-solving approach`;
  } else if (lowerMessage.includes('microsoft')) {
    fallbackResponse = `💻 **Microsoft Interview Preparation**

**Interview Process:**
• Initial screening call (30 min)
• 4-5 technical rounds with different teams
• Focus on problem-solving and collaboration

**Top 3 Coding Questions:**
1. **Reverse Linked List** (Easy) - Pointer manipulation
2. **Binary Tree Level Order Traversal** (Medium) - BFS/Queue
3. **Design LRU Cache** (Medium) - Hash map + doubly linked list

**Key Tips:**
• Emphasize teamwork and growth mindset
• Practice system design scenarios
• Know Microsoft's cloud services (Azure)
• Demonstrate leadership potential

**Technical Focus:**
• Object-oriented programming
• Cloud computing concepts
• Collaborative problem solving
• Code quality and testing`;
  } else if (lowerMessage.includes('amazon')) {
    fallbackResponse = `📦 **Amazon Interview Preparation**

**Interview Process:**
• Online assessment (coding + behavioral)
• 5-6 rounds including bar raiser
• Heavy focus on leadership principles

**Top 3 Coding Questions:**
1. **Valid Parentheses** (Easy) - Stack operations
2. **Rotting Oranges** (Medium) - BFS/Graph traversal
3. **Merge Intervals** (Medium) - Array manipulation

**Key Tips:**
• Master all 16 leadership principles with examples
• Practice system design for high scale
• Focus on customer obsession stories
• Prepare for behavioral deep dives

**Technical Focus:**
• Scalability and performance
• Distributed systems
• Leadership principles
• Customer-centric solutions`;
  } else {
    fallbackResponse += "• **Practice Daily:** Solve coding problems on LeetCode/GeeksforGeeks\n";
    fallbackResponse += "• **Master Fundamentals:** Arrays, linked lists, trees, graphs, dynamic programming\n";
    fallbackResponse += "• **Behavioral Prep:** Prepare STAR method stories for common questions\n";
    fallbackResponse += "• **Company Research:** Study the company's products, culture, and recent news\n";
    fallbackResponse += "• **Mock Interviews:** Practice explaining your thought process out loud\n";
    fallbackResponse += "• **System Design:** Learn basics of scalability, databases, and APIs\n\n";
    fallbackResponse += "Try asking me about specific companies like Google, Microsoft, or Amazon!";
  }

  res.json({
    response: fallbackResponse,
    timestamp: new Date().toISOString(),
    fallback: true,
    source: 'fallback'
  });
}

export default router;