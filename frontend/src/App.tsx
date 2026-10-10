import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import TopNav from './components/TopNav'
import ProductDashboard from './pages/ProductDashboard'
import ProductSubmission from './pages/ProductSubmission'
import ProductDetail from './pages/ProductDetail'
import VendorDashboard from './pages/VendorDashboard'
import VendorDetail from './pages/VendorDetail'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/products" element={<Layout><ProductDashboard /></Layout>} />
          <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/submit" element={<Layout><ProductSubmission /></Layout>} />
          <Route path="/vendors" element={<Layout><VendorDashboard /></Layout>} />
          <Route path="/vendors/:id" element={<Layout><VendorDetail /></Layout>} />
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
