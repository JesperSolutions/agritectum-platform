/**
 * Notification Settings Component
 * 
 * A comprehensive settings panel for managing user notification preferences.
 * Allows users to customize their notification experience including:
 * - Notification types (inspection complete, urgent issues, etc.)
 * - Delivery methods (email vs in-app)
 * - Frequency settings
 * - Unsubscribe functionality
 * 
 * Features:
 * - Real-time preference updates
 * - Email preference integration
 * - Swedish localization
 * - Error handling and success feedback
 * - Responsive modal design
 * 
 * @author Agritectum Development Team
 * @version 1.0.0
 * @since 2024-09-22
 */

import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Smartphone, Clock, Settings } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import { useAuth } from '../contexts/AuthContext';
import { getEmailPreferences, setEmailPreferences, EmailPreferences } from '../services/emailPreferenceService';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { t } = useIntl();
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (isOpen && currentUser?.email) {
      loadPreferences();
    }
  }, [isOpen, currentUser?.email]);

  const loadPreferences = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const prefs = await getEmailPreferences(currentUser.email);
      if (prefs) {
        setPreferences(prefs);
      } else {
        // Create default preferences
        const defaultPrefs: EmailPreferences = {
          email: currentUser.email,
          subscribed: true,
          preferences: {
            inspectionComplete: true,
            urgentIssues: true,
            weeklyDigest: true,
            marketingEmails: false,
            systemNotifications: true,
          },
          unsubscribeToken: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setPreferences(defaultPrefs);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(t('notifications.errorLoadingPreferences'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences['preferences']) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      preferences: {
        ...preferences.preferences,
        [key]: !preferences.preferences[key],
      },
    });
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily' | 'weekly') => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      preferences: {
        ...preferences.preferences,
        // Map frequency to specific preferences
        inspectionComplete: frequency === 'immediate',
        urgentIssues: frequency === 'immediate',
        weeklyDigest: frequency === 'weekly',
      },
    });
  };

  const handleDeliveryMethodToggle = (method: 'email' | 'inApp') => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      preferences: {
        ...preferences.preferences,
        // Toggle based on delivery method
        inspectionComplete: method === 'email',
        urgentIssues: method === 'email',
        systemNotifications: method === 'inApp',
      },
    });
  };

  const handleSave = async () => {
    if (!preferences || !currentUser?.email) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await setEmailPreferences(currentUser.email, preferences.preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(t('notifications.errorSavingPreferences'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!currentUser?.email) return;
    
    if (window.confirm(t('notifications.confirmUnsubscribe'))) {
      setSaving(true);
      try {
        await setEmailPreferences(currentUser.email, {
          inspectionComplete: false,
          urgentIssues: false,
          weeklyDigest: false,
          marketingEmails: false,
          systemNotifications: false,
        });
        setPreferences(prev => prev ? { ...prev, subscribed: false } : null);
        setSuccess(true);
      } catch (err) {
        console.error('Error unsubscribing:', err);
        setError(t('notifications.errorUnsubscribing'));
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">
              {t('notifications.settings')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
              <span className="ml-2 text-slate-600">{t('common.loading')}</span>
            </div>
          ) : preferences ? (
            <>
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{t('notifications.preferencesSaved')}</p>
                </div>
              )}

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t('notifications.notificationTypes')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {t('notifications.inspectionComplete')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t('notifications.inspectionCompleteDesc')}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences.inspectionComplete}
                        onChange={() => handleToggle('inspectionComplete')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {t('notifications.urgentIssues')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t('notifications.urgentIssuesDesc')}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences.urgentIssues}
                        onChange={() => handleToggle('urgentIssues')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {t('notifications.weeklyDigest')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t('notifications.weeklyDigestDesc')}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences.weeklyDigest}
                        onChange={() => handleToggle('weeklyDigest')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {t('notifications.systemNotifications')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t('notifications.systemNotificationsDesc')}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences.systemNotifications}
                        onChange={() => handleToggle('systemNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Delivery Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t('notifications.deliveryMethods')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-900">{t('notifications.email')}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences.inspectionComplete || preferences.preferences.urgentIssues}
                        onChange={() => handleDeliveryMethodToggle('email')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-900">{t('notifications.inApp')}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences.systemNotifications}
                        onChange={() => handleDeliveryMethodToggle('inApp')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                <button
                  onClick={handleUnsubscribe}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm font-medium"
                >
                  {t('notifications.unsubscribe')}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">{t('notifications.errorLoadingPreferences')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;