module.exports = function (req, res, next) {
    if (req.user.role !== 'superU') return res.status(403).json({'Error':'Access denied, access level only for super users!'});
    next();
};
