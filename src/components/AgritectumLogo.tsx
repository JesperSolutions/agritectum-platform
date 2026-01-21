import React from 'react';

interface AgritectumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const AgritectumLogo: React.FC<AgritectumLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: { logo: 'w-8 h-8', text: 'text-sm', container: 'space-x-2' },
    md: { logo: 'w-12 h-12', text: 'text-lg', container: 'space-x-3' },
    lg: { logo: 'w-16 h-16', text: 'text-xl', container: 'space-x-4' },
    xl: { logo: 'w-20 h-20', text: 'text-2xl', container: 'space-x-5' },
  };

  const { logo, text, container } = sizeClasses[size];

  return (
    <div className={`flex items-center ${container} ${className}`}>
      {/* Logo Emblem */}
      <div className={`${logo} flex-shrink-0`}>
        <img
          src='/agritectum-logomark.png'
          alt='Agritectum Platform Logo'
          className='w-full h-full object-contain'
        />
      </div>

      {/* Text */}
      {showText && (
        <div className='flex flex-col'>
          <span className={`font-bold text-slate-900 ${text}`}>AGRITECTUM</span>
          <span className={`text-slate-600 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            Platform
          </span>
        </div>
      )}
    </div>
  );
};

export default AgritectumLogo;
