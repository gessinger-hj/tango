module.exports = function(T) {
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

   return User ;
} ;