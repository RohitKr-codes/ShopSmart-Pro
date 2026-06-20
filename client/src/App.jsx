import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Loader from './components/Loader'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Billing from './pages/Billing'
import Invoices from './pages/Invoices'
import Customers from './pages/Customers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullPage />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullPage />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />

      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      <Route path="/dashboard" element={
        <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
      } />

      <Route path="/products" element={
        <PrivateRoute><Layout><Products /></Layout></PrivateRoute>
      } />

      <Route path="/inventory" element={
        <PrivateRoute><Layout><Inventory /></Layout></PrivateRoute>
      } />

      <Route path="/billing" element={
        <PrivateRoute><Layout><Billing /></Layout></PrivateRoute>
      } />

      <Route path="/invoices" element={
        <PrivateRoute><Layout><Invoices /></Layout></PrivateRoute>
      } />

      <Route path="/customers" element={
        <PrivateRoute><Layout><Customers /></Layout></PrivateRoute>
      } />

      <Route path="/reports" element={
        <PrivateRoute><Layout><Reports /></Layout></PrivateRoute>
      } />

      <Route path="/settings" element={
        <PrivateRoute><Layout><Settings /></Layout></PrivateRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}