// http://www.sebastianseilund.com/nodejs-async-in-practice
var util = require  ( "util" ) ;
if ( ! String.prototype.startsWith )
{
  /*
   * Description
   * @param {} needle
   * @return BinaryExpression
   */
  String.prototype.startsWith = function ( needle )
  {
    if ( ! needle ) return false ;
    return this.indexOf ( needle ) == 0 ;
  } ;
}
if ( ! String.prototype.endsWith )
{
  /*
   * Description
   * @param {} needle
   * @return Literal
   */
  String.prototype.endsWith = function ( needle )
  {
    if ( ! needle ) return false ;
    var pos = this.indexOf ( needle ) ;
    if ( pos < 0 ) return false ;
    if ( this.length - needle.length == pos ) return true ;
    return false ;
  };
}
if ( ! Array.remove )
{
  Array.prototype.remove = function ( element )
  {
    var length = this.length ;
    if ( typeof ( element ) == 'number' )
    {
      var index = Math.floor ( element ) ;
      if ( index < 0 ) return null ;
      if ( index >= length ) return null ;
      var obj = this[index] ;
      this.splice ( index, 1 ) ;
      return obj ;
    }
    var i = this.indexOf ( element ) ;
    if ( i < 0 ) return null ;
    this.splice ( i, 1 ) ;
    return element ;
  } ;
}

/**
 * @constructor
 * Description
 */
var TangoClass = function()
{
  this.jsClassName = "TangoClass" ;
};
/**
 * Description
 * @return BinaryExpression
 */
TangoClass.prototype.toString = function()
{
  return "(" + this.jsClassName + ")" ;
};
/**
 * Description
 * @param {} args
 * @return Literal
 */
TangoClass.prototype.isArguments = function ( args )
{
  if ( args === null ) return false;
  if ( typeof args !== 'object' ) return false;
  if ( typeof args.callee !== 'function' ) return false;
  if ( typeof args.length !== 'number' ) return false;
  if ( args.constructor !== Object ) return false;
  return true;
};
/**
 * Description
 * @param {} a
 * @return LogicalExpression
 */
TangoClass.prototype.isObject = function (a) { return a && typeof a == 'object'; } ;

/**
 * Description
 * @param {} a
 * @return LogicalExpression
 */
TangoClass.prototype.isArray = function (a) { return this.isObject(a) && a.constructor == Array; } ;
/**
 * Description
 * @param {} a
 * @return LogicalExpression
 */
TangoClass.prototype.isDate = function (a) { return this.isObject(a) && a.constructor == Date; } ;

/**
 * Description
 * @param {} thiz
 * @param {} parentClass
 */
TangoClass.prototype.initSuper = function ( thiz, parentClass )
{
  // thiz._super_ = parentClass.prototype ;
  // Apply parent's constructor to this object
  if( arguments.length > 2 )
  {
    // Note: 'arguments' is an Object, not an Array
    parentClass.apply ( thiz, Array.prototype.slice.call( arguments, 2 ) ) ;
  }
  else
  {
    parentClass.call ( thiz ) ;
  }
};
/**
 * Description
 * @param {} clazz
 * @param {} parentClazz
 */
TangoClass.prototype.inherits = function ( clazz, parentClazz )
{
  clazz.prototype = Object.create ( parentClazz.prototype ) ;
  clazz.prototype.constructor = this;
};

/**
 * Description
 * @param {} from
 * @param {} to
 */
TangoClass.prototype.mixin = function ( from, to )
{
  for ( var key in from )
  {
    if ( ! from.hasOwnProperty (key) ) continue ;
    if ( to.hasOwnProperty ( key ) ) continue ;
    if ( from[key] && typeof ( from[key] ) === 'object' && typeof ( from[key].create ) === 'function' )
    {
      to[key] = from[key].create.call() ;
      continue ;
    }
    to[key] = from[key] ;
  }
};
/**
 * Description
 * @param {} obj
 * @param {} name
 * @param {} a
 */
TangoClass.prototype.callSuper = function ( obj, name, a )
{
	if  ( ! obj ) return ;
	if  ( ! name ) return ;
	var proto = Object.getPrototypeOf  ( obj ) ;
	while ( proto )
	{
		proto = Object.getPrototypeOf  ( proto ) ;
		if ( ! proto ) break ;
		if ( typeof ( proto[name] ) === 'function' )
		{
			if ( ! a )
			{
				proto[name].call ( obj ) ;
			}
			else
			if ( this.isArguments ( a ) )
			{
				proto[name].apply ( obj, a ) ;
			}
			else
			if ( this.isArray ( a ) )
			{
				proto[name].call ( obj, a ) ;
			}
			else
			{
				var aa = [ a ] ;
				proto[name].call ( obj, aa ) ;
			}
			break ;
		}
	}
};
var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

