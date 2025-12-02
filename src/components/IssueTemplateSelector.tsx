import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  ISSUE_TEMPLATES,
  IssueTemplate,
  getSeverityIcon,
  getSeverityColor,
  getTypeIcon,
} from '../constants/issueTemplates';
import { IssueType, IssueSeverity } from '../types';
import { useIntl } from '../hooks/useIntl';

interface IssueTemplateSelectorProps {
  onSelectTemplate: (template: IssueTemplate) => void;
  onClose: () => void;
}

const IssueTemplateSelector: React.FC<IssueTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const { t } = useIntl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<IssueType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | 'all'>('all');

  const filteredTemplates = ISSUE_TEMPLATES.filter(template => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || template.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || template.severity === selectedSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleSelectTemplate = (template: IssueTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>{t('issueTemplates.title') || 'Välj mall för problem'}</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Filters */}
        <div className='p-6 border-b border-gray-200'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder={t('issueTemplates.searchPlaceholder') || 'Sök mallar...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as IssueType | 'all')}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>{t('issueTemplates.allTypes') || 'Alla typer'}</option>
              <option value='leak'>{t('issueTypes.leak') || 'Läckage'}</option>
              <option value='damage'>{t('issueTypes.damage') || 'Skada'}</option>
              <option value='wear'>{t('issueTypes.wear') || 'Slitage'}</option>
              <option value='structural'>{t('issueTypes.structural') || 'Struktur'}</option>
              <option value='ventilation'>{t('issueTypes.ventilation') || 'Ventilation'}</option>
              <option value='gutters'>{t('issueTypes.gutters') || 'Takrännor'}</option>
              <option value='flashing'>{t('issueTypes.flashing') || 'Taklist'}</option>
              <option value='other'>{t('issueTypes.other') || 'Annat'}</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value as IssueSeverity | 'all')}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>{t('common.filters') || 'Alla'}</option>
              <option value='critical'>{t('severity.critical')}</option>
              <option value='high'>{t('severity.high')}</option>
              <option value='medium'>{t('severity.medium')}</option>
              <option value='low'>{t('severity.low')}</option>
            </select>
          </div>
        </div>

        {/* Templates List */}
        <div className='flex-1 overflow-y-auto p-6'>
          {filteredTemplates.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <p>{t('issueTemplates.noTemplatesFound') || 'Inga mallar hittades som matchar dina kriterier.'}</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {filteredTemplates.map(template => {
                // Map template IDs to translation keys
                const templateKeyMap: Record<string, string> = {
                  'leak_roof_edge': 'roofEdgeLeak',
                  'leak_chimney': 'chimneyLeak',
                  'damage_missing_tiles': 'missingTiles',
                  'damage_cracked_tiles': 'crackedTiles',
                  'wear_general': 'generalWear',
                  'structural_sagging': 'roofSagging',
                  'ventilation_blocked': 'blockedVentilation',
                  'gutters_clogged': 'cloggedGutters',
                  'flashing_damaged': 'damagedFlashing',
                  'moss_growth': 'mossGrowth',
                };
                
                const templateKey = templateKeyMap[template.id] || template.id.replace(/_/g, '');
                const titleKey = `issueTemplates.${templateKey}.title`;
                const descKey = `issueTemplates.${templateKey}.description`;
                const locationKey = `issueTemplates.${templateKey}.location`;
                
                return (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className='border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-2xl'>{template.icon}</span>
                        <h3 className='font-medium text-gray-900'>
                          {t(titleKey) || template.title}
                        </h3>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(template.severity)}`}
                        >
                          {getSeverityIcon(template.severity)} {t(`severity.${template.severity}`)}
                        </span>
                      </div>
                    </div>

                    <p className='text-sm text-gray-600 mb-2'>
                      {t(descKey) || template.description}
                    </p>

                    <div className='flex items-center justify-between text-xs text-gray-500'>
                      <span className='flex items-center'>
                        {getTypeIcon(template.type)} {t(`issueTypes.${template.type}`) || template.type}
                      </span>
                      <span>📍 {t(locationKey) || template.location}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-gray-500'>
              {filteredTemplates.length === 1 
                ? t('issueTemplates.templatesFound.one', { count: filteredTemplates.length }) || `${filteredTemplates.length} mall hittades`
                : t('issueTemplates.templatesFound.other', { count: filteredTemplates.length }) || `${filteredTemplates.length} mallar hittades`
              }
            </p>
            <button
              onClick={onClose}
              className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
            >
              {t('common.buttons.cancel') || 'Avbryt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueTemplateSelector;
