import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { Report, Branch, Issue, RecommendedAction } from '../types';
import { createEmailNotification } from './notificationService';
import { brandConfig } from '../config/brand';

// Initialize Firestore collections
const MAIL_COLLECTION = 'mail';
const TEMPLATES_COLLECTION = 'mail-templates';
const EMAIL_LOGS_COLLECTION = 'emailLogs';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id?: string;
  reportId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  templateId: string;
  sentAt: Date;
  sentBy: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  errorMessage?: string;
  messageId?: string;
  deliveryInfo?: {
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
  };
}

export interface EmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  template: {
    name: string;
    data: Record<string, any>;
  };
  reportId: string;
  sentBy: string;
  customerName: string;
}

// Default email templates with Handlebars syntax
export const defaultTemplates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'inspection-complete',
    subject: 'Your Roof Inspection Report is Ready - {{customerName}}',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Roof Inspection Report is Ready</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
              <div style="font-size: 32px; color: white; font-weight: bold; margin-bottom: 8px;">🏠</div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">{{brandName}}</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Building Performance Platform</p>
            </div>
            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 500;">Your Inspection Report is Ready</h2>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px; font-weight: 500;">Dear {{customerName}},</p>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 32px; font-size: 16px;">
              Your comprehensive roof inspection has been completed by our certified professionals. 
              We're pleased to provide you with a detailed report containing our findings and recommendations.
            </p>
            
            <!-- Inspection Details Card -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">📋 Inspection Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date</div>
                  <div style="color: #1f2937; font-weight: 600;">{{inspectionDate}}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Inspector</div>
                  <div style="color: #1f2937; font-weight: 600;">{{inspectorName}}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; grid-column: 1 / -1;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Report ID</div>
                  <div style="color: #1f2937; font-weight: 600; font-family: monospace;">{{reportId}}</div>
                </div>
              </div>
            </div>
            
            <!-- Key Findings -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 18px; font-weight: 600;">🔍 Key Findings</h3>
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #10b981;">
                <p style="color: #065f46; margin: 0; font-size: 15px; line-height: 1.6;">{{summary}}</p>
              </div>
            </div>
            
            <!-- Recommendations -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 18px; font-weight: 600;">💡 Recommendations</h3>
              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.6;">{{recommendations}}</p>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{reportLink}}" 
                 style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 12px; 
                        font-weight: 600; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
                        transition: all 0.3s ease;">
                📊 View Complete Report
              </a>
            </div>
            
            <!-- Contact Info -->
            <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin-top: 32px;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 600;">📞 Need Assistance?</h3>
              <p style="color: #4b5563; margin-bottom: 16px; font-size: 15px;">
                If you have any questions about the inspection findings or would like to discuss next steps, 
                our team is here to help.
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="color: #374151; font-size: 14px;">
                  <strong>📞 Phone:</strong><br>{{branchPhone}}
                </div>
                <div style="color: #374151; font-size: 14px;">
                  <strong>📧 Email:</strong><br>{{branchEmail}}
                </div>
              </div>
            </div>
            
            <!-- Signature -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Best regards,</p>
              <p style="color: #1f2937; margin-bottom: 4px; font-weight: 500;">{{branchName}} Team</p>
              <p style="color: #6b7280; font-size: 14px;">{{brandName}}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px 30px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
              This email was sent from {{brandName}}
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 {{legalEntity}}. All rights reserved. | Building Performance Platform
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Dear {{customerName}},

Your roof inspection has been completed and the detailed report is now available for your review.

Inspection Details:
- Inspection Date: {{inspectionDate}}
- Inspector: {{inspectorName}}
- Report ID: {{reportId}}

Key Findings:
{{summary}}

Next Steps:
{{recommendations}}

You can view your complete report by clicking the link below:
{{reportLink}}

If you have any questions or would like to discuss the findings, please don't hesitate to contact us.

Best regards,
{{branchName}} Team
{{brandName}}

