var T = require ( "./Tango" ) ;
/**
 * Description
 * @param {} str
 * @param {} del
 * @return l
 */
function splitCsv ( str, del )
{
  var startIndex = 0 ;
  if ( ! del ) del = ',' ;

  var l = [] ;

  var sb = "" ;

  var q = 0 ;
  var lastWasQ = false ;
  var len = str.length ;
  for ( var i = 0 ; i < len ; i++ )
  {
    var c = str.charAt ( i ) ;
    if ( c == '\\' && i + 1 < len )
    {
      i++ ;
      sb += str.charAt ( i ) ;
      continue ;
    }
    if ( q !== 0 )
    {
      if ( c === q )
      {
        if ( i < str.length - 2 && str.charAt ( i + 1 ) === q )
        {
          i++ ;
        }
        else
        {
          l.push ( sb ) ;
          sb = "" ;
          q = 0 ;
          lastWasQ = true ;
          continue ;
        }
      }
      sb += str.charAt ( i ) ;
      continue ;
    }
    if ( str.charAt ( i ) === '\'' )
    {
      if ( sb.length == 0 ) q = '\'' ;
      else                  sb += str.charAt ( i ) ;
      continue ;
    }
    if ( str.charAt ( i ) === '"' )
    {
      if ( sb.length === 0 ) q = '"' ;
      else                   sb += str.charAt ( i ) ;
      continue ;
    }
    if ( c === del )
    {
      if ( ! lastWasQ ) l.push ( sb ) ;
      sb = "" ;
    }
    else
    {
      sb += str.charAt ( i ) ;
    }
    lastWasQ = false ;
  }
  if ( ! lastWasQ ) l.push ( sb ) ;
  return l ;
}
module.exports.splitCsv = splitCsv ;

/**
 * Description
 * @param {} t
 * @return t
 */
function stripQuotes ( t )
{
  t = t.trim() ;
  var c0 = t.charAt ( 0 ) ;
  var cn = t.charAt ( t.length - 1 ) ;
  if ( c0 === cn && ( c0 === '"' || c0 === "'" ) )
  {
    t = t.substring ( 1, t.length - 1 )
  }
  return t ;
}
module.exports.stripQuotes = stripQuotes ;
/**
 * Description
 * @param {} str
 * @param {} map
 * @param {} del
 * @return map
 */
function parseNameValues ( str, map, del )
{
  if ( ! map ) map = {} ;
  if ( ! del ) del = ',' ;
  var l = splitCsv ( str, del ) ;
  for ( var i = 0 ; i < l.length ; i++ )
  {
    var t = stripQuotes ( l[i] ) ;
    var pos = t.indexOf ( "=" ) ;
    if ( pos > 0 )
    {
      var k = t.substring ( 0, pos ) ;
      var v = t.substring ( pos + 1 ) ;
      k = k.trim() ;
      if ( ! k ) continue ;
      v = stripQuotes ( v ) ;
      map[k] = v ;
    }
  }
  return map ;
}
module.exports.parseNameValues = parseNameValues ;

module.exports["enumerate"] = true ;

