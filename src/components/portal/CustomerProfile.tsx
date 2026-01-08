import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateCustomerProfile } from '../../services/userAuthService';
import LoadingSpinner from '../common/LoadingSpinner';

const CustomerProfile: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    address: '',
    companyName: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        phone: currentUser.customerProfile?.phone || '',
        address: currentUser.customerProfile?.address || '',
        companyName: currentUser.customerProfile?.companyName || '',
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setMessage(null);

    try {
      // Update display name in Firebase Auth
      if (firebaseUser && formData.displayName !== currentUser.displayName) {
        await firebaseUser.updateProfile({ displayName: formData.displayName });
      }

      // Update customer profile in Firestore
      await updateCustomerProfile(currentUser.uid, {
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        companyName: formData.companyName || undefined,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Profile</h1>
        <p className='mt-2 text-gray-600'>Manage your account information</p>
      </div>

      <div className='bg-white rounded-lg shadow p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={currentUser?.email || ''}
              disabled
              className='w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500'
            />
            <p className='mt-1 text-sm text-gray-500'>Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor='displayName' className='block text-sm font-medium text-gray-700 mb-2'>
              Full Name *
            </label>
            <input
              id='displayName'
              name='displayName'
              type='text'
              value={formData.displayName}
              onChange={handleChange}
              required
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div>
            <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
              Phone
            </label>
            <input
              id='phone'
              name='phone'
              type='tel'
              value={formData.phone}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div>
            <label htmlFor='address' className='block text-sm font-medium text-gray-700 mb-2'>
              Address
            </label>
            <input
              id='address'
              name='address'
              type='text'
              value={formData.address}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div>
            <label htmlFor='companyName' className='block text-sm font-medium text-gray-700 mb-2'>
              Company Name
            </label>
            <input
              id='companyName'
              name='companyName'
              type='text'
              value={formData.companyName}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
            >
              {loading ? <LoadingSpinner size='sm' className='mr-2' /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfile;

