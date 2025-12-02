import React, { useState } from 'react';
import { Report } from '../../types';
import { X, DollarSign, Calendar } from 'lucide-react';
import { useIntl } from 'react-intl';
import AddressWithMapV2 from '../AddressWithMapV2';

interface CreateOfferModalProps {
  report: Report;
  onClose: () => void;
  onCreate: (offerData: {
    title: string;
    description: string;
    laborCost: number;
    materialCost: number;
    travelCost: number;
    overheadCost: number;
    profitMargin: number;
    validUntil: string;
  }) => Promise<void>;
}

const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ report, onClose, onCreate }) => {
  const intl = useIntl();
  const t = (key: string, values?: any) => intl.formatMessage({ id: key }, values);
  const [formData, setFormData] = useState({
    title: `Repair Offer - ${report.customerName}`,
    description: `Based on the inspection conducted on ${new Date(report.inspectionDate).toLocaleDateString('sv-SE')}, we propose the following repairs to address the issues found.`,
    laborCost: 0,
    materialCost: 0,
    travelCost: 0,
    overheadCost: 0,
    profitMargin: 15, // Default 15%
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.laborCost < 0) {
      newErrors.laborCost = 'Labor cost cannot be negative';
    }

    if (formData.materialCost < 0) {
      newErrors.materialCost = 'Material cost cannot be negative';
    }

    if (formData.travelCost < 0) {
      newErrors.travelCost = 'Travel cost cannot be negative';
    }

    if (formData.overheadCost < 0) {
      newErrors.overheadCost = 'Overhead cost cannot be negative';
    }

    if (formData.profitMargin < 0 || formData.profitMargin > 100) {
      newErrors.profitMargin = 'Profit margin must be between 0 and 100';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'Valid until date is required';
    } else {
      const validDate = new Date(formData.validUntil);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (validDate < today) {
        newErrors.validUntil = 'Valid until date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = (): number => {
    // Calculate sum of estimated costs from recommended actions (solutions)
    const recommendedActionsCost = (report.recommendedActions || []).reduce(
      (sum, action) => sum + (action.estimatedCost || 0),
      0
    );
    
    const subtotal = formData.laborCost + formData.materialCost + formData.travelCost + formData.overheadCost + recommendedActionsCost;
    const profit = subtotal * (formData.profitMargin / 100);
    return subtotal + profit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
    } catch (error) {
      console.error('Error creating offer:', error);
      alert('Failed to create offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t('offers.create.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Customer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('offers.create.customerInformation')}</h3>
            <p className="text-sm text-gray-600">{report.customerName}</p>
            <p className="text-sm text-gray-600">{report.customerEmail}</p>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.propertyAddress')}
              </label>
              <AddressWithMapV2
                value={report.customerAddress}
                onChange={() => {}} // Read-only in offer modal
                placeholder={t('common.propertyAddress')}
                className="pointer-events-none opacity-75"
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('offers.create.offerTitle')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('offers.create.offerTitlePlaceholder')}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('offers.create.description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('offers.create.descriptionPlaceholder')}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Cost Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t('offers.create.costBreakdown')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('offers.detail.laborCost')}
                </label>
                <input
                  type="number"
                  value={formData.laborCost}
                  onChange={(e) => handleChange('laborCost', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.laborCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                />
                {errors.laborCost && <p className="mt-1 text-sm text-red-600">{errors.laborCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('offers.detail.materialCost')}
                </label>
                <input
                  type="number"
                  value={formData.materialCost}
                  onChange={(e) => handleChange('materialCost', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.materialCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                />
                {errors.materialCost && <p className="mt-1 text-sm text-red-600">{errors.materialCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('offers.detail.travelCost')}
                </label>
                <input
                  type="number"
                  value={formData.travelCost}
                  onChange={(e) => handleChange('travelCost', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.travelCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                />
                {errors.travelCost && <p className="mt-1 text-sm text-red-600">{errors.travelCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('offers.detail.overheadCost')}
                </label>
                <input
                  type="number"
                  value={formData.overheadCost}
                  onChange={(e) => handleChange('overheadCost', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.overheadCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                />
                {errors.overheadCost && <p className="mt-1 text-sm text-red-600">{errors.overheadCost}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('offers.create.profitMargin')}
                </label>
                <input
                  type="number"
                  value={formData.profitMargin}
                  onChange={(e) => handleChange('profitMargin', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.profitMargin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  max="100"
                  step="0.1"
                />
                {errors.profitMargin && <p className="mt-1 text-sm text-red-600">{errors.profitMargin}</p>}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              {(() => {
                const recommendedActionsCost = (report.recommendedActions || []).reduce(
                  (sum, action) => sum + (action.estimatedCost || 0),
                  0
                );
                const baseSubtotal = formData.laborCost + formData.materialCost + formData.travelCost + formData.overheadCost;
                const subtotal = baseSubtotal + recommendedActionsCost;
                const profit = subtotal * (formData.profitMargin / 100);
                
                return (
                  <>
                    {/* Show recommended actions cost if available */}
                    {recommendedActionsCost > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Recommended Actions Cost:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {recommendedActionsCost.toLocaleString()} SEK
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{t('offers.create.subtotal')}:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {subtotal.toLocaleString()} SEK
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-gray-700">{t('offers.create.profit')} ({formData.profitMargin}%):</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {profit.toLocaleString()} SEK
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                      <span className="text-lg font-bold text-gray-900">{t('offers.detail.totalAmount')}:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {(subtotal + profit).toLocaleString()} SEK
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Valid Until */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('offers.create.validUntil')} *
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleChange('validUntil', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.validUntil ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.validUntil && <p className="mt-1 text-sm text-red-600">{errors.validUntil}</p>}
            <p className="mt-1 text-sm text-gray-500">
              {t('offers.create.validUntilDefault')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              {t('offers.create.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('offers.create.creating') : t('offers.create.createOffer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOfferModal;

