const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const router = express.Router();

// Twilio client setup (conditional)
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// LegalBot conversation state management
const conversations = new Map();

// LegalBot system prompt
const LEGALBOT_SYSTEM_PROMPT = `You are LegalBot, Oregon Legal Mind's AI legal assistant and sales representative. You are professional, knowledgeable, and helpful.

Your role:
1. Qualify prospects by learning about their practice area, firm size, and current challenges
2. Demonstrate Oregon Legal Mind's legal AI capabilities through conversation
3. Route qualified leads appropriately:
   - Solo practitioners → OpenClaw Starter ($1,000/month)
   - Small firms (2-10 attorneys) → Small Firm tier ($8,000/month)  
   - Medium firms (11-50 attorneys) → Mid-Firm tier ($20,000/month)
   - Large firms (50+ attorneys) → Enterprise tier ($50,000+/month)
4. For enterprise prospects, offer to connect them directly with Sean
5. Use the conversation itself as a product demonstration

Key points to mention:
- Oregon Legal Mind.ai offers AI-powered legal research, document analysis, and case collaboration
- You are demonstrating the AI capabilities right now through this conversation
- We offer local deployment options for complete data privacy and attorney-client privilege protection
- Our platform includes multi-attorney collaboration features unique in the market

Keep responses conversational, professional, and focused on their specific legal practice needs.`;

// Handle incoming voice calls from Twilio
router.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  
  // Initialize conversation state
  conversations.set(callSid, {
    stage: 'greeting',
    userInfo: {},
    startTime: new Date()
  });
  
  // Greeting message
  twiml.say({
    voice: 'Polly.Joanna',
    rate: 'medium'
  }, 'Hello! You\'ve reached LegalBot, Oregon Legal Mind\'s AI legal assistant. I\'m here to show you how AI can transform your legal practice. What type of law do you specialize in?');
  
  // Gather user response
  twiml.gather({
    input: 'speech',
    speechTimeout: 'auto',
    action: '/api/legalbot/process-speech',
    method: 'POST',
    speechModel: 'experimental_conversations'
  });
  
  // Fallback if no input
  twiml.say('I didn\'t catch that. Please tell me about your legal practice, or press any key to speak with our team directly.');
  twiml.redirect('/api/legalbot/voice');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Process speech input and generate AI response
