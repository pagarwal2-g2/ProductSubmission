import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api, { API_BASE_URL } from '../api'
import type { Product, Paginated } from '../api'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from '../components/StatusBadge'

export default function ProductDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const perPage = 20

  const [searchInput, setSearchInput] = useState(search)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page, per_page: perPage }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get<Paginated<Product>>('/products', { params })
      setProducts(res.data.items)
      setTotal(res.data.total)
    } catch (e: unknown) {
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, perPage])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        if (searchInput) next.set('search', searchInput)
        else next.delete('search')
        next.set('page', '1')
        return next
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearchParams])

  function setStatus(value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set('status', value)
      else next.delete('status')
      next.set('page', '1')
      return next
    })
  }

  function setPage(p: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete product "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotal(prev => prev - 1)
    } catch {
      alert('Failed to delete product.')
    }
  }

  function handleExport() {
    const a = document.createElement('a')
    a.href = `${API_BASE_URL}/products/export/csv`
    a.download = 'products.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const totalPages = Math.ceil(total / perPage)
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0 ? `${total} product${total !== 1 ? 's' : ''} total` : 'No products yet'}
          </p>
        </div>
        <Link to="/submit" className="btn-primary text-sm">
          + Submit New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="input-field max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="input-field max-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="ml-auto flex gap-2">
          {user?.role === 'admin' && (
            <button onClick={handleExport} className="btn-secondary text-sm">
              ↓ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">{error}</div>
        )}
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Product</th>
              <th>URL</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Status</th>
              <th>Submitted</th>
              {user?.role === 'admin' && <th style={{ width: 80 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: user?.role === 'admin' ? 8 : 7 }).map((_, j) => (
                    <td key={j}>
                      <div className="h-4 bg-gray-100 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'admin' ? 8 : 7} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm font-medium">No products found</p>
                    <Link to="/submit" className="btn-primary text-xs">Submit your first product</Link>
                  </div>
                </td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                  <td onClick={e => e.stopPropagation()}>
                    {p.logo_url ? (
                      <img src={p.logo_url} alt="" className="w-8 h-8 object-contain border border-gray-100" />
                    ) : (
                      <div className="w-8 h-8 bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold">
                        {p.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="font-medium text-[#1D4ED8] hover:underline">{p.name}</span>
                  </td>
                  <td>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-gray-500 hover:text-[#1D4ED8] text-xs flex items-center gap-1 max-w-[180px]"
                    >
                      <span className="truncate">{p.url.replace(/^https?:\/\//, '')}</span>
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="text-gray-700">{p.vendor_name || '—'}</td>
                  <td className="text-gray-500">{p.category || '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-gray-400 text-xs">{new Date(p.submitted_at).toLocaleDateString()}</td>
                  {user?.role === 'admin' && (
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">Showing {from}–{to} of {total} results</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              ← Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`text-xs px-3 py-1.5 border ${
                    p === page
                      ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
