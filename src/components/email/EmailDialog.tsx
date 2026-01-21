import React, { useState, useEffect } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle, Loader2, Eye } from 'lucide-react';
import { Report } from '../../types';
import { sendReportEmail, defaultTemplates } from '../../services/triggerEmailService';
import * as branchService from '../../services/branchService';
import { updateReport } from '../../services/reportService';
import EmailPreview from './EmailPreview';

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  branchId?: string;
  sentBy: string;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ isOpen, onClose, report, branchId, sentBy }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('inspection-complete');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [reportLink, setReportLink] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen && report) {
      setCustomerEmail(report.customerEmail || '');
      setSendResult(null);

      // Load branch information
      if (branchId) {
        loadBranchInfo(branchId);
      }

      // Generate report link for customer access (public view, no login required)
      setReportLink(`${window.location.origin}/report/public/${report.id}`);
    }
  }, [isOpen, report, branchId]);

  const loadBranchInfo = async (branchId: string) => {
    try {
      const branch = await branchService.getBranchById(branchId);
      if (branch) {
        setBranchInfo(branch);
      }
    } catch (error) {
      console.error('Error loading branch info:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = defaultTemplates.find(t => t.name === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomBody(template.body);
    }
  };

  const handleSendEmail = async () => {
    if (!report || !customerEmail) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const template = defaultTemplates.find(t => t.name === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }

      // Use custom content if user is customizing
      const finalTemplate = isCustomizing
        ? {
            ...template,
            subject: customSubject,
            html: customBody,
            text: customBody,
          }
        : template;

      const result = await sendReportEmail(
        report,
        customerEmail,
        finalTemplate.name,
        branchInfo,
        reportLink,
        sentBy
      );

      if (result.success) {
        // Update report status to 'sent' after successful email send
        if (report && report.status !== 'sent') {
          try {
            await updateReport(report.id, { status: 'sent' });
          } catch (updateError) {
            console.error('Error updating report status after email send:', updateError);
            // Don't fail the email send if status update fails
          }
        }

        setSendResult({
          success: true,
          message: `Email sent successfully! Message ID: ${result.messageId}`,
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSendResult({
          success: false,
          message: result.error || 'Failed to send email',
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !report) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <Mail className='w-6 h-6 text-blue-600' />
            <h2 className='text-xl font-semibold text-gray-900'>Send Report to Customer</h2>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Report Info */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium text-gray-900 mb-2'>Report Information</h3>
            <div className='text-sm text-gray-600 space-y-1'>
              <p>
                <strong>Customer:</strong> {report.customerName}
              </p>
              <p>
                <strong>Address:</strong> {report.customerAddress}
              </p>
              <p>
                <strong>Inspection Date:</strong>{' '}
                {new Date(report.inspectionDate).toLocaleDateString('sv-SE')}
              </p>
              <p>
                <strong>Status:</strong> {report.status}
              </p>
            </div>
          </div>

          {/* Email Template Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Email Template</label>
            <select
              value={selectedTemplate}
              onChange={e => handleTemplateChange(e.target.value)}
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {defaultTemplates.map(template => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Customer Email Address
            </label>
            <input
              type='email'
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='customer@example.com'
              required
            />
          </div>

          {/* Customize Button */}
          <div className='flex justify-end'>
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className='text-blue-600 hover:text-blue-800 text-sm font-medium'
            >
              {isCustomizing ? 'Use Template' : 'Customize Message'}
            </button>
          </div>

          {/* Custom Subject */}
          {isCustomizing && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Subject Line</label>
              <input
                type='text'
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          )}

          {/* Custom Body */}
          {isCustomizing && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Message Body</label>
              <textarea
                value={customBody}
                onChange={e => setCustomBody(e.target.value)}
                rows={12}
                className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          )}

          {/* Send Result */}
          {sendResult && (
            <div
              className={`p-4 rounded-lg flex items-center space-x-3 ${
                sendResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle className='w-5 h-5' />
              ) : (
                <AlertCircle className='w-5 h-5' />
              )}
              <p className='text-sm'>{sendResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t border-gray-200'>
          <button
            onClick={() => setShowPreview(true)}
            disabled={!customerEmail || !branchInfo}
            className='inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <Eye className='w-4 h-4 mr-2' />
            Preview Email
          </button>

          <div className='flex items-center space-x-3'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={!customerEmail || isSending}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isSending ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <Send className='w-4 h-4 mr-2' />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      <EmailPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        report={report}
        branchInfo={branchInfo}
        templateName={selectedTemplate}
        customerEmail={customerEmail}
      />
    </div>
  );
};

export default EmailDialog;
