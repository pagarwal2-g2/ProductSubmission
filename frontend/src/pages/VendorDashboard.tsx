import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import type { Vendor, Paginated } from '../api'
import { useAuth } from '../contexts/AuthContext'

export default function VendorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const perPage = 20
  const [searchInput, setSearchInput] = useState(search)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page, per_page: perPage }
      if (search) params.search = search
      const res = await api.get<Paginated<Vendor>>('/vendors', { params })
      setVendors(res.data.items)
      setTotal(res.data.total)
    } catch {
      setError('Failed to load vendors.')
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => { fetchVendors() }, [fetchVendors])

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

  function setPage(p: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete vendor "${name}" and all their products? This cannot be undone.`)) return
    try {
      await api.delete(`/vendors/${id}`)
      setVendors(prev => prev.filter(v => v.id !== id))
      setTotal(prev => prev - 1)
    } catch {
      alert('Failed to delete vendor.')
    }
  }

  const totalPages = Math.ceil(total / perPage)
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0 ? `${total} vendor${total !== 1 ? 's' : ''} total` : 'No vendors yet'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      <div className="card overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">{error}</div>
        )}
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Email</th>
              <th>Products</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium">No vendors found</p>
                    <p className="text-xs text-gray-400">Vendors are created automatically when products are submitted.</p>
                  </div>
                </td>
              </tr>
            ) : (
              vendors.map(v => (
                <tr key={v.id} className="cursor-pointer" onClick={() => navigate(`/vendors/${v.id}`)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {v.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-[#1D4ED8]">{v.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">{v.email}</td>
                  <td>
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-[#1D4ED8] text-xs font-bold">
                      {v.product_count ?? 0}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vendors/${v.id}`}
                        className="text-xs text-[#1D4ED8] hover:underline font-medium"
                      >
                        View
                      </Link>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(v.id, v.name)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > perPage && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">Showing {from}–{to} of {total} results</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Previous</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`text-xs px-3 py-1.5 border ${p === page ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
