const express = require('express');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const router = express.Router();

// Setup email service
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Setup Twilio for SMS notifications
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// In-memory lead storage (should be replaced with PostgreSQL in production)
const leads = [];

// Submit lead form
router.post('/submit', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      lawFirm,
      practiceArea,
      firmSize,
      interestLevel,
      contactPreference,
      message
    } = req.body;

    // Validate required fields
    if (!firstName || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['firstName', 'email']
      });
    }

    // Create lead object
    const lead = {
      id: generateLeadId(),
      firstName,
      lastName,
      email,
      phone,
      lawFirm,
      practiceArea,
      firmSize,
      interestLevel: interestLevel || 'Medium',
      contactPreference: contactPreference || 'Email',
      message,
      source: 'Website Form',
      status: 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save lead
    leads.push(lead);

    // Send confirmation email to lead
    if (process.env.SENDGRID_API_KEY) {
      await sendConfirmationEmail(lead);
    }

    // Send SMS notification to Sean
    if (twilioClient && process.env.SEAN_PHONE_NUMBER) {
      await sendSMSNotification(lead);
    }

    // Log lead for monitoring
    console.log('New lead submitted:', {
      id: lead.id,
      name: `${firstName} ${lastName}`,
      firm: lawFirm,
      practiceArea,
      firmSize,
      source: 'Website Form'
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your interest! We\'ll be in touch soon.',
      leadId: lead.id
    });

  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({
      error: 'Failed to submit lead',
      message: 'Please try again or contact us directly'
    });
  }
});

// Get lead by ID
router.get('/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  res.json(lead);
});

// List all leads (admin endpoint)
router.get('/', (req, res) => {
  const { status, practiceArea, firmSize, limit = 50, offset = 0 } = req.query;
  
  let filteredLeads = [...leads];
  
  // Apply filters
  if (status) {
    filteredLeads = filteredLeads.filter(l => l.status === status);
  }
  if (practiceArea) {
    filteredLeads = filteredLeads.filter(l => l.practiceArea === practiceArea);
  }
  if (firmSize) {
    filteredLeads = filteredLeads.filter(l => l.firmSize === firmSize);
  }
  
  // Sort by creation date (newest first)
  filteredLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Apply pagination
  const paginatedLeads = filteredLeads.slice(offset, offset + parseInt(limit));
  
  res.json({
    leads: paginatedLeads,
    total: filteredLeads.length,
    offset: parseInt(offset),
    limit: parseInt(limit)
  });
});

// Update lead status
router.patch('/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  const { status, notes } = req.body;
  
  if (status) lead.status = status;
  if (notes) lead.notes = notes;
  lead.updatedAt = new Date().toISOString();
  
  res.json(lead);
});

// Demo request endpoint
router.post('/demo-request', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      practiceArea,
      preferredTime,
      message
    } = req.body;

    const lead = {
      id: generateLeadId(),
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      email,
      phone,
      lawFirm: company,
      practiceArea,
      interestLevel: 'High',
      contactPreference: 'Demo Call',
      message: `Demo request for ${preferredTime}. ${message || ''}`,
      source: 'Demo Request',
      status: 'Demo Requested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    leads.push(lead);

    // Send demo confirmation
    if (process.env.SENDGRID_API_KEY) {
      await sendDemoConfirmation(lead, preferredTime);
    }

    // High priority SMS to Sean for demo requests
    if (twilioClient && process.env.SEAN_PHONE_NUMBER) {
      await twilioClient.messages.create({
        body: `🎯 DEMO REQUEST: ${name} from ${company} - ${practiceArea} - Preferred: ${preferredTime}. Call: ${phone}`,
        from: process.env.LEGALBOT_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER,
        to: process.env.SEAN_PHONE_NUMBER
      });
    }

    res.status(201).json({
      success: true,
      message: 'Demo request received! We\'ll contact you within 2 hours to schedule.',
      leadId: lead.id
    });

  } catch (error) {
    console.error('Error processing demo request:', error);
    res.status(500).json({
      error: 'Failed to process demo request',
      message: 'Please call us directly at the number provided'
    });
  }
});

