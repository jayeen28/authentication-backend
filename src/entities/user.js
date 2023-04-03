const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const imgCtrl = require('../controllers/imgCtrl');
const createAllowed = new Set(['fullName', 'email', 'password', 'phone']);
const ownUpdateAllowed = new Set(['fullName', 'email', 'avatar', 'phone', 'bio', 'online', 'status']);
const updateAllowed = new Set(['fullName', 'email', 'avatar', 'phone', 'bio', 'role', 'active', 'shift']);

/**
 * Creates a new user in the database with the specified properties in the request body.
 * The 'role' property is automatically set to 'user', and the 'password' property is hashed using bcrypt.
 *
 * @param {Object} req - The request object containing the properties for the new user.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} The created user object, including the JWT token.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 */
const create = async ({ req, db }) => {
    try {
        const valid = Object.keys(req.body).every(k => createAllowed.has(k));
        if (!valid) return { status: 400, message: 'Bad request' };
        req.body.role = 'user';
        req.body.password = await bcrypt.hash(req.body.password, 8);
        const user = await db.create({ table: 'user', key: { ...req.body } });
        user.active = false;
        await db.save(user);
        return user;
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Logs in a user by finding their account in the database using their email, checking their password,
 * and creating a JSON Web Token for their session. Also saves the user's user agent information to the database.
 * @async
 * @param {Object} options - The options object.
 * @param {Object} options.req - The request object containing the user's email and password.
 * @param {Object} options.db - The database object used to find and save user information.
 * @returns {Object} The user object containing their account information and JWT token.
 * @throws {Error} If something goes wrong while finding or saving the user object in the database.
 */
const login = async ({ req, db }) => {
    try {
        const user = await db.findOne({ table: 'user', key: { email: req.body.email } });
        if (!user) return { status: 400, message: 'Bad request' };
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) return { status: 400, message: 'Bad request' };
        if (!user.active) return { status: 400, message: 'T:Account is deactive. Please contact your supervisor.' };
        user.token = jsonwebtoken.sign({ id: user._id.toString() }, process.env.SECRET);
        await db.save(user);
        return user;
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Retrieves the profile of the user with the specified ID.
 *
 * @param {Object} req - The request object containing the 'id' parameter.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} An object with the 'fullName', 'email', 'phone', and 'bio' properties of the user.
 * @throws {Error} If there is an error during the database operation.
 */
const profile = async ({ req, db }) => {
    try {
        let user = await db.findOne({ table: 'user', key: { id: req.params.id } });
        user = { avatar: user.avatar, role: user.role, fullName: user.fullName, email: user.email, phone: user.phone, bio: user.bio }
        return user || { status: 400, message: 'Bad request' };
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Logs out a user by removing their browser and push notification subscription information from the user object and saving it to the database.
 * @async
 * @param {Object} options - The options object.
 * @param {Object} options.req - The request object containing the user's notification and browser information.
 * @param {Object} options.db - The database object used to find and save user information.
 * @returns {Object} An object with the status code, message, and null token indicating a successful logout.
 * @throws {Error} If something goes wrong while finding or saving the user object in the database.
 */
const logout = async ({ req, db }) => {
    try {
        req.user.notifySubs = req.user.notifySubs.filter(({ endpoint }) => endpoint !== req.body.endpoint);
        await db.save(req.user);
        return { token: null, status: 200, message: 'Success' };
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong.');
    }
};

/**
 * Retrieves all users that match the specified query parameters.
 *
 * @param {Object} req - The request object containing the query parameters.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Array} An array of user objects that match the query.
 * @throws {Error} If there is an error during the database operation.
 */
const getAll = async ({ req, db }) => {
    try {
        const user = await db.find({ table: 'user', key: { query: { ...req.query, limit: 10 }, allowedQuery: new Set(['page', 'limit', 'sortBy', 'search']) } });
        return user || [];
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong');
    }
};

/**
 * Updates the authenticated user with the specified properties in the request body.
 * If the request includes an 'avatar' file, it is processed using the 'imgCtrl' function before being set as the user's 'avatar' property.
 *
 * @param {Object} req - The request object containing the properties to be updated and, optionally, the 'avatar' file.
 * @param {Object} db - The database object for interacting with the database.
 * @returns {Object} The updated user object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 */
const updateOwn = async ({ req, searchCtrl, db }) => {
    try {
        if (req.files?.avatar?.path) {
            if ((req.files.avatar.size || 0) > 1000000) return { status: 400, reason: 'T:Image size must be lower than 1mb' };
            req.body.avatar = await imgCtrl(req.files?.avatar.path);
        }
        const keys = Object.keys(req.body);
        const valid = keys.every(k => ownUpdateAllowed.has(k));
        if (!valid) return { status: 400, reason: 'Bad request' };
        if (keys.includes('status')) {
            global.io.sockets.emit('onlineStatus', { userId: req.user.id, online: req.body.status === 'online' });
            req.user.online = req.body.status === 'online';
        }
        keys.forEach(k => req.user[k] = req.body[k]);
        searchCtrl.remove('user', req.user.id);
        searchCtrl.insert('user', { id: req.user.id, fullName: req.user.fullName, email: req.user.email, phone: req.user.phone });
        return await db.save(req.user);
    }
    catch (e) {
        console.log(e)
        throw new Error('Something went wrong');
    }
};

/**
 * Update a user record in the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} db - A database client instance.
 * @return {Object} - An object with a status code and reason for unsuccessful updates, or the updated user object for successful updates.
 *
 * @throws {Error} - If there is an error processing the avatar file or interacting with the database.
 */
const update = async ({ req, db, searchCtrl }) => {
    try {
        if (req.files?.avatar?.path) req.body.avatar = await imgCtrl(req.files?.avatar.path);
        const keys = Object.keys(req.body);
        const valid = keys.every(k => updateAllowed.has(k));
        if (!valid) return { status: 400, reason: 'Bad request' };
        const user = await db.findOne({ table: 'user', key: { id: req.params.id } });
        if (!user) return { status: 404, reason: 'Bad request' };
        keys.forEach(k => user[k] = req.body[k]);
        searchCtrl.remove('user', user.id);
        searchCtrl.insert('user', { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone });
        return await db.save(user);
    }
    catch (e) {
        console.log(e)
        throw new Error('Something went wrong');
    }
};

/**
 * Function to handle the notification subscription process
 * @returns {Object} - An object containing the status code and message
 *
 * This function expects the request to contain a user object in the request 
 * with a property "notifySubs" and a "sub" object in the body of the request 
 * containing the subscription details like endpoint, keys, auth etc.
 *
 * It checks if the subscription already exists by matching the endpoint 
 * and if it doesn't exist, it adds the subscription to the user object's notifySubs array.
 *
 * It then saves the user object to the database and returns a success message.
 * If an error occurs, it throws an error message.
 */
const notifySub = async ({ req, db }) => {
    try {
        const subs = req.user.notifySubs;
        const index = subs.findIndex(s => s.endpoint === req.body.sub?.endpoint);
        if (index === -1) req.user.notifySubs.push(req.body.sub);
        await db.save(req.user);
        return { status: 200, message: 'success' };
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong');
    }
};

/**
 * Remove a user record from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} db - A database client instance.
 * @return {Object} - An object with a status code and reason for unsuccessful removals, or the removed user object for successful removals.
 *
 * @throws {Error} - If there is an error interacting with the database.
 */
const remove = async ({ req, db }) => {
    try {
        const user = await db.remove({ table: 'user', key: { id: req.params.id } });
        if (!user) return { status: 404, message: "Bad request" };
        searchCtrl.remove('user', user.id);
        return user;
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong');
    }
};

module.exports = { create, login, profile, getAll, updateOwn, update, remove, notifySub, logout };
