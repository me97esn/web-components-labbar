// @if NODE_ENV='dev'
module.exports ={
	restApi: 'http://192.168.1.147:4000/api',
	ws: 'http://192.168.1.147:4000'
}
// @endif 

// @if NODE_ENV='prod'
module.exports ={
	restApi: '/api',
	ws: `https://${document.location.hostname}:${document.location.port}`	
}
// @endif 