// Lead analytics endpoint
router.get('/analytics/summary', (req, res) => {
  const summary = {
    total: leads.length,
    byStatus: {},
    byPracticeArea: {},
    byFirmSize: {},
    bySource: {},
    recentActivity: leads
      .slice(-10)
      .reverse()
      .map(l => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`,
        firm: l.lawFirm,
        status: l.status,
        createdAt: l.createdAt
      }))
  };

  // Calculate summaries
  leads.forEach(lead => {
    summary.byStatus[lead.status] = (summary.byStatus[lead.status] || 0) + 1;
    summary.byPracticeArea[lead.practiceArea] = (summary.byPracticeArea[lead.practiceArea] || 0) + 1;
    summary.byFirmSize[lead.firmSize] = (summary.byFirmSize[lead.firmSize] || 0) + 1;
    summary.bySource[lead.source] = (summary.bySource[lead.source] || 0) + 1;
  });

  res.json(summary);
});

// Helper functions

function generateLeadId() {
  return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function sendConfirmationEmail(lead) {
  const msg = {
    to: lead.email,
    from: process.env.FROM_EMAIL || 'contact@oregonlegalmind.ai',
    subject: 'Thank you for your interest in Oregon Legal Mind.ai',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Oregon Legal Mind.ai</h1>
          <p>Revolutionary Legal AI Platform</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2>Thank you for your interest, ${lead.firstName}!</h2>
          
          <p>We received your inquiry about Oregon Legal Mind.ai and our revolutionary legal AI platform with LegalBot voice assistant.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Information:</h3>
            <p><strong>Practice Area:</strong> ${lead.practiceArea}</p>
            <p><strong>Firm Size:</strong> ${lead.firmSize}</p>
            <p><strong>Preferred Contact:</strong> ${lead.contactPreference}</p>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Our team will review your information and contact you within 2 hours</li>
            <li>We'll schedule a personalized demo of our legal AI platform</li>
            <li>You can call LegalBot directly at ${process.env.LEGALBOT_PHONE_NUMBER || '(Coming Soon)'} to experience our AI firsthand</li>
          </ul>
          
          <div style="background: #22c55e; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p><strong>Try LegalBot Now!</strong><br>
            Call ${process.env.LEGALBOT_PHONE_NUMBER || '(Number Coming Soon)'} to speak with our AI legal assistant</p>
          </div>
          
          <h3>Pricing Overview:</h3>
          <ul>
            <li><strong>OpenClaw Starter:</strong> $1,000/month - Perfect for solo practitioners</li>
            <li><strong>Small Firm:</strong> $8,000/month - Full collaboration features</li>
            <li><strong>Mid-Firm:</strong> $20,000/month - Advanced analytics & compliance</li>
            <li><strong>Enterprise:</strong> $50,000+/month - On-premises deployment with complete privacy</li>
          </ul>
          
          <p>Questions? Reply to this email or call Sean directly at <strong>541-914-9150</strong></p>
          
          <p>Best regards,<br>The Oregon Legal Mind Team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666;">
          <p>Oregon Legal Mind.ai | Revolutionizing Legal Practice with AI</p>
          <p>Visit: oregonlegalmind.ai</p>
        </div>
      </div>
    `
  };

  await sgMail.send(msg);
}

async function sendDemoConfirmation(lead, preferredTime) {
  const msg = {
    to: lead.email,
    from: process.env.FROM_EMAIL || 'contact@oregonlegalmind.ai',
    subject: 'Demo Request Confirmed - Oregon Legal Mind.ai',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Demo Request Confirmed!</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2>Hi ${lead.firstName},</h2>
          
          <p>We've received your demo request for Oregon Legal Mind.ai!</p>
          
          <div style="background: #22c55e; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>⏰ What Happens Next:</h3>
            <p><strong>Response Time:</strong> We'll contact you within 2 hours</p>
            <p><strong>Preferred Time:</strong> ${preferredTime}</p>
            <p><strong>Demo Length:</strong> 30 minutes</p>
          </div>
          
          <p>In the meantime, you can experience our AI technology right now:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px;">
              <h3>🤖 Call LegalBot Now!</h3>
              <p style="font-size: 24px; margin: 10px 0;"><strong>${process.env.LEGALBOT_PHONE_NUMBER || '(Number Coming Soon)'}</strong></p>
              <p>Experience our legal AI assistant live - every conversation is a product demonstration!</p>
            </div>
          </div>
          
          <p>Thank you for your interest in revolutionizing your legal practice!</p>
          
          <p>Best regards,<br>Sean Keener<br>Oregon Legal Mind.ai</p>
        </div>
      </div>
    `
  };

  await sgMail.send(msg);
}

async function sendSMSNotification(lead) {
  const message = `📝 New Oregon Legal Mind lead: ${lead.firstName} ${lead.lastName} - ${lead.lawFirm} - ${lead.practiceArea} (${lead.firmSize}) - ${lead.interestLevel} interest. Email: ${lead.email}`;
  
  await twilioClient.messages.create({
    body: message,
    from: process.env.LEGALBOT_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER,
    to: process.env.SEAN_PHONE_NUMBER
  });
}

module.exports = router;