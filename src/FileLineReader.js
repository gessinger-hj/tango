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
	var n = 0 ;
 	new FileLineReader ( "../package.json" ).lines ( function onarray(line)
 	{
 		if ( line === null ) { return ; }
 		n++ ;
		console.log ( n + ":" + line ) ;
 	});
}
