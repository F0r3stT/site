// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import VerifyCode from './pages/VerifyCode';


// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FAQPAGE from './pages/FAQPage';
import SupportPage from './pages/SupportPage';
import CreateOrderPage from './pages/CreateOrderPage';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './pages/AdminDashboard';

const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return (skipAuth || token) ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path='/FAQ' element={<FAQPAGE />} />
              <Route path='/support' element={<SupportPage />} />
              <Route path="/create-order" element={<CreateOrderPage />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/verify-code" element={<VerifyCode />} />
              <Route path="/admin" element={
                <ProtectedRoute role="admin">
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;