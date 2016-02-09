'use strict';

const express = require('express');
const r = require('rethinkdb');

const router = express.Router();
let bodyParser = require('body-parser')
router.use(bodyParser.json())
const allowCrossDomain = require('../middlewares/allowcors')
router.use(allowCrossDomain);

const jwt = require('jsonwebtoken')

let connection
const db = require('../build/db')
const dbName = db.dbName
const generateName = require('sillyname');

db.connect()
	.then(_connection => connection = _connection)
	.catch(e => console.error(e))

router.post('/', function(req, res) {
	req.body.name = generateName();
	console.log(`inserting a user ${req.body.name} into ${dbName}`)

	r.db(dbName).table('users').insert(req.body).run(connection, function(err, result) {
		if (err) throw err;
		console.log('user created')

		console.log(`sign "${result.generated_keys[0]}" with a secret of length ${process.env.secret.length}`)

		if(!process.env.secret){
			console.error('No secret variable set!')
		}

		const token = jwt.sign(result.generated_keys[0], process.env.secret)
		res.json(token);
	})

})

router.get('/:id/battles', function(req, res) {
	res.json({
		1: 2
	})

})

module.exports = router