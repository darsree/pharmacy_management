import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { PharmacistPortal } from './pages/pharmacist/PharmacistPortal';
import { CustomerPortal } from './pages/customer/CustomerPortal';

// Shows the login page until someone signs in, then the portal for their role.
const RoleRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return user.role === 'pharmacist' ? <PharmacistPortal /> : <CustomerPortal />;
};

export default function App() {
  return (
    <AuthProvider>
      <RoleRouter />
    </AuthProvider>
  );
}
