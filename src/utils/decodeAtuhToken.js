const { operations } = require('../db');
const jwt = require('jsonwebtoken');

/**
 * This function is used for decoding auth token.
 * @param {String} token The token to decode.
 * @returns returns the decoded user found in database.
 */
module.exports = async token => {
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await operations.findOne({ table: 'user', key: { id: decoded.id } });
        if (!user) throw new Error('user not found');
        return user;
    }
    catch (e) {
        throw e;
    }
};