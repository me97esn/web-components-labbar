'use strict'
let settings = require('scripts/settings.js')
const socket = io(settings.ws);

socket.on('connect', function() {
	console.log('connected')
});

socket.on('event', function(data) {});
socket.on('disconnect', function() {});
let userId;


module.exports = socket;
