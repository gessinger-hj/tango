var T = require ( "Tango" ) ;
var util = require ( "util" ) ;

/**
 * @constructor
 */
User = function ( id, key, pwd )
{
	this.className = "User" ;
	this.id = id ;
	this.key = key ;
	this._pwd = pwd ;
};
/** */
User.prototype.toString = function()
{
	return "(" + this.className + ")[" + util.inspect ( this ) + "]" ;
};
/** */
User.prototype.getId = function (  )
{
	return this.id ;
};
if ( typeof tangojs === 'object' && tangojs ) tangojs.User = User ;
else tangojs = { User:User } ;

module.exports = User ;