import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react';
import {
  sendTestEmail,
  testEmailSetup,
  initializeEmailTemplates,
} from '../../services/triggerEmailService';

interface EmailTestPanelProps {
  userRole: string;
  permissionLevel: number;
}

export const EmailTestPanel: React.FC<EmailTestPanelProps> = ({ userRole, permissionLevel }) => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingSetup, setIsTestingSetup] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  // Only show for super admins and branch admins
  if (permissionLevel < 1) {
    return null;
  }

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setResult({
        success: false,
        message: 'Please enter a valid email address',
        error: 'Invalid email format',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendTestEmail(testEmail);

      if (response.success) {
        setResult({
          success: true,
          message: `Test email sent successfully to ${testEmail}. Message ID: ${response.messageId}`,
        });
        setTestEmail(''); // Clear the field on success
      } else {
        setResult({
          success: false,
          message: 'Failed to send test email',
          error: response.error || 'Unknown error',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error sending test email',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSetup = async () => {
    setIsTestingSetup(true);
    setResult(null);

    try {
      // First initialize templates if needed
      await initializeEmailTemplates();

      // Then test the setup
      const response = await testEmailSetup();

      if (response.success) {
        setResult({
          success: true,
          message: response.message || 'Email system is working correctly!',
        });
      } else {
        setResult({
          success: false,
          message: 'Email system test failed',
          error: response.error || 'Unknown error',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error testing email setup',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTestingSetup(false);
    }
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Mail className='h-5 w-5' />
          Email System Test
        </CardTitle>
        <CardDescription>
          Test the Trigger Email extension system by sending a sample report
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='test-email'>Test Email Address</Label>
          <Input
            id='test-email'
            type='email'
            placeholder='Enter email address to test'
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={handleTestSetup}
            disabled={isTestingSetup}
            variant='outline'
            className='flex-1'
          >
            {isTestingSetup ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Testing Setup...
              </>
            ) : (
              <>
                <CheckCircle className='mr-2 h-4 w-4' />
                Test Setup
              </>
            )}
          </Button>

          <Button onClick={handleSendTest} disabled={isLoading || !testEmail} className='flex-1'>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Mail className='mr-2 h-4 w-4' />
                Send Test Email
              </>
            )}
          </Button>
        </div>

        {result && (
          <Alert
            className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
          >
            <div className='flex items-center gap-2'>
              {result.success ? (
                <CheckCircle className='h-4 w-4 text-green-600' />
              ) : (
                <XCircle className='h-4 w-4 text-red-600' />
              )}
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
                {result.error && (
                  <div className='mt-2 text-sm font-mono bg-red-100 p-2 rounded'>
                    {result.error}
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className='text-sm text-gray-600 space-y-2'>
          <p>
            <strong>What this test does:</strong>
          </p>
          <ul className='list-disc list-inside space-y-1 ml-4'>
            <li>
              <strong>Test Setup:</strong> Verifies Trigger Email extension configuration
            </li>
            <li>
              <strong>Send Test Email:</strong> Sends a sample inspection report email
            </li>
            <li>Tests Handlebars template rendering</li>
            <li>Verifies email delivery status tracking</li>
            <li>Confirms SMTP configuration is working</li>
          </ul>
          <p className='mt-2 text-xs text-gray-500'>
            <strong>Note:</strong> The test email will be sent from {import.meta.env.VITE_FROM_EMAIL || 'noreply@example.com'} using the
            Trigger Email extension.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
