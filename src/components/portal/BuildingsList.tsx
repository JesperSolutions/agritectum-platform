import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { getBuildingsByCustomer, createBuilding } from '../../services/buildingService';
import { Building } from '../../types';
import { Building as BuildingIcon, Plus, MapPin } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ListCard from '../shared/cards/ListCard';
import PageHeader from '../shared/layouts/PageHeader';
import IconLabel from '../shared/layouts/IconLabel';

const BuildingsList: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    buildingType: 'residential' as Building['buildingType'],
    roofType: 'tile' as Building['roofType'],
    roofSize: '',
  });

  useEffect(() => {
    if (currentUser) {
      loadBuildings();
    }
  }, [currentUser]);

  const loadBuildings = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Use companyId (linked customer/company document) not user uid
      const customerId = currentUser.companyId || currentUser.uid;
      const data = await getBuildingsByCustomer(customerId);
      setBuildings(data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (!formData.address || !formData.name) {
        alert('Please fill in all required fields (Name and Address)');
        return;
      }
      // Use companyId (linked customer/company document) not user uid
      const customerId = currentUser.companyId || currentUser.uid;
      await createBuilding({
        name: formData.name,
        customerId: customerId,
        address: formData.address,
        buildingType: formData.buildingType,
        roofType: formData.roofType,
        roofSize: formData.roofSize ? parseFloat(formData.roofSize) : undefined,
      });
      setShowForm(false);
      setFormData({
        name: '',
        address: '',
        buildingType: 'residential',
        roofType: 'tile',
        roofSize: '',
      });
      loadBuildings();
    } catch (error) {
      console.error('Error creating building:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <PageHeader
          title={t('buildings.title') || 'Buildings'}
          subtitle={t('buildings.subtitle') || 'Manage your buildings and properties'}
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className='flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors'
        >
          <Plus className='w-5 h-5' />
          <span>{t('buildings.addBuilding') || 'Add Building'}</span>
        </button>
      </div>

      {showForm && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold mb-4'>{t('buildings.addBuilding')}</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Building Name *
              </label>
              <input
                type='text'
                placeholder='e.g., Main Office, Warehouse A'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('buildings.address')} *
              </label>
              <input
                type='text'
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('buildings.buildingType')}
                </label>
                <select
                  value={formData.buildingType}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      buildingType: e.target.value as Building['buildingType'],
                    })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='residential'>{t('buildings.residential')}</option>
                  <option value='commercial'>{t('buildings.commercial')}</option>
                  <option value='industrial'>{t('buildings.industrial')}</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('buildings.roofType')}
                </label>
                <select
                  value={formData.roofType}
                  onChange={e =>
                    setFormData({ ...formData, roofType: e.target.value as Building['roofType'] })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='tile'>{t('roofTypes.tile')}</option>
                  <option value='metal'>{t('roofTypes.metal')}</option>
                  <option value='shingle'>{t('roofTypes.shingle')}</option>
                  <option value='slate'>{t('roofTypes.slate')}</option>
                  <option value='flat'>{t('roofTypes.flat')}</option>
                  <option value='flat_bitumen_2layer'>{t('roofTypes.flat_bitumen_2layer')}</option>
                  <option value='flat_bitumen_3layer'>{t('roofTypes.flat_bitumen_3layer')}</option>
                  <option value='flat_rubber'>{t('roofTypes.flat_rubber')}</option>
                  <option value='flat_pvc'>{t('roofTypes.flat_pvc')}</option>
                  <option value='flat_tpo'>{t('roofTypes.flat_tpo')}</option>
                  <option value='flat_epdm'>{t('roofTypes.flat_epdm')}</option>
                  <option value='other'>{t('roofTypes.other')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {t('buildings.roofSize')}
              </label>
              <input
                type='number'
                value={formData.roofSize}
                onChange={e => setFormData({ ...formData, roofSize: e.target.value })}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <div className='flex space-x-4'>
              <button
                type='submit'
                className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
              >
                {t('buildings.createBuilding')}
              </button>
              <button
                type='button'
                onClick={() => setShowForm(false)}
                className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300'
              >
                {t('buildings.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {buildings.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-12 text-center border border-slate-200'>
          <BuildingIcon className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600 mb-4'>{t('buildings.noBuildings') || 'No buildings yet'}</p>
          <button
            onClick={() => setShowForm(true)}
            className='px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors'
          >
            {t('buildings.addFirstBuilding') || 'Add Your First Building'}
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {buildings.map(building => (
            <Link key={building.id} to={`/portal/buildings/${building.id}`} className='block'>
              <ListCard>
                <div className='flex items-start justify-between mb-4'>
                  <BuildingIcon className='w-8 h-8 text-slate-700' />
                  <span className='px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded'>
                    {building.buildingType ? t(`buildings.${building.buildingType}`) : 'N/A'}
                  </span>
                </div>
                <h3 className='font-semibold text-gray-900 mb-2'>{building.name || 'N/A'}</h3>
                <p className='text-sm text-gray-600 mb-4'>{building.address}</p>
                <div className='space-y-2'>
                  {building.roofType && (
                    <IconLabel
                      icon={MapPin}
                      label={t('buildings.roofType')}
                      value={t(`roofTypes.${building.roofType}`) || building.roofType}
                      iconClassName='w-4 h-4 text-gray-400'
                    />
                  )}
                  {building.roofSize && (
                    <p className='text-sm text-gray-600'>
                      {t('buildings.size')}: {building.roofSize} m²
                    </p>
                  )}
                </div>
              </ListCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuildingsList;
