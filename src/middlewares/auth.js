const { decodeAuthToken } = require('../utils');
/**
 * This function is used to authenticate request.
 * After authetication it inserts the user data to reqest object.
 */
module.exports = async (req, res, next) => {
    try {
        const token = req.cookies?.token || (process.env.NODE_ENV === 'development' ? req.header('Authorization').replace('Bearer ', '') : null);
        const user = await decodeAuthToken(token);
        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate' });
    }
};