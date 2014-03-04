var T = require ( "Tango" ) ;
var util = require ( "util" ) ;
var User = require ( "User" ) ;

/**
 * @constructor
 */
NEvent = function ( name, type )
{
	this.className = "NEvent" ;
	this.name = "" ;
	this.type = "" ;
	this.setName ( name ) ;
	this.setType ( type ) ;
	this.user = null ;
	this.control = { createdAt: new Date() } ;
	this.data = {} ;
};
/** */
NEvent.prototype.getClassName = function()
{
	return this.className ;
};
/** */
NEvent.prototype.toString = function()
{
	return "(" + this.className + ")[" + util.inspect ( this ) + "]" ;
};
/** */
NEvent.prototype.getCreatedAt = function()
{
  return this.control.createdAt ;
};
/** */
NEvent.prototype.setIsResult = function()
{
  this.control._isResult = true ;
};
/** */
NEvent.prototype.isResult = function()
{
  return this.control._isResult ;
};
/** */
NEvent.prototype.setRequestResult = function()
{
  this.control._isResultRequested = true ;
};
/** */
NEvent.prototype.isResultRequested = function()
{
  return this.control._isResultRequested ;
};
/** */
NEvent.prototype.getSourceIdentifier = function()
{
  return this.control.sourceIdentifier ;
};
/** */
NEvent.prototype.setSourceIdentifier = function ( sourceIdentifier )
{
  this.control.sourceIdentifier = sourceIdentifier ;
};
/** */
NEvent.prototype.getName = function()
{
  return this.name ;
};
/** */
NEvent.prototype.setName = function ( name )
{
  this.name = name ? name : "" ;
};
/** */
NEvent.prototype.getType = function()
{
	return this.type ;
};
/** */
NEvent.prototype.setType = function ( type )
{
	if ( ! type ) type = "" ;
  this.type = type ;
};
/** */
NEvent.prototype.getData = function()
{
	return this.data ;
};
/** */
NEvent.prototype.setData = function ( data )
{
	if ( data ) this.data = data ;
};
/** */
NEvent.prototype.getUser = function()
{
	return this.user ;
};
/** */
NEvent.prototype.setUser = function ( u )
{
	this.user = u ;
};
/** */
NEvent.prototype.getControl = function()
{
	return this.control ;
};
NEvent.prototype.setUniqueId = function ( uid )
{
	this.control.uniqueId = uid ;
};
NEvent.prototype.getUniqueId = function()
{
	return this.control.uniqueId ;
};
NEvent.prototype.isBad = function()
{
	return this.control.status.code !== 0 ;
};
NEvent.prototype.getStatusReason = function()
{
	return this.control.reason ;
};

module.exports.NEvent = NEvent ;
module.exports.User = User ;
serialize = function ( obj )
{
  var old = Date.prototype.toJSON ;
  try
  {
    Date.prototype.toJSON = function()
    {
      return { type:'Date', 'value': this.toISOString() } ;
    };
    return JSON.stringify ( obj ) ;
  }
  finally
  {
    Date.prototype.toJSON = old ;
    // console.log ( exc ) ;
  }
};

if ( require.main === module )
{
	var File = require ( "File" ) ;
	var f = new File ( "r.txt" ) ;
	var buf = f.toBuffer() ;
	var ne = new NEvent ( 'BC', "T" ) ;
	// ne.setUser ( new User ( "admin", 17 ) ) ;
	// ne.data.fileContent = buf ;
	var tree = new XmlTree() ;
	var xfile = tree.add ( "file" ) ;
	xfile.add ( "name", "r.txt" ) ;
	xfile.add ( "content", buf ) ;

	ne.xdata = tree ;
	T.log ( ne ) ;

	var str = serialize ( ne ) ;
console.log ( "str=" + str ) ;

	var o = T.deserialize ( str ) ;
	T.log ( o ) ;

// 	console.log ( "o.getUser()=" + o.getUser() ) ;
// 	console.log ( "o.getCreatedAt()=" + o.getCreatedAt() ) ;
// 	console.log ( "o.getName()=" + o.getName() ) ;
}