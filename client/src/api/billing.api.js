import api from './axios'
export const getBillsAPI = (params) => api.get('/billing', { params })
export const getBillAPI = (id) => api.get(`/billing/${id}`)
export const createBillAPI = (data) => api.post('/billing', data)
export const deleteBillAPI = (id) => api.delete(`/billing/${id}`)
export const deleteMultipleBillsAPI = (ids) => api.delete('/billing/bulk', { data: { ids } })
export const downloadPDFAPI = (id) => api.get(`/billing/${id}/pdf`, { responseType: 'blob' })