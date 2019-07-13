module.exports = function (req, res, next) {
    if (req.user.role !== 'landlord/tenant') return res.status(403).json({'Error':'Access denied, access level only for tenant or landlord users!'});
    next();
};
