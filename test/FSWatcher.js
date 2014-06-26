/*
     0 -rw-rw-r-- 1 ciss vge         0 Jun 25 12:52 rating.zone.rul.tmp
     0 -rw-rw-r-- 1 ciss vge         0 Jun 25 12:52 rating.time_zone.rul.tmp
     0 -rw-rw-r-- 1 ciss vge         0 Jun 25 12:52 rating.service.rul.tmp
     0 -rw-rw-r-- 1 ciss vge         0 Jun 25 12:52 rating.product.rul.tmp
     0 -rw-rw-r-- 1 ciss vge         0 Jun 25 12:52 rating.guiding.rul.tmp
 13220 -rw-rw-r-- 1 ciss vge  13516800 Jun 25 12:53 rating.price_rule.rul.tmp
  7268 -rw-rw-r-- 1 ciss vge   7430144 Jun 25 12:53 rating.price_parameter.rul.tmp
*/
// var T = require ( "Tango" ) ;
var fs = require ( "fs" ) ;
var util = require ( "util" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var Path = require ( "path" ) ;

var FSWatcher = function ( filename )
{
  EventEmitter.call ( this ) ;
  this.className = "FSWatcher" ;
	this.fullname = Path.resolve ( filename ) ;

	if ( this.isFile() )
	{
		this.dirname = Path.dirname ( this.fullname ) ;
		this.basename = Path.basename ( this.fullname ) ;
	}
	else
	if ( this.isDirectory() )
	{
		this.dirname = this.fullname ;
		this.basename = null ;
	}
	else
	{
		this.dirname = Path.dirname ( this.fullname ) ;
		this.basename = Path.basename ( this.fullname ) ;
	}
};
util.inherits ( FSWatcher, EventEmitter ) ;
FSWatcher.prototype.exists = function()
{
	try
	{
		fs.statSync ( this.fullname ) ;
		return true ;
	}
	catch ( exc )
	{
		return false ;
	}
};
FSWatcher.prototype.isFile = function()
{
	try
	{
		return fs.statSync ( this.fullname ).isFile() ;
	}
	catch ( exc )
	{
		return false ;
	}
};
/** */
FSWatcher.prototype.isDirectory = function()
{
	try
	{
		return fs.statSync ( this.fullname ).isDirectory() ;
	}
	catch ( exc )
	{
		return false ;
	}
};
FSWatcher.prototype.toString = function()
{
	return "(" + this.className + ")[fullname=" + this.fullname + "]" ;
};

FSWatcher.prototype.watch = function()
{
	if ( this.basename )
	{
		this.fileExists = this.exists() ;
		if ( this.fileExists )
		{
			this.emit ( "create", this.basename ) ;
		}
		else
		{
			this.emit ( "delete", this.basename ) ;
		}
	}
	try
	{
		var thiz = this ;
		this.watcher = fs.watch ( this.dirname, function ( ename, fname )
		{
			if ( ename === 'change' )
			{
				thiz.emit ( "change", fname ) ;
				return ;
			}
			if ( ename === 'rename' )
			{
				var fileNowExists = thiz.exists() ;
				if ( thiz.basename )
				{
					if ( fileNowExists )
					{
						if ( ! thiz.fileExists )
						{
							thiz.emit ( "create", thiz.basename ) ;
						}
					}
					else
					{
						if ( thiz.fileExists )
						{
							thiz.emit ( "delete", thiz.basename ) ;
						}
					}
				}
				thiz.emit ( "rename", fname ) ;
				thiz.fileExists = fileNowExists ;
				return ;
			}
		});
	}
	catch ( exc )
	{
		this.emit ( "error", exc ) ;
	}
};
module.exports = FSWatcher ;

if ( require.main === module )
{
  // var w = new FSWatcher ( "./rating.guiding.rul.tmp" ) ;
  var w = new FSWatcher ( "." ) ;
  w.on ( "error", function onerror ( e )
  {
console.log ( "" + this ) ;
  })
  w.on ( "change", function onchange ( name )
  {
  	console.log ( "change: name=" + name ) ;
  })
  w.on ( "rename", function onrename ( name )
  {
  	console.log ( "rename: name=" + name ) ;
  })
  // w.on ( "create", function oncreate ( name )
  // {
  // 	console.log ( "create: name=" + name ) ;
  // })
  // w.on ( "delete", function ondelete ( name )
  // {
  // 	console.log ( "delete: name=" + name ) ;
  // })
  w.watch() ;
};