// Branch admin flow regression tests.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../routing/guards/ProtectedRoute';
import type { User, UserRole } from '../../types';

// Mock useAuth so tests can inject arbitrary roles without a Firebase
// provider. Each test overrides the mock's return value via mockReturnValue.
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';

function makeUser(role: UserRole, overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    uid: 'u-1',
    email: role + '@example.com',
    displayName: role,
    role,
    permissionLevel: role === 'superadmin' ? 2 : 1,
    branchId: role === 'superadmin' ? undefined : 'branch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function renderProtected(opts: {
  currentUser: User | null;
  loading?: boolean;
  allowedRoles?: UserRole[];
  requiredBranch?: boolean;
}) {
  const { currentUser, loading = false, allowedRoles, requiredBranch = false } = opts;
  (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    currentUser,
    firebaseUser: currentUser ? { uid: currentUser.uid } : null,
    loading,
    signIn: vi.fn(),
    registerCustomer: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path='/protected'
          element={
            <ProtectedRoute allowedRoles={allowedRoles} requiredBranch={requiredBranch}>
              <div data-testid='protected-content'>ok</div>
            </ProtectedRoute>
          }
        />
        <Route path='/welcome' element={<div data-testid='welcome'>welcome</div>} />
        <Route path='/unauthorized' element={<div data-testid='unauthorized'>nope</div>} />
        <Route path='/no-branch' element={<div data-testid='no-branch'>no branch</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('branch admin flow', () => {
  describe('BranchManagement (fix #9)', () => {
    it.todo('renders inputs through FormField with aria-invalid on error');
    it.todo('uses AccessibleModal for destructive branch deletion');
  });

  describe('route guards (fix #4)', () => {
    const adminRoles: UserRole[] = ['superadmin', 'branchAdmin'];

    it('redirects unauthenticated users to /welcome', () => {
      renderProtected({ currentUser: null, allowedRoles: adminRoles });
      expect(screen.getByTestId('welcome')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).toBeNull();
    });

    it('blocks inspector role from admin-only routes', () => {
      renderProtected({ currentUser: makeUser('inspector'), allowedRoles: adminRoles });
      expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).toBeNull();
    });

    it('blocks customer role from admin-only routes', () => {
      renderProtected({ currentUser: makeUser('customer'), allowedRoles: adminRoles });
      expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
    });

    it('allows superadmin on admin routes', () => {
      renderProtected({ currentUser: makeUser('superadmin'), allowedRoles: adminRoles });
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('allows branchAdmin on admin routes', () => {
      renderProtected({ currentUser: makeUser('branchAdmin'), allowedRoles: adminRoles });
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('sends users without a branch to /no-branch when requiredBranch is set', () => {
      renderProtected({
        currentUser: makeUser('inspector', { branchId: undefined }),
        allowedRoles: ['inspector', 'branchAdmin'],
        requiredBranch: true,
      });
      expect(screen.getByTestId('no-branch')).toBeInTheDocument();
    });

    it('does not block superadmin without a branch when requiredBranch is set', () => {
      renderProtected({
        currentUser: makeUser('superadmin', { branchId: undefined }),
        allowedRoles: ['superadmin'],
        requiredBranch: true,
      });
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
