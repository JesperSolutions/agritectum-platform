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

      {/* Problem → Solution Overview */}
      <section 
        ref={(el) => (sectionRefs.current[1] = el)}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              From Manual Chaos to Digital Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional roof inspection management creates bottlenecks, inconsistencies, and compliance risks. 
              Here's how we solve it.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Problems */}
            <div>
              <h3 className="text-2xl font-bold text-red-600 mb-8">Current Pain Points</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-600 font-bold">×</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Manual Scheduling Chaos</h4>
                    <p className="text-gray-600">Paper calendars, phone calls, and missed appointments create scheduling nightmares.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-600 font-bold">×</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Inconsistent Reports</h4>
                    <p className="text-gray-600">Different formats, missing data, and delayed delivery frustrate customers.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-600 font-bold">×</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Slow Approval Process</h4>
                    <p className="text-gray-600">Offers get lost in email chains, leading to lost revenue and frustrated customers.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-red-600 font-bold">×</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Compliance Risks</h4>
                    <p className="text-gray-600">GDPR violations, data breaches, and audit failures create legal and financial exposure.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-8">Taklaget Solution</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Unified Scheduling Platform</h4>
                    <p className="text-gray-600">Multi-branch calendar management with automated reminders and GPS routing.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Mobile-Optimised Inspections</h4>
                    <p className="text-gray-600">Offline-capable interface with photo uploads, templates, and auto-sync.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Automated Offer Management</h4>
                    <p className="text-gray-600">Instant offer generation with follow-up workflows and approval tracking.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">GDPR-Compliant Platform</h4>
                    <p className="text-gray-600">Built-in compliance with data encryption, audit trails, and privacy controls.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section 
        ref={(el) => (sectionRefs.current[2] = el)}
        className="py-20 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Complete Workflow Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Four integrated modules that transform your inspection process from chaos to clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Schedule */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Schedule</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Multi-branch calendar management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Automated appointment reminders</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>GPS-based route optimization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Inspector availability tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Conflict detection & resolution</span>
                </li>
              </ul>
            </div>

            {/* Inspect */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Inspect</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Offline-capable mobile interface</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>High-resolution photo capture</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Predefined inspection templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Voice-to-text annotations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Auto-save & cloud sync</span>
                </li>
              </ul>
            </div>

            {/* Report */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Report</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Professional PDF generation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Structured issue categorization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Automated severity assessment</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Customer-branded templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>GDPR-compliant data handling</span>
                </li>
              </ul>
            </div>

            {/* Offer */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Offer</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Instant offer generation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dynamic pricing calculations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Customer approval tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Automated follow-up workflows</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Contract management integration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* System Status Timeline */}
      <section 
        ref={(el) => (sectionRefs.current[3] = el)}
        className="min-h-screen flex items-center justify-center py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Development Timeline & Roadmap
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent development progress with detailed feature descriptions and future vision
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-green-500"></div>
            
            {/* Timeline Items */}
            <div className="space-y-20">
              {/* Production Ready */}
              <div className="flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="bg-green-50 p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-end mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
                      <h3 className="text-2xl font-bold text-gray-900">Production Ready</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Core platform features deployed and operational across multiple Nordic branches. 
                      All essential workflows are functional with real-time data synchronization.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-end mb-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Multi-branch</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Role-based Access</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Offline PWA</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">PDF Generation</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      <strong>Status:</strong> Live in production • <strong>Users:</strong> 50+ active • <strong>Uptime:</strong> 99.9%
                    </p>
                  </div>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="w-1/2 pl-8"></div>
              </div>

              {/* In Development */}
              <div className="flex items-center">
                <div className="w-1/2 pr-8"></div>
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="w-1/2 pl-8">
                  <div className="bg-yellow-50 p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                      <h3 className="text-2xl font-bold text-gray-900">In Development</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Enhanced workflow features coming soon</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Advanced Scheduling</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Photo Annotation</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Visual Analytics</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Customer Portal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Plans */}
              <div className="flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="bg-blue-50 p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-end mb-4">
                      <Star className="h-8 w-8 text-blue-600 mr-3" />
                      <h3 className="text-2xl font-bold text-gray-900">Future Vision</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Advanced features for scaling businesses</p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Route Optimization</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Inventory Management</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Payment Integration</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">AI Insights</span>
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div className="w-1/2 pl-8"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESG Compliance & Security */}
      <section 
        ref={(el) => (sectionRefs.current[4] = el)}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              ESG Compliance & Security
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for Nordic compliance standards with enterprise-grade security and environmental responsibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Security */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-3xl shadow-lg">
              <div className="flex items-center mb-6">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Security & Privacy</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">GDPR Compliance</h4>
                    <p className="text-sm text-gray-600">Full compliance with European data protection regulations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Role-Based Access Control</h4>
                    <p className="text-sm text-gray-600">Three-tier permission system with granular controls</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Encryption</h4>
                    <p className="text-sm text-gray-600">End-to-end encryption for data at rest and in transit</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Audit Trails</h4>
                    <p className="text-sm text-gray-600">Complete activity logging for compliance and security</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ESG */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-3xl shadow-lg">
              <div className="flex items-center mb-6">
                <Star className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">ESG Reporting</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">CO₂ Impact Tracking</h4>
                    <p className="text-sm text-gray-600">Monitor and report environmental impact of operations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Material Lifecycle</h4>
                    <p className="text-sm text-gray-600">Track sustainable material usage and recycling</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Safety Compliance</h4>
                    <p className="text-sm text-gray-600">Automated safety protocol tracking and reporting</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Nordic Standards</h4>
                    <p className="text-sm text-gray-600">Built for Nordic environmental and safety standards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="mt-16 bg-gray-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Certifications & Standards</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">ISO 27001</h4>
                <p className="text-sm text-gray-600">Information Security</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">GDPR</h4>
                <p className="text-sm text-gray-600">Data Protection</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Nordic</h4>
                <p className="text-sm text-gray-600">Standards</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h4 className="font-semibold text-gray-900">SOC 2</h4>
                <p className="text-sm text-gray-600">Compliance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Visualization */}
      <section 
        ref={(el) => (sectionRefs.current[5] = el)}
        className="min-h-screen flex items-center justify-center py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">{t('marketing.userRoles.title')}</h2>
            <p className="text-xl text-gray-600">{t('marketing.userRoles.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Superadmin */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-3xl shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t('marketing.userRoles.superadmin.title') || 'Superadmin'}</h3>
                <p className="text-sm text-gray-600">{t('marketing.userRoles.superadmin.permissionLevel') || 'Permission Level 2'}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.superadmin.manageBranches')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.superadmin.viewAllReports')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.superadmin.createUsers')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.superadmin.systemAnalytics')}</span>
                </div>
              </div>
            </div>

            {/* Branch Admin */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t('marketing.userRoles.branchAdmin.title') || 'Branch Admin'}</h3>
                <p className="text-sm text-gray-600">{t('marketing.userRoles.branchAdmin.permissionLevel') || 'Permission Level 1'}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.branchAdmin.manageBranchOnly')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.branchAdmin.viewBranchReports')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{t('marketing.userRoles.branchAdmin.manageInspectors')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Create appointments</span>
                </div>
              </div>
            </div>

            {/* Inspector */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-3xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Inspector</h3>
                <p className="text-sm text-gray-600">Permission Level 0</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Create reports</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Edit own reports</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">View appointments</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Update status</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials & Case Studies */}
      <section 
        ref={(el) => (sectionRefs.current[6] = el)}
        className="py-20 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Proven Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real metrics from Nordic roofing companies using Taklaget Service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Case Study */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-6">
                <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Nordic Roofing AB</h3>
                  <p className="text-gray-600">Multi-branch operation • 25 inspectors</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">40%</div>
                  <div className="text-sm text-gray-600">Faster Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">25%</div>
                  <div className="text-sm text-gray-600">Higher Acceptance</div>
                </div>
              </div>
              <blockquote className="text-gray-700 italic">
                "Taklaget transformed our inspection process. What used to take 3 hours now takes 90 minutes. 
                Our customers love the professional reports and faster turnaround."
              </blockquote>
              <p className="text-sm text-gray-500 mt-4">— Erik Lindqvist, Branch Manager</p>
            </div>

            {/* Testimonial */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Stockholm Roofing</h3>
                  <p className="text-gray-600">Single branch • 8 inspectors</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">60%</div>
                  <div className="text-sm text-gray-600">Less Admin Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">100%</div>
                  <div className="text-sm text-gray-600">GDPR Compliant</div>
                </div>
              </div>
              <blockquote className="text-gray-700 italic">
                "The offline capability is a game-changer. Our inspectors can work anywhere, 
                and everything syncs automatically. No more lost data or delayed reports."
              </blockquote>
              <p className="text-sm text-gray-500 mt-4">— Maria Andersson, Operations Director</p>
            </div>
          </div>

          {/* Employee Wiki Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Employee Knowledge Base</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive guides, tutorials, and FAQs for all team members
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Quick Start Guides</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Superadmin Setup</li>
                  <li>• Branch Admin Training</li>
                  <li>• Inspector Onboarding</li>
                  <li>• Mobile App Installation</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Video Tutorials</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Scheduling Workflows</li>
                  <li>• Mobile Inspection Process</li>
                  <li>• Report Generation</li>
                  <li>• Offer Management</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Support & FAQ</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Troubleshooting Guide</li>
                  <li>• Common Issues</li>
                  <li>• Contact Support</li>
                  <li>• Feature Requests</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Access Knowledge Base
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section 
        ref={(el) => (sectionRefs.current[7] = el)}
        className="min-h-screen flex items-center justify-center py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-gray-600">
              Cutting-edge web technologies for optimal performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Frontend */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-3xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">F</span>
                </div>
                Frontend Stack
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-blue-600 font-bold">R</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">React 18</h4>
                  <p className="text-sm text-gray-600">Modern UI framework</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-blue-600 font-bold">TS</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">TypeScript</h4>
                  <p className="text-sm text-gray-600">Type safety</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-blue-600 font-bold">T</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">Tailwind</h4>
                  <p className="text-sm text-gray-600">Utility-first CSS</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-blue-600 font-bold">P</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">PWA</h4>
                  <p className="text-sm text-gray-600">Progressive Web App</p>
                </div>
              </div>
            </div>

            {/* Backend */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-3xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">B</span>
                </div>
                Backend & Services
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-green-600 font-bold">F</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">Firebase</h4>
                  <p className="text-sm text-gray-600">Authentication</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-green-600 font-bold">F</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">Firestore</h4>
                  <p className="text-sm text-gray-600">Real-time database</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-green-600 font-bold">C</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">Cloud Functions</h4>
                  <p className="text-sm text-gray-600">Serverless backend</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-green-600 font-bold">P</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">Puppeteer</h4>
                  <p className="text-sm text-gray-600">PDF generation</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-12 py-4 border border-transparent text-xl font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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