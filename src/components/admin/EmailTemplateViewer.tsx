import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { Mail, Eye, Code, Smartphone, Monitor, X, RefreshCw } from 'lucide-react';

interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

const EmailTemplateViewer: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [testData, setTestData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Shared design system for consistent branding
  const getSharedHeader = (title: string, subtitle?: string, urgent = false) => `
    <div style="background: linear-gradient(135deg, ${urgent ? '#dc2626 0%, #ef4444 100%' : '#1e3a8a 0%, #3b82f6 100%'}); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
        <div style="font-size: 32px; color: white; font-weight: bold; margin-bottom: 8px;">${urgent ? '🚨' : '🏠'}</div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Taklaget Professional Roofing</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Professional Roofing Services</p>
      </div>
      <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 500;">${title}</h2>
      ${subtitle ? `<p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">${subtitle}</p>` : ''}
    </div>
  `;

  const getSharedFooter = () => `
    <div style="background: #f8fafc; padding: 24px 30px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
        This email was sent from Taklaget Professional Roofing Services
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © 2025 Taklaget AB. All rights reserved. | Professional Roofing Services
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
        <a href="{{unsubscribeLink}}" style="color: #2563eb; text-decoration: none;">Unsubscribe</a> | 
        <a href="{{website}}" style="color: #2563eb; text-decoration: none;">Visit Website</a>
      </p>
    </div>
  `;

  // All actual email templates from the system with unified design
  const sampleTemplates: EmailTemplate[] = [
    {
      name: 'inspection-complete',
      subject: 'Your Roof Inspection Report is Ready - {{customerName}}',
      htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Roof Inspection Report is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    ${getSharedHeader('Your Inspection Report is Ready')}
    
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
        <p style="color: #6b7280; font-size: 14px;">Taklaget Professional Roofing Services</p>
      </div>
    </div>
    
    ${getSharedFooter()}
  </div>
</body>
</html>`,
      textContent: `Dear {{customerName}},

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
Taklaget Professional Roofing Services

Contact Information:
Phone: {{branchPhone}}
Email: {{branchEmail}}
Address: {{branchAddress}}`,
      variables: [
        'customerName',
        'inspectionDate',
        'inspectorName',
        'reportId',
        'summary',
        'recommendations',
        'reportLink',
        'branchName',
        'branchPhone',
        'branchEmail',
        'branchAddress',
      ],
    },
    {
      name: 'urgent-issues',
      subject: 'URGENT: Critical Issues Found in Your Roof Inspection - {{customerName}}',
      htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URGENT: Critical Issues Found</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fef2f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    ${getSharedHeader('URGENT NOTICE', 'Critical Issues Require Immediate Attention', true)}
    
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
      
      <!-- Critical Issues -->
      <div style="margin-bottom: 32px;">
        <h3 style="color: #dc2626; margin-bottom: 16px; font-size: 18px; font-weight: 600;">🔴 Critical Issues Identified</h3>
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
          <div id="critical-issues-content">{{criticalIssues}}</div>
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
                  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);">
          🚨 REVIEW REPORT IMMEDIATELY
        </a>
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
        <p style="color: #6b7280; font-size: 14px;">Taklaget Professional Roofing Services</p>
      </div>
    </div>
    
    ${getSharedFooter()}
  </div>
</body>
</html>`,
      textContent: `Dear {{customerName}},

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
Taklaget Professional Roofing Services

