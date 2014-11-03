var util = require ( "util" ) ;
var sax = require('sax');
var T = require ( "./Tango" ) ;
var Utils = require ( "./Utils" ) ;
var DateUtils = require ( "./DateUtils" ) ;

var StringWritable = require ( "./StringWritable" ) ;
var stream = require('stream');
'use strict' ;
/**
 * @constructor
 * @param {string} [tag="elem"] tag name
 * @param {string} [text]
 * @param {hash} [attr]
 */
var XmlElement = function ( tag, text, attr )
{
  if ( ! tag )
  {
    this._name = "elem" ;
    this._attributes = {};
    this._value = "";
  }
  else
  if ( typeof tag === 'string' )
  {
    this._name = tag ;
    this._value = "" ;
    if ( typeof text === 'string' )
    {
      this._value = text ;
      if ( attr && typeof attr === 'object') this._attributes = attr ;
    }
    else
    if ( T.isDate ( text ) )
    {
      var sd = DateUtils.getSoapDateTime ( text ) ;
      this._value = sd ;
      if ( attr && typeof attr === 'object') this._attributes = attr ;
      else this._attributes = {} ;
      this._attributes["xsi:type"] = "xsd:date" ;
    }
    else
    if ( typeof text === 'number' )
    {
      this._value = String ( text ) ;
      if ( attr && typeof attr === 'object') this._attributes = attr ;
      else this._attributes = {} ;
      this._attributes["xsi:type"] = "xsd:number" ;
    }
    else
    if ( typeof text === 'boolean' )
    {
      this._value = String ( text ) ;
      if ( attr && typeof attr === 'object') this._attributes = attr ;
      else this._attributes = {} ;
      this._attributes["xsi:type"] = "xsd:boolean" ;
    }
    else
    if ( text && ( text instanceof Buffer ) )
    {
      this._value = text.toString ( "base64" ) ;
      if ( attr && typeof attr === 'object') this._attributes = attr ;
      else this._attributes = {} ;
      this._attributes["xsi:type"] = "xsd:binary" ;
    }
    else
    if ( text && typeof text === 'object' )
    {
      this._attributes = text ;
    }
    if ( ! this._attributes ) this._attributes = {} ;
  }
  else
  {
    this._name = tag.name;
    this._attributes = tag.attributes || {};
    this._value = "";
  }
  this.children = [];
  this.isCDATA = false ;
  this.parent = null ;
};
/**
 * Description
 * @param {} parent
 * @return ThisExpression
 */
XmlElement.prototype.setParent = function ( parent )
{
  this.parent = parent ;
  return this ;
};
/**
 * Description
 * @return MemberExpression
 */
XmlElement.prototype.getParent = function()
{
  return this.parent ;
};
/**
 * Description
 * @return MemberExpression
 */
XmlElement.prototype.getName = function()
{
  return this._name ;
};

/*
 * [_ontext description]
 * @param  {[type]} text [description]
 * @return {[type]}      [description]
 */
XmlElement.prototype._ontext = function(text)
{
  text = text.trim() ;
  if ( this._value )
  {
    var ch = new XmlElement ( { name: "!Text"} ) ;
    ch.setParent ( this ) ;
    ch._value = text ;
    this.children.push ( ch ) ;
  }
  else
  {
    this._value = text;
  }
}
/*
 * [_oncdata description]
 * @param  {[type]} cdata [description]
 * @return {[type]}       [description]
 */
XmlElement.prototype._oncdata = function(cdata)
{
  if ( this._value )
  {
    var ch = new XmlElement ( { name: "!CDATA" } ) ;
    ch.isCDATA = true ;
    ch.setParent ( this ) ;
    ch._value = cdata ;
    this.children.push ( ch ) ;
  }
  else
  {
    this._value += cdata;
    this.isCDATA = true ;
  }
}
/**
 * Description
 * @param {} iterator
 * @param {} thiz
 */
XmlElement.prototype.elements = function ( iterator, thiz )
{
  for ( var i = 0 , l = this.children.length ; i < l ; i++ )
  {
    if ( iterator.call ( thiz, this.children[i] ) === false ) return;
  }
}
/**
 * Description
 * @param {} name
 * @param {} value
 */
XmlElement.prototype.addAttribute = function ( name, value )
{
  this._attributes[name] = value ;
};
/**
 * Description
 * @param {} name
 * @param {} def
 * @return def
 */
XmlElement.prototype.getAttribute = function ( name, def )
{
  if ( this._attributes[name] ) return this._attributes[name] ;
  return def ;
};
/**
 * Description
 * @param {} name
 */
XmlElement.prototype.removeAttribute = function ( name )
{
  if ( this._attributes[name] ) delete this._attributes[name] ;
};
/**
 * Description
 * @param {} e
 * @return old
 */
