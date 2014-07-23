var util = require ( "util" ) ;
var fs = require ( "fs" ) ;
var LineReader = require ( './LineReader' ) ;

/**
 * @constructor
 * @method FileLineReader
 * @param {} fileName
 */
var FileLineReader = function ( fileName )
{
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

module.exports = FileLineReader ;
