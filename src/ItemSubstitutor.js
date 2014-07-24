var splitCsv = require ( "./Utils" ).splitCsv ;
var parseNameValues = require ( "./Utils" ).parseNameValues ;
var T = require ( "./Tango" ) ;
var DateUtils = require ( "./DateUtils" ) ;
/**
 * @constructor
 */
var ItemSubstitutor = function ()
{
  this._DefaultDateFormat = "yyyyMMddHHmmss" ;
};
/**
 * Description
 * @param {} substitutor
 * @param {} item
 * @param {} map
 * @param {} useEnv
 * @param {} delimiter
 */
ItemSubstitutor.prototype.substitute = function ( substitutor, item, map, useEnv, delimiter )
{
  var v, str, p0, p1, p2, p3 ;
  var item2 = item ;

  if ( delimiter === '{' )
  {
    if ( item.indexOf ( "${" ) >= 0 )
    {
      item = substitutor.substitute ( item, map, useEnv, delimiter ) ;
      if ( item == null ) return null ;
      if ( item.indexOf ( "${" ) < 0 && item.indexOf ( "(" ) < 0 )
      {
        str = map.getText ( item ) ;
        if ( str != null ) return str ;
        return item ;
      }
    }
    if ( typeof item !== 'string' ) return ;
    if ( item.indexOf ( "${" ) >= 0 )
    {
      if ( item === item2 ) return ;
    }
    if ( map ) v = map.getText ( item ) ;
    if ( typeof v === 'string' )
    {
      if ( v.indexOf ( "${" ) >= 0 )
      {
        v = substitutor.substitute ( v, map, useEnv, delimiter ) ;
      }
      str = map.getText ( v ) ;
      if ( typeof str === 'string' ) return str ;
      return v ;
    }
  }

  if ( item.indexOf ( "<" ) === 0 )
  {
    p0 = item.indexOf ( '<' ) ;
    p1 = item.indexOf ( '>' ) ;
    p2 = item.lastIndexOf ( '<' ) ;var
    p3 = item.lastIndexOf ( '>' ) ;
    var tagName = item.substring ( p0+1, p1 ) ;
    var endTagName = item.substring ( p2+1, p3 ).trim() ;
    if ( endTagName.indexOf ( '/' ) != 0 )
    {
      throw new Error ( "Missing end '/' ( slash ) in <end-tag-name>: " + item ) ;
    }
    endTagName = endTagName.substring ( 1 ).trim() ;
    if ( ! tagName.equals ( endTagName ) )
    {
      throw new Error ( "<tag-name> and <end-tag-name> do not match: " + item ) ;
    }
    if ( tagName.equals ( "javascript" ) || tagName.equals ( "js" ) )
    {
      var js = item.substring ( p1+1, p2 ) ;
      return eval ( js ) ;
    }
    throw new Error ( "Invalid <tag-name> in: " + item ) ;
  }
  if ( item.indexOf ( "(" ) >= 0 )
  {
    var ITEM = item.toUpperCase() ;
    var pos0 = ITEM.indexOf ( "(" ) ;
    var pos1 = ITEM.lastIndexOf ( ")" ) ;
    ITEM = ITEM.substring ( 0, pos0 ).trim() ;
    var nv = item.substring ( pos0+1, pos1 ) ;
    var hv = parseNameValues ( nv ) ;
    var hm = {} ;
    for ( var k in hv )
    {
      hm[k.toUpperCase()] = hv[k] ;
    }
    str = this.evaluateFunction ( ITEM, hm ) ;
    if ( map && typeof str === 'string' ) v = map.getText ( str ) ;
    if ( typeof v === 'string' ) return v ;
    return str ;
  }
  return ;
};
/**
 * Description
 * @param {} functionName
 * @param {} hm
 */
ItemSubstitutor.prototype.evaluateFunction = function ( functionName, hm )
{
  if ( functionName.startsWith ( "LASTTIMEOFWEEKOF" ) )
  {
    return this.lastTimeOfWeekOf ( hm ) ;
  }
  else
  if ( functionName.startsWith ( "FIRSTTIMEOFWEEKOF" ) )
  {
    return this.firstTimeOfWeekOf ( hm ) ;
  }
  else
  if ( functionName.startsWith ( "LASTTIMEOFMONTHOF" ) )
  {
    return this.lastTimeOfMonthOf ( hm ) ;
  }
  else
  if ( functionName.startsWith ( "FIRSTTIMEOFMONTHOF" ) )
  {
    return this.firstTimeOfMonthOf ( hm ) ;
  }
  else
  if ( functionName.startsWith ( "FIRSTTIMEOFDAYOF" ) )
  {
    return this.firstTimeOfDayOf ( hm ) ;
  }
  else
  if ( functionName.startsWith ( "LASTTIMEOFDAYOF" ) )
  {
    return this.lastTimeOfDayOf ( hm ) ;
  }
  else
  if ( functionName.startsWith ( "FORMATDATE" ) )
  {
    return this.formatDate ( hm ) ;
  }
  return ;
};
/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.formatDate = function ( h )
{
  var rc = null ;
  var date = h["DATE"] ;
  if ( ! date )
  {
    date = DateUtils.formatDate ( new Date(), "yyyyMMddHHmmss" ) ;
  }
  var format = h["FORMAT"] ;
  var locale = h["LOCALE"] ;
  var type = h["TYPE"] ;
  var d ;
  if ( date.length === 8 || date.length === 14 )
  {
    d = DateUtils.parseDate ( date ) ;
  }
  else
  {
    var idate = parseInt ( date ) ;
    d = new Date() ;
    d = DateUtils.addDay ( d, idate ) ;
  }
  if ( locale )
  {
    var loc = Locale.getInstance ( locale ) ;
    if ( !type || type === "short" )
    {
      return DateUtils.formatDateTimeShort ( d, loc ) ;
    }
    if ( type === "medium" )
    {
      return DateUtils.formatDateTimeMedium ( d, loc ) ;
    }
    if ( type === "long" )
    {
      return DateUtils.formatDateTimeLong ( d, loc ) ;
    }
  }
  if ( ! format ) format = this._DefaultDateFormat ;
  return DateUtils.formatDate ( d, format ) ;
};

