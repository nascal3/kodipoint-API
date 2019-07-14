module.exports = function (req, res, next) {
    if (req.user.role === 'admin' || req.user.role === 'super')
    next();
    else return res.status(403).json({'Error':'Access denied, access level only for admin users!'});
};
