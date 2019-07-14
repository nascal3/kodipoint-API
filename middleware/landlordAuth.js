module.exports = function (req, res, next) {
    console.log('>>>',req.user.role);
    if (req.user.role === 'landlord' || req.user.role === 'landlord/tenant' || req.user.role === 'admin'|| req.user.role === 'super')
    next();
    else return res.status(403).json({'Error':'Access denied, access level only for landlord users!'});
};
