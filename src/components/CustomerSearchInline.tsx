import React, { useState, useEffect, useRef } from 'react';
import { searchCustomers } from '../services/customerService';
import { Customer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, Building2, Phone, Mail } from 'lucide-react';

interface CustomerSearchInlineProps {
  onCustomerSelect: (customer: Customer) => void;
  placeholder?: string;
}

const CustomerSearchInline: React.FC<CustomerSearchInlineProps> = ({ 
  onCustomerSelect,
  placeholder = 'Søg kunder...'
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
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
      try {
        const customers = await searchCustomers(searchTerm, currentUser?.branchId);
        setResults(customers);
        setShowDropdown(customers.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, currentUser?.branchId]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

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

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          className="w-full border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-white"
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          aria-label="Søg efter kunde"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>
      
      {showDropdown && results.length > 0 && (
        <ul
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {results.map((customer, index) => (
            <li
              key={customer.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`p-3 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
              onClick={() => handleSelect(customer)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium text-slate-900">{customer.name}</div>
              <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                {customer.address && (
                  <div className="flex items-center">
                    <Building2 className="w-3 h-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {customer.phone && (
                    <span className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.email && (
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showDropdown && results.length === 0 && searchTerm.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-slate-500">
          Ingen kunder fundet
        </div>
      )}
    </div>
  );
};

export default CustomerSearchInline;
