if ( !Array.isArray )
{
  /**
   * Description
   * @method isArray
   * @param {} arg
   * @return LogicalExpression
   */
  Array.isArray = function(arg) {
  	return arg && arg.constructor === Array ;
  };
}
var tangojs = {} ;

/**
 * Description
 * @constructor
 * @method Event
 * @param {} name
 * @param {} type
 * @param {} data
 * @return 
 */
tangojs.Event = function ( name, type, data )
{
	this._init ( name, type, data ) ;
};
tangojs.Event.prototype =
{
	/**
	 * Description
	 * @method serialize
	 * @param {} obj
	 * @return 
	 */
	serialize: function ( obj )
	{
		if ( ! obj )
		{
			obj = this ;
		}
	  var old = Date.prototype.toJSON ;
	  try
	  {
	    /**
    	 * Description
    	 * @method toJSON
    	 * @return ObjectExpression
    	 */
    	Date.prototype.toJSON = function()
	    {
	      return { type:'Date', 'value': this.toISOString() } ;
	    };
	    return JSON.stringify ( obj ) ;
	  }
	  finally
	  {
	    Date.prototype.toJSON = old ;
	  }
	},
	/**
	 * Description
	 * @method deserialize
	 * @param {} serializedObject
	 * @param {} classNameToConstructor
	 * @param {} deepClassInspection
	 * @return that
	 */
	deserialize: function ( serializedObject, classNameToConstructor, deepClassInspection )
	{
	  var that ;
	  var obj = serializedObject ;
	  if ( deepClassInspection !== false ) deepClassInspection = true ;
	  if ( typeof serializedObject === 'string' )
	  {
	    obj = JSON.parse ( serializedObject ) ;
	  }
	  if ( deepClassInspection ) tangojs.Event.prototype.deepDeserializeClass ( obj ) ;
	  if ( ! classNameToConstructor )
	  {
	  	classNameToConstructor = { "Event": tangojs.Event } ;
	  }
	  if ( obj.className && typeof obj.className === 'string' )
	  {
      var mcn = classNameToConstructor[obj.className] ;
      if ( mcn )
      {
        that = f = new mcn() ;
      }
      if ( ! f )
      {
	      f = eval ( obj.className ) ;
		    if ( typeof Object.create === 'function' )
		    {
			    that = Object.create ( f.prototype ) ;
		    }
		    else
		    {
			    /**
    			 * Description
    			 * @method F
    			 * @return 
    			 */
    			function F() { } ;
			    F.prototype = f.prototype ;
	    		that = new F();
	  		}
	    }

	    for ( var k in obj )
	    {
	      if ( ! obj.hasOwnProperty ( k ) ) continue ;
	      var o = obj[k] ;
	      if ( o && typeof o === 'object' )
	      {
	        if ( o.className && typeof o.className === 'string' )
	        {
	          that[k] = this.deserialize ( o ) ;
	          continue ;
	        }
	      }
	      that[k] = obj[k]  ;
	    }
	  }
  	return that ;
	},
	/**
	 * Description
	 * @method deepDeserializeClass
	 * @param {} obj
	 * @return 
	 */
	deepDeserializeClass: function ( obj )
	{
  	if ( ! obj ) return ;
  	for ( var k in obj )
  	{
    	if ( typeof obj.hasOwnProperty === 'function' )
    	{
	    	if ( ! obj.hasOwnProperty ( k ) ) continue ;
    	}
	    var o = obj[k] ;
  	  if ( ! o ) continue ;
    
	    if ( typeof o.type === 'string' )
	    {
	      if ( o.type === 'Date' )
	      {
	        obj[k] = new Date ( o.value ) ;
	        continue ;
	      }
	      if ( typeof document === 'undefined' )
	      {
		      if ( o.type === 'Xml' )
		      {
		        var txml = require ( "Xml" ) ;
		        var f = new txml.XmlFactory() ;
		        obj[k] = f.create ( o.value ) ;
		        continue ;
		      }
		      if ( o.type === "Buffer" && Array.isArray ( o.data ) )
		      {
		        obj[k] = new Buffer ( o.data ) ;
		        continue ;
		      }
	      }
	    }
	    if ( o.className && typeof o.className === 'string' )
	    {
	// console.log ( "o.className=" + o.className ) ;
	    }
	    if ( typeof o === 'object' )
	    {
	      this.deepDeserializeClass ( o ) ;
	    }
	  }
	},
	_init: function ( name, type, data )
	{
		this.className = "Event" ;
		this.name = "" ;
		this.type = "" ;
		this.setName ( name ) ;
		this.setType ( type ) ;
		this.user = null ;
		this.control = { createdAt: new Date() } ;
		if ( data && typeof data === 'object' ) this.data = data ;
		else this.data = {} ;
	},
	/**
	 * Description
	 * @method getClassName
	 * @return MemberExpression
	 */
	getClassName: function()
	{
		return this.className ;
	},
	/**
	 * Description
	 * @method toString
	 * @return 
	 */
	toString: function()
	{
		if ( typeof document === 'undefined' )
		{
			var util = require ( "util" ) ;
			return "(" + this.className + ")["
			+  "name=" + this.name
			+ ",type=" + this.type
			+ "]\n"
			+ ( this.user ? "[user=" + this.user + "]" : "" )
			+ "[control=" + util.inspect ( this.control ) + "]\n"
			+ "[data=" + util.inspect ( this.data ) + "]" ;
		}
		else
		{
			return "(" + this.className + ")["
			+  "name=" + this.name
			+ ",type=" + this.type
			+ "]\n"
			+ ( this.user ? "[user=" + this.user + "]" : "" )
			+ "[control=" + ACSys.toFullString ( this.control ) + "]\n"
			+ "[data=" + ACSys.toFullString ( this.data ) + "]" ;
		}
	},
	/**
	 * Description
	 * @method getCreatedAt
	 * @return MemberExpression
	 */
	getCreatedAt: function()
	{
  	return this.control.createdAt ;
	},
	/**
	 * Description
	 * @method setIsResult
	 * @return 
	 */
	setIsResult: function()
	{
  	this.control._isResult = true ;
	},
	/**
	 * Description
	 * @method isResult
	 * @return MemberExpression
	 */
	isResult: function()
	{
  	return this.control._isResult ;
	},
	/**
	 * Description
	 * @method setResultRequested
	 * @return 
	 */
	setResultRequested: function()
	{
  	this.control._isResultRequested = true ;
	},
		/**
	 * Description
	 * @method isResultRequested
	 * @return MemberExpression
	 */
	isResultRequested: function()
	{
  	return this.control._isResultRequested ;
	},
	/**
	 * Description
	 * @method getSourceIdentifier
	 * @return MemberExpression
	 */
	getSourceIdentifier: function()
	{
  	return this.control.sourceIdentifier ;
	},
	/**
	 * Description
	 * @method setSourceIdentifier
	 * @param {} sourceIdentifier
	 * @return 
	 */
	setSourceIdentifier: function ( sourceIdentifier )
	{
  	this.control.sourceIdentifier = sourceIdentifier ;
	},
	/**
	 * Description
	 * @method getProxyIdentifier
	 * @return MemberExpression
	 */
	getProxyIdentifier: function()
	{
  	return this.control.proxyIdentifier ;
	},
	/**
	 * Description
	 * @method setProxyIdentifier
	 * @param {} proxyIdentifier
	 * @return 
	 */
	setProxyIdentifier: function ( proxyIdentifier )
	{
  	this.control.proxyIdentifier = proxyIdentifier ;
	},
	/**
	 * Description
	 * @method getWebIdentifier
	 * @return MemberExpression
	 */
	getWebIdentifier: function()
	{
  	return this.control.webIdentifier ;
	},
	/**
	 * Description
	 * @method setWebIdentifier
	 * @param {} webIdentifier
	 * @return 
	 */
	setWebIdentifier: function ( webIdentifier )
	{
  	this.control.webIdentifier = webIdentifier ;
	},
	/**
	 * Description
	 * @method getName
	 * @return MemberExpression
	 */
	getName: function()
	{
  	return this.name ;
	},
	/**
	 * Description
	 * @method setName
	 * @param {} name
	 * @return 
	 */
	setName: function ( name )
	{
  	this.name = name ? name : "" ;
	},
	/**
	 * Description
	 * @method getType
	 * @return MemberExpression
	 */
	getType: function()
	{
		return this.type ;
	},
	/**
	 * Description
	 * @method setType
	 * @param {} type
	 * @return 
	 */
	setType: function ( type )
	{
		if ( ! type ) type = "" ;
  	this.type = type ;
	},
	/**
	 * Description
	 * @method getData
	 * @return MemberExpression
	 */
	getData: function()
	{
		return this.data ;
	},
	/**
	 * Description
	 * @method setData
	 * @param {} data
	 * @return 
	 */
	setData: function ( data )
	{
		if ( data ) this.data = data ;
	},
	/**
	 * Description
	 * @method getUser
	 * @return MemberExpression
	 */
	getUser: function()
	{
		return this.user ;
	},
	/**
	 * Description
	 * @method setUser
	 * @param {} u
	 * @return 
	 */
	setUser: function ( u )
	{
		this.user = u ;
	},
	/**
	 * Description
	 * @method getControl
	 * @return MemberExpression
	 */
	getControl: function()
	{
		return this.control ;
	},
	/**
	 * Description
	 * @method setUniqueId
	 * @param {} uid
	 * @return 
	 */
	setUniqueId: function ( uid )
	{
		if ( ! this.control.uniqueId )
		{
			this.control.uniqueId = uid ;
		}
	},
	/**
	 * Description
	 * @method getUniqueId
	 * @return MemberExpression
	 */
	getUniqueId: function()
	{
		return this.control.uniqueId ;
	},
	/**
	 * Description
	 * @method isBad
	 * @return BinaryExpression
	 */
	isBad: function()
	{
		if ( ! this.control ) return false ;
		if ( ! this.control.status ) return false ;
		if ( this.control.status.code === 'undefined' ) return false ;
		return this.control.status.code !== 0 ;
	},
	/**
	 * Description
	 * @method getStatusReason
	 * @return MemberExpression
	 */
	getStatusReason: function()
	{
		if ( ! this.control ) return ;
		if ( ! this.control.status ) return ;
		return this.control.status.reason ;
	}
};
if ( typeof document !== 'undefined' )
{
	tangojs.serialize = tangojs.Event.prototype.serialize ;
	tangojs.deserialize = tangojs.Event.prototype.deserialize ;
}
else
{
	module.exports = tangojs.Event ;

	if ( require.main === module )
	{
		var util = require ( "util" ) ;
		var T = require ( "Tango" ) ;

		var User = require ( "User" ) ;
		var File = require ( "File" ) ;

		// var f = new File ( "r.txt" ) ;
		// var buf = f.toBuffer() ;
		var ne = new tangojs.Event ( 'BC', "T" ) ;
		// ne.setUser ( new User ( "admin", 17 ) ) ;
		// ne.data.fileContent = buf ;
		// var tree = new tangojs.XmlTree() ;
		// var xfile = tree.add ( "file" ) ;
		// xfile.add ( "name", "r.txt" ) ;
		// xfile.add ( "content", buf ) ;

		// ne.xdata = tree ;
		// T.log ( ne ) ;

		var str = ne.serialize() ;
	console.log ( "str=" + str ) ;
		new File ( "nevent.json" ).write ( str ) ;
		// var o = T.deserialize ( str, { "Event": tangojs.Event } ) ;
		var o = tangojs.Event.prototype.deserialize ( str ) ;
		T.log ( o ) ;

	// 	console.log ( "o.getUser()=" + o.getUser() ) ;
	// 	console.log ( "o.getCreatedAt()=" + o.getCreatedAt() ) ;
	// 	console.log ( "o.getName()=" + o.getName() ) ;
	}
}
