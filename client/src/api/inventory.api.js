import api from './axios'
export const getLowStockAPI = () => api.get('/inventory/low-stock')
export const updateStockAPI = (data) => api.post('/inventory/update-stock', data)
export const getInventoryLogsAPI = (params) => api.get('/inventory/logs', { params })