import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// ==============================
// REQUEST INTERCEPTOR
// ==============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ==============================
// RESPONSE INTERCEPTOR (AUTO REFRESH)
// ==============================
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')

        const res = await axios.post(
          process.env.NEXT_PUBLIC_API_URL + '/auth/refresh',
          {
            refresh_token: refreshToken,
          }
        )

        const newAccessToken = res.data.access_token

        localStorage.setItem('token', newAccessToken)

        // Auto Reconnect WebSocket after token refresh
        window.dispatchEvent(new Event('tokenRefreshed'))

        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)

        // 🔥 logout user if refresh fails
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'

        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api