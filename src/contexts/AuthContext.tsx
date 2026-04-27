import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, loginApi, registerApi, googleAuthApi, type RegisterPayload } from '@/entities/Auth/api';
import { TOKEN_KEY } from '@/services/api';
import { setUser as setUserRedux, clearUser, selectUser, type AuthUser } from '@/store/authSlice';
import { getChatSocket, disconnectChatSocket } from '@/entities/Chat/socket';

export type LoginPayload = { email: string; password: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: (idToken: string, userType?: 'LEARNER' | 'TUTOR') => Promise<void>;
  logout: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Read token from login/register response (backend may return access_token, token, or accessToken). */
function getTokenFromResponse(data: unknown): string | undefined {
  const d = data as { access_token?: string; token?: string; accessToken?: string };
  return d.access_token ?? d.token ?? d.accessToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const isAuthenticated = !!token;

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await loginApi({
      email: payload.email,
      password: payload.password,
    });
    const t = getTokenFromResponse(data);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    dispatch(clearUser());
    disconnectChatSocket();
  }, [dispatch]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerApi(payload);
    const t = getTokenFromResponse(data);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, userType?: 'LEARNER' | 'TUTOR') => {
    const data = await googleAuthApi({ idToken, userType });
    const t = getTokenFromResponse(data);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await getMe();
    dispatch(setUserRedux(data as AuthUser));
  }, [dispatch]);

  // After login/register or on load with existing token, fetch current user and save to Redux
  useEffect(() => {
    if (!token) return;
    getMe()
      .then((data) => dispatch(setUserRedux(data as AuthUser)))
      .catch(() => {
        // Do not clear token or logout on error; keep user logged in
      });
  }, [token, dispatch]);

  // Eagerly open the chat socket as soon as the app has a token, so messages,
  // typing indicators, and unread counts are live everywhere — not only after
  // the user navigates to /chats.  getChatSocket() is a singleton, so any
  // later calls from chat pages just reuse this connection.
  useEffect(() => {
    if (!token) return;
    getChatSocket(token);
    // No teardown here: logout() / token change in getChatSocket handle it.
  }, [token]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, loginWithGoogle, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
