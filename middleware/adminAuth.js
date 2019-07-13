module.exports = function (req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({'Error':'Access denied, access level only for admin users!'});
    next();
};
