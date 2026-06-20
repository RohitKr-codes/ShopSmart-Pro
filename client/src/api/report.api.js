import api from './axios'
export const getSalesReportAPI = (params) => api.get('/reports/sales', { params })
export const getProductReportAPI = (params) => api.get('/reports/products', { params })
export const exportCSVAPI = (params) => api.get('/reports/export', { params, responseType: 'blob' })