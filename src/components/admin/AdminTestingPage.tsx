import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  TestTube,
  Database,
  Shield,
  Users,
  FileText,
} from 'lucide-react';
import { sendTestEmail, testEmailSetup } from '../../services/triggerEmailService';

const AdminTestingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  // Only show for admins
  if (!currentUser || currentUser.permissionLevel < 1) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-slate-900 mb-2'>{t('errors.access.denied')}</h2>
              <p className='text-slate-600'>{t('errors.access.deniedMessage')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSendTestEmail = async () => {
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
          message: `Test email sent successfully to ${testEmail}`,
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

  const handleTestEmailSetup = async () => {
    setIsLoading(true);
    setResult(null);

    try {
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
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Admin Testing Center</h1>
          <p className='mt-2 text-gray-600'>
            Test and verify system functionality for production readiness
          </p>
        </div>

        <Tabs defaultValue='email' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='email' className='flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              Email System
            </TabsTrigger>
            <TabsTrigger value='database' className='flex items-center gap-2'>
              <Database className='h-4 w-4' />
              Database
            </TabsTrigger>
            <TabsTrigger value='users' className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              User Management
            </TabsTrigger>
            <TabsTrigger value='reports' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value='email' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Mail className='h-5 w-5' />
                  Email System Testing
                </CardTitle>
                <CardDescription>
                  Test the noreply@taklaget.app email system and verify SMTP configuration
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Email Configuration Test */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Email Configuration Test</h3>
                  <p className='text-sm text-gray-600'>
                    Test the basic email system configuration and SMTP connection
                  </p>
                  <Button onClick={handleTestEmailSetup} disabled={isLoading} variant='outline'>
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Testing Configuration...
                      </>
                    ) : (
                      <>
                        <TestTube className='mr-2 h-4 w-4' />
                        Test Email Configuration
                      </>
                    )}
                  </Button>
                </div>

                {/* Test Email Sending */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Send Test Email</h3>
                  <p className='text-sm text-gray-600'>
                    Send a sample inspection report email to test the full email functionality
                  </p>

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

                  <Button
                    onClick={handleSendTestEmail}
                    disabled={isLoading || !testEmail}
                    className='w-full'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Sending Test Email...
                      </>
                    ) : (
                      <>
                        <Mail className='mr-2 h-4 w-4' />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </div>

                {/* Results */}
                {result && (
                  <Alert
                    className={
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }
                  >
                    <div className='flex items-center gap-2'>
                      {result.success ? (
                        <CheckCircle className='h-4 w-4 text-green-600' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-600' />
                      )}
                      <AlertDescription
                        className={result.success ? 'text-green-800' : 'text-red-800'}
                      >
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

                {/* Email System Info */}
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <h4 className='font-medium text-blue-900 mb-2'>Email System Configuration</h4>
                  <div className='text-sm text-blue-800 space-y-1'>
                    <p>
                      <strong>From Address:</strong> noreply@taklaget.app
                    </p>
                    <p>
                      <strong>SMTP Server:</strong> smtp.office365.com:587
                    </p>
                    <p>
                      <strong>Security:</strong> TLS encryption enabled
                    </p>
                    <p>
                      <strong>Behavior:</strong> Non-reply alias (bounces back replies)
                    </p>
                    <p>
                      <strong>Purpose:</strong> System emails, report delivery, notifications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='database' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Database className='h-5 w-5' />
                  Database Testing
                </CardTitle>
                <CardDescription>Test database connectivity and data integrity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8'>
                  <Database className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Database Tests</h3>
                  <p className='text-gray-600 mb-4'>Database testing functionality coming soon</p>
                  <Button variant='outline' disabled>
                    <TestTube className='mr-2 h-4 w-4' />
                    Run Database Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='users' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  User Management Testing
                </CardTitle>
                <CardDescription>
                  Test user creation, permissions, and authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8'>
                  <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>User Management Tests</h3>
                  <p className='text-gray-600 mb-4'>
                    User management testing functionality coming soon
                  </p>
                  <Button variant='outline' disabled>
                    <TestTube className='mr-2 h-4 w-4' />
                    Run User Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='reports' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Report System Testing
                </CardTitle>
                <CardDescription>
                  Test report generation, PDF creation, and data processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8'>
                  <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Report System Tests</h3>
                  <p className='text-gray-600 mb-4'>
                    Report system testing functionality coming soon
                  </p>
                  <Button variant='outline' disabled>
                    <TestTube className='mr-2 h-4 w-4' />
                    Run Report Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminTestingPage;
