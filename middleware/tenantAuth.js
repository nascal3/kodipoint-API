module.exports = function (req, res, next) {
    if (req.user.role !== 'tenant') return res.status(403).json({'Error':'Access denied, access level only for tenant users!'});
    next();
};
