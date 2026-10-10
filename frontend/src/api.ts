import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export default api
export { API_BASE_URL }

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  role: 'admin' | 'vendor'
  created_at: string
}

export interface Product {
  id: string
  name: string
  url: string
  logo_url?: string
  description?: string
  category?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  vendor_id: string
  vendor_name: string
}

export interface ProductDetail extends Product {
  vendor?: Vendor
  reviewer?: User
}

export interface Vendor {
  id: string
  name: string
  email: string
  created_at: string
  product_count?: number
}

export interface VendorDetail extends Vendor {
  products: Product[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface ProductCreate {
  name: string
  url: string
  logo_url?: string
  description?: string
  category?: string
  vendor_name: string
  vendor_email: string
}