router.post('/process-speech', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult;
  const conversation = conversations.get(callSid) || { stage: 'greeting', userInfo: {} };
  
  try {
    // Generate AI response using OpenAI or similar
    const aiResponse = await generateLegalBotResponse(speechResult, conversation);
    
    // Update conversation state
    conversation.lastUserInput = speechResult;
    conversation.lastBotResponse = aiResponse.text;
    conversation.stage = aiResponse.nextStage;
    
    // Update user info based on conversation
    if (aiResponse.extractedInfo) {
      Object.assign(conversation.userInfo, aiResponse.extractedInfo);
    }
    
    conversations.set(callSid, conversation);
    
    // Respond with AI-generated text
    twiml.say({
      voice: 'Polly.Joanna',
      rate: 'medium'
    }, aiResponse.text);
    
    // Determine next action
    if (aiResponse.nextStage === 'transfer') {
      twiml.say('Let me connect you with Sean right now for personalized assistance.');
      twiml.dial(process.env.SEAN_PHONE_NUMBER || '+15419149150');
    } else if (aiResponse.nextStage === 'complete') {
      twiml.say('Thank you for calling Oregon Legal Mind. Check your email for next steps, and visit oregonlegalmind.ai to get started. Have a great day!');
      twiml.hangup();
    } else {
      // Continue conversation
      twiml.gather({
        input: 'speech',
        speechTimeout: 'auto',
        action: '/api/legalbot/process-speech',
        method: 'POST',
        speechModel: 'experimental_conversations'
      });
      
      twiml.say('I didn\'t hear a response. Feel free to ask me anything about our legal AI platform, or I can connect you with our team.');
      twiml.redirect('/api/legalbot/voice');
    }
    
  } catch (error) {
    console.error('LegalBot processing error:', error);
    
    twiml.say('I\'m having trouble processing your request right now. Let me connect you directly with our team.');
    twiml.dial(process.env.SEAN_PHONE_NUMBER || '+15419149150');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle call completion
router.post('/call-complete', async (req, res) => {
  const callSid = req.body.CallSid;
  const conversation = conversations.get(callSid);
  
  if (conversation && conversation.userInfo) {
    // Save lead to database
    try {
      await saveLegalBotLead(conversation);
      
      // Send notification to Sean
      if (process.env.SEAN_PHONE_NUMBER) {
        await twilioClient.messages.create({
          body: `New LegalBot call: ${conversation.userInfo.practiceArea || 'Unknown'} - ${conversation.userInfo.firmSize || 'Unknown size'} - Interest: ${conversation.userInfo.interestLevel || 'High'}`,
          from: process.env.LEGALBOT_PHONE_NUMBER,
          to: process.env.SEAN_PHONE_NUMBER
        });
      }
      
    } catch (error) {
      console.error('Error saving LegalBot lead:', error);
    }
  }
  
  // Clean up conversation state
  conversations.delete(callSid);
  
  res.status(200).send('OK');
});

// SMS handler for text messages to LegalBot number
router.post('/sms', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const incomingMessage = req.body.Body.toLowerCase();
  const fromNumber = req.body.From;
  
  if (incomingMessage.includes('legal ai') || incomingMessage.includes('legalai')) {
    twiml.message('Hi! You\'ve reached Oregon Legal Mind. I\'m LegalBot, our AI legal assistant. Call me directly at this number to experience our legal AI platform, or visit oregonlegalmind.ai. What type of law do you practice?');
  } else {
    twiml.message('Thanks for texting! Call this number to speak with LegalBot, our AI legal assistant, or visit oregonlegalmind.ai to learn about our legal AI platform. For direct contact, text Sean at 541-914-9150.');
  }
  
  // Forward SMS to Sean
  try {
    await twilioClient.messages.create({
      body: `LegalBot SMS from ${fromNumber}: ${req.body.Body}`,
      from: process.env.LEGALBOT_PHONE_NUMBER,
      to: process.env.SEAN_PHONE_NUMBER
    });
  } catch (error) {
    console.error('Error forwarding SMS:', error);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Generate LegalBot response (placeholder for AI integration)
async function generateLegalBotResponse(userInput, conversation) {
  // This would integrate with OpenAI, Claude, or other AI service
  // For now, using rule-based responses with conversation flow
  
  const lowerInput = userInput.toLowerCase();
  const stage = conversation.stage;
  
  // Practice area detection
  let practiceArea = null;
  if (lowerInput.includes('personal injury') || lowerInput.includes('pi') || lowerInput.includes('accident')) {
    practiceArea = 'Personal Injury';
  } else if (lowerInput.includes('criminal') || lowerInput.includes('defense')) {
    practiceArea = 'Criminal Defense';
  } else if (lowerInput.includes('family') || lowerInput.includes('divorce')) {
    practiceArea = 'Family Law';
  } else if (lowerInput.includes('corporate') || lowerInput.includes('business')) {
    practiceArea = 'Corporate/Business';
  } else if (lowerInput.includes('real estate') || lowerInput.includes('property')) {
    practiceArea = 'Real Estate';
  } else if (lowerInput.includes('employment') || lowerInput.includes('labor')) {
    practiceArea = 'Employment Law';
  }
  
  // Firm size detection
  let firmSize = null;
  if (lowerInput.includes('solo') || lowerInput.includes('myself') || lowerInput.includes('just me')) {
    firmSize = 'Solo';
  } else if (lowerInput.match(/\b([2-9]|10)\b.*attorney/)) {
    firmSize = 'Small (2-10)';
  } else if (lowerInput.match(/\b(1[1-9]|[2-4][0-9]|50)\b.*attorney/)) {
    firmSize = 'Medium (11-50)';
  } else if (lowerInput.match(/\b([5-9][0-9]|[1-9][0-9]{2,})\b.*attorney/)) {
    firmSize = 'Large (50+)';
  }
  
  // Build response based on stage and input
  let response = {
    text: '',
    nextStage: 'qualification',
    extractedInfo: {}
  };
  
  if (practiceArea) response.extractedInfo.practiceArea = practiceArea;
  if (firmSize) response.extractedInfo.firmSize = firmSize;
  
  // Generate contextual response
  if (stage === 'greeting' || stage === 'qualification') {
    if (practiceArea && firmSize) {
      response.text = `Excellent! ${practiceArea} with a ${firmSize.toLowerCase()} practice is perfect for our platform. You're experiencing our AI capabilities right now through this conversation. Let me demonstrate how I'd help with a typical ${practiceArea.toLowerCase()} research task. Can you give me a hypothetical case scenario I could research for you?`;
      response.nextStage = 'demo';
    } else if (practiceArea) {
      response.text = `Great! ${practiceArea} is an excellent fit for our AI platform. How large is your firm? Are you a solo practitioner, or do you work with other attorneys?`;
      response.nextStage = 'qualification';
    } else if (firmSize) {
      response.text = `Perfect! A ${firmSize.toLowerCase()} practice can really benefit from AI automation. What area of law do you focus on?`;
      response.nextStage = 'qualification';
    } else {
      response.text = `I understand you're interested in legal AI. Could you tell me what type of law you practice and roughly how many attorneys are in your firm? This helps me show you the most relevant features.`;
      response.nextStage = 'qualification';
    }
  } else if (stage === 'demo') {
    response.text = `Based on that scenario, I would typically analyze relevant case law, identify key precedents, check jurisdiction-specific rules, and provide a research summary with citations - all in minutes rather than hours. This is exactly what Oregon Legal Mind delivers for ${practiceArea} cases. Based on your ${firmSize.toLowerCase()} practice, I'd recommend our ${getRecommendedTier(firmSize)} tier. Would you like me to connect you with Sean to discuss implementation, or would you prefer to start with our online demo?`;
    response.nextStage = 'closing';
  } else if (stage === 'closing') {
    if (lowerInput.includes('sean') || lowerInput.includes('connect') || lowerInput.includes('talk')) {
      response.text = `Perfect! I'm connecting you with Sean right now. He'll discuss your specific needs and can set up a personalized demo of our platform.`;
      response.nextStage = 'transfer';
    } else {
      response.text = `Excellent! Visit oregonlegalmind.ai to start your free trial, or I can send you a follow-up email with all the details. Thank you for experiencing Oregon Legal Mind's AI technology through this call. You've just seen how natural and powerful our legal AI can be!`;
      response.nextStage = 'complete';
      response.extractedInfo.interestLevel = 'High';
    }
  }
  
  return response;
}

// Get recommended pricing tier based on firm size
function getRecommendedTier(firmSize) {
  if (!firmSize) return 'OpenClaw Starter';
  
  switch (firmSize) {
    case 'Solo':
      return 'OpenClaw Starter ($1,000/month)';
    case 'Small (2-10)':
      return 'Small Firm ($8,000/month)';
    case 'Medium (11-50)':
      return 'Mid-Firm ($20,000/month)';
    case 'Large (50+)':
      return 'Enterprise (custom pricing)';
    default:
      return 'OpenClaw Starter';
  }
}

// Save LegalBot conversation as lead
async function saveLegalBotLead(conversation) {
  // This would save to PostgreSQL database
  // For now, just log the lead information
  console.log('LegalBot Lead Generated:', {
    source: 'LegalBot Voice',
    practiceArea: conversation.userInfo.practiceArea,
    firmSize: conversation.userInfo.firmSize,
    interestLevel: conversation.userInfo.interestLevel || 'Medium',
    callDuration: Math.floor((new Date() - conversation.startTime) / 1000),
    timestamp: new Date().toISOString()
  });
  
  // TODO: Integrate with leads database
  return true;
}

module.exports = router;