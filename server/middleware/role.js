const requireOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Owner only.' });
  }
  next();
};

const requireStaffOrOwner = (req, res, next) => {
  if (!['owner', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

module.exports = { requireOwner, requireStaffOrOwner };