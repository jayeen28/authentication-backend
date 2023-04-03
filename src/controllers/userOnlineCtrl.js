const { operations } = require('../db');

/**
 * Updates the online status of a user based on their socket connection.
 *
 * @async
 * @param {Object} socket - The socket object associated with the user.
 * @throws {Error} If there is an error retrieving or saving the user's online status.
 * @return {Promise<void>} Returns nothing.
 *
 */
const userOnlineCtrl = async (socket) => {
    try {
        const user = await operations.findOne({ table: 'user', key: { id: socket.user.id } });
        const clients = global.io.sockets.adapter.rooms.get(user.id) || new Set([]);
        user.online = user.status === 'offline' ? false : !!clients.size;
        if (socket.user.online !== user.online) {
            socket.user = await operations.save(user);
            return global.io.sockets.emit('onlineStatus', { userId: user.id, online: user.online });
        }
    }
    catch (e) {
        console.log(e);
    }
};

module.exports = userOnlineCtrl;