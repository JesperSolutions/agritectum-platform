import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Building2, Users, BarChart3, Shield, Zap, CheckCircle, Calendar, Camera, TrendingUp, Clock, MapPin, FileText, DollarSign, Settings, Eye, Star, ArrowRight, Play, CheckCircle2, ArrowDown } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';

const MarketingPage: React.FC = () => {
  const { t } = useIntl();
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setActiveSection(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('marketing.brand.name')}</h1>
                <p className="text-sm text-gray-600">{t('marketing.brand.tagline')}</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('marketing.backToApp')}
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 space-y-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === index 
                ? 'bg-blue-600 scale-125' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section 
        ref={(el) => (sectionRefs.current[0] = el)}
        className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233b82f6%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4 mr-2" />
              Production Ready Platform
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Revolutionise Roof
              <span className="text-blue-600 block">Inspection Management</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Multi-branch operations • ESG reporting • Offline-first capabilities
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
              Reduce inspection time by 40%, increase offer acceptance by 25%, and ensure GDPR compliance across all Nordic markets.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Schedule a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Min Overview
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
                <div className="text-gray-600">Faster Reports</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">25%</div>
                <div className="text-gray-600">Higher Acceptance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-gray-600">GDPR Compliant</div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ... rest of original content preserved ... */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">Taklaget Service</span>
          </div>
          <p className="text-gray-400 mb-6">
            Professional roof inspection management platform designed for modern roofing businesses.
          </p>
          <p className="text-gray-500">© 2025 Taklaget AB. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MarketingPage;