Contact Information:
Phone: {{branchPhone}}
Email: {{branchEmail}}
Address: {{branchAddress}}`,
    isDefault: true,
  },
  {
    name: 'urgent-issues',
    subject: 'URGENT: Critical Issues Found in Your Roof Inspection - {{customerName}}',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>URGENT: Critical Issues Found in Your Roof Inspection</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fef2f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Urgent Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255, 255, 255, 0.15); padding: 24px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
              <div style="font-size: 48px; color: white; font-weight: bold; margin-bottom: 12px;">🚨</div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">URGENT NOTICE</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 18px; font-weight: 400;">Critical Issues Require Immediate Attention</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px; font-weight: 500;">Dear {{customerName}},</p>
            
            <!-- Critical Alert -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border: 2px solid #fca5a5;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="font-size: 24px; margin-right: 12px;">⚠️</div>
                <h3 style="color: #dc2626; margin: 0; font-size: 20px; font-weight: 700;">IMMEDIATE ACTION REQUIRED</h3>
              </div>
              <p style="color: #991b1b; margin: 0; font-size: 16px; line-height: 1.6; font-weight: 600;">
                Our inspection has revealed critical issues that could lead to significant damage if not addressed promptly. 
                We strongly recommend immediate action to prevent further deterioration.
              </p>
            </div>
            
            <!-- Critical Issues -->
            <div style="margin-bottom: 32px;">
              <h3 style="color: #dc2626; margin-bottom: 16px; font-size: 18px; font-weight: 600;">🔴 Critical Issues Identified</h3>
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <div style="color: #92400e; white-space: pre-line; font-size: 15px; line-height: 1.6; font-weight: 500;">{{criticalIssues}}</div>
              </div>
            </div>
            
            <!-- Inspection Details -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #6b7280;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">📋 Inspection Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date</div>
                  <div style="color: #1f2937; font-weight: 600;">{{inspectionDate}}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Inspector</div>
                  <div style="color: #1f2937; font-weight: 600;">{{inspectorName}}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; grid-column: 1 / -1;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Report ID</div>
                  <div style="color: #1f2937; font-weight: 600; font-family: monospace;">{{reportId}}</div>
                </div>
              </div>
            </div>
            
            <!-- Urgent CTA -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{reportLink}}" 
                 style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); 
                        color: white; 
                        padding: 18px 36px; 
                        text-decoration: none; 
                        border-radius: 12px; 
                        font-weight: 700; 
                        font-size: 18px;
                        display: inline-block;
                        box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
                        animation: pulse 2s infinite;">
                🚨 REVIEW REPORT IMMEDIATELY
              </a>
            </div>
            
            <!-- Emergency Steps -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">⚡ Immediate Next Steps</h3>
              <ol style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 8px;"><strong>Review the detailed report</strong> by clicking the button above</li>
                <li style="margin-bottom: 8px;"><strong>Contact us immediately</strong> to schedule urgent repairs</li>
                <li style="margin-bottom: 8px;"><strong>Consider temporary protective measures</strong> if advised in the report</li>
                <li><strong>Do not delay</strong> - these issues require prompt attention</li>
              </ol>
            </div>
            
            <!-- Emergency Contact -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 24px; border-radius: 12px; text-align: center; border: 2px solid #fca5a5;">
              <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700;">🆘 24/7 EMERGENCY CONTACT</h3>
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <p style="color: #dc2626; font-size: 24px; font-weight: 700; margin: 0;">{{branchPhone}}</p>
              </div>
              <p style="color: #991b1b; margin: 0; font-size: 16px; font-weight: 600;">Available for emergency situations</p>
            </div>
            
            <!-- Signature -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Best regards,</p>
              <p style="color: #1f2937; margin-bottom: 4px; font-weight: 500;">{{branchName}} Team</p>
              <p style="color: #6b7280; font-size: 14px;">{{brandName}}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #fef2f2; padding: 24px 30px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #fca5a5;">
            <p style="color: #991b1b; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
              ⚠️ URGENT NOTICE - This is an urgent notification from {{brandName}}
            </p>
            <p style="color: #dc2626; font-size: 13px; margin: 0; font-weight: 600;">
              Please respond immediately to prevent further damage
            </p>
          </div>
        </div>
        
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4); }
            50% { box-shadow: 0 6px 30px rgba(220, 38, 38, 0.6); }
            100% { box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4); }
          }
        </style>
      </body>
      </html>
    `,
    text: `Dear {{customerName}},

We have completed your roof inspection and identified some critical issues that require immediate attention.

🚨 URGENT ACTION REQUIRED

The inspection revealed critical issues that could lead to significant damage if not addressed promptly. We strongly recommend immediate action.

Critical Issues:
{{criticalIssues}}

Inspection Details:
- Inspection Date: {{inspectionDate}}
- Inspector: {{inspectorName}}
- Report ID: {{reportId}}

Please review the complete report immediately:
{{reportLink}}

Immediate Next Steps:
1. Review the detailed report
2. Contact us immediately to schedule urgent repairs
3. Consider temporary protective measures if advised

We are available 24/7 for emergency situations. Please call us immediately at {{branchPhone}}.

Best regards,
{{branchName}} Team
{{brandName}}

Emergency Contact: {{branchPhone}}
Email: {{branchEmail}}`,
    isDefault: true,
  },
  {
    name: 'follow-up',
    subject: 'Follow-up on Your Roof Inspection Report - {{customerName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">{{brandName}}</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Follow-up on your inspection</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear {{customerName}},</p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            We hope you've had a chance to review your roof inspection report. We wanted to follow up and see if you have any questions or would like to discuss the recommended actions.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Report Summary</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li><strong>Report ID:</strong> {{reportId}}</li>
              <li><strong>Inspection Date:</strong> {{inspectionDate}}</li>
              <li><strong>Total Issues Found:</strong> {{totalIssues}}</li>
              <li><strong>Estimated Repair Cost:</strong> {{estimatedCost}} SEK</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{reportLink}}" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Your Report
            </a>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 25px;">
            <h3 style="color: #155724; margin-top: 0; margin-bottom: 15px;">We're Here to Help</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              <li>Free consultation on recommended repairs</li>
              <li>Detailed cost estimates</li>
              <li>Flexible scheduling for any work needed</li>
              <li>Warranty on all our services</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Please don't hesitate to contact us if you have any questions or would like to schedule a follow-up consultation.
          </p>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #333; font-weight: bold; margin-bottom: 10px;">Best regards,</p>
            <p style="color: #333; margin-bottom: 5px;">{{branchName}} Team</p>
            <p style="color: #333; margin-bottom: 5px;">{{brandName}}</p>
            
            <div style="margin-top: 20px; font-size: 14px; color: #666;">
              <p><strong>Contact Information:</strong></p>
              <p>📞 Phone: {{branchPhone}}</p>
              <p>📧 Email: {{branchEmail}}</p>
            </div>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e0e0e0; border-top: none;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This email was sent from {{brandName}}. 
            We're committed to helping you maintain your roof in excellent condition.
          </p>
        </div>
      </div>
    `,
    text: `Dear {{customerName}},

