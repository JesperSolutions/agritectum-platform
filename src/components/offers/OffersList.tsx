import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { Offer, OfferStatus } from '../../types';
import {
  Eye,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { formatSwedishDate, formatSwedishDateTime } from '../../utils/dateFormatter';
import EmptyState from '../common/EmptyState';

interface OffersListProps {
  offers: Offer[];
  onView: (offerId: string) => void;
  onSendReminder?: (offerId: string) => void;
  onExtendValidity?: (offerId: string) => void;
  emailEnabled?: boolean;
  onSendOffer?: (offerId: string) => void;
  onExportOffer?: (offerId: string) => void;
  onDelete?: (offerId: string) => void;
}

const OffersList: React.FC<OffersListProps> = ({
  offers,
  onView,
  onSendReminder,
  onExtendValidity,
  emailEnabled,
  onSendOffer,
  onExportOffer,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { t } = useIntl();
  const [sortField, setSortField] = useState<keyof Offer>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copying, setCopying] = useState<string | null>(null);

  // Get status badge
  const getStatusBadge = (status: OfferStatus) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      awaiting_response: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Awaiting Response' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expired' },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Unknown' };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Calculate days pending
  const getDaysPending = (offer: Offer): number => {
    if (offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'expired') {
      return 0;
    }
    if (!offer.sentAt) {
      return 0;
    }
    const sentDate = new Date(offer.sentAt);
    const now = new Date();
    const diff = now.getTime() - sentDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = offers;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((offer) => offer.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (offer) =>
          offer.customerName?.toLowerCase().includes(term) ||
          offer.customerEmail?.toLowerCase().includes(term) ||
          offer.title?.toLowerCase().includes(term)
      );
    }

    // Sort offers
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [offers, statusFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Offer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: keyof Offer }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="">
      {/* Filters */}
      <div className="mb-4">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, email, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'awaiting_response', label: 'Awaiting' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'expired', label: 'Expired' },
            ].map(pill => (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key as any)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  (statusFilter as any) === pill.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => navigate('/reports')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + {t('offers.createOffer')}
              </button>
            </div>
          </div>

          {/* Select (accessible alternative) */}
          <div className="w-full sm:w-56 hidden">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OfferStatus | 'all')}
              className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="awaiting_response">Awaiting Response</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Cards */}
      {filteredAndSortedOffers.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Inga offerter än"
          description="Skapa din första offert från en slutförd rapport."
          actionLabel="Gå till Rapporter"
          onAction={() => navigate('/reports')}
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedOffers.map((offer) => {
            const daysPending = getDaysPending(offer);
            const isOverdue = daysPending > 7 && offer.status === 'pending';
            const StatusBadge = getStatusBadge(offer.status || 'pending');

            return (
              <div key={offer.id} className={`group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-gray-900">{offer.customerName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{offer.customerEmail || 'No email'}</div>
                    </div>
                    {StatusBadge}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-gray-500 text-sm">
                      <div>{formatSwedishDate(offer.createdAt)}</div>
                      <div className="text-xs">{formatSwedishDateTime(offer.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {offer.totalAmount ? offer.totalAmount.toLocaleString('sv-SE') : '0'} {offer.currency || 'SEK'}
                      </div>
                      {isOverdue && <div className="text-xs text-red-600 font-semibold mt-1">Overdue ({daysPending}d)</div>}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                        <MoreHorizontal className="w-4 h-4" />
                        Actions
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[180px]">
                        <DropdownMenuItem onClick={() => onView(offer.id)}>View</DropdownMenuItem>
                        {onExportOffer && (
                          <DropdownMenuItem onClick={() => onExportOffer(offer.id)}>Export</DropdownMenuItem>
                        )}
                        {offer.status === 'pending' && onSendReminder && (
                          <DropdownMenuItem
                            disabled={emailEnabled === false}
                            onClick={() => emailEnabled !== false ? onSendReminder(offer.id) : undefined}
                          >
                            Reminder
                          </DropdownMenuItem>
                        )}
                        {offer.status === 'pending' && onExtendValidity && (
                          <DropdownMenuItem onClick={() => onExtendValidity(offer.id)}>Extend</DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={async () => {
                            await navigator.clipboard.writeText(`${window.location.origin}/offer/public/${offer.id}`);
                            setCopying(offer.id);
                            setTimeout(() => setCopying(null), 1200);
                          }}
                        >
                          {copying === offer.id ? '✔ Copied' : 'Copy Link'}
                        </DropdownMenuItem>
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(offer.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            {t('common.delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    {offer.status === 'pending' && onSendOffer && offer.customerEmail && emailEnabled !== false ? (
                      <button
                        onClick={() => onSendOffer(offer.id)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                        title="Send Offer via email"
                      >
                        Send Email
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(`${window.location.origin}/offer/public/${offer.id}`);
                          setCopying(offer.id);
                          setTimeout(() => setCopying(null), 1200);
                        }}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                        title="Copy public link to clipboard"
                      >
                        {copying === offer.id ? '✔ Copied!' : 'Copy Link'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OffersList;

