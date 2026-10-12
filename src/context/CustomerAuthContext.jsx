import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tr_customer_token') || '');
  const [profile, setProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshCartCount = useCallback(async () => {
    if (!localStorage.getItem('tr_customer_token')) {
      setCartCount(0);
      return;
    }
    try {
      const cart = await api.getCart();
      setCartCount(cart.count || 0);
    } catch {
      /* not logged in / token expired — ignore, will resolve on next login */
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem('tr_customer_token')) {
      setProfile(null);
      return;
    }
    try {
      const p = await api.getMyProfile();
      setProfile(p);
    } catch {
      localStorage.removeItem('tr_customer_token');
      setToken('');
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshProfile();
      await refreshCartCount();
      setLoading(false);
    })();
  }, [refreshProfile, refreshCartCount]);

  const login = useCallback(async (phone, password) => {
    const data = await api.loginCustomer({ phone, password });
    localStorage.setItem('tr_customer_token', data.token);
    setToken(data.token);
    setProfile(data.profile);
    await refreshCartCount();
    return data.profile;
  }, [refreshCartCount]);

  const register = useCallback(async (phone, name, password) => {
    const data = await api.registerCustomer({ phone, name, password });
    localStorage.setItem('tr_customer_token', data.token);
    setToken(data.token);
    setProfile(data.profile);
    await refreshCartCount();
    return data.profile;
  }, [refreshCartCount]);

  const logout = useCallback(() => {
    localStorage.removeItem('tr_customer_token');
    setToken('');
    setProfile(null);
    setCartCount(0);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        token,
        profile,
        isAuthed: !!token,
        loading,
        cartCount,
        login,
        register,
        logout,
        refreshProfile,
        refreshCartCount,
        setProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return ctx;
}
