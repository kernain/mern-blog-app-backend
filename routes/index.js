const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth.js'))
router.use('/post', require('./post.js'))

module.exports = router