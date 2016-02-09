'use strict';

const r = require('rethinkdb');
const RedisSMQ = require("rsmq");


const options = {
	host: 'localhost',
	port: 28015
}

const dbName = 'test'


var fs = require('fs');

function connect() {
	return new Promise((resolve, reject) => {
		let connection = null;
		fs.readFile('server/compose_cacert', function(err, caCert) {
			if (err) {
				console.error('error', err)
			}

			if(options.ssl && options.ssl.ca){
				options.ssl.ca = caCert
			}

			r.connect(options, function(error, conn) {
				if (err) throw err;
				connection = conn;
				resolve(connection)
			})
		});
	})
}


module.exports = {
	connect,
	dbName
}