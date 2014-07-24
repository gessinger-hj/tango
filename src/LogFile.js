var Path = require ( "path" ) ;
var T = require ( "./Tango" ) ;
var fs = require ( "fs" ) ;
var util = require ( "util" ) ;

/**
 * @constructor
 */
var LogFile = function()
{
  this._appName = "" ;
	this._SizedFile = false ;
	this._TimedFile = false ;

	this. _MaxSize  = 0 ;
	this. _CurSize  = 0 ;
	this. _MaxVersion = 0 ;

	this._MaxTime  = 0 ;
	this._LogFilePrefix = null ;
	this._LogFilePostfix = null ;
	this._TimedPerDATE = false ;
	this._TimedPerMONTH = false ;
	this._TimedPerHOUR = false ;

	this._fileName = null ;
	this._file     = null ;
	this._outputToFile = false ;

	this._isInitialized = false ;

  this._stdout = process.stdout ;
  this._out = this._stdout ;
  this.LogLevel =
  {
    LOG       : 0x00001000 ,
    EMERGENCY : 0x00000100 ,
    ALERT     : 0x00000080 ,
    CRITICAL  : 0x00000040 ,
    ERROR     : 0x00000020 ,
    WARNING   : 0x00000010 ,
    NOTICE    : 0x00000008 ,
    INFO      : 0x00000004 ,
    DEBUG     : 0x00000002 ,
    OFF       : 0x00000000
  };
  this._LEVEL = this.LogLevel.INFO ;
  this._LEVEL_NAME = "info" ;
  this._LogCallback = null ;
};
/**
 * Description
 * @param {} loggerInterface
 */
