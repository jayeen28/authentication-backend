const webPush = require('web-push');
const { operations } = require('../db');
webPush.setVapidDetails('mailto:md.jayeen@gmail.com', process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY);

/**
 * Function to launch the payload to the user's notifySubs
 * @param {Object} user - user object
 * @param {Object} payload - payload object
 * 
 * This function expects the user object to have a property "notifySubs" and payload object 
 * to have minimum 3 properties. It sends the notification to each notifySubs using webPush.sendNotification method 
 * and removes the notifySubs from the user object if it fails to send the notification.
 */
const launch = (user, payload) => {
    try {
        payload.icon = 'companylogo';
        (user.notifySubs || []).forEach(async (s, i) =>
            webPush.sendNotification(s, JSON.stringify(payload))
                .catch(e => {
                    // console.log('Push failed: ' + e.message);
                }));
    }
    catch (e) {
        console.log(e);
    }
};

/**
 * Function to ignite the payloads
 * @param {Object} options - options object
 * @param {string} options.user - user id
 * @param {Object} options.people - people object
 * @param {Array} options.people.role - array of roles
 * @param {Array} options.people.id - array of ids
 * @param {Object} options.payloads - payloads object
 * 
 * This function expects the payloads object to have at least one property. It sends the payloads to the user, 
 * roles and ids based on the options passed. It uses operations.find to fetch the user by id and role.
 * It also logs an error message if required parameters are not provided.
 */
const ignite = async ({ people = { role: [], id: [] }, query = {}, payloads = undefined } = {}) => {
    try {
        if (!payloads) return console.log('Please provide a payloads.')
        if (people.role?.length < 1 && people.id?.length < 1) return console.log("Please provide me peoples to fetch")
        const [roles = [], ids = []] = await Promise.all(Object.keys(people || {}).map(p => people[p].length > 0 && operations.find({
            table: 'user',
            key: { query: { [p]: { $in: people[p] }, ...query, online: true }, allowedQuery: new Set(['role', 'id', 'online']), paginate: false },
        })));
        roles.forEach(async p => launch(p, payloads.role));
        ids.forEach(async id => launch(id, payloads.id));
    }
    catch (e) { console.log(e) }
};

module.exports = { ignite, launch };

// ignite({ people: { role: ['admin'], id: ['63c7d4677d13be1a5a2698f6', '63c7d44e7d13be1a5a2698eb'] }, payloads: { role: { title: 'Big bang !', description: 'Yoo', icon: '' } } })