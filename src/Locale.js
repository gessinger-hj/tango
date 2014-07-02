var T = require ( "Tango" ) ;

/**
 *  @constructor
 */
var LocaleFactoryClass = function()
{
  this.language = "en" ;
  this.defaultLocaleCode = T.getProperty ( "LANG", "en_US" ) ;
  if ( this.defaultLocaleCode.indexOf ( '.' ) > 0 )
  {
    this.defaultLocaleCode = this.defaultLocaleCode.substring ( 0, this.defaultLocaleCode.indexOf ( '.' ) ) ;
  }
  this.language = this.defaultLocaleCode.substring ( 0, this.defaultLocaleCode.indexOf ( '_' ) ) ;
  this.defaultLocale = null ;
};
LocaleFactoryClass.prototype.isLocale = function ( obj )
{
  return obj instanceof Locale ;
};
LocaleFactoryClass.prototype.getInstance = function ( optionalLocaleCode )
{
  if ( ! optionalLocaleCode ) return this.getDefault() ;
  return new Locale ( optionalLocaleCode ) ;
};
LocaleFactoryClass.prototype.getDefault = function ()
{
  if ( ! this.defaultLocale )
  {
    this.defaultLocale = new Locale() ;
  }
  return this.defaultLocale ;
};
LocaleFactoryClass.prototype.setDefault = function ( defaultLocale )
{
  var l = this.defaultLocale ;
  if ( defaultLocale instanceof Locale )
  {
    this.defaultLocale = defaultLocale ;
  }
  if ( typeof defaultLocale === 'string' )
  {
    var ll = new Locale ( defaultLocale ) ;
    if ( ll ) l = this.defaultLocale = ll ;
  }
  return l ;
};
LocaleFactoryClass.prototype.getLocaleCode = function()
{
  return this.defaultLocaleCode ;
};
LocaleFactoryClass.prototype.setLanguage = function ( lang )
{
  if ( lang ) this.language = lang  ;
};
LocaleFactoryClass.prototype.getLanguage = function()
{
  return this.language ;
};
LocaleFactoryClass.prototype.getLocalePath = function()
{
  return T.getConfigPath() ;
};
LocaleFactoryClass.prototype.getLocaleXml = function ( localeCode )
{
  if ( ! localeCode ) localeCode = this.defaultLocaleCode ;
  var File = require ( "File" ) ;

  var f = new File ( this.getLocalePath(), "Locale." + localeCode + ".xml" ) ;
  if ( ! f.exists() )
  {
    if ( localeCode.length === 5 )
    {
      f = new File ( this.getLocalePath(), "Locale." + localeCode.substring ( 0, 2 ) + ".xml" ) ;
    }
  }
  if ( ! f.exists() )
  {
    f = new File ( this.getLocalePath(), "Locale." + "en_US" + ".xml" ) ;
  }
  return f.toXml() ;
};
var LocaleFactory = new LocaleFactoryClass() ;
/**
 *  @constructor
 */
