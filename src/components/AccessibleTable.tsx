import React, { forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface AccessibleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  caption?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

function AccessibleTable<T extends Record<string, any>>({
  data,
  columns,
  sortBy,
  sortDirection = 'asc',
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  caption,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}: AccessibleTableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (onSort) {
      onSort(key);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, key: keyof T) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSort(key);
    }
  };

  const getSortIcon = (key: keyof T) => {
    if (sortBy !== key) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp className='w-4 h-4' aria-hidden='true' />
    ) : (
      <ChevronDown className='w-4 h-4' aria-hidden='true' />
    );
  };

  const getSortAriaLabel = (key: keyof T, column: Column<T>) => {
    if (!column.sortable) return column.header;

    if (sortBy === key) {
      return `${column.header}, sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`;
    }

    return `${column.header}, sortable`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-1/4'></div>
          </div>
        </div>
        <div className='divide-y divide-gray-200'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='px-6 py-4'>
              <div className='animate-pulse'>
                <div className='flex space-x-4'>
                  {columns.map((_, j) => (
                    <div key={j} className='h-4 bg-gray-200 rounded flex-1'></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <table
        className='min-w-full divide-y divide-gray-200'
        role='table'
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {caption && <caption className='sr-only'>{caption}</caption>}

        <thead className='bg-gray-50'>
          <tr role='row'>
            {columns.map((column, index) => (
              <th
                key={String(column.key)}
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none' : ''}
                `}
                style={{ width: column.width }}
                role='columnheader'
                tabIndex={column.sortable ? 0 : undefined}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                onKeyDown={column.sortable ? e => handleKeyDown(e, column.key) : undefined}
                aria-sort={
                  column.sortable
                    ? sortBy === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    : undefined
                }
                aria-label={getSortAriaLabel(column.key, column)}
              >
                <div className='flex items-center space-x-1'>
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className='bg-white divide-y divide-gray-200'>
          {data.length === 0 ? (
            <tr role='row'>
              <td
                colSpan={columns.length}
                className='px-6 py-12 text-center text-sm text-gray-500'
                role='cell'
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr key={rowIndex} role='row' className='hover:bg-gray-50 focus-within:bg-gray-50'>
                {columns.map((column, colIndex) => (
                  <td
                    key={String(column.key)}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm text-gray-900
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                    role='cell'
                    headers={`${String(column.key)}-header`}
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key] || '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AccessibleTable;
