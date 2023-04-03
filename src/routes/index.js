const router = require('express').Router();
const user = require('./user');
const image = require('./image');
const search = require('./search');

const v1 = [
    user,
    image,
    search
];

module.exports = router.use('/v1', v1);