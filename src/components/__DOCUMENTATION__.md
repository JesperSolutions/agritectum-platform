# Component Documentation

This document provides comprehensive documentation for all React components in the application.

## Core Components

### ErrorBoundary

**Purpose**: Catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Props**:

- `children`: ReactNode - The component tree to wrap
- `fallback?`: ReactNode - Custom fallback UI (optional)
- `onError?`: (error: Error, errorInfo: ErrorInfo) => void - Error handler callback

**Usage**:

```tsx
<ErrorBoundary onError={handleError}>
  <MyComponent />
</ErrorBoundary>
```

### FormErrorBoundary

**Purpose**: Specialized error boundary for form components with form-specific error handling.

**Props**:

- `children`: ReactNode - The form component to wrap
- `onError?`: (error: Error, errorInfo: ErrorInfo) => void - Error handler callback

**Usage**:

```tsx
<FormErrorBoundary>
  <ReportForm />
</FormErrorBoundary>
```

### LoadingSpinner

**Purpose**: Displays loading indicators with customizable size and text.

**Props**:

- `size?`: 'sm' | 'md' | 'lg' | 'xl' - Size of the spinner
- `className?`: string - Additional CSS classes
- `text?`: string - Loading text to display
- `fullScreen?`: boolean - Whether to display as full screen overlay

**Usage**:

```tsx
<LoadingSpinner size='lg' text='Loading reports...' />
```

### SkeletonLoader

**Purpose**: Provides skeleton loading states for better UX during data loading.

**Components**:

- `Skeleton` - Base skeleton component
- `SkeletonCard` - Card skeleton
- `SkeletonTable` - Table skeleton
- `SkeletonForm` - Form skeleton
- `SkeletonList` - List skeleton
- `SkeletonReportCard` - Report card skeleton
- `SkeletonDashboard` - Dashboard skeleton

**Usage**:

```tsx
<SkeletonDashboard />
<SkeletonCard className="mb-4" />
```

## Form Components

### ValidatedInput

**Purpose**: Input component with real-time validation and error handling.

**Props**:

- `label`: string - Field label
- `rules`: ValidationRule[] - Validation rules
- `validateOnChange?`: boolean - Validate on input change
- `validateOnBlur?`: boolean - Validate on blur
- `validateOnFocus?`: boolean - Validate on focus
- `debounceMs?`: number - Debounce delay for validation
- `showValidationIcon?`: boolean - Show validation status icon
- `helpText?`: string - Help text for the field
- `required?`: boolean - Whether field is required
- `onChange?`: (value: string) => void - Change handler
- `onValidationChange?`: (isValid: boolean, error: string) => void - Validation change handler

**Usage**:

```tsx
<ValidatedInput
  label='Customer Name'
  rules={[validators.required, validators.minLength(2)]}
  validateOnChange
  helpText="Enter the customer's full name"
  required
/>
```

### ValidatedTextarea

**Purpose**: Textarea component with real-time validation and error handling.

**Props**: Same as ValidatedInput, plus:

- `rows?`: number - Number of textarea rows
- `cols?`: number - Number of textarea columns

**Usage**:

```tsx
<ValidatedTextarea
  label='Description'
  rules={[validators.required, validators.minLength(10)]}
  rows={4}
  validateOnBlur
/>
```

### FormField

**Purpose**: Wrapper component for form fields with consistent styling and accessibility.

**Props**:

- `label`: string - Field label
- `error?`: string - Error message
- `touched?`: boolean - Whether field has been touched
- `required?`: boolean - Whether field is required
- `helpText?`: string - Help text
- `className?`: string - Additional CSS classes
- `children`: ReactNode - The input element

**Usage**:

```tsx
<FormField
  label='Email'
  error={errors.email}
  touched={touched.email}
  required
  helpText="We'll never share your email"
>
  <input type='email' />
</FormField>
```

## UI Components

### AccessibleButton

**Purpose**: Button component with built-in accessibility features and loading states.

**Props**:

- `variant?`: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' - Button variant
- `size?`: 'sm' | 'md' | 'lg' - Button size
- `loading?`: boolean - Whether button is in loading state
- `loadingText?`: string - Text to show while loading
- `leftIcon?`: ReactNode - Icon to show on the left
- `rightIcon?`: ReactNode - Icon to show on the right
- `fullWidth?`: boolean - Whether button should take full width
- `ariaLabel?`: string - ARIA label for accessibility
- `ariaDescribedBy?`: string - ARIA describedby for accessibility

**Usage**:

