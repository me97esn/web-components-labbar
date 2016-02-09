'use strict';

console.log('starting server...')


require('colors');
const path = require('path');
const morgan = require('morgan');
const express = require('express');
const app = express();
const compression = require('compression')
const http = require('http').Server(app);

const api = require('./routes/api')


app.use('/api', api);
app.use(compression())

const socket = require('./socket')(http)


// Middlewares
// app.use(morgan('[:status] :method :url (:response-time ms)'));

// Host static information
app.use(express.static(path.join(__dirname, '../dist')));
// app.use(express.static(path.join(__dirname, '../app')));
// app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
// app.use('/bower_components', express.static(path.join(__dirname, '../bower_components')));

http.listen(process.env.PORT || 4000);

console.log('started server')
// // Start server
// app.listen(app.get('port'), function () {
//     console.log('server listening on port %s'.cyan, app.get('port'));
// });