var util = require ( "util" ) ;
var fs = require ( "fs" ) ;
var LineReader = require ( './LineReader' ) ;

/**
 * @constructor
 * @param {} fileName
 */
var FileLineReader = function ( fileName )
{
	this.fileName = fileName ;
	var options =
	{
		flags: 'r'
	, encoding: "utf8"
	, fd: null
	, autoClose: true
	} ;
	var rs = fs.createReadStream ( fileName, options ) ;
  LineReader.call ( this, rs ) ;
}
util.inherits ( FileLineReader, LineReader ) ;

/**
 * Description
 * @param {} callback
 * @return lr
 */
FileLineReader.prototype.lines = function ( callback )
{
	if ( callback )
	{
		var thiz = this ;
		this.on ( "end", function()
		{
			callback.call ( thiz, null ) ;
		});
		this.on ( "line", function ( line )
		{
			callback.call ( thiz, line ) ;
		});
	}
	return this ;
};
module.exports = FileLineReader ;
if ( require.main === module )
{
 	new FileLineReader ( "../package.json" ).lines ( function onarray(line)
 	{
 console.log ( "line=" + line ) ;
 	});
// 	var start = 0 ;
// 	var end = -1 ;
// 	var file = new File ( "x.log" ) ;
// 	function read()
// 	{
// 		var opt = {} ;
// 		opt.start = start ;
// 		opt.end = file.length() ;
// 		var str = fs.createReadStream ( file.path, opt ) ;
// 		str.on ( "data", function ondata(data)
// 		{
// console.log ( "data=" + data ) ;
// 		} ) ;
// 		str.on ( "end", ) ;
// 	}
}