LogFile.prototype.setLogger = function ( loggerInterface )
{
  var o =
  {
  //   emergency: function ( str ) {}
  // , alert: function ( str ) {}
  // , critical: function ( str ) {}
  // , error: function ( str ) {}
  // , warning: function ( str ) {}
  // , notice: function ( str ) {}
  // , info: function ( str ) {}
    /**
     * Description
     * @param {} str
     */
    debug: function ( str ) {}
  // , log: function ( str ) {}
  } ;
  var li = loggerInterface ;
  if ( typeof li.emergency === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.emergency = function ( str ) { li.emergency ( str ) } ;
  if ( typeof li.alert === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.alert = function ( str ) { li.alert ( str ) } ;
  if ( typeof li.critical === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.critical = function ( str ) { li.critical ( str ) } ;
  if ( typeof li.error === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.error = function ( str ) { li.error ( str ) } ;
  if ( typeof li.warning === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.warning = function ( str ) { li.warning ( str ) } ;
  if ( typeof li.notice === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.notice = function ( str ) { li.notice ( str ) } ;
  if ( typeof li.info === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.info = function ( str ) { li.info ( str ) } ;
  if ( typeof li.debug === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.debug = function ( str ) { li.debug ( str ) } ;
  if ( typeof li.log === 'function' ) 
/**
  * Description
  * @param {} str
  */
 o.log = function ( str ) { li.log ( str ) } ;

  if ( ! o.log ) o.log = o.info ;
  if ( ! o.emergency ) o.emergency = o.error ;
  if ( ! o.alert ) o.alert = o.error ;
  if ( ! o.critical ) o.critical = o.error ;
  if ( ! o.notice ) o.notice = o.info ;

  this._LogCallback = o ;
};
/**
 * Description
 * @param {} s
 */
LogFile.prototype.init = function ( s )
{
  if ( this._isInitialized ) return ;
  this._isInitialized = true ;
  var appName = process.argv[1] ;
  appName = appName.replace ( /\\/g, "/" ) ;
  appName = appName.substring ( appName.lastIndexOf ( "/" ) + 1 ) ;
  if ( appName.endsWith ( ".js" ) )
  {
    appName = appName.substring ( 0, appName.lastIndexOf ( "." ) ) ;
  }
  var tango_app_str = T.getProperty ( "tango_" + appName ) ;
  var tango_env_str = T.getProperty ( "tango.env" ) ;
  if ( ! tango_app_str )
  {
    tango_app_str = tango_env_str ;
  }

  if ( ! s ) s = "" ;
  if ( tango_app_str ) s = tango_app_str + "," + s ;

  var str = s ;
  var initString = str ;
  var nv = str.split ( "," ) ;
  var i ;
  var fileFound = false ;
  for ( i = 0 ; i < nv.length ; i++ )
  {
    if ( nv[i].trim().startsWith ( "file" ) )
    {
      fileFound = true ; break ;
    }
  }
  if ( tango_app_str && ! fileFound )
  {
    tango_app_str += ",file=" + appName + ".log:max=1m:v=4" ;
    nv = tango_app_str.split ( "," ) ;
  }
  var redirectOutput = 0 ;
  for ( i = 0 ; i < nv.length ; i++ )
  {
    var tag = nv[i] ;
    tag = tag.trim() ;
    var pos = tag.indexOf ( '=' ) ;
    if ( pos <= 0 ) continue ;
    var val = tag.substring ( pos + 1 ) ;

    if ( tag.startsWith ( "appl" ) )
    {
      this._appName = val ;
    }
    else
    if ( tag.startsWith ( "redirect" ) )
    {
      redirectOutput = parseInt ( val ) ;
      if ( isNaN ( redirectOutput ) ) redirectOutput = 3 ;
    }
    else
    if ( tag.startsWith ( "file" ) )
    {
      if ( val.length > 0 && val.charAt ( 0 ) != ':' )
      {
        if ( val.indexOf ( "%" ) >= 0 )
        {
          val = val.replace ( "%APPNAME%", appName ) ;
        }
        var posMaxSize    = val.indexOf ( ":max" ) ;
        var posMaxVersion = val.indexOf ( ":v" ) ;

        var posMaxSizeEq = -1 ;
        if ( posMaxSize > 0 ) posMaxSizeEq = val.indexOf ( '=', posMaxSize ) ;
        var posMaxVersionEq = -1 ;
        if ( posMaxVersion > 0 ) posMaxVersionEq = val.indexOf ( '=', posMaxVersion ) ;

        var strMaxSize  = null ;
        var strMaxVersion = null ;
        if ( posMaxSize > 0 && posMaxVersion > 0 )
        {
          if ( posMaxSize > posMaxVersion )
          {
            strMaxSize     = val.substring ( posMaxSizeEq+1 ) ;
            strMaxVersion  = val.substring ( posMaxVersionEq+1, posMaxSize ) ;
            this._fileName = val.substring ( 0, posMaxVersion ) ;
          }
          else
          {
            strMaxVersion  = val.substring ( posMaxVersionEq+1 ) ;
            strMaxSize     = val.substring ( posMaxSizeEq+1, posMaxVersion ) ;
            this._fileName = val.substring ( 0, posMaxSize ) ;
          }
        }
        else
        if ( posMaxSize > 0 )
        {
          strMaxSize     = val.substring ( posMaxSizeEq+1 ) ;
          strMaxVersion  = "2" ;
          this._fileName = val.substring ( 0, posMaxSize ) ;
        }
        else
        if ( posMaxVersion > 0 )
        {
          strMaxVersion = val.substring ( posMaxVersionEq+1 ) ;
          strMaxSize  = "1000000" ;
          this._fileName   = val.substring ( 0, posMaxVersion ) ;
        }
        var MaxSizeFactor = 1 ;
        if ( strMaxSize != null )
        {
          strMaxVersion = strMaxVersion.trim() ;
          strMaxSize  = strMaxSize.trim() ;
          if (  strMaxSize.endsWith ( "M" )
             || strMaxSize.endsWith ( "m" )
             )
          {
            strMaxSize  = strMaxSize.substring ( 0, strMaxSize.length-1 ) ;
            MaxSizeFactor = 1000000 ;
          }
          else
          if (  strMaxSize.endsWith ( "K" )
             || strMaxSize.endsWith ( "k" )
             )
          {
            strMaxSize  = strMaxSize.substring ( 0, strMaxSize.length-1 ) ;
            MaxSizeFactor = 1000 ;
          }

          this._MaxSize = parseInt ( strMaxSize ) ;
          if ( isNaN ( this._MaxSize) )
          {
            this._MaxSize = 0 ;
            strMaxVersion = "0" ;
          }
          this._MaxVersion = parseInt ( strMaxVersion ) ;
          if ( isNaN ( this._MaxVersion) )
          {
            this._MaxSize = 0 ;
          }
          this._MaxSize *= MaxSizeFactor ;
        }
        else this._fileName = val ;
      }
      if ( this._MaxSize > 0 )
      {
        this._SizedFile = true ;
      }
      else
      {
        var VAL = val.toUpperCase() ;
        if ( VAL.indexOf ( "%DATE%" ) >= 0 )
        {
          this._TimedPerDATE = true ;
          pos = VAL.indexOf ( "%DATE%" ) ;
          this._LogFilePrefix = val.substring ( 0, pos ) ;
          if ( val.length < pos + 6 + 1 ) this._LogFilePostfix = "" ;
          else this._LogFilePostfix = val.substring ( pos + 6 ) ;
          this._TimedFile = true ;
        }
        else
        if ( VAL.indexOf ( "%MONTH%" ) >= 0 )
        {
          _TimedPerMONTH = true ;
          this.pos = VAL.indexOf ( "%MONTH%" ) ;
          this._LogFilePrefix = val.substring ( 0, pos ) ;
          if ( val.length < pos + "%MONTH%".length + 1 ) this._LogFilePostfix = "" ;
          else this._LogFilePostfix = val.substring ( pos + 7 ) ;
          this._TimedFile = true ;
        }
        else
        if ( VAL.indexOf ( "%HOUR%" ) >= 0 )
        {
          this._TimedPerHOUR = true ;
          pos = VAL.indexOf ( "%HOUR%" ) ;
          this._LogFilePrefix = val.substring ( 0, pos ) ;
          if ( val.length < pos + "%HOUR%".length + 1 ) this._LogFilePostfix = "" ;
          else this._LogFilePostfix = val.substring ( pos + 6 ) ;
          this._TimedFile = true ;
        }
      }
    }
    else
    if ( tag.startsWith ( "class" ) )
    {
    }
    else
    if ( tag.startsWith ( "level" ) )
    {
      this._LEVEL = 0 ;

      var VAL = val.toUpperCase() ;
      if ( VAL === 'DBG' ) VAL = 'DEBUG' ;
      var level = this.LogLevel[VAL] ;
      if ( typeof level === 'undefined' )
      {
        this._LEVEL = this.LogLevel.NOTICE ;
        this._LEVEL_NAME = "notice" ;
      }
      else
      if ( level === 0 )
      {
        this._LEVEL = 0x00002000 ;
      }
      else
      {
        this._LEVEL = level ;
        this._LEVEL_NAME = val ;
      }
    }
  }
  if ( ! this._appName )
  {
  	this._appName = appName ;
  }
  if ( this._fileName != null )
  {
    this._fileName = this._fileName.trim() ;
    this._fileName = Path.normalize ( this._fileName ) ;
    if ( this._fileName.length == 0 ) this._fileName = this._appName ;
    if ( this._fileName.indexOf ( '.' ) < 0 ) this._fileName += ".log" ;
    this._outputToFile = true ;
  }

  if ( redirectOutput )
  {
    this.redirectOutput ( redirectOutput ) ;
  }
  if ( this._LEVEL & this.DEBUG )
  {
    this._writeToBuffer ( "Application '" + this._appName + "' initialized with: " + initString + "\n", true ) ;
  }
};
/**
 * Description
 * @param {} level
 */
LogFile.prototype.setLevel = function ( level )
{
  for ( var n in this.LogLevel )
  {
    if ( this.LogLevel[n] === level )
    {
      this._LEVEL_NAME = n ;
      this._LEVEL = level ;
    }
  }
};
/**
 * Description
 * @return MemberExpression
 */
LogFile.prototype.getLevel = function()
{
  return this._LEVEL ;
};
/**
 * Description
 * @return MemberExpression
 */
LogFile.prototype.getLevelName = function()
{
  return this._LEVEL_NAME ;
};
LogFile.prototype._writeToBuffer = function ( s, printTime, ln, type )
{
  this._writeToOutputBuffer ( s, printTime, ln, type ) ;
};
LogFile.prototype._writeToOutputBuffer = function ( s
                                                  , printTime 
                                                  , ln
                                                  , type
                                                  )
{
  if ( this._outputToFile )
  {
    if ( this._SizedFile || this._TimedFile )
    {
      if ( this._file == null )
      {
        this.openNewFileIntern() ;
      }
      else
      {
        if ( this._SizedFile && this._CurSize > this._MaxSize )
        {
          this.openNewFileIntern() ;
        }
        else
        if ( this._TimedFile && new Date().getTime() > this._MaxTime )
        {
          this.openNewFileIntern() ;
        }
      }
    }
    else
    {
      if ( this._file == null )
      {
        this._file = new File ( this._fileName ) ;
        try
        {
          this._out = this._file.getWriteStream() ;
        }
        catch ( exc )
        {
          this._out = this._stdout ;
        }
      }
    }
  }
  var dateLen = 0 ;
  if ( printTime )
  {
    var ss = this.getDatePrefix() ;
    this._out.write ( ss ) ;
    dateLen = ss.length ;
  }
  if ( type )
  {
    this._out.write ( type + " " ) ;
    dateLen += type.length ;
  }
  if ( util.isError ( s ) )
  {
    var ttt = s.toString() ;
    var tt = util.inspect ( s.stack ) ;
    tt = tt.split ( "\\n" ) ;
    if ( tt.length > 0 )
    {
      tt.splice ( 0, 1 ) ;
    }
    if ( tt.length )
    {
      s = ttt + "\n" + tt.join ( "\n" ) ;
    }
    else
    {
      s = ttt ;
    }
    ln = true ;
  }
  if ( typeof s === 'object' )
  {
    s = util.inspect ( s, { showHidden: false, depth: null } )
  }
  this._out.write ( s ) ;
  if ( ln ) this._out.write ( "\n" ) ;
  if ( s != null ) this._CurSize += dateLen + s.length + (ln ? 1 : 0) ;
  else             this._CurSize += dateLen + (ln ? 1 : 0) ;
};
/**
 * Description
 * @return BinaryExpression
 */
LogFile.prototype.getDatePrefix = function()
{
  var d = new Date() ;
  var DateUtils = require ( "DateUtils" ) ;
  return "[" + DateUtils.getSoapDateTimeWithMillis ( d ) + "]" ;
};
/**
 * Description
 */
LogFile.prototype.openNewFile = function()
{
  if ( this._outputToFile )
  {
    if ( this._SizedFile || this._TimedFile )
    {
      this.openNewFileIntern() ;
    }
  }
};
/**
 * Description
 */
LogFile.prototype.openNewFileIntern = function()
{
  if ( this._out !== this._stdout )
  {
    try { this._out.end() ; }
    catch ( exc ) { console.log ( exc ) ; }
  }
  this._out = this._stdout ;
  this._file = null ;

  if ( this._TimedFile )
  {
    // roundDownToDay
    var m = new Date().getTime() ;
    m /= 1000 ;
    m *= 1000 ;

	  var DateUtils = require ( "DateUtils" ) ;
    var d = new Date ( m ) ;
    var d2 ;
  	var sdf = "yyyy-MM-dd" ;
    if ( this._TimedPerMONTH )
    {
    	d = DateUtils.roundDownToMonth ( d ) ;
      d2 = DateUtils.addMonth ( d, 1 ) ;
    }
    else
    if ( this._TimedPerDATE )
    {
    	d = DateUtils.roundDownToDay ( d ) ;
      d2 = DateUtils.addDay ( d, 1 ) ;
    }
    else
    if ( this._TimedPerHOUR )
    {
      sdf = "yyyy-MM-ddTHHmmss" ;
	    d.setMinutes ( 0 ) ;
  	  d.setSeconds ( 0 ) ;
    	d.setMilliseconds ( 0 ) ;
      d2 = new Date ( d.getTime() + 3600 ) ;
    }

    this._MaxTime = d2.getTime() ;

    var s = DateUtils.formatDate ( d, sdf ) ;

    this._file = new File ( this._LogFilePrefix + s + this._LogFilePostfix ) ;
    try
    {
      if ( this._file.exists() )
      {
	      this._out = this._file.getWriteStream ( "", "a" ) ;
      }
      else
      {
	      this._out = this._file.getWriteStream() ;
      }
    }
    catch ( exc )
    {
      this._outputToFile = false ;
      this._file = null ;
      this._out = this._stdout
    }
  }
  else
  if ( this._SizedFile )
  {
    for ( var i = this._MaxVersion - 1 ; i > 0 ; i-- )
    {
      var from = new File ( this._fileName + "_" + i ) ;
      var to   = new File ( this._fileName + "_" + ( i + 1 ) ) ;
      try { to.remove() ; }
      catch ( exc ) { }
      try { from.renameTo ( to ) ; }
      catch ( exc ) { }
    }
    this._file = new File ( this._fileName + "_1" ) ;
    this._CurSize = 0 ;
    try
    {
	    this._out = this._file.getWriteStream() ;
    }
    catch ( exc )
    {
      this._outputToFile = false ;
      this._file = null ;
      this._out = this._stdout ;
    }
  }
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.debug = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( this._LEVEL > this.LogLevel.DEBUG ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.debug ( str ) ; return ; }
  var t = T.where ( 1 ) ;
  t = t.replace ( /\\/g, "/") ;
  var pos1 = t.indexOf ( "(" ) ;
  var fname = "" ;
  if ( pos1 >= 0 )
  {
    var fname = t.substring ( 0, pos1 ).trim() ;
    if ( fname.indexOf ( "at ") === 0 )
    {
      fname = fname.substring ( 3 ) ;
    }
    var pos2 = t.indexOf ( ")", pos1 ) ;
    t = t.substring ( pos1 + 1, pos2 ) ;
    pos1 = t.lastIndexOf ( "/" ) ;
    if ( pos1 >= 0 )
    {
      t = t.substring ( pos1 + 1 ) ;
    }
  }
  this._writeToBuffer ( str, true, true, "[DEBUG][" + t + " (" + fname + "())]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.info = function ( str )
{
  if ( ! this._isInitialized ) this.init() ;
  if ( this._LEVEL > this.LogLevel.INFO ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.info ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[INFO]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.notice = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( this._LEVEL > this.LogLevel.NOTICE ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.notice ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[NOTICE]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.warning = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( this._LEVEL > this.LogLevel.WARNING ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.warning ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[WARNING]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.error = function ( str )
{
  if ( ! this._isInitialized ) this.init() ;
  if ( this._LEVEL > this.LogLevel.ERROR ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.error ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[ERROR]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.critical = function ( str )
{
  if ( ! this._isInitialized ) this.init() ;
  if ( this._LEVEL > this.LogLevel.CRITICAL ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.critical ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[CRITICAL]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.alert = function ( str )
{
  if ( ! this._isInitialized ) this.init() ;
  if ( this._LEVEL > this.LogLevel.ALERT ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.alert ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[ALERT]" ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.emergency = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( this._LEVEL > this.LogLevel.EMERGENCY ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.emergency ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[EMERGENCY]" ) ;
};

/**
 * Description
 * @param {} str
 */
LogFile.prototype.log = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! this._LEVEL ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true ) ;
};
/**
 * Description
 * @param {} str
 */
LogFile.prototype.logln = function ( str )
{
  if ( ! this._isInitialized ) this.init() ;
  if ( ! this._LEVEL ) return ;
  if ( this._LogCallback != null ) { this._LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true, true ) ;
};
/**
 * Description
 */
LogFile.prototype.flush = function()
{
	if ( this._out !== this._stdout )
	{
		try
    {
      this._out.end() ;
      this._out = this._stdout ;
      this.unredirectOutput() ;
    }
    catch ( exc )
    {
      console.log ( exc ) ;
    }
    this._outputToFile = false ;
    this._file = null ;
  }
};
/**
 * Description
 * @param {} channelFlags
 */
LogFile.prototype.redirectOutput = function ( channelFlags )
{
  if ( ! this._outputToFile ) return ;
  if ( ! channelFlags )
  {
    channelFlags = 3 ;
  }
  if ( channelFlags & 1 )
  {
    if ( ! this._oldout )
    {
      var thiz = this ;
      this.old_console_log = console.log ;
      this.old_console_info = console.info ;
      this.old_console_warn = console.warn ;
      this.old_console_error = console.error ;
      /**
       * Description
       */
      console.log = function()
      {
        thiz.log ( util.format.apply ( console, arguments ) + "\n");
      };
      /**
       * Description
       */
      console.error = function()
      {
        thiz.error ( util.format.apply ( console, arguments ) + "\n");
      };
      /**
       * Description
       */
      console.info = function()
      {
        thiz.info ( util.format.apply ( console, arguments ) + "\n");
      };
      /**
       * Description
       */
      console.warn = function()
      {
        thiz.warning ( util.format.apply ( console, arguments ) + "\n");
      };
      this._oldout = process.stdout;
      process.__defineGetter__("stdout", function()
      {
        return thiz._out;
      });
    }
  }
  if ( channelFlags & 2 )
  {
    if ( ! this._olderr )
    {
      this._olderr = process.stderr ;
      var thiz = this ;
      process.__defineGetter__("stderr", function()
      {
        return thiz._out;
      });
    }
  }
};
/**
 * Description
 * @param {} channelFlags
 */
LogFile.prototype.unredirectOutput = function ( channelFlags )
{
  if ( ! channelFlags )
  {
    channelFlags = 3 ;
  }
  if ( channelFlags & 1 )
  {
    if ( this._oldout )
    {
      if ( this.old_console_log )
      {
        console.log = this.old_console_log ;
        console.info = this.old_console_info ;
        console.warn = this.old_console_warn ;
        console.error = this.old_console_error ;
        this.old_console_log = null ;
        this.old_console_info = null ;
        this.old_console_error = null ;
        this.old_console_warn = null ;
      }
      var oout = this._oldout ;
      this._oldout = null ;
      process.__defineGetter__("stdout", function()
      {
        return oout ;
      });
    }
  }
  if ( channelFlags & 2 )
  {
    if ( this._olderr )
    {
      var thiz = this ;
      var oerr = this._olderr ;
      this._olderr = null ;
      process.__defineGetter__("stderr", function()
      {
        return oerr ;
      });
    }
  }
};
/**
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
/**
 * Description
 * @return MemberExpression
 */
File.prototype.toString = function()
{
  return this.path ;
};
/**
 * Description
 * @param {} enc
 * @param {} mode
 * @return CallExpression
 */
File.prototype.getWriteStream = function ( enc, mode )
{
  if ( ! enc && enc !== null ) enc = "utf8" ;
  if ( !enc ) enc = null ;
  if ( mode )
  {
    return fs.createWriteStream ( this.path, { encoding: enc, flags: mode } ) ;
  }
  return fs.createWriteStream ( this.path, { encoding: enc } ) ;
};
/**
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

var Log = new LogFile() ;

module.exports = Log ;

if ( require.main === module )
{
  // T.setProperty ( "tango.env", "level=info,redirect=3,file=%APPNAME%.log") ;
  // Log.init() ;
  // Log.init ( "appl=Log,level=debug,xfile=Log.log:max=100:v=10" ) ;
  // var XX = function()
  // {
  //   var e = new Error ( "error --------------------");
  //   throw e ;
  // } ;
  // try
  // {
  //   XX() ;
  // }
  // catch ( exc )
  // {
  // Log.log ( exc ) ;
  // }

  // var i = 0 ;
  // Log.init ( "level=dbg,file=Log.log:max=1m:v=4" ) ;
  Log.init ( "level=notice,Xfile=Log-%DATE%.log" ) ;
  // for ( i = 0 ; i < 10 ; i++ )
  // {
  // Log.logln ( "xxxxxxxxxxxxxxxxxxxxx") ;
  // }

//   var o =
//   {
//     error: function ( str ) { console.log ( "1-" + str ) ;}
//   , warning: function ( str ) { console.log ( "2-" + str ) ;}
//   , info: function ( str ) { console.log ( "3-" + str ) ;}
//   , log: function ( str ) { console.log ( "4-" + str ) ;}
//   } ;
// Log.seLogger ( o ) ;
  Log.emergency ( "----------------" ) ;
  Log.alert ( "----------------" ) ;
  Log.critical ( "----------------" ) ;
Log.setLevel ( Log.LogLevel.DEBUG ) ;
  Log.error ( "----------------" ) ;
  Log.warning ( "----------------" ) ;
  Log.info ( "----------------" ) ;
  Log.notice ( "----------------" ) ;
  Log.debug ( "----------------" ) ;
  console.log ( "1 ---- console.log ---------" ) ;
  // Log.redirectOutput() ;
  console.log ( "%sXXX", "2 ---- console.log ---------" ) ;
  console.log ( "3 ---- console.log ---------" ) ;
  // Log.unredirectOutput() ;
  console.log ( "4 ---- console.log ---------" ) ;
  process.stdout.write ( "5 ---- write ---------\n" ) ;
// Log.flush() ;
// process.exit(0) ;
}
