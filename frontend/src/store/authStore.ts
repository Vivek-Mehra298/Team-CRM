import { create } from 'zustand';

export type UserRole = 'leader' | 'manager' | 'executive' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string | { _id: string; name: string };
  isVerified: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setVerified: () => void;
  updateOrgName: (name: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe extraction for SSR
  let initialToken = null;
  let initialUser = null;
  
  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem('teamcrm_token');
    const userJson = localStorage.getItem('teamcrm_user');
    if (userJson) {
      try {
        initialUser = JSON.parse(userJson);
      } catch {
        // Clear corrupt state
        localStorage.removeItem('teamcrm_token');
        localStorage.removeItem('teamcrm_user');
      }
    }
  }

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    login: (token, user) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('teamcrm_token', token);
        localStorage.setItem('teamcrm_user', JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('teamcrm_token');
        localStorage.removeItem('teamcrm_user');
      }
      set({ token: null, user: null, isAuthenticated: false });
    },
    setVerified: () => {
      set((state) => {
        if (!state.user) return {};
        const updatedUser = { ...state.user, isVerified: true };
        if (typeof window !== 'undefined') {
          localStorage.setItem('teamcrm_user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    },
    updateOrgName: (name: string) => {
      set((state) => {
        if (!state.user) return {};
        const updatedOrgId =
          typeof state.user.orgId === 'object' && state.user.orgId !== null
            ? { ...state.user.orgId, name }
            : { _id: state.user.orgId, name };

        const updatedUser = { ...state.user, orgId: updatedOrgId };
        if (typeof window !== 'undefined') {
          localStorage.setItem('teamcrm_user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    },
  };
});
