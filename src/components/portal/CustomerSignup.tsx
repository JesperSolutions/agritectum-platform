import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { validateInvitation, markInvitationUsed, CustomerInvitation } from '../../services/customerInvitationService';
import { useIntl } from '../../hooks/useIntl';
import { Eye, EyeOff, CheckCircle, XCircle, Clock, Building, User, Mail, Lock, AlertTriangle } from 'lucide-react';
import AgritectumLogo from '../AgritectumLogo';
import LoadingSpinner from '../common/LoadingSpinner';

const CustomerSignup: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useIntl();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<CustomerInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate invitation on mount
  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      try {
        const result = await validateInvitation(token);
        if (result.valid && result.invitation) {
          setInvitation(result.invitation);
          // Pre-fill email if provided
          if (result.invitation.email) {
            setFormData(prev => ({ ...prev, email: result.invitation!.email! }));
          }
        } else {
          setValidationError(result.error || 'Invalid invitation');
          if (result.invitation) {
            setInvitation(result.invitation);
          }
        }
      } catch (err) {
        console.error('Error validating invitation:', err);
        setError('Failed to validate invitation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token]);

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Handle signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm() || !invitation || !token) {
      return;
    }

    setSubmitting(true);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: formData.displayName,
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        displayName: formData.displayName,
        role: 'customer',
        userType: 'customer',
        permissionLevel: -1,
        companyId: invitation.companyId,
        branchId: invitation.branchId,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        invitedBy: invitation.createdBy,
        invitationToken: token,
      });

      // Mark invitation as used
      await markInvitationUsed(token, user.uid);

      // Sign out - user will need to sign in through portal
      await auth.signOut();

      setSuccess(true);
    } catch (err: any) {
      console.error('Error creating account:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Format expiry date
  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <p className='mt-4 text-slate-600'>Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center'>
          <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6'>
            <CheckCircle className='w-10 h-10 text-green-600' />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 mb-4'>
            {t('customerSignup.success.title') || 'Account Created Successfully!'}
          </h1>
          <p className='text-slate-600 mb-6'>
            {t('customerSignup.success.message') || 'Your account has been created. You can now sign in to the customer portal.'}
          </p>
          <Link
            to='/portal/login'
            className='inline-flex items-center justify-center px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium'
          >
            {t('customerSignup.success.signIn') || 'Sign In to Portal'}
          </Link>
        </div>
      </div>
    );
  }

  // Invalid/expired invitation state
  if (validationError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center'>
          <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6'>
            {validationError.includes('expired') ? (
              <Clock className='w-10 h-10 text-red-600' />
            ) : validationError.includes('used') ? (
              <CheckCircle className='w-10 h-10 text-orange-600' />
            ) : (
              <XCircle className='w-10 h-10 text-red-600' />
            )}
          </div>
          <h1 className='text-2xl font-bold text-slate-900 mb-4'>
            {validationError.includes('expired')
              ? t('customerSignup.error.expired') || 'Invitation Expired'
              : validationError.includes('used')
                ? t('customerSignup.error.used') || 'Invitation Already Used'
                : t('customerSignup.error.invalid') || 'Invalid Invitation'}
          </h1>
          <p className='text-slate-600 mb-6'>
            {validationError.includes('expired')
              ? t('customerSignup.error.expiredMessage') || 'This invitation link has expired. Please contact your service provider for a new invitation.'
              : validationError.includes('used')
                ? t('customerSignup.error.usedMessage') || 'This invitation has already been used to create an account. Please sign in instead.'
                : t('customerSignup.error.invalidMessage') || 'This invitation link is not valid. Please check the link or contact your service provider.'}
          </p>
          {invitation && (
            <div className='bg-slate-50 rounded-lg p-4 mb-6 text-left'>
              <p className='text-sm text-slate-600'>
                <strong>Company:</strong> {invitation.customerName}
              </p>
              {invitation.expiresAt && (
                <p className='text-sm text-slate-600 mt-1'>
                  <strong>Expired:</strong> {formatExpiryDate(invitation.expiresAt)}
                </p>
              )}
            </div>
          )}
          <div className='space-y-3'>
            {validationError.includes('used') && (
              <Link
                to='/portal/login'
                className='block w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-center'
              >
                {t('customerSignup.signIn') || 'Sign In to Portal'}
              </Link>
            )}
            <Link
              to='/'
              className='block w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-center'
            >
              {t('customerSignup.backToHome') || 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center'>
          <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6'>
            <AlertTriangle className='w-10 h-10 text-red-600' />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 mb-4'>
            {t('customerSignup.error.title') || 'Something Went Wrong'}
          </h1>
          <p className='text-slate-600 mb-6'>{error}</p>
          <Link
            to='/'
            className='inline-flex items-center justify-center px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium'
          >
            {t('customerSignup.backToHome') || 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
      <div className='max-w-md w-full'>
        {/* Logo */}
        <div className='text-center mb-8'>
          <AgritectumLogo className='h-12 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-slate-900'>
            {t('customerSignup.title') || 'Create Your Account'}
          </h1>
          <p className='text-slate-600 mt-2'>
            {t('customerSignup.subtitle') || 'Complete your registration to access the customer portal'}
          </p>
        </div>

        {/* Invitation info */}
        {invitation && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <div className='flex items-start gap-3'>
              <Building className='w-5 h-5 text-blue-600 mt-0.5' />
              <div>
                <p className='font-medium text-blue-900'>{invitation.customerName}</p>
                <p className='text-sm text-blue-700 mt-1'>
                  {t('customerSignup.invitationValid') || 'Invitation valid until'}: {formatExpiryDate(invitation.expiresAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className='bg-white rounded-xl shadow-lg p-8'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Display Name */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>
                {t('customerSignup.form.name') || 'Your Name'} *
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='text'
                  value={formData.displayName}
                  onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className='w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder={t('customerSignup.form.namePlaceholder') || 'Enter your full name'}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>
                {t('customerSignup.form.email') || 'Email Address'} *
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='email'
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className='w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder={t('customerSignup.form.emailPlaceholder') || 'Enter your email'}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>
                {t('customerSignup.form.password') || 'Password'} *
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className='w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder={t('customerSignup.form.passwordPlaceholder') || 'Create a password (min 8 characters)'}
                  required
                  minLength={8}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1'>
                {t('customerSignup.form.confirmPassword') || 'Confirm Password'} *
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className='w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder={t('customerSignup.form.confirmPasswordPlaceholder') || 'Confirm your password'}
                  required
                  minLength={8}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2'>
                <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-red-700'>{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type='submit'
              disabled={submitting}
              className='w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
            >
              {submitting ? (
                <>
                  <LoadingSpinner size='sm' />
                  <span className='ml-2'>{t('customerSignup.form.creating') || 'Creating account...'}</span>
                </>
              ) : (
                t('customerSignup.form.submit') || 'Create Account'
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className='mt-6 text-center'>
            <p className='text-sm text-slate-600'>
              {t('customerSignup.alreadyHaveAccount') || 'Already have an account?'}{' '}
              <Link to='/portal/login' className='text-slate-700 font-medium hover:underline'>
                {t('customerSignup.signIn') || 'Sign in'}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='mt-6 text-center text-sm text-slate-500'>
          <p>© {new Date().getFullYear()} Agritectum ApS. {t('common.allRightsReserved') || 'All rights reserved.'}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;
