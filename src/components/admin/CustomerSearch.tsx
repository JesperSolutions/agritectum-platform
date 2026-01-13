import React, { useState, useEffect, useRef } from 'react';
import { searchCustomers } from '../../services/customerService';
import { Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Loader2 } from 'lucide-react';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
  placeholder?: string;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ 
  onCustomerSelect,
  placeholder = 'Søg kunder efter navn, email, telefon...'
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Autocomplete: search as user types (debounced)
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // Pass branchId from current user for proper filtering
        const customers = await searchCustomers(searchTerm, currentUser?.branchId);
        setResults(customers);
        setShowDropdown(customers.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setError('Kunne ikke søge efter kunder');
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, currentUser?.branchId]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Enter' && searchTerm.length >= 2) {
        // Trigger search on Enter even if dropdown not showing
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSearchTerm('');
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedEl = dropdownRef.current.children[selectedIndex] as HTMLElement;
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="relative mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          className="w-full border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          aria-label="Søg efter kunde"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="customer-search-results"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mt-1 px-1">{error}</div>
      )}
      
      {showDropdown && results.length > 0 && (
        <ul
          ref={dropdownRef}
          id="customer-search-results"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((customer, index) => (
            <li
              key={customer.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                index === selectedIndex 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={() => handleSelect(customer)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium text-slate-800">{customer.name}</div>
              <div className="text-sm text-slate-500 flex gap-2 flex-wrap">
                {customer.email && <span>{customer.email}</span>}
                {customer.phone && <span>• {customer.phone}</span>}
              </div>
              {customer.address && (
                <div className="text-xs text-slate-400 mt-0.5">{customer.address}</div>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {showDropdown && results.length === 0 && searchTerm.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-slate-500">
          Ingen kunder fundet for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
