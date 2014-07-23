if ( typeof tangojs === 'undefined' ) tangojs = {} ;
/**
 *  @constructor
 * @method MultiHash
 * @return 
 */
tangojs.MultiHash = function()
{
  this._hash = {} ;
  this.className = "MultiHash" ;
};
tangojs.MultiHash.prototype =
{
  /**
   * Description
   * @method put
   * @param {} key
   * @param {} obj
   * @return 
   */
  put: function ( key, obj )
  {
    var l = this._hash[key] ;
    if ( ! l )
    {
      l = [] ;
      this._hash[key] = l ;
    }
    if ( l.indexOf ( obj ) >= 0 )
    {
      return ;
    }
    l.push ( obj ) ;
  },
  /**
   * Description
   * @method getKeysOf
   * @param {} obj
   * @return list
   */
  getKeysOf: function ( obj )
  {
    var list = [] ;
    var keys = this.getKeys() ;
    for ( var i = 0 ; i < keys.length ; i++ )
    {
      var l = this._hash[keys[i]]
      if ( l.indexOf ( obj ) >= 0 )
      {
        list.push ( keys[i] ) ;
      }
    }
    return list ;
  },
  /**
   * Description
   * @method remove
   * @param {} key
   * @param {} obj
   * @return obj
   */
  remove: function ( key, obj )
  {
    var l ;
    var index ;
    if ( key && typeof key === 'object' )
    {
      obj = key ;
      var keys = this.getKeys() ;
      for ( var i = 0 ; i < keys.length ; i++ )
      {
        l = this._hash[keys[i]]
        index = l.indexOf ( obj ) ;
        if ( index < 0 ) continue ;
        l.splice ( index, 1 ) ;
        if ( ! l.length )
        {
          delete this._hash[keys[i]] ;
        }
      }
      return ;
    }
    l = this._hash[key] ;
    if ( ! l ) return false ;
    if ( ! obj )
    {
      l.length = 0 ;
      delete this._hash[key] ;
      return true ;
    }
    index = l.indexOf ( obj ) ;
    if ( index >= 0 )
    {
      l.splice ( index, 1 ) ;
    }
    if ( ! l.length )
    {
      delete this._hash[key] ;
    }
    return obj ;
  },
  /**
   * Description
   * @method get
   * @param {} key
   * @return l
   */
  get: function ( key )
  {
    var l = this._hash[key] ;
    return l ;
  },
  /**
   * Description
   * @method getKeys
   * @return a
   */
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
  /**
   * Description
   * @method toString
   * @return str
   */
  toString: function()
  {
    var str = "(MultiHash)" ;
    // str += "size=" + this._hash.length ;
    for ( var k in this._hash )
    {
      var l = this._hash[k] ;
      if ( ! Array.isArray ( l ) ) continue ;
      str += "\n  key=" + k + ",size=" + l.length ;
      for ( var i = 0 ; i < l.length ; i++ )
      {
        str += "\n    " + i + ":" + l[i] ;
      }
    }
    return str ;
  },
  /**
   * Description
   * @method flush
   * @return 
   */
  flush: function()
  {
    delete this._hash ;
  }
};
if ( typeof document === 'undefined' && typeof module !== 'undefined' && typeof require !== 'undefined' )
{
  module.exports = tangojs.MultiHash ;
}

