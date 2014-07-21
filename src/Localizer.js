var T = require ( "./Tango.js" ) ;
var LocalizedMessages = require ( './LocalizedMessages.js' ) ;
var Substitutor = require ( './Substitutor.js' ) ;

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
  var sub = new Substitutor() ;
  return sub.substitute ( src, this._LocalizedMessages, false, delimiter, true ) ;
};

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
