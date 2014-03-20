var T = require ( "Tango" ) ;
require ( 'LocalizedMessages' ) ;
require ( 'Substitutor' ) ;

/**
  * @constructor
  */
var Localizer = function ( localizedMessages )
{
  if ( typeof localizedMessages === 'string' )
  {
    this._LocalizedMessages = new tangojs.LocalizedMessages ( localizedMessages ) ;
  }
  else
  {
    this._LocalizedMessages = localizedMessages ;
  }
}
/** */
Localizer.prototype.setLocaleCode = function ( localeString )
{
  this._LocalizedMessages.setLocaleCode ( localeString ) ;
};
/** */
Localizer.prototype.translate = function ( text, args, defaultString )
{
  var s = this._LocalizedMessages.getText ( text, args, defaultString, null ) ;
  return s ;
};
/** */
Localizer.prototype.localize = function ( src )
{
  var delimiter  = '%' ;
  if ( src.length == 0 ) return src ;

  var tgt = "" ;

  var i = 0 ;
  var j ;
  var name ;
  var n, v ;
  for ( i = 0 ; i < src.length ; i++ )
  {
    var c = src.charAt ( i ) ;
    if ( c == delimiter )
    {
      var found = false ;
      j = i + 1 ;
      for ( ; j < src.length ; j++ )
      {
        if ( src.charAt ( j ) === delimiter )
        {
          found = true ;
          break ;
        }
      }
      if ( found )
      {
        name = "" ;
        for ( i++ ; i < j ; i++ )
        {
          name += src.charAt ( i ) ;
        }
        n = name ;
        v = this._LocalizedMessages.getText ( n ) ;
        if ( v )
        {
          if ( v.indexOf ( '\'' ) >= 0 )
          {
            for ( var iv = 0 ; iv < v.length ; iv++ )
            {
              if ( v.charAt ( iv ) == '\'' ) tgt += "&apos;" ;
              else                           tgt += v.charAt ( iv ) ;
            }
          }
          else
          {
            tgt += v ;
          }
        }
        else
        {
          tgt += '%' ;
          tgt += name ;
          i-- ;
        }
      }
      else tgt += c ;
    }
    else
    {
      tgt += c ;
    }
  }
  return tgt ;
};
if ( typeof tangojs === 'object' && tangojs ) tangojs.Localizer = Localizer ;
else tangojs = { Localizer:Localizer } ;
module.exports = Localizer ;

if ( require.main === module )
{
  // var lm = new LocalizedMessages ( "localized.messages.xml" ) ;
  // var l = new Localizer ( lm ) ;
  var l = new Localizer ( "localized.messages.xml" ) ;
  var t = "xxxxx%%xxxx %Cancel% mmmmmmmmmm%Close%lllllllll%HelpOOOOOOO%XXXXXX%--" ;
  var tt = l.localize ( t ) ;
  console.log ( "t=" + t ) ;
  console.log ( "tt=" + tt ) ;
}
