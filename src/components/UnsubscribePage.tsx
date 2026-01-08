import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { unsubscribeUser, validateUnsubscribeToken } from '../services/emailPreferenceService';

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    const handleUnsubscribe = async () => {
      if (!email || !token) {
        setStatus('invalid');
        setMessage('Invalid unsubscribe link. Please check your email and try again.');
        return;
      }

      try {
        // Validate token
        const isValidToken = await validateUnsubscribeToken(email, token);
        if (!isValidToken) {
          setStatus('invalid');
          setMessage('Invalid unsubscribe token. This link may have expired.');
          return;
        }

        // Unsubscribe user
        const success = await unsubscribeUser(email, token, 'User requested via email link');
        
        if (success) {
          setStatus('success');
          setMessage(`You have been successfully unsubscribed from all Taklaget emails.`);
        } else {
          setStatus('error');
          setMessage('Failed to unsubscribe. Please try again or contact support.');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your request. Please try again.');
      }
    };

    handleUnsubscribe();
  }, [email, token]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      case 'invalid':
        return <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />;
      default:
        return <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'invalid':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Taklaget</h1>
            <p className="text-gray-600">Email Unsubscribe</p>
          </div>

          {getStatusIcon()}

          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <h2 className="text-lg font-semibold mb-2">
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Unsubscribed Successfully'}
              {status === 'error' && 'Unsubscribe Failed'}
              {status === 'invalid' && 'Invalid Link'}
            </h2>
            
            <p className="text-sm">{message}</p>
          </div>

          {status === 'loading' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">
                You will no longer receive emails from Taklaget. If you change your mind, 
                you can contact us to resubscribe.
              </p>
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Homepage
                </button>
                
                <a
                  href="mailto:support@taklaget.app"
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center"
                >
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                
                <a
                  href="mailto:support@taklaget.app"
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center"
                >
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {status === 'invalid' && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">
                This unsubscribe link appears to be invalid or expired. 
                Please check your email for the correct link.
              </p>
              
              <div className="flex flex-col space-y-2">
                <a
                  href="mailto:support@taklaget.app"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                >
                  Contact Support
                </a>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © 2025 Taklaget AB. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;
