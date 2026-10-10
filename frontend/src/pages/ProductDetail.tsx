import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import type { ProductDetail as ProductDetailType } from '../api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const res = await api.get<ProductDetailType>(`/products/${id}`)
        setProduct(res.data)
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  async function updateStatus(status: 'approved' | 'rejected') {
    setActionLoading(true)
    try {
      const res = await api.patch<ProductDetailType>(`/products/${id}/status`, { status })
      setProduct(res.data)
      setToast(status === 'approved' ? '✓ Product approved' : '✓ Product rejected')
      setTimeout(() => setToast(''), 3000)
    } catch {
      alert('Failed to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="text-center py-24">
      <p className="text-gray-500 mb-4">Product not found.</p>
      <Link to="/products" className="btn-secondary text-sm">← Back to Products</Link>
    </div>
  )

  if (!product) return null

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 text-sm z-50 shadow-lg">
          {toast}
        </div>
      )}

      {/* Back */}
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1D4ED8] mb-5">
        ← Back to Products
      </Link>

      {/* Product Header */}
      <div className="card p-6 mb-4 flex items-start gap-5">
        {product.logo_url ? (
          <img src={product.logo_url} alt="" className="w-16 h-16 object-contain border border-gray-100 flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 bg-[#1D4ED8] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {product.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>
          <p className="text-sm text-gray-400">
            Submitted {new Date(product.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Admin Actions */}
        {user?.role === 'admin' && product.status === 'pending' && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => updateStatus('approved')}
              disabled={actionLoading}
              className="btn-success text-sm disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => updateStatus('rejected')}
              disabled={actionLoading}
              className="btn-danger text-sm disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </div>
        )}
      </div>

      {/* Details + Vendor */}
      <div className="grid grid-cols-3 gap-4">
        {/* Product Details */}
        <div className="col-span-2 card p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Product Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-400 mb-0.5">URL</dt>
              <dd>
                <a href={product.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#1D4ED8] hover:underline flex items-center gap-1">
                  {product.url}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </dd>
            </div>
            {product.description && (
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Description</dt>
                <dd className="text-sm text-gray-700 leading-relaxed">{product.description}</dd>
              </div>
            )}
            {product.category && (
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Category</dt>
                <dd><span className="px-2 py-0.5 bg-blue-50 text-[#1D4ED8] text-xs">{product.category}</span></dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-400 mb-0.5">Status</dt>
              <dd><StatusBadge status={product.status} /></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 mb-0.5">Submitted</dt>
              <dd className="text-sm text-gray-700">{new Date(product.submitted_at).toLocaleString()}</dd>
            </div>
            {product.reviewed_at && (
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Reviewed</dt>
                <dd className="text-sm text-gray-700">
                  {new Date(product.reviewed_at).toLocaleString()}
                  {product.reviewer && (
                    <span className="text-gray-400 ml-1">by {product.reviewer.name}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Vendor */}
        <div className="col-span-1 card p-6 h-fit">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Vendor</h2>
          {product.vendor ? (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Company</dt>
                <dd className="font-semibold text-gray-900">{product.vendor.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Email</dt>
                <dd className="text-sm text-gray-700">{product.vendor.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">Products</dt>
                <dd>
                  <span className="text-sm font-medium text-[#1D4ED8]">
                    {product.vendor.product_count ?? 1}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">submitted</span>
                </dd>
              </div>
              <Link
                to={`/vendors/${product.vendor_id}`}
                className="block text-xs text-[#1D4ED8] hover:underline mt-2"
              >
                View vendor profile →
              </Link>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">Vendor info unavailable</p>
          )}
        </div>
      </div>
    </div>
  )
}
