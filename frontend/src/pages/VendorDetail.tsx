import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import type { VendorDetail as VendorDetailType } from '../api'
import StatusBadge from '../components/StatusBadge'

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>()
  const [vendor, setVendor] = useState<VendorDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const res = await api.get<VendorDetailType>(`/vendors/${id}`)
        setVendor(res.data)
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="text-center py-24">
      <p className="text-gray-500 mb-4">Vendor not found.</p>
      <Link to="/vendors" className="btn-secondary text-sm">← Back to Vendors</Link>
    </div>
  )

  if (!vendor) return null

  return (
    <div>
      <Link to="/vendors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1D4ED8] mb-5">
        ← Back to Vendors
      </Link>

      {/* Vendor Info */}
      <div className="card p-6 mb-4 flex items-start gap-4">
        <div className="w-14 h-14 bg-[#1D4ED8] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {vendor.name[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vendor.email}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>Joined {new Date(vendor.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="font-semibold text-[#1D4ED8]">
              {vendor.products.length} product{vendor.products.length !== 1 ? 's' : ''} submitted
            </span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Submitted Products</h2>
        </div>
        {vendor.products.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">No products submitted yet</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Product Name</th>
                <th>URL</th>
                <th>Category</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {vendor.products.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.logo_url ? (
                      <img src={p.logo_url} alt="" className="w-7 h-7 object-contain border border-gray-100" />
                    ) : (
                      <div className="w-7 h-7 bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold">
                        {p.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>
                    <Link to={`/products/${p.id}`} className="font-medium text-[#1D4ED8] hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-[#1D4ED8] truncate max-w-[150px] block">
                      {p.url.replace(/^https?:\/\//, '')}
                    </a>
                  </td>
                  <td className="text-gray-500 text-xs">{p.category || '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-gray-400 text-xs">{new Date(p.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
