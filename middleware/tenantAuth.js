module.exports = function (req, res, next) {
    if (req.user.role === 'tenant' || req.user.role === 'landlord' || req.user.role === 'landlordTenant' || req.user.role === 'admin'|| req.user.role === 'superU')
    next();
    else return res.status(403).json({'Error':'Access denied, access level only for tenant users!'});
};
