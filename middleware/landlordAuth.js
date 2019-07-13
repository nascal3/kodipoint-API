module.exports = function (req, res, next) {
    if (req.user.role !== 'landlord') return res.status(403).json({'Error':'Access denied, access level only for landlord users!'});
    next();
};
