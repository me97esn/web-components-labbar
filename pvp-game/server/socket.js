'use strict';

const r = require('rethinkdb');
require('colors')
const battle = require('./routes/battle')
let io;

const db = require('./build/db')
const jwt = require('jsonwebtoken')

let connection

db.connect()
	.then(_connection => {
		connection = _connection
	})

const dbName = db.dbName

function addUsers(_battle) {
	return new Promise((resolve, reject) => {
		if (_battle.users) {
			r.db(dbName).table('users').getAll(..._battle.users).run(connection, (err3, cursor2) => {
				if (err3) reject(err3)

				if (cursor2) {
					cursor2.toArray().then((_users) => {
						_battle.users = _users;
						resolve(_battle)
					})
				}
			})
		}
	})

}

db.connect().then(connection => {
	r.db(dbName).table('battles').changes().run(connection, function(err, cursor) {
		if (err) console.error(err);

		cursor.each(function(err2, data) {
			if (err2) console.error(err)

			// updated battle, 
			if (data.new_val && data.old_val) {
				// Emit the changed battle only to the users in the battle
				console.log('battle changed'.cyan, data.old_val, data.new_val)

				addUsers(data.new_val)
					.then(_battle => io.to(_battle.id).emit('battlesChanged', _battle))
					.catch(e => console.error(e))

				// Changes can't handle joins
			}

			// new battle
			if (data.new_val && !data.old_val) {
				console.log('battle created'.cyan)

				io.sockets.emit("newBattle", data.new_val);
			}
		});
	})
})


module.exports = function(http) {
	io = require('socket.io')(http);
	io.on('connection', function(socket) {
		
		const assertAuthenticated = function() {
			if (!socket.userInfo) {
				console.error('User not authenticated, cannot handle message'.red)
				socket.emit('an error occured', 'User not authenticated')
				socket.disconnect()
			}
		}


		socket.on('disconnect', function() {
			if (socket.userInfo && socket.userInfo.userChanges) {
				console.log('user disconnected, close the changes feed'.green);
				socket.userInfo.userChanges.close();
			}
		});

		socket.on('authenticate', (data) => {
			console.log('user authenticated'.green)
			jwt.verify(data.token, process.env.secret, function(err, decoded) {
				if (err) {
					socket.emit('an error occured', 'could not verify token. You are not doing anything shady, are you?')
					return
				}

				socket.userInfo = {
					userId: decoded
				}

				socket.emit('userId', decoded)
			});
		})

		socket.on('joinBattle', function(battleId) {
			assertAuthenticated();
			console.log(`a user joined battle ${battleId}`.yellow)
			socket.join(battleId)
			socket.battleId = battleId
			battle.joinBattle(battleId, socket.userInfo.userId);

			// listen for any changes for this user and tell every user in this battle about them
			r.db(dbName)
				.table('users')
				.get(socket.userInfo.userId)
				.changes()
				.run(connection, function(err, cursor) {
					if (err) socket.emit('an error occured', err);

					console.log('created user changes for this user'.green)
					socket.userInfo.userChanges = cursor;

					cursor.each(function(err2, data) {
						if (err) console.error('error', err2)
						io.to(battleId).emit('userChanged', data.new_val)
					})
				})

			// emit the users since often they won´t change, and therefor will not be handled by the changes listener
			r.db(dbName).table('battles').get(battleId).run(connection, function(err, _battle) {
				if (err) console.warn('could not get battle to read the users. So the user will not see the users until they change.')
				if (_battle) {
					addUsers(_battle)
						.then(_battle => io.to(_battle.id).emit('battlesChanged', _battle))
						.catch(e => console.error(e))
				}

			})
		})

		socket.on('location', function(options) {
			assertAuthenticated()
			console.log('location received')
			r.db(dbName).table('users').get(socket.userInfo.userId).run(connection, function(err, user) {
				if (err) {
					socket.emit('an error occured', err)
				}

				const location = {
					coords: r.point(options.location.coords.longitude, options.location.coords.latitude),
					accuracy: options.location.coords.accuracy,
					altitude: options.location.coords.altitude
				};

				user.location = location

				r.db(dbName).table('users').update(user).run(connection, function(err2, cursor) {
					if (err) {
						socket.emit('an error occured', err)
					}
				})
			})
		})

		socket.on('shoot', function(options) {
			assertAuthenticated()
			console.log('user', socket.userInfo.userId)
			console.log('shooting', options)
		})
	});
}