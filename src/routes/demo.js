const express = require('express');
const router = express.Router();

// Demo scenarios for legal AI platform
const demoScenarios = {
  personalInjury: {
    title: "Personal Injury Research Demo",
    scenario: "Client slipped and fell in a grocery store parking lot during rain",
    aiResponse: {
      caselaw: [
        "Smith v. Grocery Corp (2019) - Similar slip and fall case with 85% similarity",
        "Jones v. Retail Chain (2018) - Premises liability in parking lots during weather",
        "Williams v. SuperMart (2020) - Duty of care for store parking lot maintenance"
      ],
      keyLegalIssues: [
        "Premises liability under state statute §12.34.56",
        "Reasonable care standard for property maintenance",
        "Weather-related liability exclusions and limitations",
        "Comparative negligence considerations"
      ],
      suggestedActions: [
        "File discovery request for parking lot maintenance records",
        "Obtain weather reports for incident date/time",
        "Request security camera footage within 30 days",
        "Schedule expert inspection of parking lot conditions"
      ],
      estimatedValue: "$45,000 - $125,000 based on similar cases",
      timeToResearch: "3 minutes (vs 4-6 hours traditional research)"
    }
  },
  corporate: {
    title: "Contract Analysis Demo",
    scenario: "Reviewing a 50-page SaaS licensing agreement for unusual clauses",
    aiResponse: {
      riskAreas: [
        "Unlimited liability clause on page 23 - CRITICAL RISK",
        "Auto-renewal with 120-day notice requirement - HIGH RISK", 
        "IP indemnification gaps in sections 8.3-8.5 - MEDIUM RISK",
        "Termination rights heavily favor vendor - MEDIUM RISK"
      ],
      recommendations: [
        "Negotiate liability cap at $1M or 12 months fees",
        "Reduce auto-renewal notice to 30 days standard",
        "Add mutual IP indemnification protections",
        "Include termination for convenience with 90-day notice"
      ],
      complianceIssues: [
        "GDPR compliance clauses missing for EU data",
        "SOC 2 certification requirements not specified",
        "Data residency guarantees needed for regulated data"
      ],
      timeToReview: "8 minutes (vs 2-3 hours traditional review)"
    }
  },
  employment: {
    title: "Employment Law Research Demo", 
    scenario: "Wrongful termination case - Employee fired after requesting FMLA leave",
    aiResponse: {
      federalLaw: [
        "FMLA interference claim under 29 USC §2615",
        "Retaliation protections under §2615(b)",
        "Burden of proof standards from McDonnell Douglas framework"
      ],
      stateLaw: [
        "State family leave act protections (additional 6 weeks)",
        "State whistleblower protections if FMLA request was in writing",
        "At-will employment exceptions for protected activity"
      ],
      damages: [
        "Lost wages and benefits during wrongful termination period",
        "Liquidated damages equal to lost compensation under FMLA",
        "Attorney fees recoverable under federal statute",
        "Potential front pay if reinstatement not viable"
      ],
      timeToResearch: "4 minutes (vs 5-8 hours traditional research)"
    }
  }
};

// Live demo endpoint
router.post('/live-demo', (req, res) => {
  const { practiceArea, scenario } = req.body;
  
  let demoKey = 'personalInjury'; // default
  
  if (practiceArea) {
    const area = practiceArea.toLowerCase();
    if (area.includes('corporate') || area.includes('business')) {
      demoKey = 'corporate';
    } else if (area.includes('employment') || area.includes('labor')) {
      demoKey = 'employment';
    }
  }
  
  const demo = demoScenarios[demoKey];
  
  // Simulate AI processing time
  setTimeout(() => {
    res.json({
      success: true,
      demo: demo,
      practiceArea: practiceArea,
      customScenario: scenario,
      timestamp: new Date().toISOString(),
      processingTime: `${Math.floor(Math.random() * 5) + 2} minutes`
    });
  }, 2000); // 2 second delay to simulate processing
});

// Get available demo scenarios
router.get('/scenarios', (req, res) => {
  const scenarios = Object.keys(demoScenarios).map(key => ({
    id: key,
    title: demoScenarios[key].title,
    practiceArea: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }));
  
  res.json(scenarios);
});

