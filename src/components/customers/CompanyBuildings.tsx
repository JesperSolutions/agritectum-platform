import React, { useState, useEffect } from 'react';
import { useIntl } from '../../hooks/useIntl';
import { Customer } from '../../types';
import { Building, Plus, MapPin, Trash2, Edit } from 'lucide-react';

interface BuildingInfo {
  id: string;
  address: string;
  description?: string;
}

interface CompanyBuildingsProps {
  customer: Customer;
  onBuildingChange?: (buildings: BuildingInfo[]) => void;
}

const CompanyBuildings: React.FC<CompanyBuildingsProps> = ({ customer, onBuildingChange }) => {
  const { t } = useIntl();
  const [buildings, setBuildings] = useState<BuildingInfo[]>([]);
  const [editingBuilding, setEditingBuilding] = useState<BuildingInfo | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBuildingAddress, setNewBuildingAddress] = useState('');
  const [newBuildingDescription, setNewBuildingDescription] = useState('');

  useEffect(() => {
    // Initialize buildings from customer data
    // For now, if customer has buildingAddress, use that as the first building
    if (customer.buildingAddress) {
      setBuildings([
        {
          id: 'building_1',
          address: customer.buildingAddress,
          description: '',
        },
      ]);
    }
  }, [customer]);

  useEffect(() => {
    if (onBuildingChange) {
      onBuildingChange(buildings);
    }
  }, [buildings, onBuildingChange]);

  const handleAddBuilding = () => {
    if (newBuildingAddress.trim()) {
      const newBuilding: BuildingInfo = {
        id: `building_${Date.now()}`,
        address: newBuildingAddress.trim(),
        description: newBuildingDescription.trim() || undefined,
      };
      setBuildings([...buildings, newBuilding]);
      setNewBuildingAddress('');
      setNewBuildingDescription('');
      setShowAddForm(false);
    }
  };

  const handleRemoveBuilding = (buildingId: string) => {
    setBuildings(buildings.filter(b => b.id !== buildingId));
  };

  const handleEditBuilding = (building: BuildingInfo) => {
    setEditingBuilding(building);
    setNewBuildingAddress(building.address);
    setNewBuildingDescription(building.description || '');
    setShowAddForm(true);
  };

  const handleUpdateBuilding = () => {
    if (editingBuilding && newBuildingAddress.trim()) {
      setBuildings(
        buildings.map(b =>
          b.id === editingBuilding.id
            ? {
                ...b,
                address: newBuildingAddress.trim(),
                description: newBuildingDescription.trim() || undefined,
              }
            : b
        )
      );
      setEditingBuilding(null);
      setNewBuildingAddress('');
      setNewBuildingDescription('');
      setShowAddForm(false);
    }
  };

  if (customer.customerType !== 'company') {
    return null;
  }

  return (
    <div className='bg-white p-4 rounded-lg border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-medium text-gray-900 flex items-center'>
          <Building className='w-5 h-5 mr-2' />
          Byggnader
        </h3>
        {!showAddForm && (
          <button
            onClick={() => {
              setEditingBuilding(null);
              setNewBuildingAddress('');
              setNewBuildingDescription('');
              setShowAddForm(true);
            }}
            className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
          >
            <Plus className='w-4 h-4 mr-1' />
            Lägg till byggnad
          </button>
        )}
      </div>

      {showAddForm && (
        <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Byggnadsadress *
              </label>
              <input
                type='text'
                value={newBuildingAddress}
                onChange={e => setNewBuildingAddress(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                placeholder='Ange byggnadsadress'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Beskrivning (valfritt)
              </label>
              <input
                type='text'
                value={newBuildingDescription}
                onChange={e => setNewBuildingDescription(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                placeholder='T.ex. Huvudbyggnad, Lager, etc.'
              />
            </div>
            <div className='flex gap-2'>
              <button
                onClick={editingBuilding ? handleUpdateBuilding : handleAddBuilding}
                className='px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors shadow-sm'
              >
                {editingBuilding ? 'Uppdatera' : 'Lägg till'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingBuilding(null);
                  setNewBuildingAddress('');
                  setNewBuildingDescription('');
                }}
                className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm'
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {buildings.length === 0 && !showAddForm ? (
        <p className='text-sm text-gray-500 text-center py-4'>
          Inga byggnader tillagda ännu. Klicka på "Lägg till byggnad" för att börja.
        </p>
      ) : (
        <div className='space-y-2'>
          {buildings.map(building => (
            <div
              key={building.id}
              className='flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100'
            >
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-gray-400' />
                  <span className='font-medium text-gray-900'>{building.address}</span>
                </div>
                {building.description && (
                  <p className='text-sm text-gray-600 mt-1 ml-6'>{building.description}</p>
                )}
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => handleEditBuilding(building)}
                  className='p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded'
                  title='Redigera'
                >
                  <Edit className='w-4 h-4' />
                </button>
                <button
                  onClick={() => handleRemoveBuilding(building.id)}
                  className='p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded'
                  title='Ta bort'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyBuildings;