Emergency Contact: {{branchPhone}}
Email: {{branchEmail}}`,
      variables: [
        'customerName',
        'inspectionDate',
        'inspectorName',
        'reportId',
        'criticalIssues',
        'reportLink',
        'branchName',
        'branchPhone',
        'branchEmail',
      ],
    },
    {
      name: 'offer-proposal',
      subject: 'Takinspektionsoffert - {{customerName}} ({{offerValue}} SEK)',
      htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Roof Repair Offer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f9ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    ${getSharedHeader('Professional Roof Repair Offer', 'Comprehensive Repair Proposal')}
    
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px; font-weight: 500;">Dear {{customerName}},</p>
      
      <p style="color: #4b5563; line-height: 1.7; margin-bottom: 32px; font-size: 16px;">
        Thank you for choosing Taklaget for your roof inspection. Based on our thorough inspection of your property at {{customerAddress}}, 
        we are pleased to present a comprehensive repair proposal.
      </p>
      
      <!-- Inspection Summary -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">🏠 Inspection Summary</h3>
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
      
      <!-- Offer Details -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">💰 Offer Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total Value</div>
            <div style="color: #065f46; font-weight: 700; font-size: 18px;">{{offerValue}} SEK</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Valid Until</div>
            <div style="color: #065f46; font-weight: 600;">{{offerValidUntil}}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; grid-column: 1 / -1;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Duration</div>
            <div style="color: #065f46; font-weight: 600;">{{estimatedDuration}}</div>
          </div>
        </div>
      </div>
      
      <!-- Work Description -->
      <div style="margin-bottom: 32px;">
        <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 18px; font-weight: 600;">🔧 Work Included</h3>
        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
          <div style="color: #92400e; white-space: pre-line; font-size: 15px; line-height: 1.6;">{{workDescription}}</div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{reportLink}}" 
           style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
                  color: white; 
                  padding: 16px 32px; 
                  text-decoration: none; 
                  border-radius: 12px; 
                  font-weight: 600; 
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
          📊 View Complete Report
        </a>
      </div>
      
      <!-- Why Choose Taklaget -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">✅ Why Choose Taklaget?</h3>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.6;">
          <li>Professional certified roofers</li>
          <li>High-quality materials and workmanship</li>
          <li>Complete warranty on all work performed</li>
          <li>Competitive prices with no hidden costs</li>
          <li>Flexible scheduling that fits your needs</li>
        </ul>
      </div>
      
      <!-- Contact to Accept -->
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
        <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">📞 To Accept This Offer</h3>
        <p style="color: #991b1b; margin-bottom: 16px; font-size: 15px;">Contact us before {{offerValidUntil}}:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</div>
            <div style="color: #dc2626; font-weight: 600;">{{branchPhone}}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</div>
            <div style="color: #dc2626; font-weight: 600;">{{branchEmail}}</div>
          </div>
        </div>
      </div>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 32px; font-size: 15px;">
        This offer is valid until {{offerValidUntil}}. After this date, prices and availability may change.
      </p>
      
      <!-- Signature -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Best regards,</p>
        <p style="color: #1f2937; margin-bottom: 4px; font-weight: 500;">{{branchName}} Team</p>
        <p style="color: #6b7280; font-size: 14px;">Taklaget Professional Roofing Services</p>
        
        <div style="margin-top: 20px; font-size: 14px; color: #6b7280;">
          <p><strong>Professional License:</strong> #{{licenseNumber}}</p>
          <p><strong>Insurance:</strong> Fully covered for your protection</p>
        </div>
      </div>
    </div>
    
    ${getSharedFooter()}
  </div>
</body>
</html>`,
      textContent: `Kära {{customerName}},

Tack för att du valde Taklaget för din takinspektioner. Baserat på vår grundliga inspektion av din fastighet på {{customerAddress}}, har vi glädjen att presentera ett omfattande reparationsförslag.

🏠 INSPEKTIONSSAMMANFATTNING
- Inspektionsdatum: {{inspectionDate}}
- Inspektör: {{inspectorName}}
- Rapport-ID: {{reportId}}

💰 OFFERTDETALJER
- Totalt offertvärde: {{offerValue}} SEK
- Offert gäller till: {{offerValidUntil}}
- Beräknad arbetstid: {{estimatedDuration}}

🔧 ARBETE SOM INGÅR
{{workDescription}}

✅ VARFÖR VÄLJA TAKLAGET?
- Professionella certifierade takläggare
- Högkvalitativa material och utförande
- Fullständig garanti på allt utfört arbete
- Konkurrenskraftiga priser utan dolda kostnader
- Flexibel schemaläggning som passar dig

📞 FÖR ATT ACCEPTERA DENNA OFFERT
Kontakta oss innan {{offerValidUntil}}:
- Telefon: {{branchPhone}}
- E-post: {{branchEmail}}

Denna offert gäller till {{offerValidUntil}}. Efter detta datum kan priser och tillgänglighet ändras.

Med vänliga hälsningar,
{{branchName}} Team
Taklaget Professional Roofing Services

Professionell licens: #{{licenseNumber}}
Försäkring: Fullständigt täckt för ditt skydd`,
      variables: [
        'customerName',
        'customerAddress',
        'inspectionDate',
        'inspectorName',
        'reportId',
        'offerValue',
        'offerValidUntil',
        'estimatedDuration',
        'workDescription',
        'reportLink',
        'branchName',
        'branchPhone',
        'branchEmail',
        'licenseNumber',
      ],
    },
    {
      name: 'password-reset',
      subject: 'Reset Your Password - Taklaget Professional Roofing',
      htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    ${getSharedHeader('Reset Your Password', 'Secure Account Access')}
    
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1f2937; margin-bottom: 24px; font-weight: 500;">Dear {{customerName}},</p>
      
      <p style="color: #4b5563; line-height: 1.7; margin-bottom: 32px; font-size: 16px;">
        You have requested to reset your password for your Taklaget Professional Roofing account. 
        Click the button below to create a new secure password.
      </p>
      
      <!-- Security Info -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">🔒 Security Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Request Time</div>
            <div style="color: #92400e; font-weight: 600;">{{requestTime}}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Expires In</div>
            <div style="color: #92400e; font-weight: 600;">{{expirationTime}}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px; grid-column: 1 / -1;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">IP Address</div>
            <div style="color: #92400e; font-weight: 600; font-family: monospace;">{{ipAddress}}</div>
          </div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{resetLink}}" 
           style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); 
                  color: white; 
                  padding: 16px 32px; 
                  text-decoration: none; 
                  border-radius: 12px; 
                  font-weight: 600; 
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);">
          🔑 Reset Password
        </a>
      </div>
      
      <!-- Security Notice -->
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
        <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">⚠️ Important Security Notice</h3>
        <ul style="color: #991b1b; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.6;">
          <li>This link will expire in {{expirationTime}}</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Never share your password with anyone</li>
          <li>Contact us immediately if you suspect unauthorized access</li>
        </ul>
      </div>
      
      <!-- Contact Support -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600;">📞 Need Help?</h3>
        <p style="color: #1e40af; margin-bottom: 16px; font-size: 15px;">
          If you're having trouble resetting your password or have any questions, our support team is here to help.
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</div>
            <div style="color: #1e40af; font-weight: 600;">{{supportPhone}}</div>
          </div>
          <div style="background: white; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</div>
            <div style="color: #1e40af; font-weight: 600;">{{supportEmail}}</div>
          </div>
        </div>
      </div>
      
      <p style="color: #6b7280; line-height: 1.6; margin-bottom: 32px; font-size: 15px;">
        For your security, this password reset link will only work once and expires automatically.
      </p>
      
      <!-- Signature -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="color: #1f2937; font-weight: 600; margin-bottom: 8px;">Best regards,</p>
        <p style="color: #1f2937; margin-bottom: 4px; font-weight: 500;">Taklaget Security Team</p>
        <p style="color: #6b7280; font-size: 14px;">Taklaget Professional Roofing Services</p>
      </div>
    </div>
    
    ${getSharedFooter()}
  </div>
