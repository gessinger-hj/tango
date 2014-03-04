var Path = require ( "path" ) ;
var fs = require ( "fs" ) ;
var T = require ( "Tango" ) ;
var txml = require ( 'Xml' ) ;

/**
 *  @constructor
 *  @param {path|dom} id the id of an html element or
 *         the html dom element itself.
 */
File = function ( path, name )
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
/** */
File.prototype.toString = function()
{
	return this.path ;
};
/** */
File.prototype.getName = function()
{
	return Path.basename ( this.path ) ;
};
/** */
File.prototype.getParent = function()
{
	return Path.dirname ( this.path ) ;
};
/** */
File.prototype.getParentFile = function()
{
	return new File ( this.getParent() ) ;
};
/** */
File.prototype.getParentAbsolute = function()
{
	return fs.realpathSync ( Path.dirname ( this.path ) ) ;
};
/** */
File.prototype.asString = function()
{
	return fs.readFileSync ( this.path, 'utf8' ) ;
};
/** */
File.prototype.toBuffer = function()
{
	return fs.readFileSync ( this.path ) ;
};
/** */
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
/** */
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
/** */
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
/** */
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
/** */
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
/** */
File.prototype.length = function()
{
	return fs.statSync ( this.toString() ).size ;
};
/** */
File.prototype.lastModified = function()
{
	return fs.statSync ( this.toString() ).mtime.getTime() ;
};
/** */
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
/** */
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
/** */
File.prototype.getAbsolutePath = function()
{
	return fs.realpathSync ( this.toString() ) ;
};
/** */
File.prototype.getAbsoluteFile = function()
{
	var t1 = this.getAbsolutePath() ;
	if ( t1 ) return new File ( t1 ) ;
};
/** */
File.prototype.toXml = function ( elementCallback )
{
	var data = this.asString() ;
  var f = new txml.XmlFactory ( elementCallback ) ;
  return f.create ( data ) ;
};
/** */
File.prototype.toXmlResolved = function ( options )
{
	if ( ! options )
	{
		options = { includeTags: [ "xi:include" ] } ;
	}
	var m = [] ;
	var i ;
	if ( T.isArray ( options.includeTags ) )
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
/** */
File.prototype.ls = function ( pattern )
{
	return this._ls ( pattern ) ;
};
/** */
File.prototype.lsFiles = function ( pattern )
{
	return this._ls ( pattern, null, true ) ;
};
/** */
File.prototype.lsDirs = function ( pattern )
{
	return this._ls ( pattern, null, false, true ) ;
};
/** */
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
module.exports = File ;