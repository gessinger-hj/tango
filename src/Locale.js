var T = require ( "./Tango" ) ;
var fs = require ( "fs" ) ;
var Path = require ( "path" ) ;

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
/**
 * Description
 * @param {} obj
 * @return BinaryExpression
 */
LocaleFactoryClass.prototype.isLocale = function ( obj )
{
  return obj instanceof Locale ;
};
/**
 * Description
 * @param {} optionalLocaleCode
 * @return NewExpression
 */
LocaleFactoryClass.prototype.getInstance = function ( optionalLocaleCode )
{
  if ( ! optionalLocaleCode ) return this.getDefault() ;
  return new Locale ( optionalLocaleCode ) ;
};
/**
 * Description
 * @return MemberExpression
 */
LocaleFactoryClass.prototype.getDefault = function ()
{
  if ( ! this.defaultLocale )
  {
    this.defaultLocale = new Locale() ;
  }
  return this.defaultLocale ;
};
/**
 * Description
 * @param {} defaultLocale
 * @return l
 */
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
/**
 * Description
 * @return MemberExpression
 */
LocaleFactoryClass.prototype.getLocaleCode = function()
{
  return this.defaultLocaleCode ;
};
/**
 * Description
 * @param {} lang
 */
LocaleFactoryClass.prototype.setLanguage = function ( lang )
{
  if ( lang ) this.language = lang  ;
};
/**
 * Description
 * @return MemberExpression
 */
LocaleFactoryClass.prototype.getLanguage = function()
{
  return this.language ;
};
/**
 * Description
 * @return CallExpression
 */
LocaleFactoryClass.prototype.getLocalePath = function()
{
  return T.getConfigPath() ;
};
/**
 * Description
 * @param {} localeCode
 * @return CallExpression
 */
LocaleFactoryClass.prototype.getLocaleJson = function ( localeCode )
{
  if ( ! localeCode ) localeCode = this.defaultLocaleCode ;

  var f = new File ( this.getLocalePath(), "Locale." + localeCode + ".json" ) ;
  if ( ! f.exists() )
  {
    if ( localeCode.length === 5 )
    {
      f = new File ( this.getLocalePath(), "Locale." + localeCode.substring ( 0, 2 ) + ".json" ) ;
    }
  }
  if ( ! f.exists() )
  {
    f = new File ( this.getLocalePath(), "Locale." + "en_US" + ".json" ) ;
  }
  return f.getJSON() ;
};
// LocaleFactoryClass.prototype.getLocaleXml = function ( localeCode )
// {
//   if ( ! localeCode ) localeCode = this.defaultLocaleCode ;
//   var File = require ( "File" ) ;