XmlElement.prototype.replace = function ( e )
{
  var children = this.getParent().children ;
  var i = children.indexOf ( this ) ;
  var old = children[i] ;
  children[i] = e ;
  e.setParent ( this.getParent() ) ;
  return old ;
};
/**
 * Description
 * @param {} path
 * @return e
 */
XmlElement.prototype.remove = function ( path )
{
  var i ;
  if ( ! path )
  {
    i = this.getParent().children.indexOf ( this ) ;
    this.getParent().children.splice ( i, 1 ) ;
    return this ;
  }
  var e = this.elem ( path ) ;
  if ( ! e ) return ;
  i = e.getParent().children.indexOf ( e ) ;
  e.getParent().children.splice ( i, 1 ) ;
  return e ;
};
/**
 * Description
 * @param {} path
 * @return CallExpression
 */
XmlElement.prototype.elem = function ( path )
{
  if ( ! path ) return this ;
  var pathArray = path.split ( '/' ) ;
  return this._elem ( pathArray, 0 ) ;
};
/**
 * Description
 * @param {} path
 * @param {} index
 */
XmlElement.prototype.elemAt = function ( path, index )
{
  if ( typeof path === 'number' )
  {
    return this.children[path] ;
  }
  var pathArray = path.split ( '/' ) ;
  var e = this._elem ( pathArray, 0 ) ;
  if ( e )
  {
    return e.children[index] ;
  }
};
/*
 * [_elem description]
 * @param  {[type]} pathArray [description]
 * @param  {[type]} index     [description]
 * @return {[type]}           [description]
 */
XmlElement.prototype._elem = function ( pathArray, index )
{
  var name = pathArray[index] ;
  if ( name == ".." )
  {
    return this.getParent()._elem ( pathArray, index + 1 ) ;
  }
  if ( name == "." )
  {
    return this._elem ( pathArray, index + 1 ) ;
  }
  var NAME = name.toUpperCase() ;
  var counter = NaN ;
  var getLast = false ;
  var attributeName = "" ;
  var attributeValue = null ;
  if ( name.indexOf ( '[' ) > 0 )
  {
    var n1 = name.substring ( name.indexOf ( '[' ) + 1 ) ;
    if ( n1.indexOf ( ']' ) > 0 )
    {
      n1 = n1.substring ( 0, n1.indexOf ( ']' ) ) ;
      if ( n1 == "last()" )
      {
        getLast = true ;
      }
      else
      if ( n1 && n1.charAt ( 0 ) === '@' )
      {
        var pos_eq = n1.indexOf ( "=" ) ;
        if ( pos_eq > 1 )
        {
          attributeName = n1.substring ( 1, pos_eq ).trim() ;
          attributeValue = n1.substring ( pos_eq + 1 ) ;
          if ( ! attributeValue ) attributeValue = "" ;
          attributeValue = attributeValue.trim() ;
          if ( ! attributeValue ) attributeValue = null ;
          else
          if ( attributeValue.length >= 2 )
          {
            var q = attributeValue.charAt ( 0 ) ;
            var q2 = attributeValue.charAt ( attributeValue.length - 1 ) ;
            if ( q === q2 && ( q === '"' || q === "'" ) )
            {
              attributeValue = attributeValue.substring ( 1, attributeValue.length - 1 ) ;
            }
          }
        }
        else
        {
          attributeName = n1.substring ( 1 ).trim() ;
        }
        attributeName = attributeName.trim() ;
      }
      else
      {
        counter = parseInt ( n1 ) ;
        if ( counter <= 0 ) counter = NaN ;
      }
    }
    name = name.substring ( 0, name.indexOf ( '[' ) ) ;
    NAME = name.toUpperCase() ;
  }
  var lastFoundElement = null ;
  var i = 0 ;
  var ch ;
  var children = this.children ;
  var len = children.length ;
  for ( i = 0 ; i < len ; i++ )
  {
    ch = children[i] ;
    if ( ch._name && ch._name.toUpperCase() === NAME || NAME === '*' )
    {
      if ( attributeName )
      {
        if ( typeof ch._attributes[attributeName] !== 'string' )
        {
          continue ;
        }
        if ( typeof attributeValue === 'string' && ch._attributes[attributeName] !== attributeValue )
        {
          continue ;
        }
      }
      lastFoundElement = ch ;
      if ( ! isNaN ( counter ) )
      {
        counter-- ;
        if ( counter > 0 )
        {
          continue ;
        }
      }
      if ( index === pathArray.length - 1 )
      {
        if ( ! getLast )
        {
          return ch ;
        }
      }
      else
      {
        return ch._elem ( pathArray, index + 1 ) ;
      }
    }
  }
  return lastFoundElement ;
};
/**
 * Description
 * @param {} path
 * @return list
 */
