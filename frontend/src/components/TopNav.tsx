import { Link, useLocation } from 'react-router-dom'

export default function TopNav() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/products" className="flex items-center gap-2 text-[#1D4ED8] font-bold text-base">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="butt" strokeLinejoin="miter" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="whitespace-nowrap">Product Submission Workflow</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5">
          <Link
            to="/products"
            className={`text-sm font-medium border-b-2 pb-0.5 transition-colors ${
              isActive('/products')
                ? 'text-[#1D4ED8] border-[#38BDF8]'
                : 'text-gray-600 border-transparent hover:text-[#1D4ED8]'
            }`}
          >
            Products
          </Link>
          <Link
            to="/vendors"
            className={`text-sm font-medium border-b-2 pb-0.5 transition-colors ${
              isActive('/vendors')
                ? 'text-[#1D4ED8] border-[#38BDF8]'
                : 'text-gray-600 border-transparent hover:text-[#1D4ED8]'
            }`}
          >
            Vendors
          </Link>
          <Link to="/submit" className="btn-primary text-sm">
            + Submit Product
          </Link>
        </div>
      </div>
    </nav>
  )
}
