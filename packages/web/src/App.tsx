import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { MyShiftsPage } from './pages/MyShiftsPage';
import { PrivacyPage } from './pages/PrivacyPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, token } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user || !token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        {user?.role === 'WORKER' && (
            <Route path="my-shifts" element={<MyShiftsPage />} />
        )}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