var Locale = function ( optionalLocationCode )
{
  this.currencySymbol = undefined ;
  this.internationalCurrencySympol = undefined ;
  this.MonetaryDecimalSeparator = undefined ;
  this.DecimalSeparator = undefined ;
  this.GroupingSeparator = undefined ;
  this.CurrencySymbolInFront = undefined ;
  this.languageCode = null ;
  this.countryCode = null ;
  this.xml = LocaleFactory.getLocaleXml ( optionalLocationCode ) ;
  this.setFormats() ;
} ;
Locale.prototype =
{
  SHORT: 1,
  MEDIUM: 2,
  LONG: 3,
//   setInternationalCurrencySymbol: function ( symbol )
//   {
//     this.internationalCurrencySymbol = symbol ;
//     var url = ACSys.getMainUrl()+"&action=GetCurrencySymbol&ICS=" + this.internationalCurrencySymbol ;
//     var x = new ACXml ( ACSys.getXml ( url ) ) ;
//     this.currencySymbol = x.getContent ( "CurrencySymbol" ) ;
// //    this.CurrencySymbolInFront = x.getBool ( "CurrencySymbolInFront", true ) ;
//   },
  setFormats: function()
  {
    var str = this.xml.getContent ( "FormatSymbols/Date" ) ;
    if ( ! str ) return ;
    var a = eval ( str ) ;
    var lang = a[0] ;
    this._userLanguage = lang ;
    this._monthNames = a[1] ;
    this._dayNames = a[2] ;
    this._dateFormatShort = a[3] ;
    this._dateFormatMedium = a[4] ;
    this._dateFormatLong = a[5] ;
    this._dateTimeFormatShort = a[6] ;
    this._dateTimeFormatMedium = a[7] ;
    this._dateTimeFormatLong = a[8] ;
  },
  flush: function()
  {
    this.xml = undefined ;
  },
  getLanguage: function()
  {
    if ( this.languageCode ) return this.languageCode ;
    if ( ! this.xml ) return LocaleFactory.getLanguage() ;
    var l = this.xml.getContent ( "Language" ) ;
    if ( ! l ) l = LocaleFactory.getLanguage() ;
    if ( l.indexOf ( '_' ) == 2 && l.length == 5 )
    {
      this.countryCode = l.substring ( 3 ) ;
      this.languageCode = l.substring ( 0, 2 ) ;
    }
    else
    {
      this.countryCode = l.toUpperCase() ;
      this.languageCode = l ;
    }
    return this.languageCode ;
  },
  getCountryCode: function()
  {
    if ( this.countryCode ) return this.countryCode ;
    if ( ! this.xml ) return "DE" ;
    var l = this.xml.getContent ( "Language", "de_DE" ) ;
    if ( l.indexOf ( '_' ) == 2 && l.length == 5 )
    {
      this.countryCode = l.substring ( 3 ) ;
      this.languageCode = l.substring ( 0, 2 ) ;
    }
    return this.countryCode ;
  },
  getLocationCode: function()
  {
    return this.getLanguage() + "_" + this.getCountryCode() ;
  },
  toString: function()
  {
    return "(Locale)"
         + "\ncurrencySymbol=" + this.getCurrencySymbol()
         + "\ninternationalCurrencySymbol=" + this.getInternationalCurrencySymbol()
         + "\nMonetaryDecimalSeparator=" + this.getMonetaryDecimalSeparator()
         + "\nDecimalSeparator=" + this.getDecimalSeparator()
         + "\nGroupingSeparator=" + this.getGroupingSeparator()
         + "\nCurrencySymbolInFront=" + this.isCurrencySymbolInFront()
         + "\nlanguage=" + this.getLanguage()
         + "\ncountryCode=" + this.getCountryCode()
    		 + "\nDateTimeFormatShort=" + this._dateTimeFormatShort
    		 + "\nDateTimeFormatMedium=" + this._dateTimeFormatMedium
    		 + "\nDateTimeFormatLong=" + this._dateTimeFormatLong
         ;
  },
  isCurrencySymbolInFront: function()
  {
    if ( typeof ( this.CurrencySymbolInFront ) != "undefined" ) return this.CurrencySymbolInFront ;
    if ( ! this.xml ) return true ;
    this.CurrencySymbolInFront = this.xml.getBool ( "CurrencySymbolInFront", true ) ;
    return this.CurrencySymbolInFront ;
  },
  getCurrencySymbol: function()
  {
    if ( this.currencySymbol ) return this.currencySymbol ;
    if ( ! this.xml )
    {
      this.currencySymbol = "\u20AC" ;
      return this.currencySymbol ;
    }
    this.currencySymbol = this.xml.getContent ( "CurrencySymbol", "\u20AC" ) ;
    return this.currencySymbol ;
  },
  getInternationalCurrencySymbol: function()
  {
    if ( this.internationalCurrencySymbol ) return this.internationalCurrencySymbol ;
    if ( ! this.xml )
    {
      this.internationalCurrencySymbol = "EUR" ;
      return this.internationalCurrencySymbol ;
    }
    this.internationalCurrencySymbol = this.xml.getContent ( "InternationalCurrencySymbol", "EUR" ) ;
    return this.internationalCurrencySymbol ;
  },
  getMonetaryDecimalSeparator: function()
  {
    if ( this.MonetaryDecimalSeparator ) return this.MonetaryDecimalSeparator ;
    if ( ! this.xml )
    {
      this.MonetaryDecimalSeparator = "." ;
      return this.MonetaryDecimalSeparator ;
    }
    this.MonetaryDecimalSeparator = this.xml.getContent ( "MonetaryDecimalSeparator", "," ) ;
    return this.MonetaryDecimalSeparator ;
  },
  getDecimalSeparator: function()
  {
    if ( this.DecimalSeparator ) return this.DecimalSeparator ;
    if ( ! this.xml )
    {
      this.DecimalSeparator = "." ;
      return this.DecimalSeparator ;
    }
    this.DecimalSeparator = this.xml.getContent ( "DecimalSeparator", "," ) ;
    return this.DecimalSeparator ;
  },
  getGroupingSeparator: function()
  {
    if ( this.GroupingSeparator ) return this.GroupingSeparator ;
    if ( ! this.xml )
    {
      this.GroupingSeparator = "," ;
      return this.GroupingSeparator ;
    }
    this.GroupingSeparator = this.xml.getContent ( "GroupingSeparator", "." ) ;
    return this.GroupingSeparator ;
  },
  formatMoneyWithCurrency: function ( amount )
  {
    if ( ! this.currencySymbol || ! this.DecimalSeparator )
    {
      this.getCurrencySymbol() ;
      this.getDecimalSeparator() ;
      this.isCurrencySymbolInFront() ;
    }
    if ( this.CurrencySymbolInFront ) return this.currencySymbol + " " + this.formatMoney ( amount ) ;
    return this.formatMoney ( amount ) + " " + this.currencySymbol ;
  },
  formatMoney: function ( amount )
  {
    if ( ! this.GroupingSeparator || this.DecimalSeparator || this.MonetaryDecimalSeparator )
    {
      this.getGroupingSeparator() ;
      this.getMonetaryDecimalSeparator() ;
    }
    if ( typeof ( amount ) != 'number' )
    {
      amount = parseFloat ( amount ) ;
      if ( isNaN ( amount ) ) amount = 0 ;
    }
    var str = amount.toFixed(2) ;
    if ( this.MonetaryDecimalSeparator != '.' ) str = str.replace ( '.', this.MonetaryDecimalSeparator ) ;
		var sign = str.substring ( 0, 1 ) ;
		if ( sign == "+" || sign == "-" )
		{
			str = str.substring ( 1 ) ;
		}
		else
		{
		  sign = "" ;
		}
    if ( str.length >= 10 )
    {
      str = str.substring ( 0, str.length - 9 ) + this.GroupingSeparator + str.substring ( str.length - 9, str.length - 6 ) + this.GroupingSeparator + str.substring ( str.length - 6 ) ;
    }
    else
    if ( str.length >= 7 )
    {
      str = str.substring ( 0, str.length - 6 ) + this.GroupingSeparator + str.substring ( str.length - 6 ) ;
    }
		if ( sign ) str = sign + str ;
    return str ;
  },
  formatFloat: function ( amount )
  {
    if ( ! this.DecimalSeparator )
    {
      this.getDecimalSeparator() ;
    }
    if ( typeof ( amount ) != 'number' )
    {
      amount = parseFloat ( amount ) ;
      if ( isNaN ( amount ) ) amount = 0 ;
    }
    var str = "" + amount ;
    if ( this.DecimalSeparator != '.' ) str = str.replace ( '.', this.DecimalSeparator ) ;
    return str ;
  },
  getDateFormatShort: function()
  {
    return this._dateFormatShort ;
  },
  getDateTimeFormatShort: function()
  {
    return this._dateTimeFormatShort ;
  },
  getDateFormatMedium: function()
  {
    return this._dateFormatMedium ;
  },
  getDateTimeFormatMedium: function()
  {
    return this._dateTimeFormatMedium ;
  },
  getDateFormatLong: function()
  {
    return this._dateFormatLong ;
  },
  getDateTimeFormatLong: function()
  {
    return this._dateTimeFormatLong ;
  },
  getDateFormat: function ( type )
  {
    if ( typeof ( type ) == 'string' )
    {
      var t = type.toUpperCase() ;
      if ( t == 'SHORT' ) type = this.SHORT ;
      else
      if ( t == 'MEDIUM' ) type = this.MEDIUM ;
      else
      if ( t == 'LONG' ) type = this.LONG ;
      else
      {
        var n = parseInt ( type ) ;
        if ( isNaN ( n ) ) return type ;
        type = n ;
      }
    }
    if ( type == this.SHORT ) return this._dateFormatShort ;
    if ( type == this.MEDIUM ) return this._dateFormatMedium ;
    if ( type == this.LONG ) return this._dateFormatLong ;
    return this._dateFormatShort ;
  },
  getDateTimeFormat: function ( type )
  {
    if ( typeof ( type ) == 'string' )
    {
      var t = type.toUpperCase() ;
      if ( t == 'SHORT' ) type = this.SHORT ;
      else
      if ( t == 'MEDIUM' ) type = this.MEDIUM ;
      else
      if ( t == 'LONG' ) type = this.LONG ;
      else
      {
        var n = parseInt ( type ) ;
        if ( isNaN ( n ) ) return type ;
        type = n ;
      }
    }
    if ( type == this.SHORT ) return this._dateTimeFormatShort ;
    if ( type == this.MEDIUM ) return this._dateTimeFormatMedium ;
    if ( type == this.LONG ) return this._dateTimeFormatLong ;
    return this._dateTimeFormatShort ;
  }
} ;
Locale.prototype.defaultLocale = null ;
/** */
Locale.prototype.getDefault = function()
{
  if ( this.defaultLocale ) return this.defaultLocale ;
  this.defaultLocale = new Locale() ;
  return this.defaultLocale ;
};
/** */
Locale.prototype.getXml = function()
{
  return this.xml ;
};
if ( typeof tangojs === 'object' && tangojs ) tangojs.LocaleFactory = LocaleFactory ;
else tangojs = { Locale:Locale } ;

module.exports = LocaleFactory ;
if ( require.main === module )
{
  var l = LocaleFactory.getInstance ( "fr_FR" ) ;
  console.log ( l.toString() ) ;
};