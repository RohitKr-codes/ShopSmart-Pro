export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0)
}
export const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0)