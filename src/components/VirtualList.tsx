import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { memoryManager } from '../services/memoryManagementService';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
  onItemClick?: (item: T, index: number) => void;
  onItemSelect?: (item: T, index: number) => void;
  selectedIndex?: number;
  className?: string;
  overscanCount?: number;
  estimatedItemSize?: number;
  onScroll?: (scrollOffset: number, scrollDirection: 'forward' | 'backward') => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  searchTerm?: string;
  filterFunction?: (item: T, searchTerm: string) => boolean;
}

interface ListItemProps<T> {
  index: number;
  style: React.CSSProperties;
  data: {
    items: T[];
    renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
    onItemClick?: (item: T, index: number) => void;
    onItemSelect?: (item: T, index: number) => void;
    selectedIndex?: number;
    searchTerm?: string;
    filterFunction?: (item: T, searchTerm: string) => boolean;
  };
}

function ListItem<T>({ index, style, data }: ListItemProps<T>) {
  const {
    items,
    renderItem,
    onItemClick,
    onItemSelect,
    selectedIndex,
    searchTerm,
    filterFunction,
  } = data;
  const item = items[index];

  const handleClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [item, index, onItemClick]);

  const handleSelect = useCallback(() => {
    if (onItemSelect) {
      onItemSelect(item, index);
    }
  }, [item, index, onItemSelect]);

  // Filter items based on search term
  const isVisible = useMemo(() => {
    if (!searchTerm || !filterFunction) return true;
    return filterFunction(item, searchTerm);
  }, [item, searchTerm, filterFunction]);

  if (!isVisible) {
    return <div style={style} />;
  }

  return (
    <div
      style={{
        ...style,
        cursor: onItemClick ? 'pointer' : 'default',
        backgroundColor: selectedIndex === index ? '#E3F2FD' : 'transparent',
        borderBottom: '1px solid #E0E0E0',
        transition: 'background-color 0.2s ease',
      }}
      onClick={handleClick}
      onMouseEnter={handleSelect}
    >
      {renderItem({ index, style: { ...style, height: 'auto' }, item })}
    </div>
  );
}

function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  onItemClick,
  onItemSelect,
  selectedIndex,
  className = '',
  overscanCount = 5,
  estimatedItemSize,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
  searchTerm = '',
  filterFunction,
}: VirtualListProps<T>) {
  const listRef = useRef<List>(null);
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm || !filterFunction) {
      setFilteredItems(items);
      return;
    }

    setIsFiltering(true);

    // Use requestIdleCallback for non-blocking filtering
    const filterItems = () => {
      const filtered = items.filter(item => filterFunction(item, searchTerm));
      setFilteredItems(filtered);
      setIsFiltering(false);
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(filterItems);
    } else {
      setTimeout(filterItems, 0);
    }
  }, [items, searchTerm, filterFunction]);

  // Handle scroll events
  const handleScroll = useCallback(
    (scrollOffset: number, scrollDirection: 'forward' | 'backward') => {
      if (onScroll) {
        onScroll(scrollOffset, scrollDirection);
      }
    },
    [onScroll]
  );

  // Memoize list data to prevent unnecessary re-renders
  const listData = useMemo(
    () => ({
      items: filteredItems,
      renderItem,
      onItemClick,
      onItemSelect,
      selectedIndex,
      searchTerm,
      filterFunction,
    }),
    [
      filteredItems,
      renderItem,
      onItemClick,
      onItemSelect,
      selectedIndex,
      searchTerm,
      filterFunction,
    ]
  );

  // Add memory cleanup task
  useEffect(() => {
    const cleanupTask = () => {
      // Clear any cached data when memory is low
      if (listRef.current) {
        listRef.current.scrollToItem(0);
      }
    };

    memoryManager.addCleanupTask(cleanupTask);

    return () => {
      memoryManager.removeCleanupTask(cleanupTask);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div
        className={`virtual-list-loading ${className}`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {loadingComponent || (
          <div className='flex items-center space-x-2'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
            <span>Loading...</span>
          </div>
        )}
      </div>
    );
  }

  // Show empty state
  if (filteredItems.length === 0) {
    return (
      <div
        className={`virtual-list-empty ${className}`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {emptyComponent || (
          <div className='text-center text-gray-500'>
            <p>No items found</p>
            {searchTerm && <p className='text-sm'>Try adjusting your search</p>}
          </div>
        )}
      </div>
    );
  }

  // Show filtering state
  if (isFiltering) {
    return (
      <div
        className={`virtual-list-filtering ${className}`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className='flex items-center space-x-2'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <span className='text-sm text-gray-600'>Filtering...</span>
        </div>
      </div>
    );
  }

  // react-window expects a component reference (not JSX element)
  // ListItem is properly defined as a function component, which react-window accepts
  return (
    <div className={`virtual-list ${className}`}>
      <List
        ref={listRef}
        height={height}
        itemCount={filteredItems.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={overscanCount}
        onScroll={handleScroll}
        estimatedItemSize={estimatedItemSize}
      >
        {ListItem}
      </List>
    </div>
  );
}

// Hook for using virtual list with search
export function useVirtualListSearch<T>(
  items: T[],
  searchTerm: string,
  filterFunction: (item: T, searchTerm: string) => boolean
) {
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(items);
      return;
    }

    setIsSearching(true);

    // Debounce search to prevent excessive filtering
    const timeoutId = setTimeout(() => {
      const filtered = items.filter(item => filterFunction(item, searchTerm));
      setFilteredItems(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [items, searchTerm, filterFunction]);

  return {
    filteredItems,
    isSearching,
    totalItems: items.length,
    filteredCount: filteredItems.length,
  };
}

// Hook for virtual list performance monitoring
export function useVirtualListPerformance() {
  const [performance, setPerformance] = useState({
    renderTime: 0,
    scrollTime: 0,
    filterTime: 0,
  });

  const measureRenderTime = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    setPerformance(prev => ({ ...prev, renderTime: end - start }));
  }, []);

  const measureScrollTime = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    setPerformance(prev => ({ ...prev, scrollTime: end - start }));
  }, []);

  const measureFilterTime = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    setPerformance(prev => ({ ...prev, filterTime: end - start }));
  }, []);

  return {
    performance,
    measureRenderTime,
    measureScrollTime,
    measureFilterTime,
  };
}

export default VirtualList;
