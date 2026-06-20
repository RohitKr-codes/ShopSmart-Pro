import api from './axios'
export const getProductsAPI = (params) => api.get('/products', { params })
export const getProductAPI = (id) => api.get(`/products/${id}`)
export const createProductAPI = (data) => api.post('/products', data)
export const updateProductAPI = (id, data) => api.put(`/products/${id}`, data)
export const deleteProductAPI = (id) => api.delete(`/products/${id}`)
export const getCategoriesAPI = () => api.get('/products/categories')
export const createCategoryAPI = (data) => api.post('/products/categories', data)