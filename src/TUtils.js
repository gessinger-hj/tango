var T = require ( "Tango" ) ;
/**
 *  @constructor
 */
MultiHash = function()
{
  this._hash = {} ;
  this.className = "MultiHash" ;
};
MultiHash.prototype =
{
  put: function ( key, obj )
  {
    var l = this._hash[key] ;
    if ( ! l )
    {
      l = [] ;
      this._hash[key] = l ;
    }
    l.push ( obj ) ;
  },
  remove: function ( key, obj )
  {
    var l = this._hash[key] ;
    if ( ! obj )
    {
      if ( ! l ) return false ;
      delete this._hash[key] ;
      return true ;
    }
    l = this._hash[key] ;
    if ( ! l ) return false ;
    l.remove ( obj ) ;
    if ( ! l.length )
    {
      delete this._hash[key] ;
    }
    return obj ;
  },
  get: function ( key )
  {
    var l = this._hash[key] ;
    return l ;
  },
  getKeys: function()
  {
    var a = [] ;
    for ( var k in this._hash )
    {
      if ( typeof ( this._hash[k] ) === 'function' ) continue ;
      a.push ( k ) ;
    }
    return a ;
  },
  toString: function()
  {
    var str = "(MultiHash)" ;
    // str += "size=" + this._hash.length ;
    for ( var k in this._hash )
    {
      var l = this._hash[k] ;
      if ( ! T.isArray ( l ) ) continue ;
      str += "\n  key=" + k + ",size=" + l.length ;
      for ( var i = 0 ; i < l.length ; i++ )
      {
        str += "\n    " + i + ":" + l[i] ;
      }
    }
    return str ;
  },
  flush: function()
  {
    delete this._hash ;
  }
  // toJSON: function()
  // {
  //   return { _hash: this._hash, className: this.className } ;
  // }
};
module.exports.MultiHash = MultiHash ;