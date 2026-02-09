import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { Building as BuildingType } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Building Switcher Dropdown
 * Quick navigation between buildings when viewing building details
 */
const BuildingSwitcher: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Load buildings
  useEffect(() => {
    const loadBuildings = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        const customerId = currentUser.companyId || currentUser.uid;
        const userBuildings = await getBuildingsByCustomer(customerId);
        setBuildings(userBuildings);
      } catch (error) {
        logger.error('Failed to load buildings for switcher:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBuildings();
  }, [currentUser]);

  // Don't show if not on building detail page
  if (!buildingId) {
    return null;
  }

  // Don't show if no buildings or only one building
  if (buildings.length <= 1) {
    return null;
  }

  const currentBuilding = buildings.find((b) => b.id === buildingId);

  const handleBuildingSelect = (selectedBuildingId: string) => {
    setIsOpen(false);
    navigate(`/portal/buildings/${selectedBuildingId}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent, selectedBuildingId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBuildingSelect(selectedBuildingId);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg transition-colors"
        aria-label="Switch building"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Building className="w-4 h-4 text-slate-600" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-900 max-w-[150px] truncate">
          {currentBuilding?.name || 'Select Building'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Select a building"
        >
          {loading ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto" />
              <p className="mt-2 text-sm">Loading buildings...</p>
            </div>
          ) : (
            <ul className="py-2">
              {buildings.map((building) => {
                const isSelected = building.id === buildingId;

                return (
                  <li
                    key={building.id}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      onClick={() => handleBuildingSelect(building.id)}
                      onKeyDown={(e) => handleKeyDown(e, building.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-slate-100' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <Building
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isSelected ? 'text-slate-900' : 'text-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div
                            className={`text-sm font-medium truncate ${
                              isSelected ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {building.name}
                          </div>
                          {building.address && (
                            <div className="text-xs text-slate-500 truncate">
                              {building.address}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check
                          className="w-5 h-5 text-slate-900 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* View all buildings link */}
          <div className="border-t border-slate-200 px-4 py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/portal/buildings');
              }}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              View all buildings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingSwitcher;
