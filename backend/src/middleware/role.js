// Ensures the current user has one of the required roles
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User context missing. Are you authenticated?' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission for this action' });
  }

  return next();
};