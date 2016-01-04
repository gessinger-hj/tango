//https://github.com/then/promise
// var Promise = require('promise') ;
// var Promise = require('q').Promise ;

var File = require ( "File" ) ;
var fs = require ( "fs" ) ;
var T = require ( "Tango" ) ;
var User = require ( "User" ) ;
var LogFile = require ( "LogFile" ) ;

if ( typeof Promise === 'undefined' )
{
  Promise = require ( "promise" ) ;
}

// var promise = Promise(function (resolve, reject) {
// 	resolve ( new User ( "gess", 11, "*****" ) ) ;
// });
// promise.then ( function ( a )
// {
// 	console.log ( "1 --------------promise.then------------" ) ;
// 	console.log ( "a=" + a ) ;
// 	return Promise.resolve("DDDDDDDD") ;
// }
// , function ( a )
// {
// 	console.log ( "2 --------------promise.then------------" ) ;
// 	console.log ( "a=" + a ) ;
// }
// ).then ( function ( a )
// {
// 	console.log ( "B 1 --------------promise.then------------" ) ;
// 	console.log ( "a=" + a ) ;
// }
// , function ( a )
// {
// 	console.log ( "B 2 --------------promise.then------------" ) ;
// 	console.log ( "a=" + a ) ;
// }
// );
// return ;

var promise = new Promise(function (resolve, reject) {
	fs.readFile ( "Xr.txt", 'utf8', function(err,res)
	{
console.log ( "0 --------------------------" ) ;
		if ( err ) reject ( err ) ;
		else resolve ( res ) ;
	});
});
promise
.then(function (fileContent,pp)
{
	console.log ( "1 -----------------" ) ;
	console.log ( "pp=" + pp ) ;
	console.log ( "XXXX" + fileContent.toString() ) ;
}
,function(p)
{
	console.log ( "2 -----------------" ) ;
	throw new Error ( p ) ;
})
.catch ( function(p)
{
	console.log ( "3 -----------------" ) ;
	console.log ( "--------catch---------" ) ;
	console.log ( "p=" + p ) ;
	LogFile.log ( p ) ;
})
// .done(function(p)
// {
// 	console.log ( "4 -----------------" ) ;
// })
  ;

// var read = Promise.denodeify(require('fs').readFile)

// console.log ( read ) ;
// read('Xr.txt', 'utf8')
//   .then(function (fileContent) {
//   	console.log ( fileContent.toString() ) ;
//   }
//   ,function(p)
//   {
//   	console.log ( "rejected ???" ) ;
//   }).catch ( function(p)
//   {
//   	console.log ( "--------catch---------" ) ;
//   	console.log ( "p=" + p ) ;
//   	T.log ( p ) ;
//   }).done(function(p)
//   {
//   })