</body>
</html>`,
      textContent: `Taklaget - Återställ lösenord

Hej {{customerName}},

Du har begärt att återställa ditt lösenord för Taklaget. Använd länken nedan för att skapa ett nytt lösenord:

{{resetLink}}

Om du inte begärde denna återställning, kan du ignorera detta e-postmeddelande.

Taklaget AB
{{companyAddress}}
{{companyPhone}}

Avsluta prenumeration: {{unsubscribeLink}}`,
      variables: ['customerName', 'resetLink', 'companyAddress', 'companyPhone', 'unsubscribeLink'],
    },
  ];

  useEffect(() => {
    // Simulate loading templates
    setTimeout(() => {
      setTemplates(sampleTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  // Generate test data for template variables with current company info
  const generateTestData = (template: EmailTemplate) => {
    const testData: Record<string, string> = {
      // Customer Information
      customerName: 'Anna Andersson',
      customerAddress: 'Storgatan 123, 123 45 Stockholm',
      inspectionAddress: 'Storgatan 123, 123 45 Stockholm',

      // Inspection Details
      inspectionDate: '2025-01-15',
      inspectorName: 'Erik Eriksson',
      reportId: 'RPT-2025-001',
      issuesCount: '3',
      estimatedCost: '25,000',

      // Links
      reportLink: 'https://taklaget.app/report/abc123',
      contactLink: 'https://taklaget.app/contact',
      unsubscribeLink: 'https://taklaget.app/unsubscribe?email=anna@example.com',
      resetLink: 'https://taklaget.app/reset-password?token=abc123',

      // Current Company Information (from template-config.json)
      companyAddress: 'Professional Roofing Services, Sweden',
      companyPhone: '+46 470 123 456',
      companyName: 'Taklaget Professional Roofing',
      brandName: 'Taklaget Professional Roofing',
      legalEntity: 'Taklaget AB',
      legalAddress: 'Professional Roofing Services, Sweden',
      website: 'https://taklaget.app',

      // Branch Information
      branchPhone: '+46 470 123 456',
      branchEmail: 'support@taklaget.app',
      branchName: 'Taklaget Professional Roofing',
      branchAddress: 'Professional Roofing Services, Sweden',

      // Email Configuration
      fromEmail: 'noreply@taklaget.app',
      replyToEmail: 'support@taklaget.app',
      supportEmail: 'support@taklaget.app',
      supportPhone: '+46 470 123 456',

      // Report Content
      summary:
        'The inspection identified 3 issues, including 1 critical concern requiring immediate attention. Overall roof condition is fair with some areas needing repair.',
      recommendations:
        '3 recommended actions, with 1 high-priority item. Estimated total cost: 25,000 SEK',
      criticalIssues:
        '1. DAMAGE: Large leak in roof (Location: Bedroom)\n2. DAMAGE: Damaged roofing felt (Location: Kitchen)\n3. DAMAGE: Loose roof tile (Location: Living room)',

      // Offer Information
      offerValue: '45,000',
      offerValidUntil: '2025-02-15',
      estimatedDuration: '3-5 dagar',
      workDescription:
        '1. Repair roof leak in bedroom\n2. Replace damaged roofing felt in kitchen\n3. Secure loose roof tiles\n4. Apply waterproof coating\n5. Clean gutters and downspouts',
      licenseNumber: 'ROF-2024-001',

      // Security Information
      requestTime: '2025-01-15 14:30:00',
      ipAddress: '192.168.1.100',
      expirationTime: '24 hours',
    };

    setTestData(testData);
  };

  // Replace template variables with test data
  const renderTemplate = (template: EmailTemplate) => {
    let content = template.htmlContent;

    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    // Handle special formatting for critical issues
    if (template.name === 'urgent-issues' && testData.criticalIssues) {
      // Convert newline-separated issues to HTML
      const issues = testData.criticalIssues.split('\n').filter(issue => issue.trim());
      const issueHtml = issues
        .map(
          issue => `
        <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-weight: bold; color: #dc2626; font-size: 15px;">${issue}</p>
        </div>
      `
        )
        .join('');

      // Replace the critical issues placeholder with formatted HTML
      content = content.replace('{{criticalIssues}}', issueHtml);
    }

    return content;
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    generateTestData(template);
    setShowCode(false);
  };

  // Only show for superadmin
  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 text-6xl mb-4'>🚫</div>
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>{t('errors.access.denied')}</h2>
          <p className='text-gray-600'>Only superadmins can access email template viewer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 font-material'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8 bg-white rounded-material shadow-material-2 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-light text-gray-900 tracking-tight flex items-center'>
                <Mail className='h-8 w-8 mr-3 text-blue-600' />
                Email Template Viewer
              </h1>
              <p className='mt-2 text-gray-600 font-light'>
                Preview and test email templates without sending actual emails
              </p>
            </div>
            <div className='flex space-x-3'>
              <button
                onClick={() => setLoading(true)}
                className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Template List */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-material shadow-material-2 p-6'>
              <h2 className='text-xl font-medium text-gray-900 mb-4'>Available Templates</h2>

              {loading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map(i => (
                    <div key={i} className='animate-pulse'>
                      <div className='h-16 bg-gray-200 rounded-lg'></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='space-y-3'>
                  {templates.map(template => (
                    <button
                      key={template.name}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedTemplate?.name === template.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className='font-medium text-gray-900 capitalize'>
                        {template.name.replace('-', ' ')}
                      </h3>
                      <p className='text-sm text-gray-600 mt-1'>{template.subject}</p>
                      <p className='text-xs text-gray-500 mt-2'>
                        {template.variables.length} variables
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template Preview */}
          <div className='lg:col-span-2'>
            {selectedTemplate ? (
              <div className='bg-white rounded-material shadow-material-2'>
                {/* Preview Controls */}
                <div className='border-b border-gray-200 p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <h2 className='text-xl font-medium text-gray-900'>
                        {selectedTemplate.name.replace('-', ' ')}
                      </h2>
                      <span className='text-sm text-gray-500'>
                        {selectedTemplate.variables.length} variables
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded ${
                          previewMode === 'desktop'
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Monitor className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded ${
                          previewMode === 'mobile'
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Smartphone className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => setShowCode(!showCode)}
                        className={`p-2 rounded ${
                          showCode
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Code className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                <div className='p-6'>
                  {showCode ? (
                    <div className='space-y-4'>
                      <div>
                        <h3 className='text-sm font-medium text-gray-700 mb-2'>HTML Content</h3>
                        <pre className='bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto'>
                          <code>{renderTemplate(selectedTemplate)}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className='text-sm font-medium text-gray-700 mb-2'>Text Content</h3>
                        <pre className='bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto'>
                          <code>{selectedTemplate.textContent}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-2xl mx-auto'}`}
                    >
                      <div className='border border-gray-200 rounded-lg overflow-hidden'>
                        <div className='bg-gray-100 px-4 py-2 border-b border-gray-200'>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                            <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                            <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                            <span className='text-xs text-gray-600 ml-2'>
                              {selectedTemplate.subject}
                            </span>
                          </div>
                        </div>
                        <div
                          className='bg-white'
                          style={{
                            maxHeight: '600px',
                            overflow: 'auto',
                            ...(previewMode === 'mobile' ? { fontSize: '14px' } : {}),
                          }}
                          dangerouslySetInnerHTML={{
                            __html: renderTemplate(selectedTemplate),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='bg-white rounded-material shadow-material-2 p-12 text-center'>
                <Mail className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>No Template Selected</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Choose a template from the list to preview it here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateViewer;
