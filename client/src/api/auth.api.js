import api from './axios'
export const loginAPI = (data) => api.post('/auth/login', data)
export const registerAPI = (data) => api.post('/auth/register', data)
export const getMeAPI = () => api.get('/auth/me')
export const updateProfileAPI = (data) => api.put('/auth/profile', data)
export const changePasswordAPI = (data) => api.put('/auth/change-password', data)