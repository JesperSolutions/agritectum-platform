import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  to,
  label,
  icon: Icon = Plus,
}) => {
  return (
    <Link
      to={to}
      className='fixed bottom-6 right-6 z-40 inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105'
    >
      <Icon className='w-5 h-5 mr-2' />
      <span className='hidden sm:inline'>{label}</span>
    </Link>
  );
};

export default FloatingActionButton;