XmlElement.prototype.select = function ( path )
{
  var list = [];
  
  if ( ! path ) return list ;
  var name = path ;
  var e = this ;
  if ( path.indexOf ( "/" ) >= 0 )
  {
    var pos = path.lastIndexOf ( "/" ) ;
    var parent = path.substring ( 0, pos ) ;
    name = path.substring ( pos + 1 ) ;
    e = this.elem ( parent ) ;
  }

  if ( ! e ) return list ;

  for ( var i=0, l = e.children.length ; i < l; i++ )
  {
    if ( e.children[i]._name === name )
    {
      list.push ( e.children[i] ) ;
    }
  }
  return list;
};
/**
 * Description
 * @param {string} path - location path
 * @return {Date|Number|Boolean|String}
 */
XmlElement.prototype.valueOf = function ( path )
{
  if ( ! path )
  {
    if ( this._attributes["xsi:type"] === "xsd:date" ) return DateUtils.parseDate ( this._value ) ;
    else
    if ( this._attributes["xsi:type"] === "xsd:number" ) return parseFloat ( this._value ) ;
    else
    if ( this._attributes["xsi:type"] === "xsd:boolean" ) return this._value === 'true' ? true : false ;
    else
    if ( this._attributes["xsi:type"] === "xsd:binary" ) return new Buffer ( this._value, 'base64' ) ;

    return this._value ;
  }
  var last_slash = path.lastIndexOf ( "/" ) ;
  var last_at = path.lastIndexOf ( "@" ) ;
  var attributeName = "" ;
  if ( last_at >= 0 && last_at > last_slash )
  {
    attributeName = path.substring ( last_at + 1 ) ;
    path = path.substring ( 0, last_slash > 0 ? last_slash : last_at ) ;
  }
  var child = this ;
  if ( path )
  {
    child = this.elem ( path ) ;
    if ( ! child )
    {
      return "" ;
    }
  }
  if ( attributeName )
  {
    return child._attributes[attributeName] ;
  }
  if ( child._attributes["xsi:type"] === "xsd:date" ) return DateUtils.parseDate ( child._value ) ;
  else
  if ( child._attributes["xsi:type"] === "xsd:number" ) return parseFloat ( child._value ) ;
  else
  if ( child._attributes["xsi:type"] === "xsd:boolean" ) return child._value === 'true' ? true : false ;
  else
  if ( child._attributes["xsi:type"] === "xsd:binary" ) return new Buffer ( child._value, 'base64' ) ;

  return child._value ;
};
/**
 * Description
 * @param {} path
 * @return CallExpression
 */
XmlElement.prototype.getContent = function ( path )
{
  return this.valueOf ( path ) ;
};
/**
 * Description
 * @param {} path
 * @return v
 */
XmlElement.prototype.getDate = function ( path )
{
  var v = this.valueOf ( path ) ;
  if ( typeof v === 'string' )
  {
    return DateUtils.parseDate ( this.valueOf ( path ) ) ;
  }
  return v ;
};
/**
 * Description
 * @param {} path
 * @param {} def
 * @return Literal
 */
XmlElement.prototype.getBool = function ( path, def )
{
  var s = null ;
  if ( typeof ( path ) == 'boolean' )
  {
    s = this.getContent() ;
    if ( typeof s === 'boolean' ) return s ;
    return path ;
  }
  s = this.getContent ( path ) ;
  if ( typeof s === 'boolean' ) return s ;
  
  if ( ! s )
  {
    if ( def ) return true ;
    else       return false ;
  }
  if ( s === "true" ) return true ;
  return false ;
};
/**
 * Description
 * @param {} path
 * @param {} def
 * @return n
 */
XmlElement.prototype.getNumber = function ( path, def )
{
  var s = null ;
  if ( typeof ( path ) == 'number' )
  {
    s = this.getContent() ;
    if ( typeof s === 'number' ) return s ;
    return path ;
  }
  s = this.getContent ( path ) ;
  if ( typeof s === 'number' ) return s ;
  var n = parseFloat ( s ) ;
  if ( isNaN ( n ) ) return def ;
  return n ;
};

/**
 * Description
 * @param {} value
 */
XmlElement.prototype.setValue = function ( value )
{
  this._value = value ;
};

/**
 * Description
 * @param {} wstream
 */
XmlElement.prototype.toString = function ( wstream )
{
  if ( ! wstream )
  {
    wstream = new StringWritable() ;
    this._toString ( "", wstream ) ;
    var s = wstream.toString() ;
    wstream.end() ;
    wstream.flush() ;
    return s ;
  }
  else
  {
    this._toString ( "", wstream ) ;
  }
}
/*
 * Description
 * @param {} wstream
 */
XmlElement.prototype.toWriteStream = function ( wstream )
{
  this._toString ( "", wstream ) ;
};

/*
 * [_toString description]
 * @param  {[type]} indent  [description]
 * @param  {[type]} wstream [description]
 * @return {[type]}         [description]
 */
