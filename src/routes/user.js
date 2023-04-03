const { reqCtrl } = require('../controllers');
const router = require('express').Router();
const { user: { create, getAll, profile, updateOwn, update, remove, notifySub, logout, login } } = require('../entities');
const { auth, checkRole } = require('../middlewares');

/**
 * POST /v1/user
 * @description Create an user
 * @response {Object} 200 - The created user
 */
router.post('/user', reqCtrl(create));

/**
 * POST /v1/user
 * @description Log in a user.
 * @response {Object} 200 - success response.
 */
router.post('/user/login', reqCtrl(login))

/**
 * GET /v1/user
 * @description Get all user
 * @response {Array} 200 - All user data
 */
router.get('/user', auth, checkRole(['owner', 'admin']), reqCtrl(getAll));

/**
 * GET /v1/user/me
 * @description Get my own profile
 * @response {Object} 200 - My profile data
 */
router.get('/user/me', auth, async (req, res) => res.status(200).send(req.user));

/**
 * GET /v1/profile/:id
 * @description Get user's profile
 * @response {Object} 200 - The found data.
 */
router.get('/user/profile/:id', auth, reqCtrl(profile))

/**
 * PATCH /v1/user/me
 * @description Update a user with ID
 * @response {Object} 200 - Update an user which is found with ID
 */
router.patch('/user/me', auth, reqCtrl(updateOwn));

/**
 * PATCH /v1/user/notifysub
 * @description Update notification subscription if needed.
 * @response {Object} 200 - Success response.
 */
router.patch('/user/notifysub', auth, reqCtrl(notifySub));

/**
 * PATCH /v1/user/:id
 * @description Find a user with id and update.
 * @response {Object} 200 - The udpated user.
 */
router.patch('/user/:id', auth, checkRole(['admin', 'owner']), reqCtrl(update));

/**
 * DELETE /v1/user/:id
 * @description Delete a user with ID
 * @response {Object} 200 - Delete an user which is found with ID
 */
router.delete('/user/:id', reqCtrl(remove));

/**
 * POST /v1/user/logout
 * @description Logout from current device
 * @response {Object} 200 - Nothing
 */
router.post('/user/logout', auth, reqCtrl(logout));

module.exports = router;