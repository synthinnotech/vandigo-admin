import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';
import ChatWidget from './components/chat/ChatWidget';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Rides from './pages/Rides';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import PromoCodes from './pages/PromoCodes';
import FareConfig from './pages/FareConfig';
import Support from './pages/Support';
import Offers from './pages/Offers';
import DocumentTypes from './pages/DocumentTypes';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('vandigo_access_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ChatProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
                <Route path="/drivers" element={<PrivateRoute><Drivers /></PrivateRoute>} />
                <Route path="/rides" element={<PrivateRoute><Rides /></PrivateRoute>} />
                <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
                <Route path="/withdrawals" element={<PrivateRoute><Withdrawals /></PrivateRoute>} />
                <Route path="/promo-codes" element={<PrivateRoute><PromoCodes /></PrivateRoute>} />
                <Route path="/fare-config" element={<PrivateRoute><FareConfig /></PrivateRoute>} />
                <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
                <Route path="/offers" element={<PrivateRoute><Offers /></PrivateRoute>} />
                <Route path="/document-types" element={<PrivateRoute><DocumentTypes /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <ChatWidget />
            </ChatProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