```tsx
<AccessibleButton
  variant='primary'
  size='md'
  loading={isSubmitting}
  leftIcon={<Save />}
  ariaLabel='Save changes'
>
  Save
</AccessibleButton>
```

### AccessibleTable

**Purpose**: Table component with accessibility features and sorting capabilities.

**Props**:

- `data`: T[] - Table data
- `columns`: Column<T>[] - Column definitions
- `sortBy?`: keyof T - Currently sorted column
- `sortDirection?`: 'asc' | 'desc' - Sort direction
- `onSort?`: (key: keyof T) => void - Sort handler
- `loading?`: boolean - Whether table is loading
- `emptyMessage?`: string - Message to show when no data
- `className?`: string - Additional CSS classes
- `caption?`: string - Table caption
- `aria-label?`: string - ARIA label for accessibility

**Usage**:

```tsx
<AccessibleTable
  data={reports}
  columns={reportColumns}
  sortBy='createdAt'
  sortDirection='desc'
  onSort={handleSort}
  loading={isLoading}
  emptyMessage='No reports found'
/>
```

### AccessibleModal

**Purpose**: Modal component with accessibility features and focus management.

**Props**:

- `isOpen`: boolean - Whether modal is open
- `onClose`: () => void - Close handler
- `title`: string - Modal title
- `children`: ReactNode - Modal content
- `size?`: 'sm' | 'md' | 'lg' | 'xl' | 'full' - Modal size
- `closeOnOverlayClick?`: boolean - Whether to close on overlay click
- `closeOnEscape?`: boolean - Whether to close on escape key
- `showCloseButton?`: boolean - Whether to show close button
- `className?`: string - Additional CSS classes
- `aria-label?`: string - ARIA label for accessibility

**Usage**:

```tsx
<AccessibleModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title='Confirm Action'
  size='md'
  closeOnEscape
>
  <p>Are you sure you want to delete this item?</p>
</AccessibleModal>
```

## Error Components

### ErrorDisplay

**Purpose**: Displays error messages with different types and actions.

**Props**:

- `type?`: 'error' | 'warning' | 'info' | 'success' - Error type
- `title?`: string - Error title
- `message`: string - Error message
- `details?`: string - Additional error details
- `onRetry?`: () => void - Retry handler
- `onDismiss?`: () => void - Dismiss handler
- `showDetails?`: boolean - Whether to show details
- `className?`: string - Additional CSS classes
- `aria-label?`: string - ARIA label for accessibility

**Usage**:

```tsx
<ErrorDisplay
  type='error'
  title='Connection Error'
  message='Unable to connect to the server'
  onRetry={handleRetry}
  showDetails
/>
```

### InlineError

**Purpose**: Inline error message for form fields.

**Props**:

- `message`: string - Error message
- `className?`: string - Additional CSS classes

**Usage**:

```tsx
<InlineError message='This field is required' />
```

## Lazy Components

### LazyComponents

**Purpose**: Exports lazy-loaded versions of all major components for code splitting.

**Exports**:

- `LazyDashboard` - Lazy-loaded Dashboard
- `LazyReportForm` - Lazy-loaded ReportForm
- `LazyReportView` - Lazy-loaded ReportView
- `LazyReportList` - Lazy-loaded ReportList
- `LazyCustomerManagement` - Lazy-loaded CustomerManagement
- `LazyUserManagement` - Lazy-loaded UserManagement
- `LazyBranchManagement` - Lazy-loaded BranchManagement
- `LazyQATestingPage` - Lazy-loaded QATestingPage
- `LazyAnalytics` - Lazy-loaded Analytics

**Usage**:

```tsx
import { LazyDashboard } from './LazyComponents';

<Suspense fallback={<LoadingFallback />}>
  <LazyDashboard />
</Suspense>;
```

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Define clear, typed props interfaces
3. **Default Props**: Provide sensible defaults for optional props
4. **Accessibility**: Include proper ARIA attributes and keyboard navigation
5. **Error Handling**: Implement proper error boundaries and fallbacks

### Performance

1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Implement code splitting for large components
3. **Optimization**: Use useMemo and useCallback for expensive operations
4. **Bundle Size**: Keep components focused and avoid unnecessary dependencies

### Testing

1. **Unit Tests**: Write tests for component logic
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Verify accessibility features
4. **Visual Tests**: Test component appearance and behavior

### Documentation

1. **JSDoc Comments**: Document all props and methods
2. **Usage Examples**: Provide clear usage examples
3. **Type Definitions**: Use TypeScript for type safety
4. **README Files**: Maintain component-specific documentation