XmlElement.prototype._toString = function ( indent, wstream )
{
  if ( !this.getParent() && ( this instanceof XmlTree ) )
  {
    wstream.write ( '<?xml version="1.0" encoding="UTF-8"?>\n' ) ;
  }
  if ( this._name === "!Text" )
  {
  }
  else
  if ( this._name === "!CDATA" )
  {
  }
  else
  {
    wstream.write ( indent + "<" + this._name ) ;
  
    for ( var name in this._attributes )
    {
      var n = this._attributes[name] ;
      if ( n )
      {
        n = n.replace ( /&/, "&amp;" )
             .replace ( /</g, "&lt;" )
             .replace ( />/, "&gt;" )
             .replace ( /'/g, "&apos;" )
             .replace ( /"/g, "&quot;" )
             ;
      }
      wstream.write ( " " + name + '="' + n + '"' ) ;
    }
  }

  var text = this._value ;
  if ( text && ! this.isCDATA )
  {
    text = text.replace ( /&/, "&amp;" ).replace ( /</g, "&lt;" ).replace ( />/g, "&gt;" ) ;
  }

  if ( this._name === "!Text" )
  {
    if ( text ) wstream.write ( indent + text ) ;
  }
  else
  if ( this._name === "!CDATA" )
  {
    wstream.write ( "<![CDATA[" + text + "]]>" ) ;
  }
  else
  {
    if ( this.children.length )
    {
      wstream.write ( ">" ) ;
      
      if ( text.length )
      {
        wstream.write ( text ) ;
      }
      wstream.write ( "\n" ) ;

      for (var i=0, l=this.children.length; i<l; i++)
      {
        this.children[i]._toString ( indent + "  ", wstream ) ;
        wstream.write ( "\n" ) ;
      }
      wstream.write ( indent + "</" + this._name + ">" ) ;
    }
    else
    if ( text.length )
    {
      if ( this.isCDATA )
      {
        wstream.write ( "><![CDATA[" + text + "]]></" + this._name +">" ) ;
      }
      else
      {
        wstream.write ( ">" + text + "</" + this._name +">" ) ;
      }
    }
    else wstream.write ( "/>" ) ;
  }
};
/**
 * Description
 * @return str
 */
XmlElement.prototype.getPath = function()
{
  var str = this._name ;
  var p = this.getParent() ;
  while ( p )
  {
    if ( ! p.parent )
    {
      break ;
    }
    str = p._name + "/" + str ;
    p = p.getParent() ;
  }
  return str ;
};
/**
 * Description
 * @return UnaryExpression
 */
XmlElement.prototype.isRoot = function()
{
  return ! this.parent ;
};
/**
 * Description
 * @param {} visitor
 * @param {} thiz
 */
XmlElement.prototype.visit = function ( visitor, thiz )
{
  if ( typeof visitor === 'function' )
  {
    this._visit ( null, visitor, 0, thiz ) ;
  }
  else
  {
    this._visit ( visitor, null, 0, thiz ) ;
  }
} ;
/*
 * [_visit description]
 * @param  {[type]} visitor  [description]
 * @param  {[type]} fvisitor [description]
 * @param  {[type]} depth    [description]
 * @param  {[type]} thiz     [description]
 * @return {[type]}          [description]
 */
XmlElement.prototype._visit = function ( visitor, fvisitor, depth, thiz )
{
  if ( fvisitor )
  {
    if ( fvisitor.call ( null, this, depth ) === false ) return false ;
    // if ( fvisitor ( this, depth ) === false ) return false ;
  }
  else
  {
    if ( visitor.visit ( this, depth ) === false ) return false ;
  }
  var n = this.children.length ;
  if ( ! n ) return ;

  for ( var i = 0 ; i < n ; i++ )
  {
    if ( this.children[i]._visit ( visitor, fvisitor, depth + 1, thiz ) === false ) return false ;
  }
} ;
/**
 * Description
 * @param {string|XmlElement} p1
 * @param {string} [p2]
 * @param {hash} [attr]
 * @return {XmlElement} new element
 */
XmlElement.prototype.add = function ( p1, p2, attr )
{
  if ( p1 instanceof XmlElement )
  {
    this.children.push ( p1 ) ;
    p1.setParent ( this ) ;
    return p1 ;
  }
  var e = new XmlElement ( p1, p2, attr ) ;
  this.children.push ( e ) ;
  e.setParent ( this ) ;
  return e ;
} ;
/**
 * Description
 * @param {} p1
 * @param {} p2
 * @param {} attr
 * @return e
 */
XmlElement.prototype.addCDATA = function ( p1, p2, attr )
{
  if ( p1 instanceof XmlElement )
  {
    this.children.push ( p1 ) ;
    p1.isCDATA = true ;
    p1.setParent ( this ) ;
    return p1 ;
  }
  var e = new XmlElement ( p1, p2, attr ) ;
  e.isCDATA = true ;
  this.children.push ( e ) ;
  e.setParent ( this ) ;
  return e ;
} ;
/**
 * Description
 * @param {} e
 * @param {} index
 * @return e
 */
XmlElement.prototype.insertAt = function ( e, index )
{
  if ( index < 0 )
  {
    return this.add ( e ) ;
  }
  if ( index >= this.children.length )
  {
    return this.add ( e ) ;
  }
  this.children.splice  ( index, 0, e ) ;
  e.setParent ( this ) ;
  return e ;
};
/**
 * Description
 * @return e
 */
XmlElement.prototype.duplicate = function()
{
  var e = null ;
  if ( this instanceof XmlTree ) e = new XmlTree() ;
  else                           e = new XmlElement() ;
  for ( var key in this._attributes )
  {
    e._attributes[key] = this._attributes[key] ;
  }
  e._name = this._name ;
  e._value = this._value ;
  e._cdata = this._cdata ;
  e.isCDATA = this.isCDATA ;
  if ( this.children )
  {
    e.children = [] ;
    var size = this.children.length ;
    for ( var i = 0 ; i < size ; i++ )
    {
      var ee = this.children[i] ;
      var dup = ee.duplicate() ;
      dup.setParent ( e ) ;
      e.children.push ( dup ) ;
    }
  }
  return e ;
};
/**
 * Description
 * @param {} properties
 * @return eNew
 */
XmlElement.prototype.duplicateConditional = function ( properties )
{
  var eNew = null ;
  if ( this instanceof XmlTree )
  {
    eNew = new XmlTree() ;
  }
  else
  {
    eNew = new XmlElem() ;
  }
  for ( var key in this._attributes )
  {
    eNew._attributes[key] = this._attributes[key] ;
  }
  if ( !this.children ) return eNew ;
  this._duplicateConditional ( eNew, this.children, properties ) ;
  return eNew ;
};
XmlElement.prototype._duplicateConditional = function ( parentNew
                                                      , srcChildren
                                                      , properties
                                                      )
{
  if ( ! srcChildren.length ) return ;
  var i ;
  var property ;
  var value ;
  var ch ;
  var operator ;
  var ne ;
  var result ;
  for ( i = 0 ; i < srcChildren.length ; i++ )
  {       
    ch = srcChildren[i] ;
        
    if ( ch._name === "define" )
    {
      property = ch.getAttribute ( "property" ) ;
      if ( typeof property !== 'string' )
      {
        console.log ( "Missing 'property' attribute in:\n" + ch.toString() ) ;
        continue ;
      }
      value = ch.getAttribute ( "value", "true" ) ;
      if ( typeof value !== 'string' )
      {
        console.log ( "Missing 'value' attribute in:\n" + ch.toString() ) ;
        continue ;
      }
      properties[property] = value ;
      continue ;
    }
    if (  ch._name === "if"
       || ch._name === "elseif"
       )
    {
      property = ch.getAttribute ( "property" ) ;
      if ( typeof property !== 'string' )
      {
        console.log ( "Missing 'property' attribute in:\n" + ch.toString() ) ;
        continue ;
      }
      operator = ch.getAttribute ( "operator", "defined" ) ;
        
      if ( operator === "defined" ) 
      { 
        this._duplicateConditional ( parentNew, ch.children, properties ) ;
        i++ ;
        for ( ; i < srcChildren.length ; i++ )
        {
          ne = srcChildren[i] ;
          if ( ne === "elseif" ) continue ;
          if ( ne === "else" ) continue ;
          i-- ;
          break ;
        }
        continue ;
      }
      if ( operator === "undefined" )
      {
        this._duplicateConditional ( parentNew, ch.children, properties ) ;
        i++ ;
        for ( ; i < srcChildren.length ; i++ )
        {
          ne = srcChildren[i] ;
          if ( ne === "elseif" ) continue ;
          if ( ne === "else" ) continue ;
          i-- ;
          break ;
        }
        continue ;
      }

      result = this._evaluateProperty ( null, properties, ch ) ;
      if (  typeof result !== 'string'
         && typeof result !== 'number'
         && typeof result !== 'boolean'
         )
      {
        continue ;
      }
      
      this._duplicateConditional ( parentNew, ch.children, properties ) ;
      i++ ;
      for ( ; i < srcChildren.length ; i++ )
      {
        ne = srcChildren[i] ;
        if ( ne === "elseif" ) continue ;
        if ( ne === "else" ) continue ;
        i-- ;
        break ;
      }
      continue ;
    }
    if ( ch._name === "else" )
    {
      if ( ch.children.length )
      {
        this._duplicateConditional ( parentNew, ch.children, properties ) ;
      }
      continue ;
    }
    e = parentNew.add ( ch._name, ch._value ) ;
    e._cdata = ch._cdata ;
    e.isCDATA = ch.isCDATA
    for ( var key in ch._attributes )
    {
      e._attributes[key] = ch._attributes[key] ;
    }
    if ( ch.children.length )
    {
      this._duplicateConditional ( e, ch.children, properties ) ;
    }
  }
};
XmlElement.prototype._evaluateProperty = function ( propertyValue, properties, e )
{
  var name ;
  var value ;
  var operator ;
  var i ;
  if ( typeof propertyValue !== 'string' )
  {
    name = e.getAttribute ( "property" ) ;
    if ( typeof name !== 'string' ) return ;
    if ( properties ) propertyValue = properties[name] ;
    if ( propertyValue == null ) propertyValue = T.getProperty ( name ) ;
  }
  value    = e.getAttribute ( "value" ) ;
  operator = e.getAttribute ( "operator" ) ;

  if ( typeof operator !== 'string' ) return propertyValue ;

  if ( operator === "eq" )
  {
    if ( typeof value !== 'string' ) return ;
    if ( value === propertyValue )
    {
      return propertyValue ;
    }
    else                           return ;
  }
  if ( operator === "ne" )
  {
    if ( typeof value !== 'string' ) return ;
    if ( value !== propertyValue ) return propertyValue ;
    else                           return ;
  }
  if ( operator === "contains" )
  {
    if ( typeof value !== 'string' ) return ;
    if ( propertyValue.indexOf ( value ) >= 0 ) return propertyValue ;
    else                                        return ;
  }
  if ( operator === "containsic" )
  {
    if ( typeof value !== 'string' ) return ;
    if ( propertyValue.toUpperCase().indexOf ( value.toUpperCase() ) >= 0 ) return propertyValue ;
    else                                                                    return null ;
  }
  if ( operator === "not-contains" )
  {
    if ( typeof value !== 'string' ) return ;
    if ( propertyValue.indexOf ( value ) < 0 ) return propertyValue ;
    else                                       return ;
  }
  if ( operator === "not-containsic" )
  {
    if ( typeof value !== 'string' ) return ;
    if ( propertyValue.toUpperCase().indexOf ( value.toUpperCase() ) < 0 ) return propertyValue ;
    else                                                                   return null ;
  }
  if ( operator === "in" )
  {
    if ( typeof value !== 'string' ) return ;
    var list = Utils.splitCsv ( value ) ;
    if ( list.indexOf ( propertyValue ) >= 0 )
    {
      list.length = 0 ;
      return propertyValue ;
    }
    list.length = 0 ;
    return null ;
  }
  if ( operator === "not-in" )
  {
    if ( typeof value !== 'string' ) return ;
    var list = Utils.splitCsv ( value ) ;
    if ( list.indexOf ( propertyValue ) < 0 )
    {
      list.length = 0 ;
      return propertyValue ;
    }
    list.length = 0 ;
    return null ;
  }
  if ( operator === "matches" )
  {
    try
    {
      if ( typeof value !== 'string' ) return ;
      var regex = new RegExp ( value ) ;
      if ( regex.test ( propertyValue ) ) return propertyValue ;
      else                                return ;
    }
    catch ( exc )
    {
      console.log ( "propertyValue: " + propertyValue ) ;
      console.log ( "value: " + value ) ;
      console.log ( "operator: " + operator ) ;
      console.log ( exc ) ;
      return ;
    }
  }
  try
  {
    var dproperty = parseFloat ( propertyValue ) ;
    var dvalue    = parseFloat ( value ) ;

    if ( operator === "lt" )
    {
      if ( dproperty < dvalue ) return propertyValue ;
      else                      return  ;
    }
    else
    if ( operator === "le" )
    {
      if ( dproperty <= dvalue ) return propertyValue ;
      else                       return  ;
    }
    else
    if ( operator === "ge" )
    {
      if ( dproperty >= dvalue ) return propertyValue ;
      else                       return  ;
    }
    else
    if ( operator === "gt" )
    {
      if ( dproperty > dvalue ) return propertyValue ;
      else                      return  ;
    }
  }
  catch ( exc )
  {
    console.log ( "propertyValue: " + propertyValue ) ;
    console.log ( "value: " + value ) ;
    console.log ( "operator: " + operator ) ;
    console.log ( exc ) ;
    return ;
  }

  return ;
};
/**
 * Description
 * @return ObjectExpression
 */
XmlElement.prototype.toJSON = function()
{
  return { type:'Xml', 'value': this.toString() } ;
};

/**
 * @constructor
 * @extends XmlElement
 * @param {string} [name="xml"] - root tag name
 */
var XmlTree = function ( name )
{
  if ( ! name ) name = 'xml' ;
  XmlElement.call ( this, XmlElement, name ) ;
};
util.inherits ( XmlTree, XmlElement ) ;

XmlTree.prototype._setCollectedElements = function ( list )
{
  this.collectedElements = list ;
};
/**
 * Description
 * @method
 * @return MemberExpression
 */
XmlTree.prototype.getCollectedElements = function()
{
  return this.collectedElements ;
};

var EventEmitter = require ( "events" ).EventEmitter ;
/**
 * @constructor
 * @class
 * @param {requestCallback} callbackCloseTag
 */
var XmlFactory = function ( callbackCloseTag )
{
  EventEmitter.call ( this ) ;
  this.callbackCloseTag = undefined ;
  if ( typeof callbackCloseTag === 'function' )
  {
    this.callbackCloseTag = callbackCloseTag ;
  }
};
util.inherits ( XmlFactory, EventEmitter ) ;
/**
 * Description
 * @method
 * @param {string|stream.Readable} source
 */
XmlFactory.prototype.create = function ( source )
{
  if ( ! source )
  {
    throw new Error ( "No XML to create!" ) ;
  }
  // if ( typeof source === 'string' )
  {
    var x = new XmlTree() ;
    var elementStack = [x];
    this.currentChild = x ;
    var thiz = this ;
    var parser = null ;

    if ( source instanceof stream.Readable )
    {
      parser = sax.createStream ( true ) ; //, options)      
    }
    else
    if ( typeof source === 'string' )
    {
      source = source.trim() ;
      parser = sax.parser(true)
    }
    /*
     * Description
     * @param {} text
     */
    parser.ontext = function ( text ) { thiz.currentChild._ontext ( text ) } ;
    /*
     * Description
     * @param {} cdata
     */
    parser.oncdata = function ( cdata ) { thiz.currentChild._oncdata ( cdata ) } ;
    /*
     * Description
     */
    parser.onprocessinginstruction = function()
    {
      var pi = arguments[0] ;
      if ( pi._name === "xml" )
      {
    // console.log ( "parser_processinginstruction" ) ;
    // console.log ( pi.body ) ;
      }
    } ;
    var first = true ;
    /*
     * Description
     * @param {} tag
     */
    parser.onopentag = function ( tag )
    {
      if ( elementStack[0] === x && first )
      {
        first = false ;
        x._name = tag.name;
        x._attributes = tag.attributes || {};
      }
      else
      {
        var child = new XmlElement(tag);
        elementStack[0].add ( child ) ;
        thiz.currentChild = child ;
        elementStack.unshift ( child ) ;
      }
    } ;
    /*
     * Description
     */
    parser.onclosetag = function()
    {
      if ( thiz.callbackCloseTag )
      {
        thiz.callbackCloseTag.call ( null, elementStack[0] ) ;
      }
      elementStack.shift();
      thiz.currentChild = elementStack[0] ;
    } ;
    if ( source instanceof stream.Readable )
    {
      parser.on ( "end", function (e)
      {
        thiz.emit ( "end", x ) ;
      }) ;
      parser.on ( "error", function (e)
      {
        thiz.emit ( "error", e ) ;
        this._parser.error = null
        this._parser.resume()
      });
    }
    if ( source instanceof stream.Readable )
    {
      source.pipe ( parser ) ;
      // parser.end() ;
    }
    else
    {
      parser.write ( source ) ;
      parser.close() ;
    }
    return x ;
  }
};

module.exports = {
  XmlElement: XmlElement,
  XmlTree: XmlTree,
  XmlFactory: XmlFactory,
  "enumerate":true
} ;

if ( require.main === module )
{
  var xml = new XmlTree ( ) ;
  var e = xml.add ( "child", "John" ) ;
  e.addAttribute ( "dateOfBirth", "1975-03-31" ) ;
  xml.add ( "child", "Jack", { dateOfBirth: "1977-02-01" } ) ;
  xml.add ( "child", "George", { dateOfBirth: "1979-12-01" } ) ;

  e = new XmlElement ( "child", "Michael", { dateOfBirth: "1981-12-01" } ) ;
  xml.add ( e ) ;
  xml.add ( "toBeReplaced", { end: "9999-12-31", start: "2014-01-01" } ) ;
  var xif = xml.add ( "if", { property:"TEST" } ) ;
  xif.add ( "optionalElement" ) ;

  var xif = xml.add ( "if", { property:"NUMBER", value:"1", operator:"gt" } ) ;
  xif.add ( "optionalElement2" ) ;

  var xif = xml.add ( "if", { property:"LOGNAME" } ) ;
  xif.add ( "optionalElement3" ) ;

  var xif = xml.add ( "if", { property:"partner", value:"gess", operator:"contains" } ) ;
  xif.add ( "optionalElement4" ) ;

  var xif = xml.add ( "if", { property:"partner", value:"a,b,gess,c", operator:"in" } ) ;
  xif.add ( "optionalElement5" ) ;

  console.log ( xml.toString() ) ;
  console.log ( "---------- duplicate ----------------" ) ;
  var xdup = xml.duplicate()
  console.log ( "" + xdup.toString() ) ;

  console.log ( "---------- duplicate conditional ----------------" ) ;
  var xxdup = xml.duplicateConditional ( { TEST:true, NUMBER:1.2, partner:"gess", partner_list:"a,b,gess,c" } ) ;
  console.log ( "" + xxdup.toString() ) ;
process.exit() ;

  console.log ( "---------- various access methods ----------------" ) ;
  var ch1 = xml.elem ( "child[last()]" ) ;
  console.log ( "1 - " + ch1.toString() ) ;
  ch1 = xml.elem ( "*[last()]" ) ;
  console.log ( "2 - " + String ( ch1 ) ) ;
  ch1 = xml.elem ( "child[@dateOfBirth=1979-12-01]" ) ;
  console.log ( "3 - " + String ( ch1 ) ) ;
  ch1 = xml.elem ( "*[@end]" ) ;
  console.log ( "4 - " + String ( ch1 ) ) ;
  var str = xml.valueOf ( "*[@dateOfBirth=1979-12-01]/@dateOfBirth" ) ;
  console.log ( "5 - " + str ) ;
  str = xml.valueOf ( "*[@end]/@start" ) ;
  console.log ( "6 - " + str ) ;

// process.exit() ;

  var str = xml.toString() ;
  console.log ( "---------- reparse xml string ----------------" ) ;
  var tree = new XmlFactory().create ( str ) ;

  console.log ( tree.toString() ) ;
  var child = tree.elem ( "child" ) ;
  child.add ( "grandchild", "Ann", { dateOfBirth: "2002-12-01" } ) ;
  child.add ( "grandchild", "Rita", { dateOfBirth: "2003-12-01" } ) ;
  child.add ( "additional", "Multiplex" ) ;
  child.add ( "toBeReplaced" ) ;
  child = tree.elem  ( "child[2]" ) ;
  child.add ( "grandchild", "Monica", { dateOfBirth: "2004-12-01" } ) ;
  child.add ( "grandchild", "Matilda", { dateOfBirth: "2004-12-01" } ) ;
  tree.add ( "Start", new Date() ) ;
  console.log ( tree.toString() ) ;
  console.log ( "Start=" + tree.valueOf ( "Start") ) ;

process.exit() ;

  console.log ( "\nName of first child: '%s'\n", tree.valueOf ( "child" ) ) ;

  console.log ( "-------------- Iterate over children -------------" ) ;
  var n = 0 ;
  tree.elements ( function ( e )
  {
    n++ ;
    console.log ( "n=" + n ) ;
    console.log ( "  " + e.toString() ) ;
    console.log ( "  dateOfBirth: '%s'", e.valueOf ( "@dateOfBirth" ) ) ;
    console.log ( "  Name of child: '%s'", e.valueOf() ) ;
  }) ;

  var grandchild = tree.elem ( "child/grandchild" ) ;
  console.log ( "\nFirst grandchild: %s\n", grandchild ) ;
  console.log ( "\nSecond grandchild: %s\n", tree.elem ( "child/grandchild[2]" ) ) ;
  
  var path = grandchild.getPath() ;
  console.log ( "Path of firstGrandchild=" + path ) ;

  var listOfGrandchilds = tree.select ( "child/grandchild" ) ;

  console.log ( "-------------- List of grandchilds -------------" ) ;
  for ( n = 0 ; n < listOfGrandchilds.length ; n++ )
  {
    console.log ( "[" + n + "]" + listOfGrandchilds[n].toString() ) ;
  }
  // var fOut = new File ( "x.xml" ) ;
  // fOut.write ( results ) ;

  console.log ( "-------------- Vist all elements ---------------" ) ;
  tree.visit ( function ( x, depth )
  {
    console.log ( "" + x._name ) ;
  }) ;
  tree.remove ( "child/additional" ) ;
  tree.elem ( "child" ).setValue   ( "Albert" ) ;
  tree.elem ( "child[2]/grandchild" ).setValue   ( "Robert" ) ;
  console.log ( tree.toString() ) ;
  var toBeReplaced = tree.elem ( "child/toBeReplaced" ) ;
  toBeReplaced.replace ( new XmlElement ( "grandchild", "Michael", { dateOfBirth: "1999-12-01" } ) ) ;
  console.log ( tree.toString() ) ;

  var secondChild = tree.elem ( "child[2]" ) ;
  secondChild.insertAt ( new XmlElement ( "number-1" ), 0 ) ;
  secondChild.insertAt ( new XmlElement ( "number-3" ), 2 ) ;
  console.log ( tree.toString() ) ;
}
