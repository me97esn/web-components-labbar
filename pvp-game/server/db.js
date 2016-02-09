'use strict';

const r = require('rethinkdb');
const RedisSMQ = require("rsmq");

// @if NODE_ENV='prod'
const options = {
	host: 'aws-us-east-1-portal.9.dblayer.com',
	port: 10353,
	authKey: process.env.authkey,
	ssl: {
		ca: true
	}
}

const dbName = 'killemall'

// @endif 

// @if NODE_ENV='dev'
const options = {
	host: 'localhost',
	port: 28015
}

const dbName = 'test'

// @endif 

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