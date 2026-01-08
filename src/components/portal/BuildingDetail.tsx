import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBuildingById, updateBuilding } from '../../services/buildingService';
import { Building } from '../../types';
import { Building as BuildingIcon, MapPin, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const BuildingDetail: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    buildingType: 'residential' as Building['buildingType'],
    roofType: 'tile' as Building['roofType'],
    roofSize: '',
  });

  useEffect(() => {
    if (buildingId) {
      loadBuilding();
    }
  }, [buildingId]);

  const loadBuilding = async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const data = await getBuildingById(buildingId);
      if (data) {
        setBuilding(data);
        setFormData({
          address: data.address,
          buildingType: data.buildingType || 'residential',
          roofType: data.roofType || 'tile',
          roofSize: data.roofSize?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading building:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) return;

    try {
      await updateBuilding(buildingId, {
        address: formData.address,
        buildingType: formData.buildingType,
        roofType: formData.roofType,
        roofSize: formData.roofSize ? parseFloat(formData.roofSize) : undefined,
      });
      setEditing(false);
      loadBuilding();
    } catch (error) {
      console.error('Error updating building:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!building) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>Building not found</p>
        <Link to='/portal/buildings' className='text-green-600 hover:text-green-700 mt-4 inline-block'>
          Back to Buildings
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Link
        to='/portal/buildings'
        className='inline-flex items-center text-gray-600 hover:text-gray-900'
      >
        <ArrowLeft className='w-4 h-4 mr-2' />
        Back to Buildings
      </Link>

      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{building.address}</h1>
            <p className='text-gray-600 mt-2'>Building Details</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Address *</label>
              <input
                type='text'
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Building Type</label>
                <select
                  value={formData.buildingType}
                  onChange={(e) => setFormData({ ...formData, buildingType: e.target.value as Building['buildingType'] })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='residential'>Residential</option>
                  <option value='commercial'>Commercial</option>
                  <option value='industrial'>Industrial</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Roof Type</label>
                <select
                  value={formData.roofType}
                  onChange={(e) => setFormData({ ...formData, roofType: e.target.value as Building['roofType'] })}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
                >
                  <option value='tile'>Tile</option>
                  <option value='metal'>Metal</option>
                  <option value='shingle'>Shingle</option>
                  <option value='slate'>Slate</option>
                  <option value='flat'>Flat</option>
                  <option value='other'>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Roof Size (m²)</label>
              <input
                type='number'
                value={formData.roofSize}
                onChange={(e) => setFormData({ ...formData, roofSize: e.target.value })}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500'
              />
            </div>
            <button
              type='submit'
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Address</p>
                <p className='text-gray-900'>{building.address}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Building Type</p>
                <p className='text-gray-900'>{building.buildingType || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Roof Type</p>
                <p className='text-gray-900'>{building.roofType || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Roof Size</p>
                <p className='text-gray-900'>{building.roofSize ? `${building.roofSize} m²` : 'N/A'}</p>
              </div>
            </div>
            {building.latitude && building.longitude && (
              <div>
                <p className='text-sm font-medium text-gray-600 mb-2'>Location</p>
                <p className='text-gray-900'>
                  {building.latitude.toFixed(6)}, {building.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingDetail;


