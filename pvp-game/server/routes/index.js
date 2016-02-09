'use strict';

var app = require('express').Router();

module.exports = function (backendUrl) {
    app.use('/', require('./api'));

    return app;
}