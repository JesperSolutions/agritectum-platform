import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Eye, Mail, Code, X } from 'lucide-react';
import { Report, Branch } from '../../types';
import { generateEmailTemplateData, defaultTemplates } from '../../services/triggerEmailService';

interface EmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  branchInfo: Branch | null;
  templateName: string;
  customerEmail: string;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  isOpen,
  onClose,
  report,
  branchInfo,
  templateName,
  customerEmail,
}) => {
  const [previewData, setPreviewData] = useState<{
    subject: string;
    html: string;
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && report && branchInfo) {
      generatePreview();
    }
  }, [isOpen, report, branchInfo, templateName]);

  const generatePreview = async () => {
    setLoading(true);
    setError('');

    try {
      // Generate report link for preview (public view for customers)
      const reportLink = `${window.location.origin}/report/public/${report?.id}`;

      // Get the template
      const template = defaultTemplates.find(t => t.name === templateName);
      if (!template) {
        throw new Error('Template not found');
      }

      // Generate template data
      const templateData = generateEmailTemplateData(report!, branchInfo!, reportLink);

      // Replace template variables in subject and content
      const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return templateData[key] || match;
      });

      let html = template.html;
      let text = template.text;

      // Replace variables in HTML and text
      Object.keys(templateData).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        html = html.replace(regex, templateData[key] || '');
        text = text.replace(regex, templateData[key] || '');
      });

      setPreviewData({
        subject,
        html,
        text,
      });
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate email preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = () => {
    // This would trigger the actual email sending
    // For now, just close the preview
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <DialogTitle className='flex items-center space-x-2'>
            <Eye className='h-5 w-5 text-blue-600' />
            <span>Email Preview</span>
          </DialogTitle>
          <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
            <X className='h-4 w-4' />
          </Button>
        </DialogHeader>

        {loading && (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>Generating preview...</span>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
            <div className='flex items-center'>
              <div className='text-red-600 text-sm'>{error}</div>
            </div>
          </div>
        )}

        {previewData && !loading && (
          <div className='space-y-4'>
            {/* Email Details */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium text-gray-700'>To:</span>
                  <span className='ml-2 text-gray-900'>{customerEmail}</span>
                </div>
                <div>
                  <span className='font-medium text-gray-700'>Template:</span>
                  <span className='ml-2 text-gray-900 capitalize'>{templateName}</span>
                </div>
                <div className='col-span-2'>
                  <span className='font-medium text-gray-700'>Subject:</span>
                  <span className='ml-2 text-gray-900'>{previewData.subject}</span>
                </div>
              </div>
            </div>

            {/* Preview Tabs */}
            <Tabs defaultValue='preview' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='preview' className='flex items-center space-x-2'>
                  <Eye className='h-4 w-4' />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger value='html' className='flex items-center space-x-2'>
                  <Code className='h-4 w-4' />
                  <span>HTML</span>
                </TabsTrigger>
                <TabsTrigger value='text' className='flex items-center space-x-2'>
                  <Mail className='h-4 w-4' />
                  <span>Text</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value='preview' className='mt-4'>
                <div className='border rounded-lg overflow-hidden'>
                  <div className='bg-gray-100 px-4 py-2 border-b'>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Mail className='h-4 w-4' />
                      <span>Email Preview</span>
                    </div>
                  </div>
                  <div className='max-h-96 overflow-auto'>
                    <iframe
                      srcDoc={previewData.html}
                      className='w-full h-96 border-0'
                      title='Email Preview'
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='html' className='mt-4'>
                <div className='border rounded-lg overflow-hidden'>
                  <div className='bg-gray-100 px-4 py-2 border-b'>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Code className='h-4 w-4' />
                      <span>HTML Source</span>
                    </div>
                  </div>
                  <pre className='p-4 bg-gray-900 text-gray-100 text-sm overflow-auto max-h-96'>
                    <code>{previewData.html}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value='text' className='mt-4'>
                <div className='border rounded-lg overflow-hidden'>
                  <div className='bg-gray-100 px-4 py-2 border-b'>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Mail className='h-4 w-4' />
                      <span>Plain Text Version</span>
                    </div>
                  </div>
                  <pre className='p-4 bg-white text-gray-900 text-sm whitespace-pre-wrap overflow-auto max-h-96'>
                    {previewData.text}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className='flex justify-end space-x-3 pt-4 border-t'>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} className='bg-blue-600 hover:bg-blue-700'>
                Send Email
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreview;
