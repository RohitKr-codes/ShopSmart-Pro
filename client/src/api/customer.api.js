import api from './axios'
export const getCustomersAPI = (params) => api.get('/customers', { params })
export const getCustomerAPI = (id) => api.get(`/customers/${id}`)
export const createCustomerAPI = (data) => api.post('/customers', data)
export const updateCustomerAPI = (id, data) => api.put(`/customers/${id}`, data)
export const deleteCustomerAPI = (id) => api.delete(`/customers/${id}`)