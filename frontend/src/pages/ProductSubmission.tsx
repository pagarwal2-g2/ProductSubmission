import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import type { ProductCreate, ProductDetail } from '../api'

const CATEGORIES = [
  'CRM', 'Analytics', 'Marketing', 'HR & Recruiting', 'Finance',
  'Project Management', 'Customer Support', 'Security', 'DevOps', 'Other',
]

interface FormState {
  name: string
  url: string
  logo_url: string
  description: string
  category: string
  vendor_name: string
  vendor_email: string
}

const EMPTY: FormState = {
  name: '', url: '', logo_url: '', description: '', category: '',
  vendor_name: '', vendor_email: '',
}

export default function ProductSubmission() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<ProductDetail | null>(null)
  const [apiError, setApiError] = useState('')

  function update(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.url.trim()) e.url = 'Product URL is required'
    else if (!/^https?:\/\/.+/.test(form.url)) e.url = 'Must be a valid URL starting with http:// or https://'
    if (!form.vendor_name.trim()) e.vendor_name = 'Vendor name is required'
    if (!form.vendor_email.trim()) e.vendor_email = 'Vendor email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.vendor_email)) e.vendor_email = 'Must be a valid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setApiError('')
    try {
      const payload: ProductCreate = {
        name: form.name,
        url: form.url,
        logo_url: form.logo_url || undefined,
        description: form.description || undefined,
        category: form.category || undefined,
        vendor_name: form.vendor_name,
        vendor_email: form.vendor_email,
      }
      const res = await api.post<ProductDetail>('/products', payload)
      setSuccess(res.data)
      setForm(EMPTY)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(msg || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-16">
        <div className="card p-10 text-center">
          <div className="w-14 h-14 bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Submitted!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <span className="font-medium text-gray-700">{success.name}</span> has been submitted for review.
          </p>
          <p className="text-gray-400 text-xs mb-6">An admin will review and approve your product shortly.</p>
          <div className="flex justify-center gap-3">
            <Link to="/products" className="btn-primary text-sm">View All Products</Link>
            <button
              onClick={() => setSuccess(null)}
              className="btn-secondary text-sm"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Submit a New Product</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to list your product for review and publishing.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">{apiError}</div>
            )}

            {/* Product Information */}
            <div className="card p-6 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                Product Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="e.g. Salesforce CRM"
                    className={`input-field ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={e => update('url', e.target.value)}
                    placeholder="https://yourproduct.com"
                    className={`input-field ${errors.url ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  />
                  {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.logo_url}
                    onChange={e => update('logo_url', e.target.value)}
                    placeholder="https://logo.clearbit.com/yourproduct.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Describe what your product does in a few sentences..."
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => update('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="card p-6 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                Vendor Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.vendor_name}
                    onChange={e => update('vendor_name', e.target.value)}
                    placeholder="e.g. Salesforce Inc."
                    className={`input-field ${errors.vendor_name ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  />
                  {errors.vendor_name && <p className="text-red-500 text-xs mt-1">{errors.vendor_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.vendor_email}
                    onChange={e => update('vendor_email', e.target.value)}
                    placeholder="contact@yourcompany.com"
                    className={`input-field ${errors.vendor_email ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  />
                  {errors.vendor_email && <p className="text-red-500 text-xs mt-1">{errors.vendor_email}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-sm font-semibold"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Product for Review'
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          {/* Preview */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preview</h3>
            <div className="flex items-start gap-3">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt=""
                  className="w-12 h-12 object-contain border border-gray-100 flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {form.name || <span className="text-gray-300">Product name</span>}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {form.url ? form.url.replace(/^https?:\/\//, '') : <span className="text-gray-200">product-url.com</span>}
                </p>
                {form.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-[#1D4ED8] text-xs">
                    {form.category}
                  </span>
                )}
              </div>
            </div>
            {form.description && (
              <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3 line-clamp-3">
                {form.description}
              </p>
            )}
          </div>

          {/* Guidelines */}
          <div className="card p-5 bg-blue-50 border-[#BFDBFE]">
            <h3 className="text-xs font-semibold text-[#1D4ED8] uppercase tracking-wide mb-2">
              Submission Guidelines
            </h3>
            <ul className="space-y-1.5">
              {[
                'Provide a real, working product URL',
                'Use your company email for vendor info',
                'Logo URL should be publicly accessible',
                'Submissions are reviewed within 24–48 hours',
                'Each product will appear on the platform after approval',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-blue-800">
                  <span className="text-[#38BDF8] flex-shrink-0 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
