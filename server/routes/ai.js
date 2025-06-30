import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat with AI for interview preparation
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    // Build conversation context
    let conversationContext = systemPrompt + '\n\n';
    
    // Add recent conversation history (last 6 messages to keep context manageable)
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      conversationContext += `${msg.type === 'user' ? 'Student' : 'Assistant'}: ${msg.content}\n`;
    }
    
    conversationContext += `Student: ${message}\nAssistant:`;

    // Generate response
    const result = await model.generateContent(conversationContext);
    const response = await result.response;
    const aiResponse = response.text();

    // Log the interaction (optional, for monitoring)
    console.log(`AI Chat - User: ${req.user.id}, Message length: ${message.length}, Response length: ${aiResponse.length}`);

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini AI Error:', error);
    
    // Provide fallback response
    let fallbackResponse = "I'm having trouble connecting right now. Here are some general interview tips:\n\n";
    fallbackResponse += "• Practice coding problems daily on LeetCode/GeeksforGeeks\n";
    fallbackResponse += "• Master data structures: arrays, linked lists, trees, graphs\n";
    fallbackResponse += "• Prepare behavioral stories using the STAR method\n";
    fallbackResponse += "• Research the company's products and culture\n";
    fallbackResponse += "• Practice explaining your thought process out loud\n\n";
    fallbackResponse += "Try asking me again in a moment!";

    res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// Get interview tips for specific companies
router.get('/company-tips/:company', authenticateToken, async (req, res) => {
  try {
    const { company } = req.params;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Provide concise interview preparation tips for ${company}. Include:
1. Brief interview process (2-3 lines)
2. Exactly 3 most asked coding questions with difficulty
3. 4 key preparation tips
4. Technical focus areas

Keep response under 250 words and use bullet points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tips = response.text();

    res.json({
      company,
      tips,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Company tips error:', error);
    res.status(500).json({ error: 'Failed to get company tips' });
  }
});

export default router;