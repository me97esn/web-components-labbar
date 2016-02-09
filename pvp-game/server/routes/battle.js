'use strict';

const express = require('express');
const r = require('rethinkdb');
require('colors')
const router = express.Router();
let bodyParser = require('body-parser')
router.use(bodyParser.json())
const allowCrossDomain = require('../middlewares/allowcors')
router.use(allowCrossDomain);
const moment = require('moment')
let connection
const db = require('../build/db')
var queue = require('queue');

const dbName = db.dbName

db.connect()
	.then(_connection => {
		connection = _connection
	})
	.catch(e => {throw e})


var q = queue();

function joinBattle(battleId, userId) {
	console.log(`add the user ${userId} to the battle ${battleId}`.yellow)
	q.push(
		function(cb) {
			r.db(dbName).table('battles').get(battleId).run(connection, function(err, _battle) {
				if (err) {
					console.warn('An error occured when handling message. Ignore it.', err)
					cb()
					return
				}

				// if (!_battle) {
				// 	console.error(`No battle with id ${battleId} found? Why?`)
				// 	next()
				// 	return
				// }

				_battle.users = _battle.users || []

				if (_battle.users.indexOf(userId) < 0) {
					_battle.users.push(userId)
				}

				r.db(dbName).table('battles').update(_battle).run(connection, function(updateErr, updateResult) {
					if (updateErr) throw updateErr;
					cb();
				});
			})
		}
	)
	q.start()

}

// All active battles
router.get('/', function(req, res) {
	r.db(dbName).table("battles")
		.filter(r.row("battleEnds").gt(new Date())).run(connection, function(err, cursor) {
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				res.json(result)
			});
		});
});


// create a battle
router.post('/', function(req, res) {
	let battle = req.body;
	battle.battleEnds = moment(battle.battleEnds).toDate()
	r.db(dbName).table('battles').insert(battle).run(connection, function(err, result) {
		if (err) throw err;
		console.log(JSON.stringify(result, null, 2));
		res.json(result)
	})
})

module.exports = router
module.exports.joinBattle = joinBattle
module.exports.get = function(id) {
	return new Promise((resolve, reject) => {
		r.db(dbName).table("battles").get(id).run(connection, function(err, battle) {
			if (err) throw err;
			if (battle.users) {
				r.db(dbName).table('users').getAll(...Object.keys(battle.users))
					.then(cursor => cursor.toArray())
					.then(users => users.forEach(user => battle.user.name = user.name))
					.then(resolve)
					.error(err3 => {
						throw err3
					})
			}
		})
	})

}