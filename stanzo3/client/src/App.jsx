import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoreFront from './pages/StoreFront';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProducts from './pages/admin/AdminProducts';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<StoreFront />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="products" element={<AdminProducts />} />
            {/* Make products default for /admin */}
            <Route index element={<AdminProducts />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