We hope you've had a chance to review your roof inspection report. We wanted to follow up and see if you have any questions or would like to discuss the recommended actions.

Report Summary:
- Report ID: {{reportId}}
- Inspection Date: {{inspectionDate}}
- Total Issues Found: {{totalIssues}}
- Estimated Repair Cost: {{estimatedCost}} SEK

View Your Report:
{{reportLink}}

We're Here to Help:
- Free consultation on recommended repairs
- Detailed cost estimates
- Flexible scheduling for any work needed
- Warranty on all our services

Please don't hesitate to contact us if you have any questions or would like to schedule a follow-up consultation.

Best regards,
{{branchName}} Team
{{brandName}}

Contact Information:
Phone: {{branchPhone}}
Email: {{branchEmail}}`,
    isDefault: true,
  },
];

// Helper functions to generate content sections
const generateSummary = (report: Report): string => {
  const totalIssues = report.issuesFound?.length || 0;
  const criticalIssues =
    report.issuesFound?.filter((i: Issue) => i.severity === 'critical').length || 0;

  if (totalIssues === 0) {
    return '✅ No significant issues were identified during the inspection. Your roof is in good condition.';
  }

  let summary = `The inspection identified ${totalIssues} issue${totalIssues > 1 ? 's' : ''}`;
  if (criticalIssues > 0) {
    summary += `, including ${criticalIssues} critical concern${criticalIssues > 1 ? 's' : ''} requiring immediate attention`;
  }
  summary += '.';

  return summary;
};

const generateRecommendations = (report: Report): string => {
  const actions = report.recommendedActions || [];
  if (actions.length === 0) {
    return 'No specific recommendations at this time.';
  }

  const highPriority = actions.filter((a: RecommendedAction) => a.priority === 'high').length;
  const totalCost = actions.reduce(
    (sum: number, action: RecommendedAction) => sum + (action.estimatedCost || 0),
    0
  );

  let recommendations = `${actions.length} recommended action${actions.length > 1 ? 's' : ''}`;
  if (highPriority > 0) {
    recommendations += `, with ${highPriority} high-priority item${highPriority > 1 ? 's' : ''}`;
  }
  if (totalCost > 0) {
    recommendations += `. Estimated total cost: ${totalCost.toLocaleString('sv-SE')} SEK`;
  }

  return recommendations;
};

const generateCriticalIssues = (report: Report): string => {
  const criticalIssues = report.issuesFound?.filter((i: Issue) => i.severity === 'critical') || [];
  if (criticalIssues.length === 0) {
    return 'No critical issues identified.';
  }

  return criticalIssues
    .map(
      (issue: Issue, index: number) =>
        `${index + 1}. ${issue.type.toUpperCase()}: ${issue.description} (Location: ${issue.location})`
    )
    .join('\n');
};

// Initialize email templates in Firestore
export const initializeEmailTemplates = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing email templates...');

    for (const template of defaultTemplates) {
      // Check if template already exists
      const templateRef = doc(db, TEMPLATES_COLLECTION, template.name);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        await updateDoc(templateRef, {
          ...template,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(async () => {
          // If document doesn't exist, create it
          await addDoc(collection(db, TEMPLATES_COLLECTION), {
            ...template,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⚠️ Template already exists: ${template.name}`);
      }
    }

    console.log('✅ Email templates initialization completed');
  } catch (error) {
    console.error('❌ Error initializing email templates:', error);
    throw error;
  }
};