/**
 * Description
 * @param {} str
 */
TangoClass.prototype.lwhere = function ( str )
{
  if (!hasStacks) {
      return;
  }
  try
  {
    throw new Error();
  }
  catch (e)
  {
    var lines = e.stack.split ("\n") ;
    var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
    firstLine = firstLine.trim() ;
    if ( firstLine.indexOf ( "at " ) === 0 ) firstLine = firstLine.substring ( 3 ) ;
    var p1 = firstLine.lastIndexOf ( "(" ) ;
    var p2 = firstLine.indexOf ( ")", p1 ) ;
    if ( p1 >= 0 && p2 >= 0 && p2 > p1 )
    {
      var p_slash = firstLine.lastIndexOf ( "/", p2 ) ;
      if ( p_slash < 0 )
      {
        p_slash = firstLine.lastIndexOf ( "\\", p1 ) ;
      }
      if ( p_slash > p1 && p_slash < p2 )
      {
        firstLine = firstLine.substring ( 0, p1+1 ) + firstLine.substring ( p_slash + 1 ) ;
      }
    }
    if ( str )
    {
      console.log ( str + ": " + firstLine ) ;
    }
    else
    {
      console.log ( firstLine ) ;
    }
  }
}
/**
 * Description
 * @param {} indexOfLine
 */
TangoClass.prototype.where = function ( indexOfLine )
{
  if (!hasStacks) {
      return;
  }
  if ( ! indexOfLine ) indexOfLine = 0 ;
  try
  {
    throw new Error();
  }
  catch (e)
  {
    var lines = e.stack.split ("\n") ;
    var firstLine = lines[0].indexOf("@") > 0 ? lines[indexOfLine+1] : lines[indexOfLine+2];
    if ( firstLine.indexOf ( "at " ) === 0 ) firstLine = firstLine.substring ( 3 ) ;
    return firstLine ;
  }
}
/**
 * Description
 * @param {} iterable
 * @return results
 */
TangoClass.prototype.toArray = function (iterable)
{
  if ( !iterable ) return []; 
  if (iterable.toArray)
  {
    return iterable.toArray();
  }
  var results = [];
  for ( var i = 0 ; i < iterable.length ; i++ )
  {
    results.push(iterable[i]);
  }     
  return results;
};
/**
 * Description
 * @param {} name
 * @param {} value
 */
TangoClass.prototype.setProperty = function ( name, value )
{
  if ( ! this._envMap ) this._envMap = [] ;
  this._envMap[name] = value ;
};
/**
 * Description
 * @param {} name
 * @param {} defaultValue
 */
TangoClass.prototype.getInt = function ( name, defaultValue )
{
  var v = this
};
/**
 * Description
 * @param {} name
 * @param {} defaultValue
 * @return defaultValue
 */
TangoClass.prototype.getProperty = function ( name, defaultValue )
{
  var value ;
  if ( this._envMap )
  {
    value = this._envMap[name] ;
    if ( typeof value !== 'undefined' )
    {
      return value ;
    }
  }
  if ( ! this._envMap )
  {
    this._envMap = [] ;
  }
  var i ;
  if ( ! this.argsDone )
  {
    this.argsDone = true ;
    for ( i = 2 ; i < process.argv.length ; i++ )
    {
      var p = process.argv[i] ;
      if ( p.indexOf ( "-D" ) === 0 )
      {
        if (  p.length < 3
           || p.charAt ( 2 ) == '='
           )
        {
          console.log ( "Missing option name: " + p ) ;
          return ;
        }
        var pos = p.indexOf ( '=' ) ;
        if ( pos < 0 )
        {
          this.setProperty ( p.substring ( 2 ), "true" ) ;
        }
        else
        {
          this.setProperty ( p.substring ( 2, pos )
                           , p.substring ( pos + 1 )
                            ) ;
        }
      }
    }
  }
  value = this._envMap[name] ;
  if ( typeof value !== 'undefined' )
  {
    return value ;
  }
  value = process.env[name] ;
  if ( ! value && typeof value !== 'string' && name.indexOf ( '.' ) > 0 )
  {
    name = name.replace ( /\./g, '_' ) ;
    value = process.env[name] ;
    if ( ! value && typeof value !== 'string' )
    {
      name = name.toUpperCase() ;
      value = process.env[name] ;
    }
  }
  if ( typeof value !== 'undefined' )
  {
    this._envMap[name] = value ;
    return value ;
  }

  return defaultValue ;
};
/**
 * Description
 * @param {} object
 */
