var T = require ( "Tango" ) ;
var Locale = require ( "Locale" ) ;
/**
 *  Global singleton <b>DateUtils</b>
 *  @constructor
 */
var DateUtilsClass = function()
{
  this._initialize() ;
};
DateUtilsClass.prototype =
{
  _userLanguage: "en",
  SHORT: 1,
  MEDIUM: 2,
  LONG: 3,
  _monthDays: [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ],
  _monthNames: [],
  _dayNames: [],
  _dateFormatShort: [],
  _dateTimeFormatShort: [],
  _dateFormatMedium: [],
  _dateTimeFormatMedium: [],
  _dateFormatLong: [],
  _dateTimeFormatLong: [],
  _initialize: function()
  {
    this._monthNames["en"] = new Array (
      'January',   'February', 'March',    'April'
    , 'May',       'June',     'July',     'August'
    , 'September', 'October',  'November', 'December'
    , 'Jan',       'Feb',      'Mar',      'Apr'
    , 'May',       'Jun',      'Jul',      'Aug'
    , 'Sep',       'Oct',      'Nov',      'Dec'
    );
    this._monthNames["de"] = new Array (
      'Januar',    'Februar',  'März',     'April'
    , 'Mai',       'Juni',     'Juli',     'August'
    , 'September', 'Oktober',  'November', 'Dezember'
    , 'Jan',       'Feb',      'Mrz',      'Apr'
    , 'Mai',       'Jun',      'Jul',      'Aug'
    , 'Sep',       'Okt',      'Nov',      'Dez'
    ) ;
    this._dayNames["en"] = new Array(
      'Sunday' ,'Monday' ,'Tuesday' ,'Wednesday' ,'Thursday' ,'Friday' ,'Saturday'
    , 'Sun' ,'Mon' ,'Tue' ,'Wed' ,'Thu' ,'Fri' ,'Sat'
    );
    this._dayNames["de"] = new Array(
      'Sonntag' ,'Montag' ,'Dienstag' ,'Mittwoch' ,'Donnerstag' ,'Freitag' ,'Samstag'
    , 'So' ,'Mo' ,'Di' ,'Mi' ,'Do' ,'Fr' ,'Sa'
    );
    this._dateFormatShort["en"] = "M/d/yy" ;
    this._dateTimeFormatShort["en"] = "M/d/yy HH:mm:ss" ;
    this._dateFormatMedium["en"] = "MMM/d/yyyy" ;
    this._dateTimeFormatMedium["en"] = "MMM/d/yyyy HH:mm:ss" ;
    this._dateFormatLong["en"] = "MMMM/d/yyyy" ;
    this._dateTimeFormatLong["en"] = "MMMM/d/yyyy HH:mm:ss" ;
    this._dateFormatShort["de"] = "d.M.yy" ;
    this._dateTimeFormatShort["de"] = "d.M.yy HH:mm:ss" ;
    this._dateFormatMedium["de"] = "d.MMM.yyyy" ;
    this._dateTimeFormatMedium["de"] = "d.MMM.yyyy HH:mm:ss" ;
    this._dateFormatLong["de"] = "d.MMMM.yyyy" ;
    this._dateTimeFormatLong["de"] = "d.MMMM.yyyy HH:mm:ss" ;
  },
  getDateTimeFormatShort: function()
  {
    var f = this._dateTimeFormatShort[this._userLanguage] ;
    if ( f ) return f ;
    return this._dateTimeFormatShort["en"] ;
  },
  setFormats: function ( webConfig )
  {
    if ( ! webConfig.getXml() ) return ;
    var str = webConfig.getXml().getContent ( "FormatSymbols/Date" ) ;
    if ( ! str ) return ;
    var a = eval ( str ) ;
    var lang = a[0] ;
    this._userLanguage = lang ;
    this._monthNames[lang] = a[1] ;
    this._dayNames[lang] = a[2] ;
    this._dateFormatShort[lang] = a[3] ;
    this._dateFormatMedium[lang] = a[4] ;
    this._dateFormatLong[lang] = a[5] ;
    this._dateTimeFormatShort[lang] = a[6] ;
    this._dateTimeFormatMedium[lang] = a[7] ;
    this._dateTimeFormatLong[lang] = a[8] ;
  },
  getWeekOfYear: function ( date )
  {
    var iYear = date.getFullYear();
    var iYearM1 = iYear - 1;
    var isLeapYear = this.isLeapYear ( date ) ;
    isLeapYearM1 = this.getMaxDays ( date.getFullYear(), 1 ) == 29 ;

    var iYearM1Mod100 = iYearM1 % 100;
    var iDayOfYear = this.getDayOfYear ( date ) ;

    var iJan1DayOfWeek = 1 + ((((Math.floor((iYearM1 - iYearM1Mod100) / 100) % 4) * 5) + (iYearM1Mod100 + Math.floor(iYearM1Mod100 / 4))) % 7);
    var iDayOfWeek = 1 + ( ( ( iDayOfYear + iJan1DayOfWeek - 1 ) - 1 ) % 7 ) ;
    var iDaysInYear = isLeapYear ? 366 : 365;
    var iWeekOfYear = 0;

    if ( ( iDayOfYear <= ( 8 - iJan1DayOfWeek ) ) && ( iJan1DayOfWeek > 4 ) )
    {
      iWeekOfYear = ( iJan1DayOfWeek == 5 || ( iJan1DayOfWeek == 6 && isLeapYearM1 ) ) ? 53 : 52;
    }
    else
    if ( iDaysInYear - iDayOfYear < 4 - iDayOfWeek )
    {
      iWeekOfYear = 1;
    }
    else
    {
      iWeekOfYear = Math.floor((iDayOfYear + (7 - iDayOfWeek) + (iJan1DayOfWeek - 1)) / 7);
      if (iJan1DayOfWeek > 4)
      {
        iWeekOfYear -= 1;
      }
    }
    return iWeekOfYear ;
  },
  getWeekOfYear2: function ( date )
  {
    // Skip to Thursday of this week
    var now = this.getDayOfYear(date) + (4 - date.getDay());
    // Find the first Thursday of the year
    var jan1 = new Date(date.getFullYear(), 0, 1);
    var then = (7 - jan1.getDay() + 4);
    return Math.floor ( ((now - then) / 7) + 1 ) ;
  },
  getDayOfYear: function ( date )
  {
    var iMonth = date.getMonth();
    var iFeb = this.getMaxDays ( date.getFullYear(), 1 ) ;
    var aDaysInMonth = new Array(31, iFeb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
    var iDayOfYear = 0;

    for ( var i = 0; i < iMonth; i++ )
    {
      iDayOfYear += aDaysInMonth[i];
    }
    iDayOfYear += date.getDate();
    return iDayOfYear ;
  },
  getFirstDayOfWeek: function()
  {
    var x = T.getConfig().getLocale().getXml() ;
    return x.getInt ( "FirstDayOfWeek", 2 ) ;
  },
  getDayNames: function ( lang )
  {
    if ( ! lang ) lang = T.getConfig().getLocale().getLanguage() ;
    var a = this._dayNames[lang] ;
    if ( ! a ) a = this._dayNames["en"] ;
    return a ;
  },
  getDayNamesShort: function ( lang )
  {
    var a = this.getDayNames() ;
    var b = [] ;
    for ( var i = 7 ; i < a.length ; i++ )
    {
      b.push ( a[i] ) ;
    }
    b.push ( a[7] ) ;
    return b ;
  },
  getMonthNames: function ( lang )
  {
    if ( ! lang ) lang = T.getConfig().getLocale().getLanguage() ;
    var a = this._monthNames[lang] ;
    if ( ! a ) a = this._monthNames["en"] ;
    return a ;
  },
  isLeapYear: function ( date )
  {
    if ( this.getMaxDays ( date.getFullYear(), 1 ) == 29 ) return true ;
    return false ;
  },
  getMaxDays: function ( y, m )
  {
    if ( T.isDate ( y ) )
    {
      var d = y ;
      y = d.getFullYear() ;
      m = d.getMonth() ;
    }

    if ( m != 1 ) return this._monthDays[m] ;

    if ( ( y % 4 ) !== 0 ) return 28 ;
    if ( ( y % 100 ) === 0 )
    {
      if ( ( y % 400 ) === 0 ) return 29 ;
      return 28 ;
    }
    return 29 ;
  },
  roundDownToDay: function ( date )
  {
    var m = date.getTime() ;
    var d = new Date ( m ) ;
    d.setHours ( 0 ) ;
    d.setMinutes ( 0 ) ;
    d.setSeconds ( 0 ) ;
    d.setMilliseconds ( 0 ) ;
    return d ;
  },
  roundDownToWeek: function ( date )
  {
    var firstDayOfWeek = this.getFirstDayOfWeek() ;
    var d = this.roundDownToDay ( date ) ;

    for ( var i = 0 ; i < 40 ; i++ )
    {
      if ( d.getDay() == firstDayOfWeek - 1 )
      {
        break ;
      }
      d = this.addDay ( d, -1 ) ;
    }
    return d ;
  },
  roundDownToMonth: function ( date )
  {
    date = new Date ( date.getTime() ) ;
    date.setDate ( 1 ) ;
    date.setHours ( 0 ) ;
    date.setMinutes ( 0 ) ;
    date.setSeconds ( 0 ) ;
    date.setMilliseconds ( 0 ) ;
    return date ;
  },
  addWeek: function ( date, nWeeks )
  {
    return this.addDay ( date, nWeeks * 7 ) ;
  },
  addDay: function ( date, nDay )
  {
    var millis = date.getTime() ;
    millis += nDay * 24 * 60 * 60 * 1000 ;
    var newDate = new Date ( millis ) ;
    if ( date.getTimezoneOffset() != newDate.getTimezoneOffset() )
    {
      millis += - ( date.getTimezoneOffset() - newDate.getTimezoneOffset() ) * 60 * 1000 ;
      newDate = new Date ( millis ) ;
    }
    return newDate ;
  },
  addMonth: function ( date, nMonth )
  {
    var day = date.getDate() ;
    var month = date.getMonth() ;
    var year = date.getFullYear() ;

    var factor = 1 ;
    if ( nMonth < 0 ) factor = -1 ;
    nMonth = Math.abs ( nMonth ) ;
    var dmonth = nMonth % 12 ;
    var dyear = Math.floor ( nMonth / 12 ) ;

    year = factor * dyear + year ;

    month = factor * dmonth + month ;

    if ( month < 0 )
    {
      month += 12 ;
      year-- ;
    }
    if ( month >= 12 )
    {
      month -= 12 ;
      year++ ;
    }
    var d = new Date ( date.getTime() ) ;
    d.setDate ( 1 ) ;
    d.setFullYear ( year ) ;
    d.setMonth ( month ) ;
    var maxDays = this.getMaxDays ( year, month ) ;
    if ( day > maxDays ) day = maxDays ;
    d.setDate ( day ) ;
    return d ;
  },
  getSoapDate: function ( d )
  {
    return DateUtils.formatDate ( d ? d : new Date(), "yyyy-MM-dd" ) ;
  },
  getSoapDateTime: function ( d )
  {
    return DateUtils.formatDate ( d ? d : new Date(), "yyyy-MM-ddTHH:mm:ss" ) ;
  },
  getSoapDateTimeWithMillis: function ( d )
  {
    return DateUtils.formatDate ( d ? d : new Date(), "yyyy-MM-ddTHH:mm:ss.SSS" ) ;
  },
  formatTimeShort: function ( date )
  {
    if ( ! date ) date = new Date() ;
    return this.formatDate ( date, "HH:mm:ss" ) ;
  },
  formatDateShort: function ( date, locale )
  {
    if ( ! date ) date = new Date() ;
    if ( ! locale ) locale = T.getConfig().getLocale() ;
    return this.formatDate ( date, locale, this.SHORT, false ) ;
  },
  formatDateTimeShort: function ( date, locale )
  {
    if ( ! date ) date = new Date() ;
    if ( ! locale ) locale = T.getConfig().getLocale() ;
    return this.formatDate ( date, locale, this.SHORT, true ) ;
  },
  formatDateMedium: function ( date, locale )
  {
    if ( ! date ) date = new Date() ;
    if ( ! locale ) locale = T.getConfig().getLocale() ;
    return this.formatDate ( date, locale, this.MEDIUM, false ) ;
  },
  formatDateTimeMedium: function ( date, locale )
  {
    if ( ! date ) date = new Date() ;
    if ( ! locale ) locale = T.getConfig().getLocale() ;
    return this.formatDate ( date, locale, this.MEDIUM, true ) ;
  },
  formatDateLong: function ( date, locale )
  {
    if ( ! date ) date = new Date() ;
    if ( ! locale ) locale = T.getConfig().getLocale() ;
    return this.formatDate ( date, locale, this.LONG, false ) ;
  },
  formatDateTimeLong: function ( date, locale )
  {
    if ( ! date ) date = new Date() ;
    if ( ! locale ) locale = T.getConfig().getLocale() ;
    return this.formatDate ( date, locale, this.LONG, true ) ;
  },
  formatDate: function ( date, format, monthNames, dayNames )
  {
    var locale = T.getConfig().getLocale() ;
    if ( format instanceof Locale )
    {
      locale = format ;
      var withTime = dayNames === true ;
      var shortOrMediumOrLong = monthNames ;
      if ( withTime )
      {
        format = locale.getDateTimeFormat ( shortOrMediumOrLong ) ;
      }
      else
      {
        format = locale.getDateFormat ( shortOrMediumOrLong ) ;
      }
      monthNames = locale._monthNames ;
      dayNames = locale._dayNames ;
    }
    if ( ! monthNames ) monthNames = locale._monthNames ;
    if ( ! dayNames ) dayNames = locale._dayNames ;

    if ( ! T.isDate ( date ) )
    {
      if ( typeof ( date ) == 'string' ) date = this.parseDate ( date ) ;
      else
      if ( typeof ( date ) == 'number' )
      {
        if ( date >= 1 && date <= 3 )
        {
          format = locale.getDateTimeFormat ( date ) ;
          date = new Date() ;
        }
        else
        {
          date = new Date ( date ) ;
        }
      }
      else date = new Date() ;
    }
		if ( typeof format === 'string' && format.indexOf ( "'" ) >= 0 )
		{
			var aa = format.split ( "'" ) ;
			var tt = "" ;
			for ( var ii = 0 ; ii < aa.length ; ii++ )
			{
				if ( ! aa[ii] )
				{
					continue ;
				}
				if ( ii & 0x01 )
				{
					tt += aa[ii] ;
				}
				else
				{
					tt += this.formatDate ( date, aa[ii], monthNames, dayNames ) ;
				}
			}
			return tt ;
		}
    var lang = T.getConfig().getLocale().getLanguage() ;
    var mn = this.getMonthNames ( lang ) ;
    var dn = this.getDayNames ( lang ) ;
    if ( monthNames ) mn = monthNames ;
    if ( dayNames ) dn = dayNames ;

    if ( ! format ) format = locale.getDateTimeFormat ( this.SHORT ) ;

    format=format+"";
    var result="";
    var i_format=0;
    var c="";
    var token="";
    var y=date.getFullYear()+"";
    var M=date.getMonth()+1;
    var d=date.getDate();
    var E=date.getDay();
    var H=date.getHours();
    var m=date.getMinutes();
    var s=date.getSeconds();
    var milliRest = date.getTime() % 1000 ;
    var yyyy,yy,MMMM,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
    var value=new Object();
    if ( y.length < 4 )
    {
      y=""+(y-0+1900);
    }
    value["y"]=""+y;
    value["yyyy"]=y;
    value["yy"]=y.substring(2,4);
    value["M"]=M;
    value["MM"]=this.LZ(M);
    value["MMM"]=mn[M+11];
    value["MMMM"]=mn[M-1];
    value["d"]=d;
    value["dd"]=this.LZ(d);
    value["E"]=dn[E+7];
    value["EE"]=dn[E];
    value["H"]=H;
    value["HH"]=this.LZ(H);
    if ( H == 0 )
    {
      value["h"]=12;
    }
    else
    if ( H>12 )
    {
      value["h"]=H-12;
    }
    else
    {
      value["h"]=H;
    }
    value["hh"]=this.LZ(value["h"]);
    if ( H>11 )
    {
      value["K"]=H-12;
    }
    else
    {
      value["K"]=H;
    }
    value["k"]=H+1;
    value["KK"]=this.LZ(value["K"]);
    value["kk"]=this.LZ(value["k"]);
    if ( H > 11)
    {
      value["a"]="PM";
    }
    else
    {
      value["a"]="AM";
    }
    value["m"]=m;
    value["mm"]=this.LZ(m);
    value["s"]=s;
    value["ss"]=this.LZ(s);
    value["SSS"]=this.LZ2(milliRest);
    while ( i_format < format.length )
    {
      c = format.charAt ( i_format ) ;
      token="";
      while (  ( format.charAt ( i_format ) == c )
            && ( i_format < format.length )
            )
      {
        token += format.charAt ( i_format++ ) ;
      }
      if ( value[token] != null )
      {
        result += value[token];
      }
      else
      {
        result += token;
      }
    }
    return result;
  },
  isStandardDateFormat: function ( str )
  {
    var i ;
    if (  str.length != 19 /* yyyy-mm-ddThh:mm:ss */
       && str.length != 16 /* yyyy-mm-dd hh:mm*/
       && str.length != 10 /* yyyy-mm-dd */
       && str.length != 14 /* yyyymmddhhmmss */
       && str.length != 8  /* yyyymmdd */
       )
    {
      return false ;
    }
    if ( str.length == 19 ) /* yyyy-mm-ddThh:mm:ss */
    {
      if ( str.charAt ( 4 ) != "-" ) return false ;
      if ( str.charAt ( 7 ) != "-" ) return false ;
      if ( str.charAt ( 10 ) != " " && str.charAt ( 10 ) != "T" ) return false ;
      if ( str.charAt ( 13 ) != ":" ) return false ;
      if ( str.charAt ( 16 ) != ":" ) return false ;
      for ( i = 0 ; i < str.length ; i++ )
      {
        if ( i == 4 || i == 7 || i == 10 || i == 13 || i == 16 ) continue ;
	      if ( isNaN ( parseInt ( str.charAt ( i ) ) ) ) return false ;
      }
    }
    else
    if ( str.length == 16 ) /* yyyy-mm-ddThh:mm */
    {
      if ( str.charAt ( 4 ) != "-" ) return false ;
      if ( str.charAt ( 7 ) != "-" ) return false ;
      if ( str.charAt ( 10 ) != " " && str.charAt ( 10 ) != "T" ) return false ;
      if ( str.charAt ( 13 ) != ":" ) return false ;
      for ( i = 0 ; i < str.length ; i++ )
      {
        if ( i == 4 || i == 7 || i == 10 || i == 13 ) continue ;
	if ( isNaN ( parseInt ( str.charAt ( i ) ) ) ) return false ;
      }
    }
    else
    if ( str.length == 10 ) /* yyyy-mm-dd */
    {
      if ( str.charAt ( 4 ) != "-" ) return false ;
      if ( str.charAt ( 7 ) != "-" ) return false ;
      for ( i = 0 ; i < str.length ; i++ )
      {
        if ( i == 4 || i == 7 ) continue ;
        if ( isNaN ( parseInt ( str.charAt ( i ) ) ) ) return false ;
      }
    }
    else
    {
      for ( i = 0 ; i < str.length ; i++ )
      {
        if ( isNaN ( parseInt ( str.charAt ( i ) ) ) ) return false ;
      }
    }
    return true ;
  },
  stringToDate: function ( str )
  {
    return this.parseDate ( str ) ;
  },
  parseDate: function ( str )
  {
    var iYear ;
    var iMonth ;
    var iDay ;
    var iHour ;
    var iMinute ;
    var iSecond ;
    var date = new Date() ;
    if  ( str.length >= 19 && str.charAt ( 19 ) == '.' ) // yyyy-mm-ddThh:mm:ss.0
    {
      str = str.substring ( 0, 19 ) ;
    }
    if  ( str.length == 19 ) // yyyy-mm-ddThh:mm:ss
    {
      iYear = parseInt ( this.MLZ ( str.substring ( 0, 4 ) ) ) ;
      iMonth = parseInt ( this.MLZ ( str.substring ( 5, 7 ) ) ) ;
      iDay = parseInt ( this.MLZ ( str.substring ( 8, 10 ) ) ) ;
      iHour = parseInt ( this.MLZ ( str.substring ( 11, 13 ) ) ) ;
      iMinute = parseInt ( this.MLZ ( str.substring ( 14, 16 ) ) ) ;
      iSecond = parseInt ( this.MLZ ( str.substring ( 17 ) ) ) ;
      date.setDate ( 1 ) ;
      date.setFullYear ( iYear ) ;
      date.setMonth ( iMonth-1 ) ;
      date.setDate ( iDay ) ;
      date.setHours ( iHour ) ;
      date.setMinutes ( iMinute ) ;
      date.setSeconds ( iSecond ) ;
      date.setMilliseconds ( 0 ) ;
      return date ;
    }
    else
    if  ( str.length == 10 ) // yyyy-mm-dd
    {
      iYear = parseInt ( this.MLZ ( str.substring ( 0, 4 ) ) ) ;
      iMonth = parseInt ( this.MLZ ( str.substring ( 5, 7 ) ) ) ;
      iDay = parseInt ( this.MLZ ( str.substring ( 8, 10 ) ) ) ;
      date.setDate ( 1 ) ;
      date.setFullYear ( iYear ) ;
      date.setMonth ( iMonth-1 ) ;
      date.setDate ( iDay ) ;
      date.setHours ( 0 ) ;
      date.setMinutes ( 0 ) ;
      date.setSeconds ( 0 ) ;
      date.setMilliseconds ( 0 ) ;
      return date ;
    }
    else
    if  ( str.length == 14 ) // yyyymmddhhmmss
    {
      date = new Date() ;
      iYear = parseInt ( this.MLZ ( str.substring ( 0, 4 ) ) ) ;
      iMonth = parseInt ( this.MLZ ( str.substring ( 4, 6 ) ) ) ;
      iDay = parseInt ( this.MLZ ( str.substring ( 6, 8 ) ) ) ;
      iHour = parseInt ( this.MLZ ( str.substring ( 8, 10 ) ) ) ;
      iMinute = parseInt ( this.MLZ ( str.substring ( 10, 12 ) ) ) ;
      iSecond = parseInt ( this.MLZ ( str.substring ( 12 ) ) ) ;
      date.setDate ( 1 ) ;
      date.setFullYear ( iYear ) ;
      date.setMonth ( iMonth-1 ) ;
      date.setDate ( iDay ) ;
      date.setHours ( iHour ) ;
      date.setMinutes ( iMinute ) ;
      date.setSeconds ( iSecond ) ;
      date.setMilliseconds ( 0 ) ;
      return date ;
    }
    else
    if  ( str.length == 8 ) // yyyymmdd
    {
      date = new Date() ;
      iYear = parseInt ( this.MLZ ( str.substring ( 0, 4 ) ) ) ;
      iMonth = parseInt ( this.MLZ ( str.substring ( 4, 6 ) ) ) ;
      iDay = parseInt ( this.MLZ ( str.substring ( 6, 8 ) ) ) ;
      date.setDate ( 1 ) ;
      date.setFullYear ( iYear ) ;
      date.setMonth ( iMonth-1 ) ;
      date.setDate ( iDay ) ;
      date.setHours ( 0 ) ;
      date.setMinutes ( 0 ) ;
      date.setSeconds ( 0 ) ;
      date.setMilliseconds ( 0 ) ;
      return date ;
    }
    date = new Date ( Date.parse ( str ) ) ;
    return date ;
  },
  getTimeZoneId: function()
  {
    if ( ! this.TIMEZONE_ID )
    {
      var d = new Date() ;
      var tzOffset = d.getTimezoneOffset() ;
      var sign = tzOffset >= 0 ? "-" : "+" ;
      tzOffset = Math.abs ( tzOffset ) ;
      var m = tzOffset % 60 ;
      var h = Math.floor ( tzOffset / 60 ) ;
      this.TIMEZONE_ID = "GMT" + sign + this.LZ(h) + this.LZ(m) ;
    }
    return this.TIMEZONE_ID ;
  }
} ;
DateUtilsClass.prototype.LZ = function (x){return(x<0||x>9?"":"0")+x;} ;
DateUtilsClass.prototype.LZ2 = function (x)
{
  if ( x < 0 || x >= 100 ) return "" + x ;
  if ( x >= 10 || x < 100 ) return "0" + x ;
  return "00" + x ;
} ;
DateUtilsClass.prototype.MLZ = function (x)
{
  if ( x == "" ) return 0 ;
  if ( x == "0" ) return 0 ;
  if ( x == "00" ) return 0 ;
  var i = 0 ;
  var rc = "" ;
  var found = false ;
  for ( i = 0 ; i < x.length ; i++ )
  {
    if ( ! found && x.charAt ( i ) == '0' ) continue ;
    found = true ;
    rc += x.charAt ( i ) ;
  }
  return rc ;
};

var DateUtils = new DateUtilsClass() ;
module.exports = DateUtils ;

if ( require.main === module )
{
  var d = new Date() ;
  console.log ( "d=" + d ) ;
  d = DateUtils.addMonth ( d, 3 ) ;
  console.log ( "d=" + d ) ;
  var s = DateUtils.formatDateShort ( d ) ;
  console.log ( "1 s=" + s ) ;
  s = DateUtils.formatDateTimeLong ( d ) ;
  console.log ( "2 s=" + s ) ;
  s = DateUtils.formatDateTimeShort ( d ) ;
  console.log ( "3 s=" + s ) ;
  s = DateUtils.formatDateTimeMedium ( d ) ;
  console.log ( "4 s=" + s ) ;
  s = DateUtils.formatDateTimeLong ( new Date(), new Locale ( "fr_FR" ) ) ;
  console.log ( "5 s=" + s ) ;
  console.log ( new Locale ( "fr_FR" ).toString() ) ;
  console.log ( DateUtils.formatDate ( new Date(), "yyyy-MM-ddTHH:mm:ss.SSS" ) ) ;
}