//   var f = new File ( this.getLocalePath(), "Locale." + localeCode + ".xml" ) ;
//   if ( ! f.exists() )
//   {
//     if ( localeCode.length === 5 )
//     {
//       f = new File ( this.getLocalePath(), "Locale." + localeCode.substring ( 0, 2 ) + ".xml" ) ;
//     }
//   }
//   if ( ! f.exists() )
//   {
//     f = new File ( this.getLocalePath(), "Locale." + "en_US" + ".xml" ) ;
//   }
//   return f.getXml() ;
// };
var LocaleFactory = new LocaleFactoryClass() ;
/**
 *  @constructor
 * @param {} optionalLocationCode
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
  this.json = LocaleFactory.getLocaleJson ( optionalLocationCode ) ;
  this.setFormats() ;
} ;
Locale.prototype =
{
  SHORT: 1,
  MEDIUM: 2,
  LONG: 3,
  /**
   * Description
   */
  setFormats: function()
  {
    var a = this.json.FormatSymbols.Date ;
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
  /**
   * Description
   */
  flush: function()
  {
    this.json = undefined ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getLanguage: function()
  {
    if ( this.languageCode ) return this.languageCode ;
    if ( ! this.json ) return LocaleFactory.getLanguage() ;
    var l = this.json.Language ;
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
  /**
   * Description
   * @return MemberExpression
   */
  getCountryCode: function()
  {
    if ( this.countryCode ) return this.countryCode ;
    if ( ! this.json ) return "DE" ;
    var l = this.json.Language ? this.json.Language : "de_DE" ;
    if ( l.indexOf ( '_' ) == 2 && l.length == 5 )
    {
      this.countryCode = l.substring ( 3 ) ;
      this.languageCode = l.substring ( 0, 2 ) ;
    }
    return this.countryCode ;
  },
  /**
   * Description
   * @return BinaryExpression
   */
  getLocationCode: function()
  {
    return this.getLanguage() + "_" + this.getCountryCode() ;
  },
  /**
   * Description
   * @return BinaryExpression
   */
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
  /**
   * Description
   * @return MemberExpression
   */
  isCurrencySymbolInFront: function()
  {
    if ( typeof ( this.CurrencySymbolInFront ) != "undefined" ) return this.CurrencySymbolInFront ;
    if ( ! this.json ) return true ;
    this.CurrencySymbolInFront = this.json.CurrencySymbolInFront == "true" ;
    return this.CurrencySymbolInFront ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getCurrencySymbol: function()
  {
    if ( this.currencySymbol ) return this.currencySymbol ;
    if ( ! this.json )
    {
      this.currencySymbol = "\u20AC" ;
      return this.currencySymbol ;
    }
    this.currencySymbol = this.json.CurrencySymbol ? this.json.CurrencySymbol : "\u20AC" ;
    return this.currencySymbol ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getInternationalCurrencySymbol: function()
  {
    if ( this.internationalCurrencySymbol ) return this.internationalCurrencySymbol ;
    if ( ! this.json )
    {
      this.internationalCurrencySymbol = "EUR" ;
      return this.internationalCurrencySymbol ;
    }
    this.internationalCurrencySymbol = this.json.InternationalCurrencySymbol ? this.json.InternationalCurrencySymbol : "EUR" ;
    return this.internationalCurrencySymbol ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getMonetaryDecimalSeparator: function()
  {
    if ( this.MonetaryDecimalSeparator ) return this.MonetaryDecimalSeparator ;
    if ( ! this.json )
    {
      this.MonetaryDecimalSeparator = "." ;
      return this.MonetaryDecimalSeparator ;
    }
    this.MonetaryDecimalSeparator = this.json.MonetaryDecimalSeparator ? this.json.MonetaryDecimalSeparator : "," ;
    return this.MonetaryDecimalSeparator ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getDecimalSeparator: function()
  {
    if ( this.DecimalSeparator ) return this.DecimalSeparator ;
    if ( ! this.json )
    {
      this.DecimalSeparator = "." ;
      return this.DecimalSeparator ;
    }
    this.DecimalSeparator = this.json.DecimalSeparator ? this.json.DecimalSeparator : "," ;
    return this.DecimalSeparator ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getGroupingSeparator: function()
  {
    if ( this.GroupingSeparator ) return this.GroupingSeparator ;
    if ( ! this.json )
    {
      this.GroupingSeparator = "," ;
      return this.GroupingSeparator ;
    }
    this.GroupingSeparator = this.json.GroupingSeparator ? this.json.GroupingSeparator : "." ;
    return this.GroupingSeparator ;
  },
  /**
   * Description
   * @param {} amount
   * @return BinaryExpression
   */
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
  /**
   * Description
   * @param {} amount
   * @return str
   */
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
  /**
   * Description
   * @param {} amount
   * @return str
   */
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
  /**
   * Description
   * @return MemberExpression
   */
  getDateFormatShort: function()
  {
    return this._dateFormatShort ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getDateTimeFormatShort: function()
  {
    return this._dateTimeFormatShort ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getDateFormatMedium: function()
  {
    return this._dateFormatMedium ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getDateTimeFormatMedium: function()
  {
    return this._dateTimeFormatMedium ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getDateFormatLong: function()
  {
    return this._dateFormatLong ;
  },
  /**
   * Description
   * @return MemberExpression
   */
  getDateTimeFormatLong: function()
  {
    return this._dateTimeFormatLong ;
  },
  /**
   * Description
   * @param {} type
   * @return MemberExpression
   */
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
  /**
   * Description
   * @param {} type
   * @return MemberExpression
   */
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
/**
 * Description
 * @return MemberExpression
 */
Locale.prototype.getDefault = function()
{
  if ( this.defaultLocale ) return this.defaultLocale ;
  this.defaultLocale = new Locale() ;
  return this.defaultLocale ;
};
/**
 * Description
 * @return MemberExpression
 */
Locale.prototype.getJson = function()
{
  return this.json ;
};
/*
 * Description
 * @param {} path
 * @param {} name
 */
var File = function ( path, name )
{
  if ( path instanceof File )
  {
    path = path.toString() ;
  }
  this.path = path ;
  if ( name )
  {
    this.path += "/" + name ;
  }
  if ( ! this.path )
  {
    this.path = process.cwd() ;
  }
  this.path = Path.normalize ( this.path ) ;
};
/*
 * Description
 */
File.prototype.exists = function()
{
  try
  {
    var st = fs.statSync ( this.toString() ) ;
    return true ;
  }
  catch ( exc )
  {
    return false ;
  }
};
/*
 * Description
 * @return o
 */
File.prototype.getJSON = function()
{
  var str = fs.readFileSync ( this.path, 'utf8' ) ;
  var o = JSON.parse ( str ) ;
  return o ;
};
module.exports = LocaleFactory ;
if ( require.main === module )
{
  var l = LocaleFactory.getInstance ( "fr_FR" ) ;
  console.log ( l.toString() ) ;
};
