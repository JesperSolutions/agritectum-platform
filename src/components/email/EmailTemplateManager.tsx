import React, { useState } from 'react';
import { Mail, Edit, Save, X } from 'lucide-react';
import { EmailTemplate, defaultTemplates } from '../services/triggerEmailService';

interface EmailTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: EmailTemplate) => void;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => (t.id === editingTemplate.id ? editingTemplate : t)));
      setIsEditing(false);
      setEditingTemplate(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTemplate(null);
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    onTemplateSelect(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <Mail className='w-6 h-6 text-blue-600' />
            <h2 className='text-xl font-semibold text-gray-900'>Email Templates</h2>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {isEditing && editingTemplate ? (
            /* Edit Template Form */
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Template Name
                </label>
                <input
                  type='text'
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Subject Line</label>
                <input
                  type='text'
                  value={editingTemplate.subject}
                  onChange={e =>
                    setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                  }
                  className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Email Body</label>
                <textarea
                  value={editingTemplate.body}
                  onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  rows={15}
                  className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex justify-end space-x-3'>
                <button
                  onClick={handleCancelEdit}
                  className='px-4 py-2 text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium shadow-sm'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Save Template
                </button>
              </div>
            </div>
          ) : (
            /* Template List */
            <div className='space-y-4'>
              {templates.map(template => (
                <div
                  key={template.id}
                  className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        {template.name}
                        {template.isDefault && (
                          <span className='ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                            Default
                          </span>
                        )}
                      </h3>
                      <p className='text-sm text-gray-600 mb-2'>
                        <strong>Subject:</strong> {template.subject}
                      </p>
                      <div className='text-sm text-gray-500 max-h-20 overflow-hidden'>
                        <strong>Body Preview:</strong> {template.body.substring(0, 200)}...
                      </div>
                    </div>
                    <div className='flex space-x-2 ml-4'>
                      <button
                        onClick={() => handleSelectTemplate(template)}
                        className='px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                      >
                        Use Template
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateManager;
