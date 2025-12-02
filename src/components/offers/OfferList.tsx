import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Offer, OfferStatus } from '../../types';
import {
  getOffersByBranch,
  getOffersByStatus,
  calculateDaysPending,
  needsFollowUp,
} from '../../services/offerService';
import OfferStatusBadge from './OfferStatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

interface OfferListProps {
  onOfferClick?: (offerId: string) => void;
}

/**
 * Offer List Component
 * Displays list of offers with filtering and sorting
 */
const OfferList: React.FC<OfferListProps> = ({ onOfferClick }) => {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OfferStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'daysPending'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadOffers();
  }, [currentUser, filterStatus]);

  const loadOffers = async () => {
    if (!currentUser?.branchId) return;

    try {
      setLoading(true);
      setError(null);

      let fetchedOffers: Offer[];
      if (filterStatus === 'all') {
        fetchedOffers = await getOffersByBranch(currentUser.branchId);
      } else {
        fetchedOffers = await getOffersByStatus(currentUser.branchId, filterStatus);
      }

      // Sort offers
      const sortedOffers = sortOffers(fetchedOffers, sortBy, sortOrder);
      setOffers(sortedOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const sortOffers = (
    offers: Offer[],
    sortBy: string,
    order: 'asc' | 'desc'
  ): Offer[] => {
    const sorted = [...offers].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'daysPending':
          comparison = calculateDaysPending(a.sentAt) - calculateDaysPending(b.sentAt);
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const handleSort = (newSortBy: 'date' | 'amount' | 'daysPending') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleOfferClick = (offerId: string) => {
    if (onOfferClick) {
      onOfferClick(offerId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('accepted')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterStatus === 'accepted'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Sort */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as 'date' | 'amount' | 'daysPending')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="daysPending">Days Pending</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-600 hover:text-gray-900"
            aria-label="Toggle sort order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Pending
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No offers found
                </td>
              </tr>
            ) : (
              offers.map((offer) => {
                const daysPending = calculateDaysPending(offer.sentAt);
                const needsFollowUpFlag = needsFollowUp(offer);

                return (
                  <tr
                    key={offer.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      needsFollowUpFlag ? 'bg-yellow-50' : ''
                    }`}
                    onClick={() => handleOfferClick(offer.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {offer.customerName}
                      </div>
                      <div className="text-sm text-gray-500">{offer.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {offer.totalAmount.toLocaleString()} {offer.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OfferStatusBadge status={offer.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={daysPending > 7 ? 'text-orange-600 font-medium' : ''}>
                        {daysPending} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {needsFollowUpFlag && (
                        <span className="text-orange-600 text-xs">⚠️ Needs Follow-up</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {offers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Showing {offers.length} offer{offers.length !== 1 ? 's' : ''}
            {filterStatus !== 'all' && ` with status: ${filterStatus}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default OfferList;

