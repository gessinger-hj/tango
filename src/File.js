var Path = require ( "path" ) ;
var fs = require ( "fs" ) ;
var util = require ( "util" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var stream = require('stream');

var FileLineReader = require ( './FileLineReader' ) ;

/**
 *  @constructor
 *  @param {path|dom} id the id of an html element or
 *         the html dom element itself.
 * @method File
 * @param {} path
 * @param {} name
 */
var File = function ( path, name )
{
	if ( path instanceof File )
	{
		path = path.toString() ;
	}
	this.path = path ;
	if ( name )
	{
		this.path += "/" + name ;
	}
	if ( ! this.path )
	{
		this.path = process.cwd() ;
	}
	this.path = Path.normalize ( this.path ) ;
};
/**
 * Description
 * @method toString
 * @return MemberExpression
 */
File.prototype.toString = function()
{
	return this.path ;
};
/**
 * Description
 * @method getName
 * @return CallExpression
 */
File.prototype.getName = function()
{
	return Path.basename ( this.path ) ;
};
/**
 * Description
 * @method getParent
 * @return CallExpression
 */
File.prototype.getParent = function()
{
	return Path.dirname ( this.path ) ;
};
/**
 * Description
 * @method getParentFile
 * @return NewExpression
 */
File.prototype.getParentFile = function()
{
	return new File ( this.getParent() ) ;
};
/**
 * Description
 * @method getParentAbsolute
 * @return CallExpression
 */
File.prototype.getParentAbsolute = function()
{
	return fs.realpathSync ( Path.dirname ( this.path ) ) ;
};
/**
 * Description
 * @method asString
 * @return CallExpression
 */
File.prototype.asString = function()
{
	return fs.readFileSync ( this.path, 'utf8' ) ;
};
/**
 * Description
 * @method toBuffer
 * @return CallExpression
 */
File.prototype.toBuffer = function()
{
	return fs.readFileSync ( this.path ) ;
};
/**
 * Description
 * @method getWriteStream
 * @param {} enc
 * @param {} mode
 * @return CallExpression
 */
File.prototype.getWriteStream = function ( enc, mode )
{
	if ( ! enc && enc !== null ) enc = "utf8" ;
	if ( !enc ) enc = null ;
	if ( mode )
	{
		return fs.createWriteStream ( this.path, { encoding: enc, flags: mode } ) ;
	}
	return fs.createWriteStream ( this.path, { encoding: enc } ) ;
};
/**
 * Description
 * @method getCharStream
 * @return CallExpression
 */
File.prototype.getCharStream = function()
{
	return this._getReadStream ( "utf8" ) ;
}
/**
 * Description
 * @method getBinaryStream
 * @return CallExpression
 */
File.prototype.getBinaryStream = function()
{
	return this._getReadStream ( null ) ;
}
;
File.prototype._getReadStream = function ( enc )
{
	if ( ! enc ) enc = null ;
	var options =
	{
		flags: 'r'
	, encoding: enc
	, fd: null
	, autoClose: true
	} ;
	return fs.createReadStream ( this.path, options ) ;
};
/**
 * Description
 * @method write
 * @param {} o
 * @param {} enc
 */
File.prototype.write = function ( o, enc )
{
	if ( ! o )
	{
		var ws = this.getWriteStream() ;
		ws.end() ;
		return ;
	}
	if ( typeof o === 'string' )
	{
		var ws = this.getWriteStream() ;
		ws.write ( o ) ;
		ws.end() ;
		return ;
	}
	if ( o instanceof Buffer )
	{
		var ws = this.getWriteStream ( null ) ;
		ws.write ( o ) ;
		ws.end() ;
		return ;
	}
	if ( typeof o.toWriteStream === 'function' )
	{
		var ws = this.getWriteStream() ;
		o.toWriteStream ( ws ) ;
		ws.end() ;
		return ;
	}
};
/**
 * Description
 * @method stat
 * @return CallExpression
 */
File.prototype.stat = function()
{
	return fs.statSync ( this.toString() ) ;
};
/*
stats.isFile()
stats.isDirectory()
stats.isBlockDevice()
stats.isCharacterDevice()
stats.isSymbolicLink() (only valid with fs.lstat())
stats.isFIFO()
stats.isSocket()
*/
/**
 * Description
 * @method exists
 */
File.prototype.exists = function()
{
	try
	{
		var st = fs.statSync ( this.toString() ) ;
		return true ;
	}
	catch ( exc )
	{
		return false ;
	}
};
/**
 * Description
 * @method isSymbolicLink
 */
File.prototype.isSymbolicLink = function()
{
	try
	{
		return fs.lstatSync ( this.toString() ).isSymbolicLink() ;
	}
	catch ( exc )
	{
		return false ;
	}
};
/**
 * Description
 * @method length
 * @return MemberExpression
 */
File.prototype.length = function()
{
	return fs.statSync ( this.toString() ).size ;
};
/**
 * Description
 * @method lastModified
 * @return CallExpression
 */
File.prototype.lastModified = function()
{
	return fs.statSync ( this.toString() ).mtime.getTime() ;
};
/**
 * Description
 * @method isFile
 */
File.prototype.isFile = function()
{
	try
	{
		return fs.statSync ( this.toString() ).isFile() ;
	}
	catch ( exc )
	{
		return false ;
	}
};
/**
 * Description
 * @method isDirectory
 */
File.prototype.isDirectory = function()
{
	try
	{
		return fs.statSync ( this.toString() ).isDirectory() ;
	}
	catch ( exc )
	{
		return false ;
	}
};
/**
 * Description
 * @method getAbsolutePath
 * @return CallExpression
 */
File.prototype.getAbsolutePath = function()
{
	return fs.realpathSync ( this.toString() ) ;
};
/**
 * Description
 * @method getAbsoluteFile
 */
File.prototype.getAbsoluteFile = function()
{
	var t1 = this.getAbsolutePath() ;
	if ( t1 ) return new File ( t1 ) ;
};
/**
 * Description
 * @method toXml
 * @param {} elementCallback
 * @return CallExpression
 */
File.prototype.toXml = function ( elementCallback )
{
	var data = this.asString() ;
	var xml = require ( 'Xml' ) ;
  var f = new xml.XmlFactory ( elementCallback ) ;
  return f.create ( data ) ;
};
/**
 * Description
 * @method toXmlResolved
 * @param {} options
 * @return xmlTree
 */
File.prototype.toXmlResolved = function ( options )
{
	if ( ! options )
	{
		options = { includeTags: [ "xi:include" ] } ;
	}
	var m = [] ;
	var i ;
	if ( Array.isArray ( options.includeTags ) )
	{
		var a = options.includeTags ;
		var len = a.length ;
		for ( i = 0 ; i < len ; i++ )
		{
			m[a[i]] = true ;
		}
	}
  var includeList = [] ;
  var xmlTree = this.toXml ( function ( x )
	{
	  if ( m[x.getName()] )
	  {
	    includeList.push ( x ) ;
	  }
	} ) ;
	for ( var i = 0 ; i < includeList.length ; i++ )
	{
		this._toXmlResolved ( m, null, includeList[i] ) ;
	}
	includeList.length = 0 ;
	return xmlTree ;
};
File.prototype._toXmlResolved = function ( includeTagNameMap, variablesMap, includeElement )
{
  var includeList = [] ;

  var href = includeElement.getAttribute ( "href" ) ;
  if ( ! href ) return ;
  var file = new File ( this.getParent(), href ) ;
  var elem = file.toXml ( function ( x )
	{
	  if ( includeTagNameMap[x.getName()] )
	  {
	    includeList.push ( x ) ;
	  }
	} ) ;
  includeElement.replace ( elem ) ;

	for ( var i = 0 ; i < includeList.length ; i++ )
	{
		this._toXmlResolved ( includeTagNameMap, variablesMap, includeList[i] ) ;
	}
	includeList.length = 0 ;
};
/**
 * Description
 * @method ls
 * @param {} pattern
 * @return CallExpression
 */
File.prototype.ls = function ( pattern )
{
	return this._ls ( pattern ) ;
};
/**
 * Description
 * @method lsFiles
 * @param {} pattern
 * @return CallExpression
 */
File.prototype.lsFiles = function ( pattern )
{
	return this._ls ( pattern, null, true ) ;
};
/**
 * Description
 * @method lsDirs
 * @param {} pattern
 * @return CallExpression
 */
File.prototype.lsDirs = function ( pattern )
{
	return this._ls ( pattern, null, false, true ) ;
};
/**
 * Description
 * @method lsRegExp
 * @param {} pattern
 * @param {} filesOnly
 * @param {} dirsOnly
 * @return CallExpression
 */
File.prototype.lsRegExp = function ( pattern, filesOnly, dirsOnly )
{
	var r = new RegExp ( pattern ) ;
	return this._ls ( null, r, filesOnly, dirsOnly ) ;
};
File.prototype._ls = function ( pattern, regexp, filesOnly, dirsOnly )
{
	if ( ! this.isDirectory() )
	{
		throw "Not a directory: " + this ;
	}
	var i ;
	var a = fs.readdirSync ( this.toString() ) ;
	var list = [] ;
	if ( pattern || regexp )
	{
		var r ;
		if ( regexp )
		{
			r = regexp ;
		}
		else
		{
			pattern = pattern.replace ( /\./g, "\\." ).replace ( /\*/g, ".*" ).replace ( /\?/g, "." ) ;
			r = new RegExp ( pattern ) ; //,modifiers)
		}
		if ( filesOnly || dirsOnly )
		{
			for ( var i = 0 ; i < a.length ; i++ )
			{
				if ( r.test ( a[i] ) )
				{
					if ( filesOnly )
					{
						if ( ! fs.statSync ( a[i] ).isFile() ) continue ;
					}
					if ( dirsOnly )
					{
						if ( ! fs.statSync ( a[i] ).isDirectory() ) continue ;
					}
					list.push ( this.path + Path.sep + a[i] ) ;
				}
			}
		}
		else
		{
			for ( var i = 0 ; i < a.length ; i++ )
			{
				if ( r.test ( a[i] ) )
				{
					list.push ( this.path + Path.sep + a[i] ) ;
				}
			}
		}
		a.length = 0 ;
		return list ;
	}
	if ( filesOnly || dirsOnly )
	{
		for ( var i = 0 ; i < a.length ; i++ )
		{
			if ( filesOnly )
			{
				if ( ! fs.statSync ( a[i] ).isFile() ) continue ;
			}
			if ( dirsOnly )
			{
				if ( ! fs.statSync ( a[i] ).isDirectory() ) continue ;
			}
			list.push ( this.path + Path.sep + a[i] ) ;
		}
		a.length = 0 ;
		return list ;
	}
	else
	{
		for ( var i = 0 ; i < a.length ; i++ )
		{
			a[i] = this.path + Path.sep + a[i] ;
		}
		return a ;
	}
};
/**
 * Description
 * @method visit
 * @param {} visitor
 * @return void
 */
File.prototype.visit = function ( visitor )
{
  if ( visitor.visitDirectory ( this ) )
  {
    this._visit ( this, visitor ) ;
  }
};
File.prototype._visit = function ( thisFile, visitor )
{
  var list = thisFile.ls() ;
  if ( ! list.length ) return ;
  var i ;

  for ( i = 0 ; i < list.length ; i++ )
  {
    var f = new File ( list[i] ) ;
    if ( f.isDirectory() )
    {
      if ( visitor.visitDirectory ( f ) )
      {
        this._visit ( f, visitor ) ;
      }
    }
    else
    {
      if ( ! visitor.visitFile ( f ) ) break ;
    }
  }
  return ;
};
/**
 * Description
 * @method renameTo
 * @param {} newName
 * @return void
 */
File.prototype.renameTo = function ( newName )
{
	if ( newName instanceof File )
	{
		fs.renameSync ( this.path, newName.toString() ) ;
	}
	else
	{
		fs.renameSync ( this.path, newName ) ;
	}
};
/**
 * Description
 * @method remove
 * @return void
 */
File.prototype.remove = function()
{
	try
	{
		fs.unlinkSync ( this.path ) ;
	}
	catch ( exc )
	{
		// console.log ( exc ) ;
	}
};
/**
 * Description
 * @method lines
 * @param {} callback
 * @return lr
 */
File.prototype.lines = function ( callback )
{
	var lr = new FileLineReader ( this.path ) ;
	if ( callback )
	{
		var thiz = this ;
		lr.on ( "end", function()
		{
			callback.call ( thiz, null ) ;
		});
		lr.on ( "line", function ( line )
		{
			callback.call ( thiz, line ) ;
		});
	}
	return lr ;
};
/**
 * Description
 * @method toJson
 * @return o
 */
File.prototype.toJson = function()
{
  var str = fs.readFileSync ( this.path, 'utf8' ) ;
  var o = JSON.parse ( str ) ;
  return o ;
};

module.exports = File ;
if ( require.main === module )
{
// 	var CsvReader = require ( "CsvReader" ) ;
// 	var csvr = new CsvReader ( new File ( "x.csv" ).lines() ) ;
// 	csvr.on ( "array", function onarray(a)
// 	{
// console.log ( a ) ;
// 	});

	new File ( "User.js" ).lines ( function onarray(line)
	{
console.log ( "line=" + line ) ;
	});
}