// ROI Calculator endpoint
router.post('/roi-calculator', (req, res) => {
  const {
    firmSize = 1,
    avgHourlyRate = 350,
    researchHoursPerWeek = 10,
    documentReviewHoursPerWeek = 8
  } = req.body;
  
  // Calculate time savings
  const weeklyResearchSavings = researchHoursPerWeek * 0.8; // 80% time savings
  const weeklyDocumentSavings = documentReviewHoursPerWeek * 0.6; // 60% time savings
  const totalWeeklySavings = weeklyResearchSavings + weeklyDocumentSavings;
  
  // Calculate financial impact
  const weeklyCostSavings = totalWeeklySavings * avgHourlyRate;
  const monthlyCostSavings = weeklyCostSavings * 4.33; // Average weeks per month
  const annualCostSavings = monthlyCostSavings * 12;
  
  // Platform costs based on firm size
  let monthlyCost = 1000; // OpenClaw Starter
  if (firmSize >= 2 && firmSize <= 10) {
    monthlyCost = 8000; // Small Firm
  } else if (firmSize >= 11 && firmSize <= 50) {
    monthlyCost = 20000; // Mid-Firm  
  } else if (firmSize > 50) {
    monthlyCost = 50000; // Enterprise
  }
  
  const annualCost = monthlyCost * 12;
  const netAnnualSavings = annualCostSavings - annualCost;
  const roi = ((netAnnualSavings / annualCost) * 100).toFixed(1);
  const paybackMonths = (annualCost / monthlyCostSavings).toFixed(1);
  
  res.json({
    inputs: {
      firmSize,
      avgHourlyRate,
      researchHoursPerWeek,
      documentReviewHoursPerWeek
    },
    timeSavings: {
      weeklyResearchSavings: weeklyResearchSavings.toFixed(1),
      weeklyDocumentSavings: weeklyDocumentSavings.toFixed(1),
      totalWeeklySavings: totalWeeklySavings.toFixed(1),
      annualHoursSaved: (totalWeeklySavings * 52).toFixed(0)
    },
    financialImpact: {
      weeklyCostSavings: Math.round(weeklyCostSavings),
      monthlyCostSavings: Math.round(monthlyCostSavings),
      annualCostSavings: Math.round(annualCostSavings),
      monthlyCost: monthlyCost,
      annualCost: annualCost,
      netAnnualSavings: Math.round(netAnnualSavings),
      roi: roi + '%',
      paybackMonths: paybackMonths + ' months'
    },
    recommendation: getRecommendedTier(firmSize)
  });
});

// Case collaboration demo
router.post('/collaboration-demo', (req, res) => {
  // Simulate multi-attorney collaboration on a complex case
  const collaborationDemo = {
    caseName: "Johnson v. Medical Center - Medical Malpractice",
    attorneys: [
      { name: "Sarah Chen", role: "Lead Attorney", specialization: "Medical Malpractice" },
      { name: "Michael Rodriguez", role: "Research Attorney", specialization: "Expert Witnesses" },
      { name: "Jennifer Park", role: "Document Review", specialization: "Medical Records" }
    ],
    realTimeUpdates: [
      {
        timestamp: "2 minutes ago",
        attorney: "Michael Rodriguez",
        action: "Added expert witness research",
        content: "Found 3 qualified cardiothoracic surgery experts with malpractice testimony experience"
      },
      {
        timestamp: "5 minutes ago", 
        attorney: "Jennifer Park",
        action: "Flagged critical document",
        content: "Post-operative note shows deviation from standard care protocol"
      },
      {
        timestamp: "8 minutes ago",
        attorney: "Sarah Chen",
        action: "Updated case strategy",
        content: "Focus on informed consent issues based on new medical records analysis"
      }
    ],
    aiSuggestions: [
      "Similar informed consent case in 9th Circuit may strengthen your position",
      "Medical expert Dr. Thompson has testified in 23 similar cases with 87% plaintiff success rate",
      "Consider requesting additional surgical records from 6 months prior to incident"
    ],
    documentAnalysis: {
      totalDocuments: 1247,
      medicalRecords: 423,
      expertReports: 18,
      correspondence: 156,
      riskFlags: 7,
      keyEvidence: 23
    }
  };
  
  res.json({
    success: true,
    demo: collaborationDemo,
    timestamp: new Date().toISOString()
  });
});

function getRecommendedTier(firmSize) {
  if (firmSize === 1) {
    return {
      tier: "OpenClaw Starter",
      price: "$1,000/month",
      features: ["AI Legal Research", "Document Analysis", "OpenClaw Agent Integration", "Basic Support"]
    };
  } else if (firmSize <= 10) {
    return {
      tier: "Small Firm",
      price: "$8,000/month", 
      features: ["Full Legal AI Suite", "Multi-Attorney Collaboration", "Advanced Document Review", "Priority Support"]
    };
  } else if (firmSize <= 50) {
    return {
      tier: "Mid-Firm",
      price: "$20,000/month",
      features: ["Enterprise Legal AI", "Advanced Analytics", "Compliance Monitoring", "Dedicated Support"]
    };
  } else {
    return {
      tier: "Enterprise",
      price: "Custom Pricing",
      features: ["On-Premises Deployment", "Complete Data Privacy", "Custom Integrations", "White-Glove Support"]
    };
  }
}

module.exports = router;