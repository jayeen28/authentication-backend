const { reqCtrl } = require('../controllers');
const router = require('express').Router();
const { search } = require('../entities');
const { auth } = require('../middlewares');

router.get('/search/:from/:term', auth, reqCtrl(search));

module.exports = router;