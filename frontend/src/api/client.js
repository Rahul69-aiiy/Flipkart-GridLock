import axios from 'axios'

// In dev: Vite proxies /api → http://localhost:8000
// In prod: frontend is served by FastAPI itself, so /api is on the same origin
const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export const fetchSummary       = ()           => api.get('/summary').then((r) => r.data)
export const fetchHotspots      = (topN = 50)  => api.get('/hotspots', { params: { top_n: topN } }).then((r) => r.data)
export const fetchCIP           = (topN = 50)  => api.get('/cip', { params: { top_n: topN } }).then((r) => r.data)
export const fetchForecast      = (topN = 30)  => api.get('/forecast', { params: { top_n: topN } }).then((r) => r.data)
export const fetchConfidence    = ()           => api.get('/confidence').then((r) => r.data)
export const fetchOpportunities = (topN = 30)  => api.get('/opportunities', { params: { top_n: topN } }).then((r) => r.data)
export const fetchValueProof    = ()           => api.get('/value-proof').then((r) => r.data)
export const fetchStations      = ()           => api.get('/stations').then((r) => r.data)
export const fetchCoverage      = ()           => api.get('/coverage').then((r) => r.data)
export const postResourcePlan   = (officerHours)    => api.post('/plan/resource', { officer_hours: officerHours }).then((r) => r.data)
export const postTargetPlan     = (targetCoverage)  => api.post('/plan/target', { target_coverage: targetCoverage }).then((r) => r.data)
export const fetchHealth        = ()           => axios.get('/health', { timeout: 5000 }).then((r) => r.data).catch(() => null)

export default api
