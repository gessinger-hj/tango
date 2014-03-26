if ( typeof tangojs === 'undefined' ) tangojs = {} ;

if ( !Array.isArray )
{
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}
/**
 * @constructor
 */
tangojs.NEvent = function ( name, type, data )
{
	this._init ( name, type,data ) ;
};
tangojs.NEvent.prototype =
{
	classNameMappings:
	{
  	NEvent: "tangojs.NEvent"
	},
	serialize: function ( obj )
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
	},
	deserialize: function ( serializedObject, deepClassInspection )
	{
	  var that ;
	  var obj = serializedObject ;
	  if ( deepClassInspection !== false ) deepClassInspection = true ;
	  if ( typeof serializedObject === 'string' )
	  {
	    obj = JSON.parse ( serializedObject ) ;
	  }
	  if ( deepClassInspection ) tangojs.NEvent.prototype.deepDeserializeClass ( obj ) ;
	  if ( obj.className && typeof obj.className === 'string' )
	  {
	    var mcn = tangojs.NEvent.prototype.classNameMappings[obj.className] ;
	    var f ;
	    if ( mcn )
	    {
	      f = eval ( mcn ) ;
	    }
	    else
	    {
	      f = eval ( obj.className ) ;
	    }
	    if ( typeof Object.create === 'function' )
	    {
		    that = Object.create ( f.prototype ) ;
	    }
	    else
	    {
		    function F() { } ;
		    F.prototype = f.prototype ;
    		return new F();
  		}
	    that = Object.create ( f.prototype ) ;

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
		this.className = "NEvent" ;
		this.name = "" ;
		this.type = "" ;
		this.setName ( name ) ;
		this.setType ( type ) ;
		this.user = null ;
		this.control = { createdAt: new Date() } ;
		if ( data && typeof data === 'object' ) this.data = data ;
		else this.data = {} ;
	},
	/** */
	getClassName: function()
	{
		return this.className ;
	},
	/** */
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
			+ "[data" + util.inspect ( this.data ) + "]" ;
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
	/** */
	getCreatedAt: function()
	{
  	return this.control.createdAt ;
	},
	/** */
	setIsResult: function()
	{
  	this.control._isResult = true ;
	},
	/** */
	isResult: function()
	{
  	return this.control._isResult ;
	},
	/** */
	setRequestResult: function()
	{
  	this.control._isResultRequested = true ;
	},
		/** */
	isResultRequested: function()
	{
  	return this.control._isResultRequested ;
	},
	/** */
	getSourceIdentifier: function()
	{
  	return this.control.sourceIdentifier ;
	},
	/** */
	setSourceIdentifier: function ( sourceIdentifier )
	{
  	this.control.sourceIdentifier = sourceIdentifier ;
	},
	getProxyIdentifier: function()
	{
  	return this.control.proxyIdentifier ;
	},
	/** */
	setProxyIdentifier: function ( proxyIdentifier )
	{
  	this.control.proxyIdentifier = proxyIdentifier ;
	},
	/** */
	getName: function()
	{
  	return this.name ;
	},
	/** */
	setName: function ( name )
	{
  	this.name = name ? name : "" ;
	},
	/** */
	getType: function()
	{
		return this.type ;
	},
	/** */
	setType: function ( type )
	{
		if ( ! type ) type = "" ;
  	this.type = type ;
	},
	/** */
	getData: function()
	{
		return this.data ;
	},
	/** */
	setData: function ( data )
	{
		if ( data ) this.data = data ;
	},
	/** */
	getUser: function()
	{
		return this.user ;
	},
	/** */
	setUser: function ( u )
	{
		this.user = u ;
	},
	/** */
	getControl: function()
	{
		return this.control ;
	},
	setUniqueId: function ( uid )
	{
		this.control.uniqueId = uid ;
	},
	getUniqueId: function()
	{
		return this.control.uniqueId ;
	},
	isBad: function()
	{
		return this.control.status.code !== 0 ;
	},
	getStatusReason: function()
	{
		return this.control.reason ;
	}
};
tangojs.serialize = tangojs.NEvent.prototype.serialize ;
tangojs.deserialize = tangojs.NEvent.prototype.deserialize ;

if ( typeof document === 'undefined' )
{
	module.exports = tangojs.NEvent ;

	if ( require.main === module )
	{
		var util = require ( "util" ) ;
		var T = require ( "Tango" ) ;

		require ( "User" ) ;
		require ( "File" ) ;

		var f = new tangojs.File ( "r.txt" ) ;
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

		var str = T.serialize ( ne ) ;
	console.log ( "str=" + str ) ;

		var o = T.deserialize ( str ) ;
		T.log ( o ) ;

	// 	console.log ( "o.getUser()=" + o.getUser() ) ;
	// 	console.log ( "o.getCreatedAt()=" + o.getCreatedAt() ) ;
	// 	console.log ( "o.getName()=" + o.getName() ) ;
	}
}