/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.firstTimeOfDayOf = function ( h )
{
  return this.timeOfDayOf ( h, true ) ;
};
/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.lastTimeOfDayOf = function ( h )
{
  return this.timeOfDayOf ( h, false ) ;
};
/**
 * Description
 * @param {} h
 * @param {} first
 * @return rc
 */
ItemSubstitutor.prototype.timeOfDayOf = function ( h, first )
{
  var rc ;
  var day = h["DAY"] ;
  if ( ! day )
  {
    day = DateUtils.formatDate ( new Date(), "yyyyMMddHHmmss" ) ;
  }
  var format = h["FORMAT"] ;
  var localeCode = h["LOCALE"] ;
  if ( ! format ) format = this._DefaultDateFormat ;
  if ( day )
  {
    var d ;
    if ( day.length === 8 || day.length === 14 )
    {
      d = DateUtils.parseDate ( day ) ;
    }
    else
    {
      var iday = parseInt ( day ) ;
      d = new Date() ;
      d = DateUtils.addDay ( d, iday ) ;
    }
    if ( first )
    {
      d = DateUtils.roundDownToDay ( d, localeCode ) ;
    }
    else
    {
      d = DateUtils.addDay ( d, 7 ) ;
      d = DateUtils.roundDownToDay ( d, localeCode ) ;
      d.setSeconds ( d.getSeconds() - 1 ) ;
    }
    rc = DateUtils.formatDate ( d, format ) ;
  }
  return rc ;
};
/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.firstTimeOfWeekOf = function ( h )
{
  return this.timeOfWeekOf ( h, true ) ;
};
/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.lastTimeOfWeekOf = function ( h )
{
  return this.timeOfWeekOf ( h, false ) ;
};
/**
 * Description
 * @param {} h
 * @param {} first
 * @return rc
 */
ItemSubstitutor.prototype.timeOfWeekOf = function ( h, first )
{
  var rc ;
  var week = h["WEEK"] ;
  if ( ! week )
  {
    week = DateUtils.formatDate ( new Date(), "yyyyMMddHHmmss" ) ;
  }
  var format = h["FORMAT"] ;
  var localeCode = h["LOCALE"] ;
  if ( ! format ) format = this._DefaultDateFormat ;
  if ( week )
  {
    var d ;
    if ( week.length === 8 || week.length === 14 )
    {
      d = DateUtils.parseDate ( week ) ;
    }
    else
    {
      var iweek = parseInt ( week ) ;
      d = new Date() ;
      d = DateUtils.addDay ( d, iweek * 7 ) ;
    }
    if ( first )
    {
      d = DateUtils.roundDownToWeek ( d, localeCode ) ;
    }
    else
    {
      d = DateUtils.addDay ( d, 7 ) ;
      d = DateUtils.roundDownToWeek ( d, localeCode ) ;
      d.setSeconds ( d.getSeconds() - 1 ) ;
    }
    rc = DateUtils.formatDate ( d, format ) ;
  }
  return rc ;
};
/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.firstTimeOfMonthOf = function ( h )
{
  return this.timeOfMonthOf ( h, true ) ;
}
/**
 * Description
 * @param {} h
 * @return CallExpression
 */
ItemSubstitutor.prototype.lastTimeOfMonthOf = function ( h )
{
  return this.timeOfMonthOf ( h, false ) ;
}
/**
 * Description
 * @param {} h
 * @param {} first
 * @return rc
 */
ItemSubstitutor.prototype.timeOfMonthOf = function ( h, first )
{
  var rc = null ;
  var month = h["MONTH"] ;
  if ( ! month )
  {
    month = DateUtils.formatDate ( new Date(), "yyyyMMddHHmmss" ) ;
  }
  var format = h["FORMAT"] ;
  if ( ! format ) format = this._DefaultDateFormat ;

  if ( month )
  {
    var d ;
    if ( month.length === 8 || month.length === 14 )
    {
      d = DateUtils.parseDate ( month ) ;
    }
    else
    {
      var imonth = parseInt ( month ) ;
      d = new Date() ;
      d = DateUtils.addMonth ( d, imonth ) ;
    }
    if ( first )
    {
      d = DateUtils.roundDownToMonth ( d ) ;
    }
    else
    {
      d = DateUtils.addMonth ( d, 1 ) ;
      d = DateUtils.roundDownToMonth ( d ) ;
      d.setSeconds ( d.getSeconds() - 1 ) ;
    }
    rc = DateUtils.formatDate ( d, format ) ;
  }
  return rc ;
}
module.exports = ItemSubstitutor ;

