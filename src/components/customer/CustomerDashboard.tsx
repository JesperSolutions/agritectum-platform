import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from '../../hooks/useIntl';
import { getCustomerByUserId } from '../../services/customerAuthService';
import { getBuildingsForCustomer } from '../../services/buildingService';
import { getOffersForCustomer } from '../../services/offerService';
import { getServiceAgreementsForCustomer } from '../../services/serviceAgreementService';
import { Customer, Building, Offer, ServiceAgreement } from '../../types';
import { Building2, FileText, Handshake, TrendingUp, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ReportTimeline from './ReportTimeline';

const CustomerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useIntl();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);

        // Load customer data
        const customerData = await getCustomerByUserId(currentUser.uid);
        setCustomer(customerData);

        if (customerData) {
          // Load buildings
          const buildingsData = await getBuildingsForCustomer(customerData.id);
          setBuildings(buildingsData);

          // Load offers
          const offersData = await getOffersForCustomer(customerData.id);
          setOffers(offersData);

          // Load service agreements
          const agreementsData = await getServiceAgreementsForCustomer(customerData.id);
          setAgreements(agreementsData);

          // Load reports for this customer
          try {
            const reportsRef = collection(db, 'reports');
            // Query by customerId if available, otherwise by email
            let q;
            if (customerData.id) {
              q = query(reportsRef, where('customerId', '==', customerData.id));
            } else if (customerData.email) {
              q = query(reportsRef, where('customerEmail', '==', customerData.email.toLowerCase()));
            } else {
              // Fallback: get all reports and filter client-side (less efficient but works)
              q = reportsRef;
            }
            const querySnapshot = await getDocs(q);
            const customerReports = querySnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Report))
              .filter(report => 
                report.customerId === customerData.id || 
                (report.customerEmail && report.customerEmail.toLowerCase() === customerData.email?.toLowerCase())
              );
            setReports(customerReports);
          } catch (error) {
            console.error('Error loading reports:', error);
            // Don't fail the whole dashboard if reports fail to load
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const activeOffers = offers.filter(o => o.status === 'pending' || o.status === 'awaiting_response');
  const activeAgreements = agreements.filter(a => a.status === 'active');
  const upcomingServices = agreements
    .filter(a => a.status === 'active' && a.nextServiceDate)
    .sort((a, b) => new Date(a.nextServiceDate!).getTime() - new Date(b.nextServiceDate!).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {customer?.name || currentUser?.displayName}
          </h1>
          <p className="text-gray-600">Manage your buildings and view your offers and agreements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Buildings Card */}
          <div
            onClick={() => navigate('/customer/buildings')}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Buildings</p>
                <p className="text-3xl font-bold text-gray-900">{buildings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Offers Card */}
          <div
            onClick={() => navigate('/customer/offers')}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Offers</p>
                <p className="text-3xl font-bold text-gray-900">{activeOffers.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Active Agreements Card */}
          <div
            onClick={() => navigate('/customer/agreements')}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Service Agreements</p>
                <p className="text-3xl font-bold text-gray-900">{activeAgreements.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Handshake className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Reports Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">{customer?.totalReports || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buildings Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Buildings</h2>
              <button
                onClick={() => navigate('/customer/buildings')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            {buildings.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No buildings yet</p>
                <p className="text-sm text-gray-500">
                  Buildings will appear here once inspections are completed
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {buildings.slice(0, 5).map((building) => (
                  <div
                    key={building.id}
                    onClick={() => navigate(`/customer/buildings/${building.id}`)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{building.name || building.address}</p>
                        <p className="text-sm text-gray-600">
                          {building.reportIds.length} {building.reportIds.length === 1 ? 'report' : 'reports'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        building.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {building.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Services Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Services</h2>
              <button
                onClick={() => navigate('/customer/agreements')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            {upcomingServices.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming services</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingServices.map((agreement) => (
                  <div
                    key={agreement.id}
                    onClick={() => navigate(`/customer/agreements/${agreement.id}`)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{agreement.title}</p>
                        <p className="text-sm text-gray-600">
                          Next service: {new Date(agreement.nextServiceDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Offers Section */}
        {activeOffers.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Offers</h2>
              <button
                onClick={() => navigate('/customer/offers')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {activeOffers.slice(0, 5).map((offer) => (
                <div
                  key={offer.id}
                  onClick={() => navigate(`/customer/offers/${offer.id}`)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{offer.title}</p>
                      <p className="text-sm text-gray-600">
                        {offer.totalAmount.toLocaleString()} {offer.currency}
                        {offer.validUntil && (
                          <span className="ml-2">
                            • Valid until {new Date(offer.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      offer.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {offer.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;