TangoClass.prototype.log = function ( object )
{
  console.log ( util.inspect ( object, { showHidden: false, depth: null } ) ) ;
};
/**
 * Description
 * @return __dirname
 */
TangoClass.prototype.getConfigPath = function()
{
  return __dirname ;
};
/**
 * Description
 * @param {} str
 * @return list
 */
TangoClass.prototype.splitJSONObjects = function ( str )
{
  var list = [] ;
  var pcounter = 1 ;
  var q = "" ;
  var i0 = 0 ;
  var i = 1 ;
  for ( i = 1 ; i < str.length ; i++ )
  {
    var c = str.charAt ( i ) ;
    if ( c === '"' || c === "'" )
    {
      q = c ;
      for ( var j = i+1 ; j < str.length ; j++ )
      {
        c = str.charAt ( j ) ;
        if ( c === q )
        {
          if ( str.charAt  ( j - 1 ) === '\\' )
          {
            continue ;
          }
          i = j ;
          break ;
        }
      }
    }
    if ( c === '{' )
    {
      pcounter++ ;
      continue ;
    }
    if ( c === '}' )
    {
      pcounter-- ;
      if ( pcounter === 0 )
      {
        list.push ( str.substring ( i0, i + 1 ) ) ;
        i0 = i + 1 ;
        for ( ; i0 < str.length ; i0++ )
        {
          if ( str.charAt ( i0 ) === '{' )
          {
            i = i0 - 1 ;
            break ;
          }
        }
      }
      continue ;
    }
  }
  if ( i0 < str.length )
  {
    list.push ( str.substring ( i0 ) ) ;
  }
  return { list: list, lastLineIsPartial: pcounter ? true : false } ;
};
/**
 * Description
 * @param {} obj
 */
TangoClass.prototype.serialize = function ( obj )
{
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
    return JSON.stringify ( obj ) ; //+ "\r\n" ;
  }
  finally
  {
    Date.prototype.toJSON = old ;
    // console.log ( exc ) ;
  }
};
/**
 * Description
 * @param {} obj
 */
TangoClass.prototype.deepDeserializeClass = function ( obj )
{
  if ( ! obj ) return ;
  for ( var k in obj )
  {
    if ( ! obj.hasOwnProperty ( k ) ) continue ;

    var o = obj[k] ;
    if ( ! o ) continue ;
    
    if ( typeof o.type === 'string' )
    {
      if ( o.type === 'Date' )
      {
        obj[k] = new Date ( o.value ) ;
        continue ;
      }
      if ( o.type === 'Xml' )
      {
        var txml = require ( "Xml" ) ;
        var f = new txml.XmlFactory() ;
        obj[k] = f.create ( o.value ) ;
        continue ;
      }
      if ( o.type === "Buffer" && this.isArray ( o.data ) )
      {
        obj[k] = new Buffer ( o.data ) ;
        continue ;
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
}
/**
 * Description
 * @param {} serializedObject
 * @param {} classNameToConstructor
 * @param {} deepClassInspection
 * @return that
 */
TangoClass.prototype.deserialize = function ( serializedObject, classNameToConstructor, deepClassInspection )
{
  var that ;
  var obj = serializedObject ;
  if ( deepClassInspection !== false ) deepClassInspection = true ;
  if ( typeof serializedObject === 'string' )
  {
    obj = JSON.parse ( serializedObject ) ;
  }
  if ( deepClassInspection ) this.deepDeserializeClass ( obj ) ;
  if ( obj.className && typeof obj.className === 'string' )
  {
    var f ;
    if ( classNameToConstructor )
    {
      var mcn = classNameToConstructor[obj.className] ;
      if ( mcn )
      {
        that = f = new mcn() ;
      }
    }
    if ( ! f )
    {
      f = eval ( obj.className ) ;
      that = Object.create ( f.prototype ) ;
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
};

var Tango = new TangoClass() ;
module.exports = Tango ;
