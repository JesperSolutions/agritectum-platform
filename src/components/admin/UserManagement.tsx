import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Filter,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { useToast } from '../../contexts/ToastContext';
import * as userService from '../../services/userService';
import * as branchService from '../../services/branchService';
import { createUserWithAuth } from '../../services/userAuthService';
import { generateTemporaryPassword } from '../../services/userInvitationService';
import { User, UserRole, Branch } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { logger } from '../../utils/logger';
import Tooltip from '../Tooltip';
import ConfirmationDialog from '../common/ConfirmationDialog';

const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    displayName: '',
    role: 'inspector' as UserRole,
    isActive: true,
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordToShow, setPasswordToShow] = useState<string | null>(null);
  const [userForPassword, setUserForPassword] = useState<User | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isViewingPassword, setIsViewingPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    displayName?: string;
    password?: string;
  }>({});

  // Password strength calculation
  const calculatePasswordStrength = (
    pwd: string
  ): { strength: 'weak' | 'fair' | 'good' | 'strong'; score: number; feedback: string[] } => {
    if (!pwd) {
      return { strength: 'weak', score: 0, feedback: [] };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (pwd.length >= 8) score += 1;
    else feedback.push('Minst 8 tecken');

    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;

    // Character variety checks
    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('Lägg till små bokstäver');

    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('Lägg till stora bokstäver');

    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('Lägg till siffror');

    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('Lägg till specialtecken');

    // Determine strength level
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score <= 2) strength = 'weak';
    else if (score <= 4) strength = 'fair';
    else if (score <= 6) strength = 'good';
    else strength = 'strong';

    return { strength, score, feedback };
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Ogiltig e-postadress';
    }
    return undefined;
  };

  // Form validation
  const isFormValid = (): boolean => {
    if (editingUser) {
      return !!(
        formData.email &&
        formData.displayName &&
        !fieldErrors.email &&
        !fieldErrors.displayName
      );
    } else {
      return !!(
        formData.email &&
        formData.displayName &&
        password &&
        password.length >= 8 &&
        !fieldErrors.email &&
        !fieldErrors.displayName &&
        !fieldErrors.password
      );
    }
  };

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));

    // Clear error when user starts typing
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: undefined }));
    }

    // Validate email format
    if (value && value.length > 0) {
      const error = validateEmail(value);
      if (error) {
        setFieldErrors(prev => ({ ...prev, email: error }));
      }
    }
  };

  // Handle display name change
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, displayName: value }));

    // Clear error when user starts typing
    if (fieldErrors.displayName) {
      setFieldErrors(prev => ({ ...prev, displayName: undefined }));
    }
  };

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    // Clear error when user starts typing
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }

    // Validate password length
    if (value && value.length > 0 && value.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: 'Lösenordet måste vara minst 8 tecken' }));
    }
  };

  // Handle password generation
  const handleGeneratePassword = async () => {
    setIsGeneratingPassword(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    const newPassword = generateTemporaryPassword();
    setPassword(newPassword);
    setShowPassword(true);
    setFieldErrors(prev => ({ ...prev, password: undefined }));
    setIsGeneratingPassword(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadBranches();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      // Superadmin can see all users
      loadAllUsers();
    } else if (currentUser?.role === 'branchAdmin' && currentUser?.branchId) {
      // Branch admin can only see their branch users
      setSelectedBranch(currentUser.branchId);
      loadBranchUsers(currentUser.branchId);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedBranch && currentUser?.role === 'superadmin') {
      loadBranchUsers(selectedBranch);
    }
  }, [selectedBranch, currentUser]);

  const loadBranches = async () => {
    try {
      if (currentUser?.role === 'superadmin') {
        // Super admin can see all branches
        const branchesData = await branchService.getBranches(currentUser);
        setBranches(branchesData);
      } else if (currentUser?.role === 'branchAdmin' && currentUser?.branchId) {
        // Branch admin can only see their own branch
        const branchData = await branchService.getBranch(currentUser.branchId);
        if (branchData) {
          setBranches([branchData]);
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setError(t('admin.errors.failedToLoadBranches'));
    }
  };

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      logger.log('🔍 UserManagement: Loading all users for superadmin...');
      const usersData = await userService.getUsers();
      logger.log('🔍 UserManagement: Received users data:', usersData);
      setUsers(usersData);
      logger.log('✅ UserManagement: Successfully loaded', usersData.length, 'users');
    } catch (error) {
      console.error('❌ UserManagement: Error loading users:', error);
      setError(t('admin.errors.failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  const loadBranchUsers = async (branchId: string) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      logger.log('🔍 UserManagement: Loading users for branch:', branchId);
      const usersData = await userService.getUsers(branchId);
      logger.log('🔍 UserManagement: Received branch users data:', usersData);
      setUsers(usersData);
      logger.log(
        '✅ UserManagement: Successfully loaded',
        usersData.length,
        'users for branch',
        branchId
      );
    } catch (error) {
      console.error('❌ UserManagement: Error loading branch users:', error);
      setError(t('admin.errors.failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    const emailError = validateEmail(formData.email || '');
    if (emailError) {
      setFieldErrors(prev => ({ ...prev, email: emailError }));
      setError('Vänligen korrigera felen i formuläret');
      return;
    }

    if (!formData.email || !formData.displayName) {
      setError(t('admin.validation.emailAndNameRequired'));
      if (!formData.email) {
        setFieldErrors(prev => ({ ...prev, email: 'E-postadress krävs' }));
      }
      if (!formData.displayName) {
        setFieldErrors(prev => ({ ...prev, displayName: 'Visningsnamn krävs' }));
      }
      return;
    }

    // For superadmin, branch selection is required
    if (currentUser?.role === 'superadmin' && !selectedBranch) {
      setError(t('admin.validation.selectBranchForUser'));
      return;
    }

    const targetBranchId = selectedBranch || currentUser?.branchId;
    if (!targetBranchId) {
      setError(t('admin.validation.noBranchSelected'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setFieldErrors({});

      if (editingUser) {
        await userService.updateUser(editingUser.id, formData, currentUser || undefined);
        setUsers(prev => prev.map(u => (u.id === editingUser.id ? { ...u, ...formData } : u)));
      } else {
        // Validate password
        if (!password || password.length < 8) {
          setFieldErrors(prev => ({ ...prev, password: 'Lösenordet måste vara minst 8 tecken' }));
          setError('Lösenordet måste vara minst 8 tecken');
          setLoading(false);
          return;
        }

        // Warn if password is weak
        if (passwordStrength.strength === 'weak' || passwordStrength.strength === 'fair') {
          if (
            !window.confirm(
              'Lösenordet är svagt eller måttligt. Rekommenderas att använda ett starkare lösenord. Vill du fortsätta ändå?'
            )
          ) {
            setLoading(false);
            return;
          }
        }

        // Set permission level based on role
        const permissionLevel =
          formData.role === 'inspector' ? 0 : formData.role === 'branchAdmin' ? 1 : 2;

        // Create user with Firebase Auth using Cloud Function
        const authResult = await createUserWithAuth({
          email: formData.email!,
          password: password,
          displayName: formData.displayName!,
          role: formData.role!,
          branchId: targetBranchId,
          isActive: formData.isActive!,
          invitedBy: currentUser?.displayName || 'Admin',
        });

        if (!authResult.success) {
          setError(t('admin.errors.failedToCreateUser') + ': ' + authResult.error);
          return;
        }

        logger.log('✅ User created with Firebase Auth:', authResult.userId);

        const user = {
          id: authResult.userId!,
          uid: authResult.firebaseUid!,
          ...formData,
          permissionLevel,
          branchId: targetBranchId,
        } as User;

        // Refresh the users list
        if (currentUser?.role === 'superadmin') {
          await loadAllUsers();
        } else {
          await loadBranchUsers(targetBranchId);
        }
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({ email: '', displayName: '', role: 'inspector', isActive: true });
      setPassword('');
      setShowPassword(false);
      setError('');
      setFieldErrors({});

      // Show success toast
      if (editingUser) {
        showSuccess(
          t('admin.userManagement.userUpdatedSuccessfully') || 'User updated successfully'
        );
      } else {
        showSuccess(
          t('admin.userManagement.userCreatedSuccessfully') || 'User created successfully'
        );
      }
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMsg = t('admin.errors.failedToSaveUser') || 'Failed to save user';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    });
    setPassword('');
    setShowPassword(false);
    setError('');
    setFieldErrors({});
    setShowForm(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const targetBranchId = userToDelete.branchId || selectedBranch || currentUser?.branchId;
    if (!targetBranchId) {
      setError('No branch selected');
      return;
    }

    setIsDeleting(true);
    try {
      await userService.deleteUser(userToDelete.id, currentUser || undefined);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setShowDeleteDialog(false);
      setUserToDelete(null);
      showSuccess(t('admin.userManagement.userDeletedSuccessfully') || 'User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      // Use the error message from service if available, otherwise use generic message
      const errorMsg = error.message || 'Failed to delete user';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const targetBranchId = user.branchId || selectedBranch || currentUser?.branchId;
    if (!targetBranchId) {
      setError('No branch selected');
      return;
    }

    try {
      await userService.toggleUserStatus(user.id, !user.isActive);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));

      const status = user.isActive ? 'deactivated' : 'activated';
      showSuccess(`User ${status} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      const errorMsg = 'Failed to toggle user status';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (
      !window.confirm(t('admin.userManagement.confirmResetPassword', { name: user.displayName }))
    ) {
      return;
    }

    setIsResettingPassword(true);
    try {
      const result = await userService.resetUserPassword(user.id);
      if (result.success && result.password) {
        setPasswordToShow(result.password);
        setUserForPassword(user);
        setShowPasswordModal(true);
        showSuccess(t('admin.userManagement.passwordResetSuccess'));
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showError(error.message || t('admin.userManagement.passwordResetError'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleViewPassword = async (user: User) => {
    setIsViewingPassword(true);
    try {
      const result = await userService.viewUserPassword(user.id);
      if (result.success && result.password) {
        setPasswordToShow(result.password);
        setUserForPassword(user);
        setShowPasswordModal(true);
      } else {
        showError(result.error || t('admin.userManagement.passwordViewError'));
      }
    } catch (error: any) {
      console.error('Error viewing password:', error);
      showError(error.message || t('admin.userManagement.passwordViewError'));
    } finally {
      setIsViewingPassword(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ email: '', displayName: '', role: 'inspector', isActive: true });
    setPassword('');
    setShowPassword(false);
    setError('');
    setFieldErrors({});

    // Refresh the user list to ensure it's up to date
    if (currentUser?.role === 'superadmin') {
      if (selectedBranch) {
        loadBranchUsers(selectedBranch);
      } else {
        loadAllUsers();
      }
    } else if (currentUser?.role === 'branchAdmin' && currentUser?.branchId) {
      loadBranchUsers(currentUser.branchId);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'branchAdmin':
        return 'bg-blue-100 text-blue-800';
      case 'inspector':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBranchName = (branchId: string) => {
    if (!branchId) return 'No Branch';
    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      // If branches are still loading, show loading state
      if (branches.length === 0) return 'Loading...';
      return `Branch ${branchId.slice(0, 8)}...`;
    }
    return branch.name;
  };

  if (loading && users.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6 font-material max-w-7xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-8'>
      {/* Material Design Header */}
      <div className='bg-white p-8 rounded-xl shadow-sm border border-slate-200'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 flex items-center tracking-tight'>
              <Users className='w-8 h-8 mr-3 text-slate-600' />
              {t('admin.userManagement.title')}
            </h1>
            <p className='text-slate-600 mt-2'>{t('admin.userManagement.subtitle')}</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all uppercase tracking-wide'
          >
            <Plus className='w-5 h-5 mr-2' />
            {t('admin.userManagement.addUser')}
          </button>
        </div>
      </div>

      {/* Branch Filter for Superadmin */}
      {currentUser?.role === 'superadmin' && (
        <div className='bg-white p-4 rounded-xl shadow-sm border border-slate-200'>
          <div className='flex items-center space-x-4'>
            <Filter className='w-5 h-5 text-slate-400' />
            <label htmlFor='branchFilter' className='text-sm font-medium text-slate-700'>
              {t('admin.userManagement.filterByBranch')}:
            </label>
            <select
              id='branchFilter'
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className='border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
            >
              <option value=''>{t('admin.userManagement.allBranches')}</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex'>
            <AlertTriangle className='w-5 h-5 text-red-400' />
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* User Form */}
      {showForm && (
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <h2 className='text-lg font-bold text-slate-900 mb-4'>
            {editingUser
              ? t('admin.userManagement.editUser')
              : t('admin.userManagement.addNewUser')}
          </h2>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Information Section */}
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2'>
                {t('admin.userManagement.basicInfo')}
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-slate-700 mb-1'>
                    {t('admin.userManagement.emailAddress')} *
                  </label>
                  <input
                    type='email'
                    id='email'
                    required
                    value={formData.email || ''}
                    onChange={handleEmailChange}
                    className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      fieldErrors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-300'
                    }`}
                    placeholder={t('admin.userManagement.emailPlaceholder')}
                  />
                  {fieldErrors.email && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor='displayName'
                    className='block text-sm font-medium text-slate-700 mb-1'
                  >
                    {t('admin.userManagement.displayName')} *
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      id='displayName'
                      required
                      value={formData.displayName || ''}
                      onChange={handleDisplayNameChange}
                      className={`mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                        fieldErrors.displayName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-300'
                      }`}
                      placeholder={t('admin.userManagement.displayNamePlaceholder')}
                      maxLength={100}
                    />
                    {formData.displayName && (
                      <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400'>
                        {formData.displayName.length}/100
                      </span>
                    )}
                  </div>
                  {fieldErrors.displayName && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.displayName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role & Permissions Section */}
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2'>
                {t('admin.userManagement.roleAndPermissions')}
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Branch Selection - Required for superadmin */}
                {currentUser?.role === 'superadmin' && (
                  <div className='md:col-span-2'>
                    <label
                      htmlFor='branchId'
                      className='block text-sm font-medium text-slate-700 mb-1'
                    >
                      {t('admin.userManagement.branchAssignment')} *
                    </label>
                    <select
                      id='branchId'
                      required
                      value={selectedBranch}
                      onChange={e => setSelectedBranch(e.target.value)}
                      className='mt-1 block w-full px-4 py-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                    >
                      <option value=''>{t('admin.userManagement.selectBranch')}</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <p className='mt-1 text-xs text-slate-500'>
                      {t('admin.userManagement.branchAssignmentHelp')}
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor='role' className='block text-sm font-medium text-slate-700 mb-1'>
                    {t('admin.userManagement.role')} *
                  </label>
                  <select
                    id='role'
                    required
                    value={formData.role || 'inspector'}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))
                    }
                    className='mt-1 block w-full px-4 py-2.5 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  >
                    <option value='inspector'>{t('admin.userManagement.roles.inspector')}</option>
                    <option value='branchAdmin'>
                      {t('admin.userManagement.roles.branchAdmin')}
                    </option>
                    {currentUser?.role === 'superadmin' && (
                      <option value='superadmin'>
                        {t('admin.userManagement.roles.superadmin')}
                      </option>
                    )}
                  </select>
                </div>

                <div className='flex items-center pt-6'>
                  <input
                    type='checkbox'
                    id='isActive'
                    checked={formData.isActive || false}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className='h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded'
                  />
                  <label htmlFor='isActive' className='ml-2 block text-sm text-slate-900'>
                    {t('admin.userManagement.activeUser')}
                  </label>
                </div>
              </div>
            </div>

            {/* Password Field - Required for new users */}
            {!editingUser && (
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2'>
                  {t('admin.userManagement.passwordSection')}
                </h3>
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-slate-700 mb-1'
                  >
                    {t('admin.userManagement.password')} *
                  </label>
                  <div className='mt-1 flex rounded-lg shadow-sm'>
                    <div className='relative flex-1'>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id='password'
                        required
                        value={password}
                        onChange={handlePasswordChange}
                        className={`block w-full px-4 py-2.5 pr-20 rounded-l-lg border focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                          fieldErrors.password
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-300'
                        }`}
                        placeholder={t('admin.userManagement.passwordPlaceholder')}
                        minLength={8}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1.5'
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                    <button
                      type='button'
                      onClick={handleGeneratePassword}
                      disabled={isGeneratingPassword}
                      className='inline-flex items-center px-4 py-2.5 border border-l-0 border-slate-300 rounded-r-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isGeneratingPassword ? (
                        <>
                          <LoadingSpinner size='sm' />
                          <span className='ml-2'>
                            {t('admin.userManagement.generatingPassword')}
                          </span>
                        </>
                      ) : (
                        t('admin.userManagement.generatePassword')
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.password}</p>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className='mt-2'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-xs font-medium text-slate-600'>
                        {t('admin.userManagement.passwordStrength')}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          passwordStrength.strength === 'weak'
                            ? 'text-red-600'
                            : passwordStrength.strength === 'fair'
                              ? 'text-orange-600'
                              : passwordStrength.strength === 'good'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                        }`}
                      >
                        {passwordStrength.strength === 'weak'
                          ? t('admin.userManagement.passwordStrengthLevels.weak')
                          : passwordStrength.strength === 'fair'
                            ? t('admin.userManagement.passwordStrengthLevels.fair')
                            : passwordStrength.strength === 'good'
                              ? t('admin.userManagement.passwordStrengthLevels.good')
                              : t('admin.userManagement.passwordStrengthLevels.strong')}
                      </span>
                    </div>
                    <div className='w-full bg-slate-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 'weak'
                            ? 'bg-red-500'
                            : passwordStrength.strength === 'fair'
                              ? 'bg-orange-500'
                              : passwordStrength.strength === 'good'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 8) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className='mt-2 text-xs text-slate-600 space-y-1'>
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className='flex items-center'>
                            <span className='text-red-500 mr-1'>•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <p className='mt-1 text-sm text-slate-500'>
                  {t('admin.userManagement.passwordHelp')}
                </p>
              </div>
            )}

            <div className='flex justify-end space-x-3'>
              <button
                type='button'
                onClick={handleCancel}
                className='px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500'
              >
                {t('form.buttons.cancel')}
              </button>

              <button
                type='submit'
                disabled={loading || !isFormValid()}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? <LoadingSpinner size='sm' /> : <CheckCircle className='w-4 h-4 mr-2' />}
                {editingUser
                  ? t('admin.userManagement.updateUser')
                  : t('admin.userManagement.createUser')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-medium text-gray-900'>
            {t('admin.userManagement.users')} ({users.length})
            {currentUser?.role === 'superadmin' && selectedBranch && (
              <span className='text-sm text-gray-500 ml-2'>- {getBranchName(selectedBranch)}</span>
            )}
          </h2>
        </div>

        {users.length === 0 ? (
          <div className='p-6 text-center'>
            <Users className='w-12 h-12 text-gray-400 mx-auto' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              {t('admin.userManagement.noUsers')}
            </h3>
            <p className='mt-1 text-sm text-gray-500'>{t('admin.userManagement.getStarted')}</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {users.map(user => (
              <div key={user.id} className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-3'>
                      <div>
                        <h3 className='text-sm font-medium text-gray-900 truncate'>
                          {user.displayName}
                        </h3>
                        <p className='text-sm text-gray-500 truncate'>{user.email}</p>
                        <div className='flex items-center mt-1 space-x-4'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}
                          >
                            {user.role}
                          </span>
                          {currentUser?.role === 'superadmin' && (
                            <span className='text-xs text-gray-500'>
                              {getBranchName(user.branchId)}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isActive
                              ? t('admin.userManagement.status.active')
                              : t('admin.userManagement.status.inactive')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Tooltip
                      content={
                        user.isActive
                          ? t('admin.userManagement.deactivateUser')
                          : t('admin.userManagement.activateUser')
                      }
                    >
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-md transition-colors ${
                          user.isActive
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? (
                          <UserX className='w-4 h-4' />
                        ) : (
                          <UserCheck className='w-4 h-4' />
                        )}
                      </button>
                    </Tooltip>

                    <Tooltip content={t('admin.userManagement.editUser')}>
                      <button
                        onClick={() => handleEdit(user)}
                        className='p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                    </Tooltip>

                    <Tooltip content={t('admin.userManagement.resetPassword')}>
                      <button
                        onClick={() => handleResetPassword(user)}
                        disabled={isResettingPassword}
                        className='p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${isResettingPassword ? 'animate-spin' : ''}`}
                        />
                      </button>
                    </Tooltip>

                    <Tooltip content={t('admin.userManagement.viewPassword')}>
                      <button
                        onClick={() => handleViewPassword(user)}
                        disabled={isViewingPassword}
                        className='p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Key className={`w-4 h-4 ${isViewingPassword ? 'animate-pulse' : ''}`} />
                      </button>
                    </Tooltip>

                    <Tooltip content={t('admin.userManagement.deleteUser')}>
                      <button
                        onClick={() => handleDelete(user)}
                        className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Password View Modal */}
        {showPasswordModal && userForPassword && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>
                {t('admin.userManagement.userPassword')}
              </h3>
              <div className='mb-4'>
                <p className='text-sm text-slate-600 mb-2'>
                  {t('admin.userManagement.passwordFor')}:{' '}
                  <strong>{userForPassword.displayName}</strong>
                </p>
                <p className='text-sm text-slate-600 mb-4'>{userForPassword.email}</p>
                <div className='bg-slate-50 border border-slate-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <code className='text-lg font-mono text-slate-900 break-all'>
                      {passwordToShow}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(passwordToShow || '');
                        showSuccess(t('admin.userManagement.passwordCopied'));
                      }}
                      className='ml-2 p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors'
                      title={t('admin.userManagement.copyPassword')}
                      aria-label={t('admin.userManagement.copyPassword')}
                    >
                      <Edit className='w-4 h-4' />
                    </button>
                  </div>
                </div>
                <p className='text-xs text-slate-500 mt-2'>
                  {t('admin.userManagement.passwordWarning')}
                </p>
              </div>
              <div className='flex justify-end'>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordToShow(null);
                    setUserForPassword(null);
                  }}
                  className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                >
                  {t('common.buttons.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDeleteUser}
          title={t('admin.userManagement.deleteUser')}
          message={t('admin.userManagement.deleteUserConfirm', { name: userToDelete?.displayName })}
          confirmText={t('common.delete')}
          cancelText={t('form.buttons.cancel')}
          type='danger'
          icon='trash'
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default UserManagement;
