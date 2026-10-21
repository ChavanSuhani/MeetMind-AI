import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingQueue: Array<() => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)))
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('mm_refresh_token')
        const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })

        localStorage.setItem('mm_access_token', data.access_token)
        localStorage.setItem('mm_refresh_token', data.refresh_token)

        pendingQueue.forEach((cb) => cb())
        pendingQueue = []

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('mm_access_token')
        localStorage.removeItem('mm_refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
