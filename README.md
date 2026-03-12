# Oregon Legal Mind.ai - Revolutionary Legal AI Platform

## 🚀 Project Overview

Oregon Legal Mind.ai is a comprehensive legal AI platform featuring LegalBot voice assistant, multi-attorney collaboration, and advanced document analysis. Built specifically for Bonnie Richardson's Friday conference presentation to hundreds of lawyers.

## ✨ Key Features

### 🤖 LegalBot Voice AI
- 24/7 voice assistant for legal consultations
- Real-time conversation with prospects
- Intelligent lead qualification and routing
- Live product demonstration through calls
- Twilio + ElevenLabs + OpenAI integration

### 📝 Lead Capture System
- Comprehensive interest forms
- Multiple contact methods (voice, SMS, email)
- Automatic SMS notifications to Sean (541-914-9150)
- Lead scoring and qualification
- CRM integration

### 💼 Multi-Tier Pricing
1. **OpenClaw Starter** - $1,000/month (solo practitioners)
2. **Small Firm** - $8,000/month (2-10 attorneys)
3. **Mid-Firm** - $20,000/month (11-50 attorneys)  
4. **Enterprise** - Custom pricing (50+ attorneys)

### 🔒 Privacy & Security
- Local deployment options for complete data privacy
- Attorney-client privilege protection
- End-to-end encryption
- HIPAA compliance ready

## 🛠️ Technical Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Redis
- **Voice AI**: Twilio + ElevenLabs + OpenAI Whisper
- **Email**: SendGrid
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Deployment**: Railway (recommended)

## 📋 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Core Settings
NODE_ENV=production
PORT=3000  
DOMAIN=oregonlegalmind.ai

# LegalBot Voice AI
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
LEGALBOT_PHONE_NUMBER=+1...
ELEVENLABS_API_KEY=sk-...
ELEVENLABS_VOICE_ID=...
OPENAI_API_KEY=sk-...

# Contact
SEAN_PHONE_NUMBER=+15419149150
FROM_EMAIL=contact@oregonlegalmind.ai
SENDGRID_API_KEY=SG...

# Database (Railway auto-provides)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
JWT_SECRET=...
SESSION_SECRET=...
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Production Deployment

The application is designed for Railway deployment with PostgreSQL and Redis services.

## 🌐 Pages & Routes

### Frontend Pages
- `/` - Main landing page with lead capture form
- `/pricing` - Detailed pricing tiers with ROI calculator
- `/contact` - Multiple contact methods and forms
- `/demo` - Product demonstrations and scenarios

### API Endpoints
- `POST /api/leads/submit` - Lead form submission
- `POST /api/leads/demo-request` - Demo scheduling  
- `GET /api/leads/analytics/summary` - Lead analytics
- `POST /api/legalbot/voice` - Twilio voice webhook
- `POST /api/legalbot/sms` - SMS handling
- `POST /api/demo/live-demo` - Live demo scenarios
- `POST /api/demo/roi-calculator` - ROI calculations

## 🤖 LegalBot Voice AI

LegalBot handles incoming phone calls with:

1. **Greeting & Qualification**: Practice area, firm size detection
2. **Live Demonstration**: Real legal research examples  
3. **Tier Recommendation**: Automatic pricing tier suggestion
4. **Lead Routing**: Transfer to Sean or complete with follow-up

### Conversation Flow
```
Greeting → Qualification → Demo → Closing → Transfer/Complete
```

### Voice Integration
- **Speech-to-Text**: OpenAI Whisper API
- **Voice Generation**: ElevenLabs professional voice
- **Call Handling**: Twilio Voice API
- **Lead Storage**: PostgreSQL database

## 📊 Lead Management

### Lead Sources
- Website forms
- LegalBot voice calls  
- SMS messages
- Demo requests

### Lead Scoring
- Practice area relevance
- Firm size category
- Interest level indicators
- Contact method preference

### Notifications
- Real-time SMS to Sean for all leads
- Email confirmations to prospects
- Lead scoring and priority routing

## 🎯 Conference Integration

Optimized for Bonnie Richardson's Friday legal conference:

- Prominent LegalBot phone number display
- Professional Oregon Legal Mind.ai branding
- Live demo capabilities during presentation
- Immediate lead capture and follow-up
- Multiple contact methods for different preferences

## 🔧 Development

### Project Structure
```
oregon-legal-mind-ai/
├── src/
│   ├── server.js           # Main application server
│   ├── routes/             # API route handlers
│   │   ├── leads.js        # Lead management
│   │   ├── legalbot.js     # Voice AI system
│   │   └── demo.js         # Demo scenarios
│   ├── models/             # Data models
│   ├── middleware/         # Express middleware
│   └── services/           # Business logic
├── public/                 # Static assets
│   ├── index.html          # Landing page
│   ├── pricing.html        # Pricing page
│   ├── contact.html        # Contact page
│   └── assets/             # CSS, JS, images
├── docs/                   # Documentation
└── deployment/             # Deploy configs
```

### Key Dependencies
- `express` - Web framework
- `twilio` - Voice/SMS integration
- `axios` - HTTP client for AI APIs
- `pg` - PostgreSQL client
- `redis` - Session/cache management
- `@sendgrid/mail` - Email service
- `helmet` - Security headers
- `express-rate-limit` - API protection

## 🚀 Deployment

### Railway Setup
1. Connect GitHub repository
2. Add PostgreSQL service
3. Add Redis service  
4. Configure environment variables
5. Deploy with custom domain

### Domain Configuration
- Purchase `oregonlegalmind.ai` domain
- Configure DNS to point to Railway
- Set up SSL certificate (automatic)
- Update environment variables

### Phone Number Setup
1. Purchase Twilio phone number
2. Configure voice webhook: `/api/legalbot/voice`  
3. Configure SMS webhook: `/api/legalbot/sms`
4. Update LegalBot number throughout application

## 📈 Success Metrics

### Conference Goals
- 100+ qualified prospects
- 75+ form submissions
- 25+ LegalBot voice calls  
- $5M+ pipeline value
- 50+ OpenClaw Starter signups
- $50K+ immediate monthly revenue

### Platform KPIs
- 90% reduction in legal research time
- 95%+ document analysis accuracy
- 80% daily active usage within firms
- 4.5+ star rating from legal professionals

## 🎨 Branding

### Oregon Legal Mind.ai Identity
- **Colors**: Deep navy (#1e3a8a), forest green (#059669), cyan (#22d3ee)  
- **Typography**: Inter font family, professional and modern
- **Logo Elements**: Brain + scales of justice + Oregon mountain outline
- **Voice**: Professional, trustworthy, innovative

### Visual Hierarchy
1. Oregon Legal Mind.ai branding
2. LegalBot contact prominence  
3. Professional legal aesthetic
4. Clear pricing and value proposition
5. Multiple contact methods

## 📞 Contact Information

- **LegalBot AI**: (Phone number to be configured)
- **Sean Direct**: 541-914-9150 (text)
- **Email**: contact@oregonlegalmind.ai
- **Website**: oregonlegalmind.ai

## 🔐 Security & Compliance

- End-to-end encryption
- Local deployment options
- Attorney-client privilege protection  
- GDPR/HIPAA compliance ready
- Audit trails and logging
- Role-based access controls

---

**Built for the Friday Legal Conference - Ready to revolutionize the legal industry!** 🏛️⚖️🤖