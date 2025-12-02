import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceAgreementByPublicToken, acceptServiceAgreementPublic } from '../../services/serviceAgreementService';
import { ServiceAgreement } from '../../types';
import { CheckCircle, XCircle, Calendar, FileCheck, AlertCircle, User, MapPin, Mail, Phone, DollarSign, Clock, Check } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useIntl } from '../../hooks/useIntl';
import { BRAND_CONFIG } from '../../config/brand';
import { formatCurrencyAmount, Currency } from '../../utils/currencyUtils';

const PublicServiceAgreementView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t, locale } = useIntl();
  const [agreement, setAgreement] = useState<ServiceAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [acceptAgreement, setAcceptAgreement] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAgreement();
  }, [token]);

  useDocumentTitle(agreement ? `${t('serviceAgreement.public.title')} – ${agreement.title}` : t('serviceAgreement.public.title'));

  const loadAgreement = async () => {
    if (!token) {
      setError(t('serviceAgreement.public.invalidToken') || 'Invalid token');
      setLoading(false);
      return;
    }

    try {
      const fetchedAgreement = await getServiceAgreementByPublicToken(token);
      if (!fetchedAgreement) {
        setError(t('serviceAgreement.public.notFound') || 'Service agreement not found');
        setLoading(false);
        return;
      }

      // Pre-fill form with customer data if available
      if (fetchedAgreement.customerName) {
        setCustomerName(fetchedAgreement.customerName);
      }
      if (fetchedAgreement.customerEmail) {
        setCustomerEmail(fetchedAgreement.customerEmail);
      }

      setAgreement(fetchedAgreement);
      
      // If already accepted, show success
      if (fetchedAgreement.acceptedAt) {
        setShowSuccess(true);
      }
    } catch (err) {
      console.error('Error loading service agreement:', err);
      setError(t('serviceAgreement.public.loadError') || 'Failed to load service agreement');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = t('serviceAgreement.public.validation.nameRequired') || 'Name is required';
    }

    if (!customerEmail.trim()) {
      errors.customerEmail = t('serviceAgreement.public.validation.emailRequired') || 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      errors.customerEmail = t('serviceAgreement.public.validation.emailInvalid') || 'Invalid email address';
    }

    if (!agreeToTerms) {
      errors.agreeToTerms = t('serviceAgreement.public.validation.termsRequired') || 'You must agree to the terms and conditions';
    }

    if (!acceptAgreement) {
      errors.acceptAgreement = t('serviceAgreement.public.validation.acceptanceRequired') || 'You must accept the service agreement';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccept = async () => {
    if (!agreement || !validateForm()) {
      return;
    }

    setProcessing(true);
    try {
      // Get IP address if possible (for logging purposes)
      let ipAddress: string | undefined;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        // Ignore IP fetch errors
      }

      await acceptServiceAgreementPublic(agreement.id, {
        name: customerName.trim(),
        email: customerEmail.trim(),
      }, ipAddress);

      // Update UI immediately
      setAgreement(prev => prev ? {
        ...prev,
        acceptedAt: new Date().toISOString(),
        acceptedBy: customerName.trim(),
        acceptedByEmail: customerEmail.trim(),
        status: 'active' as const,
      } : null);
      
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Error accepting service agreement:', err);
      setError(err.message || t('serviceAgreement.public.acceptError') || 'Failed to accept service agreement');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const currencyCode = (currency as Currency) || 'SEK';
    return formatCurrencyAmount(amount, currencyCode, locale);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('serviceAgreement.public.notFoundTitle') || 'Service Agreement Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || t('serviceAgreement.public.notFoundMessage') || 'The service agreement you are looking for does not exist or has been removed.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {t('serviceAgreement.public.goHome') || 'Go to Homepage'}
          </button>
        </div>
      </div>
    );
  }

  const isAccepted = !!agreement.acceptedAt;
  const isExpired = new Date(agreement.endDate) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('serviceAgreement.public.headerTitle') || `${BRAND_CONFIG.BRAND_NAME} Service Agreement`}
            </h1>
            <p className="text-slate-200">{agreement.title}</p>
          </div>

          {/* Status Banner */}
          {isAccepted && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-green-800 font-semibold">
                    {t('serviceAgreement.public.accepted') || 'Service Agreement Accepted'}
                  </p>
                  <p className="text-green-600 text-sm">
                    {t('serviceAgreement.public.acceptedMessage', { date: formatDate(agreement.acceptedAt || '') }) || 
                      `Thank you! This agreement was accepted on ${formatDate(agreement.acceptedAt || '')}.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isExpired && !isAccepted && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <XCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-red-800 font-semibold">
                    {t('serviceAgreement.public.expired') || 'Service Agreement Expired'}
                  </p>
                  <p className="text-red-600 text-sm">
                    {t('serviceAgreement.public.expiredMessage') || 'This service agreement has expired.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isAccepted && !isExpired && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <Clock className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-semibold">
                    {t('serviceAgreement.public.pending') || 'Pending Acceptance'}
                  </p>
                  <p className="text-blue-600 text-sm">
                    {t('serviceAgreement.public.pendingMessage') || 'Please review and accept this service agreement to proceed.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Agreement Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{agreement.title}</h2>

          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('serviceAgreement.public.customerInfo') || 'Customer Information'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-medium">{agreement.customerName}</p>
                {agreement.customerEmail && (
                  <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {agreement.customerEmail}
                  </p>
                )}
                {agreement.customerPhone && (
                  <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" />
                    {agreement.customerPhone}
                  </p>
                )}
                <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {agreement.customerAddress}
                </p>
              </div>
            </div>

            {/* Agreement Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                {t('serviceAgreement.public.agreementType') || 'Agreement Type'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}>
                  {t(`serviceAgreement.type.${agreement.agreementType}`) || agreement.agreementType}
                </span>
              </div>
            </div>

            {/* Description */}
            {agreement.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('serviceAgreement.public.description') || 'Description'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{agreement.description}</p>
                </div>
              </div>
            )}

            {/* Purpose (AFTALENS FORMÅL) */}
            {agreement.purpose && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('serviceAgreement.public.purpose') || '1. AFTALENS FORMÅL'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{agreement.purpose}</p>
                </div>
              </div>
            )}

            {/* Services (YDELSER) */}
            {(agreement.serviceVisits || agreement.standardServices || agreement.addons) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('serviceAgreement.public.services') || '2. YDELSER – AFKRYDSNING'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* Service Visits */}
                  {agreement.serviceVisits && (agreement.serviceVisits.oneAnnual || agreement.serviceVisits.twoAnnual) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {t('serviceAgreement.public.serviceVisits') || 'SERVICEBESØG:'}
                      </h4>
                      <div className="space-y-2 ml-4">
                        {agreement.serviceVisits.oneAnnual && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-gray-700">
                              {t('serviceAgreement.form.services.oneAnnual') || '1 årligt servicebesøg'}
                            </span>
                          </div>
                        )}
                        {agreement.serviceVisits.twoAnnual && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-gray-700">
                              {t('serviceAgreement.form.services.twoAnnual') || '2 årlige servicebesøg'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Standard Services */}
                  {agreement.standardServices && agreement.standardServices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {t('serviceAgreement.public.standardServices') || 'STANDARDYDELSER:'}
                      </h4>
                      <div className="space-y-2 ml-4">
                        {[
                          { key: 'visualInspection', label: t('serviceAgreement.form.services.visualInspection') || 'Visuel gennemgang af tag' },
                          { key: 'roofingControl', label: t('serviceAgreement.form.services.roofingControl') || 'Kontrol af tagpap og samlinger' },
                          { key: 'penetrationsControl', label: t('serviceAgreement.form.services.penetrationsControl') || 'Kontrol af gennemføringer' },
                          { key: 'flashingControl', label: t('serviceAgreement.form.services.flashingControl') || 'Kontrol af inddækninger og fuger' },
                          { key: 'drainCleaning', label: t('serviceAgreement.form.services.drainCleaning') || 'Rensning af afløb og skotrender' },
                          { key: 'gutterCleaning', label: t('serviceAgreement.form.services.gutterCleaning') || 'Rengøring af tagrender' },
                          { key: 'debrisRemoval', label: t('serviceAgreement.form.services.debrisRemoval') || 'Fjernelse af blade, mos og snavs' },
                          { key: 'drainageTest', label: t('serviceAgreement.form.services.drainageTest') || 'Funktions-/flow-test af afvanding' },
                          { key: 'walkwayControl', label: t('serviceAgreement.form.services.walkwayControl') || 'Kontrol af gangbaner' },
                          { key: 'photoDocumentation', label: t('serviceAgreement.form.services.photoDocumentation') || 'Fotodokumentation' },
                        ].filter(service => agreement.standardServices?.includes(service.key)).map(service => (
                          <div key={service.key} className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-gray-700">{service.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Addons */}
                  {agreement.addons && (
                    <>
                      {/* Skylights & Fall Protection */}
                      {agreement.addons.skylights && agreement.addons.skylights.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t('serviceAgreement.form.addons.skylights.title') || 'OVENLYS & FALDSIKRING:'}
                          </h4>
                          <div className="space-y-2 ml-4">
                            {agreement.addons.skylights.includes('skylightCleaning') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.skylightCleaning') || 'Rensning/inspektion af ovenlyskupler'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.skylights.includes('annualInspection') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.annualInspection') || 'Årligt eftersyn (EN 365)'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.skylights.includes('safetyEquipmentControl') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.safetyEquipmentControl') || 'Kontrol af liner, wires, seler og karabiner'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Solar */}
                      {agreement.addons.solar && agreement.addons.solar.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t('serviceAgreement.form.addons.solar.title') || 'SOLCELLER:'}
                          </h4>
                          <div className="space-y-2 ml-4">
                            {agreement.addons.solar.includes('solarCleaning') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.solarCleaning') || 'Rensning af solceller (1–2 gange årligt)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Steel */}
                      {agreement.addons.steel && agreement.addons.steel.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t('serviceAgreement.form.addons.steel.title') || 'STÅLTAG:'}
                          </h4>
                          <div className="space-y-2 ml-4">
                            {agreement.addons.steel.includes('mossRemoval') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.mossRemoval') || 'Rensning af lav og mos'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.steel.includes('chemicalTreatment') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.chemicalTreatment') || 'Kemisk tagbehandling'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sedum */}
                      {agreement.addons.sedum && agreement.addons.sedum.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t('serviceAgreement.form.addons.sedum.title') || 'SEDUMTAG (GRØNT TAG):'}
                          </h4>
                          <div className="space-y-2 ml-4">
                            {agreement.addons.sedum.includes('fertilization') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.fertilization') || 'Gødning (forår/sommer)'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.sedum.includes('weedControl') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.weedControl') || 'Ukrudtskontrol'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.sedum.includes('sedumRepair') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.sedumRepair') || 'Reparation af sedumflader'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.sedum.includes('substrateRefill') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.substrateRefill') || 'Efterfyldning af vækstmedie'}
                                </span>
                              </div>
                            )}
                            {agreement.addons.sedum.includes('watering') && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                  {t('serviceAgreement.form.addons.watering') || 'Vanding efter behov'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('serviceAgreement.public.dates') || 'Important Dates'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('serviceAgreement.public.startDate') || 'Start Date'}:</span>
                  <span className="font-medium">{formatDate(agreement.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('serviceAgreement.public.endDate') || 'End Date'}:</span>
                  <span className="font-medium">{formatDate(agreement.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('serviceAgreement.public.nextService') || 'Next Service Date'}:</span>
                  <span className="font-medium">{formatDate(agreement.nextServiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('serviceAgreement.public.frequency') || 'Service Frequency'}:</span>
                  <span className="font-medium">
                    {t(`serviceAgreement.frequency.${agreement.serviceFrequency}`) || agreement.serviceFrequency}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            {(agreement.price || agreement.pricingStructure || agreement.billingFrequency) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t('serviceAgreement.public.pricing') || '6. PRIS & FAKTURERING'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* Standard Price */}
                  {agreement.price && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('serviceAgreement.public.price') || 'Price'}:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(agreement.price, agreement.currency)}
                      </span>
                    </div>
                  )}

                  {/* Pricing Structure */}
                  {agreement.pricingStructure && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      {(agreement.pricingStructure.perRoof || agreement.pricingStructure.perRoof === 0) && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {t('serviceAgreement.public.pricingPerRoof') || 'Pris start pr. år per tag:'}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(agreement.pricingStructure.perRoof, agreement.currency || 'DKK')}
                          </span>
                        </div>
                      )}
                      {(agreement.pricingStructure.perSquareMeter || agreement.pricingStructure.perSquareMeter === 0) && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {t('serviceAgreement.public.pricingPerSquareMeter') || 'Pris pr. m²:'}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(agreement.pricingStructure.perSquareMeter, agreement.currency || 'DKK')} / m²
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Billing Frequency */}
                  {agreement.billingFrequency && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600">
                        {t('serviceAgreement.public.billingFrequency') || 'Faktureringsfrekvens:'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {agreement.billingFrequency === 'annual' 
                          ? (t('serviceAgreement.public.billingAnnual') || 'Årlig')
                          : (t('serviceAgreement.public.billingSemiAnnual') || 'Halvårlig')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {agreement.termsAndConditions && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('serviceAgreement.public.terms') || 'Terms and Conditions'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{agreement.termsAndConditions}</p>
                </div>
              </div>
            )}

            {/* Documents Section (placeholder) */}
            {agreement.termsDocuments && agreement.termsDocuments.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('serviceAgreement.public.documents') || 'Documents'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {agreement.termsDocuments.map((docUrl, index) => (
                      <li key={index}>
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          {t('serviceAgreement.public.document', { number: index + 1 }) || `Document ${index + 1}`}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('serviceAgreement.public.documents') || 'Documents'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm italic">
                    {t('serviceAgreement.public.documentsPlaceholder') || 'Documents will be added here.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acceptance Form */}
        {!isAccepted && !isExpired && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('serviceAgreement.public.acceptanceForm') || 'Accept Service Agreement'}
            </h2>

            <div className="space-y-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceAgreement.public.form.name') || 'Your Name'} *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent ${
                    formErrors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('serviceAgreement.public.form.namePlaceholder') || 'Enter your full name'}
                />
                {formErrors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customerName}</p>
                )}
              </div>

              {/* Customer Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceAgreement.public.form.email') || 'Your Email'} *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-700 focus:border-transparent ${
                    formErrors.customerEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('serviceAgreement.public.form.emailPlaceholder') || 'Enter your email address'}
                />
                {formErrors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customerEmail}</p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 mr-3 w-5 h-5 text-slate-700 border-gray-300 rounded focus:ring-slate-700"
                    />
                    <span className={`text-sm ${formErrors.agreeToTerms ? 'text-red-600' : 'text-gray-700'}`}>
                      {t('serviceAgreement.public.form.agreeToTerms') || 'I agree to the terms and conditions'} *
                    </span>
                  </label>
                  {formErrors.agreeToTerms && (
                    <p className="mt-1 text-sm text-red-600 ml-8">{formErrors.agreeToTerms}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={acceptAgreement}
                      onChange={(e) => setAcceptAgreement(e.target.checked)}
                      className="mt-1 mr-3 w-5 h-5 text-slate-700 border-gray-300 rounded focus:ring-slate-700"
                    />
                    <span className={`text-sm ${formErrors.acceptAgreement ? 'text-red-600' : 'text-gray-700'}`}>
                      {t('serviceAgreement.public.form.acceptAgreement') || 'I understand and accept this service agreement'} *
                    </span>
                  </label>
                  {formErrors.acceptAgreement && (
                    <p className="mt-1 text-sm text-red-600 ml-8">{formErrors.acceptAgreement}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAccept}
                disabled={processing}
                className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('serviceAgreement.public.form.processing') || 'Processing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('serviceAgreement.public.form.accept') || 'Accept Service Agreement'}
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && isAccepted && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('serviceAgreement.public.successTitle') || 'Thank You!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('serviceAgreement.public.successMessage') || 'Your service agreement has been accepted. We will contact you shortly.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicServiceAgreementView;

