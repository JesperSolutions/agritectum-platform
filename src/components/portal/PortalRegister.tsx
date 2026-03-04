import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PortalRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phone: '',
    address: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await registerCustomer(formData.email, formData.password, formData.displayName, {
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        companyName: formData.companyName || undefined,
      });
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#A1BA53]/10 to-[#A1BA53]/20 flex items-center justify-center px-4 py-12'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Agritectum</h1>
          <p className='text-gray-600'>Create Customer Account</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='bg-[#DA5062]/10 border border-[#DA5062]/30 text-[#c23d4f] px-4 py-3 rounded-md text-sm'>
              {error}
            </div>
          )}

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
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
            />
          </div>

          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              Email *
            </label>
            <input
              id='email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              required
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
            />
          </div>

          <div>
            <label htmlFor='companyName' className='block text-sm font-medium text-gray-700 mb-2'>
              Company Name (if applicable)
            </label>
            <input
              id='companyName'
              name='companyName'
              type='text'
              value={formData.companyName}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
            />
          </div>

          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
              Password *
            </label>
            <input
              id='password'
              name='password'
              type='password'
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
            />
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Confirm Password *
            </label>
            <input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A1BA53] focus:border-[#A1BA53]'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-[#A1BA53] text-white py-2 px-4 rounded-md hover:bg-[#8a9f47] focus:outline-none focus:ring-2 focus:ring-[#A1BA53] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          >
            {loading ? <LoadingSpinner size='sm' /> : 'Create Account'}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            Already have an account?{' '}
            <Link to='/portal/login' className='text-[#A1BA53] hover:text-[#73853b] font-medium'>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalRegister;
