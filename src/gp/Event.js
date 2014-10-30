if ( !Array.isArray )
{
  /**
   * Description
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
 * @param {} name
 * @param {} type
 * @param {} data
 */
tangojs.Event = function ( name, type, data )
{
	this._init ( name, type, data ) ;
};
tangojs.Event.prototype =
{
	/**
	 * Description
	 * @param {} obj
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
	 * @param {} obj
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
	 * @return MemberExpression
	 */
	getClassName: function()
	{
		return this.className ;
	},
	/**
	 * Description
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
	 * @return MemberExpression
	 */
	getCreatedAt: function()
	{
  	return this.control.createdAt ;
	},
	/**
	 * Description
	 */
	setIsResult: function()
	{
  	this.control._isResult = true ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	isResult: function()
	{
  	return this.control._isResult ;
	},
	/**
	 * Description
	 */
	setResultRequested: function()
	{
  	this.control._isResultRequested = true ;
	},
		/**
	 * Description
	 * @return MemberExpression
	 */
	isResultRequested: function()
	{
  	return this.control._isResultRequested ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getSourceIdentifier: function()
	{
  	return this.control.sourceIdentifier ;
	},
	/**
	 * Description
	 * @param {} sourceIdentifier
	 */
	setSourceIdentifier: function ( sourceIdentifier )
	{
  	this.control.sourceIdentifier = sourceIdentifier ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getProxyIdentifier: function()
	{
  	return this.control.proxyIdentifier ;
	},
	/**
	 * Description
	 * @param {} proxyIdentifier
	 */
	setProxyIdentifier: function ( proxyIdentifier )
	{
  	this.control.proxyIdentifier = proxyIdentifier ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getWebIdentifier: function()
	{
  	return this.control.webIdentifier ;
	},
	/**
	 * Description
	 * @param {} webIdentifier
	 */
	setWebIdentifier: function ( webIdentifier )
	{
  	this.control.webIdentifier = webIdentifier ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getName: function()
	{
  	return this.name ;
	},
	/**
	 * Description
	 * @param {} name
	 */
	setName: function ( name )
	{
  	this.name = name ? name : "" ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getType: function()
	{
		return this.type ;
	},
	/**
	 * Description
	 * @param {} type
	 */
	setType: function ( type )
	{
		if ( ! type ) type = "" ;
  	this.type = type ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getData: function()
	{
		return this.data ;
	},
	/**
	 * Description
	 * @param {} data
	 */
	setData: function ( data )
	{
		if ( data ) this.data = data ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getUser: function()
	{
		return this.user ;
	},
	/**
	 * Description
	 * @param {} u
	 */
	setUser: function ( u )
	{
		this.user = u ;
	},
	/**
	 * Description
	 * @return MemberExpression
	 */
	getControl: function()
	{
		return this.control ;
	},
	/**
	 * Description
	 * @param {} uid
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
	 * @return MemberExpression
	 */
	getUniqueId: function()
	{
		return this.control.uniqueId ;
	},
	/**
	 * Description
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
