var T = require ( "Tango" ) ;
var txml = require ( 'TXml' ) ;
var File = require ( 'TFile' ) ;

/**
	* @constructor
	*/
LocalizedMessages = function ( file, localeString )
{
	this.file = new File ( file ) ;
	this.xml = this.file.toXml() ;
	this._localeStringToNameToText = [] ;
  this._LocaleString = null ;
  this._LanguageString = null ;

	this.setLocaleCode ( localeString ) ;
};
/** */
LocalizedMessages.prototype.setLocaleCode = function ( localeString )
{
  this._LocaleString = localeString ;
  if ( ! this._LocaleString ) this._LocaleString = T.getConfig().getLocaleCode() ;
  var pos = this._LocaleString.indexOf ( '_' ) ;
  if ( pos > 0 )
  {
    this._LanguageString = this._LocaleString.substring ( 0, pos ) ;
  }
  else
  {
    this._LanguageString = this._LocaleString ;
  }
};
/** */
LocalizedMessages.prototype.getText = function ( name, args, defaultString, lc )
{
  var localeString = this._LocaleString ;
  var languageString = this._LanguageString ;
  if ( lc )
  {
    localeString = lc ;
    var pos = localeString.indexOf ( '_' ) ;
    if ( pos > 0 )
    {
      languageString = localeString.substring ( 0, pos ) ;
    }
    else
    {
      languageString = localeString ;
    }
  }
  if (  name.indexOf ( '\n' ) >= 0
     || name.indexOf ( '[' ) >= 0
     )
  {
    return defaultString ;
  }
  var nameToText = this._localeStringToNameToText[localeString] ;

  if ( ! nameToText ) nameToText = this._localeStringToNameToText[languageString] ;

  if ( ! nameToText )
  {
    nameToText = [] ;
    this._localeStringToNameToText[localeString] = nameToText ;
    this._localeStringToNameToText[languageString] = nameToText ;
  }

  var e_name = this.xml.elem ( name ) ;
  if ( ! e_name ) return defaultString ;

  var text = nameToText[name] ;
  if ( text )
  {
    if ( ! args ) return text ;
    return this.substituteDollarParameter ( text, args ) ;
  }

  var e = e_name.elem ( localeString ) ;
  if ( ! e )
  {
    e = e_name.elem ( languageString ) ;
  }
  if ( e != null )
  {
    if ( e.isCDATA )
    {
      text = e.valueOf() ;
      nameToText[name] = text ;
      if ( ! args ) return text ;
      return this.substituteDollarParameter ( text, args ) ;
    }
  }
  if ( e != null && e.valueOf().trim().length > 0 ) text = e.valueOf() ;
  else
  {
    text = e_name.valueOf() ;
    if ( text.length > 0 ) {}
    else
    {
      e = e_name.elemAt ( 0 ) ;
      if ( e != null ) text = e.valueOf() ;
      else             text = name ;
    }
  }
  nameToText[name] = text ;
  if ( ! args == null ) return text ;
  return this.substituteDollarParameter ( text, args ) ;
};
/** */
LocalizedMessages.prototype.substituteDollarParameter = function ( str, args )
{
  if ( ! str ) return str ;
  if ( typeof args === 'string' )
  {
  	args = [ args ] ;
  }
  if ( ! T.isArray ( args ) ) return str ;
  for ( var i = 0 ; i < args.length ; i++ )
  {
    str = str.replace ( "\$" + i, args[i] ) ;
  }
  return str ;
};
module.exports = LocalizedMessages ;
if ( require.main === module )
{
	var lm = new LocalizedMessages ( "localized.messages.xml" ) ;
	var t ;
	t = lm.getText ( "QuestionDownloadFile", "aaaaaa.xls", "" ) ;
	console.log ( "1 t=" + t ) ;
	t = lm.getText ( "QuestionDownloadFile", "aaaaaa.xls", "", "en" ) ;
	console.log ( "2 t=" + t ) ;
	t = lm.getText ( "QuestionDownloadFile", "aaaaaa.xls", "", "en_US" ) ;
	console.log ( "3 t=" + t ) ;
}