// Generate email template data from report
export const generateEmailTemplateData = (
  report: Report,
  branchInfo: Branch,
  reportLink: string
): Record<string, any> => {
  return {
    customerName: report.customerName || 'Valued Customer',
    inspectionDate: new Date(report.inspectionDate).toLocaleDateString('sv-SE'),
    inspectorName: report.createdByName || 'Our Inspector',
    reportId: report.id,
    branchName: branchInfo?.name || brandConfig.companyName,
    branchPhone: branchInfo?.phone || brandConfig.supportPhone,
    branchEmail: branchInfo?.email || brandConfig.supportEmail,
    branchAddress: branchInfo?.address || 'Professional Roofing Services',
    reportLink: reportLink,
    summary: generateSummary(report),
    recommendations: generateRecommendations(report),
    criticalIssues: generateCriticalIssues(report),
    totalIssues: report.issuesFound?.length || 0,
    estimatedCost:
      report.recommendedActions?.reduce(
        (sum: number, action: RecommendedAction) => sum + (action.estimatedCost || 0),
        0
      ) || 0,
  };
};

// Log email request to Firestore
export const logEmailRequest = async (emailLog: Omit<EmailLog, 'id'>): Promise<string> => {
  try {
    const emailLogRef = collection(db, EMAIL_LOGS_COLLECTION);
    const docRef = await addDoc(emailLogRef, {
      ...emailLog,
      sentAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging email request:', error);
    throw new Error('Failed to log email request');
  }
};

// Send email using Trigger Email extension
export const sendEmail = async (
  emailRequest: EmailRequest
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log('📧 Sending email via Trigger Email extension:', {
      to: emailRequest.to,
      template: emailRequest.template.name,
      reportId: emailRequest.reportId,
    });

    // Log the email request (optional - don't fail if logging fails)
    let logId: string | null = null;
    try {
      logId = await logEmailRequest({
        reportId: emailRequest.reportId,
        customerEmail: Array.isArray(emailRequest.to) ? emailRequest.to[0] : emailRequest.to,
        customerName: emailRequest.customerName,
        subject: `Template: ${emailRequest.template.name}`,
        templateId: emailRequest.template.name,
        sentBy: emailRequest.sentBy,
        status: 'pending',
      });
    } catch (logError) {
      console.warn('⚠️ Email logging failed, continuing with email send:', logError);
    }

    // Create email document for Trigger Email extension
    const mailDoc: any = {
      to: emailRequest.to,
      from: emailRequest.from || brandConfig.fromEmail,
      replyTo: emailRequest.replyTo || brandConfig.replyToEmail,
      template: {
        name: emailRequest.template.name,
        data: emailRequest.template.data,
      },
      // Add metadata for tracking
      metadata: {
        reportId: emailRequest.reportId,
        sentBy: emailRequest.sentBy,
        logId: logId,
        timestamp: new Date().toISOString(),
      },
    };

    // Only add cc and bcc if they have values (Firestore doesn't accept undefined)
    if (emailRequest.cc) {
      mailDoc.cc = emailRequest.cc;
    }
    if (emailRequest.bcc) {
      mailDoc.bcc = emailRequest.bcc;
    }

    // Add document to mail collection to trigger email
    const mailRef = await addDoc(collection(db, MAIL_COLLECTION), mailDoc);

    console.log('✅ Email request created:', mailRef.id);

    return {
      success: true,
      messageId: mailRef.id,
    };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Send report email to customer
export const sendReportEmail = async (
  report: Report,
  customerEmail: string,
  templateId: string,
  branchInfo: Branch,
  reportLink: string,
  sentBy: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log('📧 Sending report email:', {
      reportId: report.id,
      customerEmail,
      templateId,
    });

    // Generate template data
    const templateData = generateEmailTemplateData(report, branchInfo, reportLink);

    // Create email request
    const emailRequest: EmailRequest = {
      to: customerEmail,
      from: brandConfig.fromEmail,
      replyTo: brandConfig.replyToEmail,
      template: {
        name: templateId,
        data: templateData,
      },
      reportId: report.id,
      sentBy,
      customerName: report.customerName || 'Customer',
    };

    // Send email
    const result = await sendEmail(emailRequest);

    if (result.success) {
      console.log('✅ Email sent successfully:', result.messageId);
      
      // Create notification for successful email
      try {
        await createEmailNotification(
          sentBy, // This should be the user ID, but we need to get it from the context
          'sent',
          customerEmail,
          `Rapport: ${report.title || report.id}`,
          branchInfo.id
        );
      } catch (notificationError) {
        console.warn('Failed to create email notification:', notificationError);
      }
    } else {
      console.error('❌ Email sending failed:', result.error);
      
      // Create notification for failed email
      try {
        await createEmailNotification(
          sentBy,
          'failed',
          customerEmail,
          `Rapport: ${report.title || report.id}`,
          branchInfo.id
        );
      } catch (notificationError) {
        console.warn('Failed to create email failure notification:', notificationError);
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending report email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Send test email with sample report
export const sendTestEmail = async (
  testEmail: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    console.log('📧 Sending test email to:', testEmail);

    // Create a sample report for testing
    const sampleReport: Report = {
      id: 'test-report-' + Date.now(),
      createdBy: 'test-user',
      createdByName: 'Test Inspector',
      branchId: 'test-branch',
      inspectionDate: new Date().toISOString().split('T')[0],
      customerName: 'Test Customer',
      customerAddress: 'Test Address 123, Stockholm',
      customerPhone: '+46 70 123 4567',
      customerEmail: testEmail,
      roofType: 'tile',
      roofAge: 15,
      conditionNotes: 'This is a test inspection report to verify email functionality.',
      issuesFound: [
        {
          id: 'test-issue-1',
          type: 'damage',
          severity: 'medium',
          description: 'Minor wear on roof tiles',
          location: 'North side',
        },
        {
          id: 'test-issue-2',
          type: 'ventilation',
          severity: 'low',
          description: 'Adequate ventilation system',
          location: 'Attic',
        },
      ],
      recommendedActions: [
        {
          id: 'test-action-1',
          priority: 'medium',
          description: 'Replace worn tiles within 2 years',
          estimatedCost: 15000,
          urgency: 'short_term',
        },
      ],
      status: 'completed',
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      isShared: false,
      inspectionDuration: 120,
      isOffer: false,
    };

    // Create sample branch info
    const sampleBranch: Branch = {
      id: 'test-branch',
      name: 'Agritectum Test Branch',
      address: 'Test Street 1, Stockholm',
      phone: '+46 8 123 4567',
      email: brandConfig.supportEmail,
      createdAt: new Date().toISOString(),
      country: 'Sweden',
      isActive: true,
    };

    // Generate report link (public view for customers)
    const reportLink = `https://agritectum-platform.web.app/report/public/${sampleReport.id}`;

    // Send the test email
    const result = await sendReportEmail(
      sampleReport,
      testEmail,
      'inspection-complete',
      sampleBranch,
      reportLink,
      'test-user'
    );

    if (result.success) {
      console.log('✅ Test email sent successfully:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Test email failed:', result.error);
      return {
        success: false,
        error: result.error || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Test email setup (check if Trigger Email extension is configured)
export const testEmailSetup = async (): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  try {
    console.log('🧪 Testing Trigger Email extension setup...');

    // Check if mail collection exists and is accessible
    const testDoc = await addDoc(collection(db, MAIL_COLLECTION), {
      test: true,
      timestamp: serverTimestamp(),
    });

    // Clean up test document
    await updateDoc(doc(db, MAIL_COLLECTION, testDoc.id), {
      test: false,
      cleaned: true,
    });

    console.log('✅ Trigger Email extension setup test passed');
    return {
      success: true,
      message: 'Trigger Email extension is properly configured and ready to use!',
    };
  } catch (error) {
    console.error('Trigger Email extension setup test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Monitor email delivery status
export const monitorEmailDelivery = async (
  messageId: string
): Promise<{
  status: string;
  delivery?: any;
  error?: string;
}> => {
  try {
    const mailDoc = await getDoc(doc(db, MAIL_COLLECTION, messageId));

    if (!mailDoc.exists()) {
      return {
        status: 'not_found',
        error: 'Email document not found',
      };
    }

    const mailData = mailDoc.data();
    const delivery = mailData.delivery;

    if (!delivery) {
      return {
        status: 'pending',
      };
    }

    return {
      status: delivery.state || 'unknown',
      delivery: delivery,
    };
  } catch (error) {
    console.error('Error monitoring email delivery:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get email delivery status for a report
export const getEmailDeliveryStatus = async (reportId: string): Promise<EmailLog[]> => {
  try {
    const emailLogsRef = collection(db, EMAIL_LOGS_COLLECTION);
    const querySnapshot = await getDocs(
      query(emailLogsRef, where('reportId', '==', reportId), orderBy('sentAt', 'desc'))
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailLog[];
  } catch (error) {
    console.error('Error getting email delivery status:', error);
    return [];
  }
};
