import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getTableClasses, getTypographyClasses } from '../../../design-system/components';
import { table, typography } from '../../../design-system/tokens';

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
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

/**
 * Enhanced DataTable component using design system tokens
 * Provides consistent table styling with sorting and accessibility
 */
function DataTable<T extends Record<string, any>>({
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
}: DataTableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (onSort) {
      onSort(key);
    }
  };

  const getSortIcon = (key: keyof T) => {
    if (sortBy !== key) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className='h-4 w-4 text-slate-600' />
    ) : (
      <ChevronDown className='h-4 w-4 text-slate-600' />
    );
  };

  const getSortAriaLabel = (key: keyof T, column: Column<T>): string => {
    if (!column.sortable) return column.header;
    if (sortBy === key) {
      return `${column.header}, sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`;
    }
    return `${column.header}, sortable`;
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: keyof T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(key);
    }
  };

  if (loading) {
    return (
      <div className={`${getTableClasses('header')} rounded-xl p-8 text-center`}>
        <p className={typography.body.secondary}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      <table
        className='min-w-full divide-y divide-slate-200'
        role='table'
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {caption && <caption className='sr-only'>{caption}</caption>}

        <thead className={getTableClasses('header')}>
          <tr role='row'>
            {columns.map((column, index) => (
              <th
                key={String(column.key)}
                className={`
                  ${getTableClasses('headerCell')}
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                  ${column.sortable ? 'cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:outline-none' : ''}
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

        <tbody className='bg-white divide-y divide-slate-200'>
          {data.length === 0 ? (
            <tr role='row'>
              <td
                colSpan={columns.length}
                className='px-6 py-12 text-center text-sm text-slate-500'
                role='cell'
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr key={rowIndex} role='row' className={getTableClasses('row')}>
                {columns.map((column, colIndex) => (
                  <td
                    key={String(column.key)}
                    className={`
                      ${getTableClasses('cell')}
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

export default DataTable;
