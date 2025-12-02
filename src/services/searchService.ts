/**
 * Advanced Search Service
 * Provides comprehensive search functionality across all data types
 */

import { Report, Branch, Customer, Employee } from '../types';

export interface SearchOptions {
  fields?: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  includeMetadata?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights: string[];
  matchedFields: string[];
}

export interface SearchResponse<T> {
  results: SearchResult<T>[];
  total: number;
  query: string;
  took: number;
  suggestions: string[];
}

export interface SearchIndex {
  [key: string]: {
    [field: string]: string[];
  };
}

class SearchService {
  private static instance: SearchService;
  private searchIndex: SearchIndex = {};
  private searchHistory: string[] = [];
  private searchCache = new Map<string, any>();
  private maxCacheSize = 1000;
  private cacheTimeout = 300000; // 5 minutes

  private constructor() {
    this.initializeSearchIndex();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Initialize search index
   */
  private initializeSearchIndex(): void {
    this.searchIndex = {
      reports: {},
      branches: {},
      customers: {},
      employees: {},
    };
  }

  /**
   * Index a document for search
   */
  indexDocument<T>(type: keyof SearchIndex, id: string, document: T): void {
    if (!this.searchIndex[type]) {
      this.searchIndex[type] = {};
    }

    const indexedFields: string[] = [];

    // Index all string fields
    Object.entries(document as any).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        const words = this.tokenize(value);
        this.searchIndex[type][`${id}_${key}`] = words;
        indexedFields.push(key);
      } else if (Array.isArray(value)) {
        // Index array fields
        const arrayText = value.join(' ');
        const words = this.tokenize(arrayText);
        this.searchIndex[type][`${id}_${key}`] = words;
        indexedFields.push(key);
      }
    });

    // Store metadata
    this.searchIndex[type][`${id}_metadata`] = indexedFields;
  }

  /**
   * Remove document from index
   */
  removeFromIndex(type: keyof SearchIndex, id: string): void {
    if (!this.searchIndex[type]) return;

    Object.keys(this.searchIndex[type]).forEach(key => {
      if (key.startsWith(`${id}_`)) {
        delete this.searchIndex[type][key];
      }
    });
  }

  /**
   * Tokenize text for search
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Calculate search score
   */
  private calculateScore(queryTokens: string[], documentTokens: string[]): number {
    let score = 0;
    const queryLength = queryTokens.length;

    queryTokens.forEach(queryToken => {
      documentTokens.forEach(docToken => {
        if (docToken.includes(queryToken)) {
          score += 1;
        } else if (this.calculateLevenshteinDistance(queryToken, docToken) <= 2) {
          score += 0.5; // Fuzzy match
        }
      });
    });

    return score / queryLength;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Search across all indexed documents
   */
  search<T>(
    query: string,
    type: keyof SearchIndex,
    options: SearchOptions = {}
  ): SearchResponse<T> {
    const startTime = performance.now();

    // Check cache first
    const cacheKey = `${type}_${query}_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      fields = [],
      fuzzy = true,
      caseSensitive = false,
      exactMatch = false,
      limit = 50,
      offset = 0,
      sortBy = 'score',
      sortOrder = 'desc',
    } = options;

    const queryTokens = this.tokenize(query);
    const results: SearchResult<T>[] = [];
    const suggestions: string[] = [];

    if (!this.searchIndex[type]) {
      return {
        results: [],
        total: 0,
        query,
        took: performance.now() - startTime,
        suggestions: [],
      };
    }

    // Search through indexed documents
    Object.keys(this.searchIndex[type]).forEach(key => {
      if (key.endsWith('_metadata')) return;

      const [id, field] = key.split('_', 2);

      // Skip if field filtering is enabled and field is not in the list
      if (fields.length > 0 && !fields.includes(field)) return;

      const documentTokens = this.searchIndex[type][key];
      const score = this.calculateScore(queryTokens, documentTokens);

      if (score > 0) {
        // Find existing result or create new one
        let existingResult = results.find(r => (r.item as any).id === id);

        if (!existingResult) {
          existingResult = {
            item: {} as T,
            score: 0,
            highlights: [],
            matchedFields: [],
          };
          results.push(existingResult);
        }

        existingResult.score += score;
        existingResult.matchedFields.push(field);

        // Add highlights
        queryTokens.forEach(queryToken => {
          documentTokens.forEach(docToken => {
            if (docToken.includes(queryToken)) {
              existingResult!.highlights.push(docToken);
            }
          });
        });
      }
    });

    // Sort results
    results.sort((a, b) => {
      if (sortBy === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
      return 0;
    });

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    // Generate suggestions
    if (query.length > 2) {
      suggestions.push(...this.generateSuggestions(query, type));
    }

    // Add to search history
    this.addToSearchHistory(query);

    const response: SearchResponse<T> = {
      results: paginatedResults,
      total: results.length,
      query,
      took: performance.now() - startTime,
      suggestions,
    };

    // Cache the result
    this.setCache(cacheKey, response);

    return response;
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, type: keyof SearchIndex): string[] {
    const suggestions: string[] = [];
    const queryTokens = this.tokenize(query);

    if (!this.searchIndex[type]) return suggestions;

    // Find similar terms in the index
    const allTerms = new Set<string>();
    Object.values(this.searchIndex[type]).forEach(tokens => {
      tokens.forEach(token => allTerms.add(token));
    });

    allTerms.forEach(term => {
      queryTokens.forEach(queryToken => {
        if (term.includes(queryToken) && term !== queryToken) {
          suggestions.push(term);
        }
      });
    });

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Add query to search history
   */
  private addToSearchHistory(query: string): void {
    if (query.trim() && !this.searchHistory.includes(query)) {
      this.searchHistory.unshift(query);
      if (this.searchHistory.length > 50) {
        this.searchHistory = this.searchHistory.slice(0, 50);
      }
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.searchCache.delete(key);
    return null;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any): void {
    // Remove oldest entries if cache is full
    if (this.searchCache.size >= this.maxCacheSize) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }

    this.searchCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.searchCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
    };
  }

  /**
   * Search with autocomplete
   */
  autocomplete(query: string, type: keyof SearchIndex, limit: number = 10): string[] {
    if (query.length < 2) return [];

    const suggestions = this.generateSuggestions(query, type);
    return suggestions.slice(0, limit);
  }

  /**
   * Search with filters
   */
  searchWithFilters<T>(
    query: string,
    type: keyof SearchIndex,
    filters: Record<string, any>,
    options: SearchOptions = {}
  ): SearchResponse<T> {
    // This would implement advanced filtering
    // For now, just return regular search
    return this.search<T>(query, type, options);
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(): {
    totalSearches: number;
    popularQueries: string[];
    averageQueryLength: number;
    searchTypes: Record<string, number>;
  } {
    return {
      totalSearches: this.searchHistory.length,
      popularQueries: this.searchHistory.slice(0, 10),
      averageQueryLength:
        this.searchHistory.reduce((sum, query) => sum + query.length, 0) /
        this.searchHistory.length,
      searchTypes: {}, // Would need to track search types
    };
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();

// Search utilities
export const searchUtils = {
  /**
   * Create searchable text from object
   */
  createSearchableText<T>(obj: T): string {
    const searchableFields: string[] = [];

    Object.values(obj as any).forEach(value => {
      if (typeof value === 'string') {
        searchableFields.push(value);
      } else if (Array.isArray(value)) {
        searchableFields.push(value.join(' '));
      }
    });

    return searchableFields.join(' ');
  },

  /**
   * Highlight search terms in text
   */
  highlightText(text: string, query: string): string {
    const queryTokens = query.toLowerCase().split(/\s+/);
    let highlightedText = text;

    queryTokens.forEach(token => {
      const regex = new RegExp(`(${token})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  },

  /**
   * Create search index from data
   */
  createSearchIndex<T>(data: T[], type: keyof SearchIndex): void {
    data.forEach(item => {
      const id = (item as any).id;
      if (id) {
        searchService.indexDocument(type, id, item);
      }
    });
  },

  /**
   * Search with debouncing
   */
  debounceSearch<T>(
    query: string,
    type: keyof SearchIndex,
    options: SearchOptions,
    delay: number = 300
  ): Promise<SearchResponse<T>> {
    return new Promise(resolve => {
      setTimeout(() => {
        const result = searchService.search<T>(query, type, options);
        resolve(result);
      }, delay);
    });
  },
};

export default searchService;
