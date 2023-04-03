const { Router } = require('express');
const router = Router();
const rootPath = require('path');

/**
 * GET /v1/images/:path
 * @description Loads an Image with id.
 * @response {Binary} 200 - Image.
 */
router.get('/images/:path', async (req, res) => {
    try {
        const { path } = req.params;
        const root = rootPath.resolve();
        if (!path) return res.status(400).send({ status: 400, reason: 'Please provide the path' })
        res.status(200).sendFile(root + '/images/' + path);
    }
    catch (e) {
        res.status(500).send('Something went wrong.')
    }
});

module.exports = router;