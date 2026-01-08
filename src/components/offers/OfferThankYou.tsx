import React from 'react';

const OfferThankYou: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md w-full">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Thank You for Your Response!</h1>
      <p className="text-lg text-gray-700 mb-4">
        We appreciate your response. If you have accepted the offer, our team will contact you shortly to arrange the work. If you declined, thank you for your feedback.
      </p>
      <a
        href="https://agritectum.com"
        className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Homepage
      </a>
    </div>
  </div>
);

export default OfferThankYou;
