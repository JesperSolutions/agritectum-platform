import React from 'react';
import { Building2 } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';

interface AgritectumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const AgritectumLogo: React.FC<AgritectumLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: { logo: 'w-8 h-8', text: 'text-sm', container: 'space-x-2' },
    md: { logo: 'w-12 h-12', text: 'text-lg', container: 'space-x-3' },
    lg: { logo: 'w-16 h-16', text: 'text-xl', container: 'space-x-4' },
    xl: { logo: 'w-20 h-20', text: 'text-2xl', container: 'space-x-5' }
  };

  const { logo, text, container } = sizeClasses[size];

  return (
    <div className={`flex items-center ${container} ${className}`}>
      {/* Logo Icon */}
      <div className={`${logo} flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg`}>
        <Building2 className="w-3/4 h-3/4 text-white" />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-gray-900 ${text}`}>{BRAND_CONFIG.BRAND_NAME.toUpperCase()}</span>
          <span className={`text-gray-600 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>Building Performance Platform</span>
        </div>
      )}
    </div>
  );
};

export default AgritectumLogo;

