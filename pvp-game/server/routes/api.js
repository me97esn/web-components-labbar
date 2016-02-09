'use strict';

const express = require('express');

const router = express.Router();
const allowCrossDomain = require('../middlewares/allowcors')
router.use(allowCrossDomain);
const battle = require('./battle')
const user = require('./user')

router.use('/battle', battle);
router.use('/user', user);

module.exports = router