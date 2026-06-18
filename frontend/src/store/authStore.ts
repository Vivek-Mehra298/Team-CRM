import { create } from 'zustand';

export type UserRole = 'leader' | 'manager' | 'executive' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  isVerified: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setVerified: () => void;
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
  };
});
