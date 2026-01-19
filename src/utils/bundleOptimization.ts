// Bundle optimization utilities and configuration

import { logger } from './logger';

// Dynamic imports for better code splitting
export const dynamicImports = {
  // Lazy load heavy components
  loadHeavyComponent: () => import('../components/ReportForm'),
  loadAnalytics: () => import('../components/AnalyticsDashboardSimple'),
  loadUserManagement: () => import('../components/UserManagement'),
  loadBranchManagement: () => import('../components/BranchManagement'),

  // Lazy load utility libraries
  loadPdfLibrary: () => import('jspdf'),
  loadChartLibrary: () => import('chart.js'),
  loadDateLibrary: () => import('date-fns'),

  // Lazy load services
  loadEmailService: () => import('../services/triggerEmailService'),
  loadPdfService: () => import('../services/pdfService'),
  loadAnalyticsService: () => import('../services/analyticsService'),
};

// Preload critical resources
export const preloadResources = () => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.href = '/src/index.css';
  criticalCSS.as = 'style';
  document.head.appendChild(criticalCSS);

  // Preload critical fonts
  const criticalFont = document.createElement('link');
  criticalFont.rel = 'preload';
  criticalFont.href = '/fonts/inter.woff2';
  criticalFont.as = 'font';
  criticalFont.type = 'font/woff2';
  criticalFont.crossOrigin = 'anonymous';
  document.head.appendChild(criticalFont);
};

// Bundle splitting strategy
export const bundleSplitting = {
  // Split by route
  routeChunks: {
    dashboard: () => import('../components/Dashboard'),
    reports: () => import('../components/ReportForm'),
    admin: () => import('../components/UserManagement'),
    analytics: () => import('../components/AnalyticsDashboardSimple'),
  },

  // Split by feature
  featureChunks: {
    forms: () => import('../components/ValidatedInput'),
    tables: () => import('../components/AccessibleTable'),
    modals: () => import('../components/AccessibleModal'),
    charts: () => import('../components/Chart'),
  },

  // Split by vendor
  vendorChunks: {
    react: () => import('react'),
    firebase: () => import('../config/firebase'),
    utils: () => import('../utils/validation'),
  },
};

// Tree shaking optimization
export const treeShakingOptimizations = {
  // Use named imports instead of default imports
  useNamedImports: true,

  // Import only needed functions
  importOnlyNeeded: {
    fromLodash: ['debounce', 'throttle'],
    fromDateFns: ['format', 'parseISO', 'isValid'],
    fromLodash: ['debounce', 'throttle'],
  },

  // Avoid importing entire libraries
  avoidFullImports: ['lodash', 'date-fns', 'chart.js'],
};

// Performance monitoring
export const performanceMonitoring = {
  // Measure bundle load times
  measureBundleLoad: (chunkName: string) => {
    const startTime = performance.now();
    return {
      end: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        logger.log(`Bundle ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
        return loadTime;
      },
    };
  },

  // Monitor chunk sizes
  monitorChunkSizes: () => {
    if (process.env.NODE_ENV === 'development') {
      logger.log('Chunk sizes monitoring enabled in development');
      // In production, this would integrate with webpack-bundle-analyzer
    }
  },

  // Track loading performance
  trackLoadingPerformance: () => {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      logger.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart);
      logger.log(
        'DOM content loaded:',
        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      );
    });
  },
};

// Lazy loading strategies
export const lazyLoadingStrategies = {
  // Route-based lazy loading
  routeBased: {
    loadOnRoute: (route: string) => {
      return import(`../components/${route}`);
    },
  },

  // Feature-based lazy loading
  featureBased: {
    loadOnFeature: (feature: string) => {
      return import(`../features/${feature}`);
    },
  },

  // User interaction-based lazy loading
  interactionBased: {
    loadOnHover: (component: string) => {
      return import(`../components/${component}`);
    },
    loadOnClick: (component: string) => {
      return import(`../components/${component}`);
    },
  },
};

// Bundle optimization recommendations
export const optimizationRecommendations = {
  // Code splitting recommendations
  codeSplitting: [
    'Split by route - each route should be its own chunk',
    'Split by feature - group related components together',
    'Split vendor libraries - separate third-party code',
    'Use dynamic imports for heavy components',
    'Implement lazy loading for non-critical features',
  ],

  // Tree shaking recommendations
  treeShaking: [
    'Use ES6 modules instead of CommonJS',
    'Import only what you need from libraries',
    'Avoid importing entire libraries',
    'Use named imports instead of default imports',
    'Remove unused code and dead code',
  ],

  // Compression recommendations
  compression: [
    'Enable gzip compression on the server',
    'Use Brotli compression for better ratios',
    'Minify JavaScript and CSS',
    'Optimize images and use modern formats',
    'Use CDN for static assets',
  ],

  // Caching recommendations
  caching: [
    'Implement proper cache headers',
    'Use service workers for offline caching',
    'Cache API responses when appropriate',
    'Use browser caching for static assets',
    'Implement cache invalidation strategies',
  ],
};

// Bundle analysis
export const bundleAnalysis = {
  // Analyze bundle composition
  analyzeBundle: () => {
    if (process.env.NODE_ENV === 'development') {
      logger.log('Bundle analysis available in development mode');
      logger.log('Run: npm run build && npx webpack-bundle-analyzer dist/assets/*.js');
    }
  },

  // Get bundle statistics
  getBundleStats: () => {
    // This would typically be used with webpack-bundle-analyzer
    return {
      totalSize: 'Unknown - run bundle analyzer',
      chunkCount: 'Unknown - run bundle analyzer',
      gzipSize: 'Unknown - run bundle analyzer',
    };
  },
};

// Initialize bundle optimizations
export const initializeBundleOptimizations = () => {
  // Preload critical resources
  preloadResources();

  // Start performance monitoring
  performanceMonitoring.trackLoadingPerformance();
  performanceMonitoring.monitorChunkSizes();

  // Analyze bundle in development
  bundleAnalysis.analyzeBundle();
};
