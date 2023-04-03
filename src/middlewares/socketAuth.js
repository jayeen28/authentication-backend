const { decodeAuthToken } = require('../utils');
/**
 * This middleware is used for authorize the socketid if the connection comes with a authoriation token.
 * NOTE: It only works after login there is a function called "authenticateEvents" to authenticate the token after login.
 * @param {Object} socket The socket object. 
 * @param {Function} next Function to move forward
 */
module.exports = async (socket, next) => {
    try {
        const token = (socket.handshake?.headers?.cookie || '')?.split(';')?.find(s => s.includes('token='))?.split("=")[1] || (process.env.NODE_ENV === 'development' ? socket.handshake.headers['authorization']?.replace('Bearer ', '') : null);
        if (!token) throw new Error('Invalid token.');
        const user = await decodeAuthToken(token);
        if (!user) throw new Error('User not found with the provided token.');
        socket.token = token;
        socket.user = user;
        socket.join(user.id);
        next();
    }
    catch (e) {
        next(new Error("unauthorized"));
    };
};