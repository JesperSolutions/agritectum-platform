import React, { useState } from 'react';
import { searchCustomers, getCustomerById } from '../../services/customerService';
import { Customer } from '../../types';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ onCustomerSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const customers = await searchCustomers(searchTerm);
      setResults(customers);
    } catch (err) {
      setError('Error searching customers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="Search customers by name, email, phone, or address..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {results.length > 0 && (
        <ul className="border rounded mt-2 bg-white max-h-60 overflow-y-auto">
          {results.map(customer => (
            <li
              key={customer.id}
              className="p-2 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
              onClick={() => onCustomerSelect(customer)}
            >
              <div className="font-semibold">{customer.name}</div>
              <div className="text-xs text-slate-500">{customer.email || customer.phone || customer.address}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerSearch;
