var Path = require ( "path" ) ;
var T = require ( "Tango" ) ;
var File = require ( "File" ) ;
var fs = require ( "fs" ) ;
var util = require ( "util" ) ;

/**
	* @constructor
	*/
LogFile = function()
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
  this._LEVEL = this.LOG | this.INFO | this.WARNING | this.ERROR ;
};

LogFile.prototype.OFF     = 0x00000000 ; /** No Logging. */
LogFile.prototype.INFO    = 0x00000001 ; /** Obsolete in Java. @deprecated */
LogFile.prototype.ERROR   = 0x00000002 ; /** Log prologs and epilogs. */
LogFile.prototype.SYS     = 0x00000004 ; /** Not used. */
LogFile.prototype.WARNING = 0x00000008 ; /** Log regular log output. */
LogFile.prototype.LOG     = 0x00000010 ; /** Default log level. */
LogFile.prototype.DBG     = 0x00008000 ;

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
        var posMaxSize  = val.indexOf ( ":max" ) ;
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
            strMaxSize  = val.substring ( posMaxSizeEq+1 ) ;
            strMaxVersion = val.substring ( posMaxVersionEq+1, posMaxSize ) ;
            this._fileName   = val.substring ( 0, posMaxVersion ) ;
          }
          else
          {
            strMaxVersion = val.substring ( posMaxVersionEq+1 ) ;
            strMaxSize  = val.substring ( posMaxSizeEq+1, posMaxVersion ) ;
            this._fileName   = val.substring ( 0, posMaxSize ) ;
          }
        }
        else
        if ( posMaxSize > 0 )
        {
          strMaxSize  = val.substring ( posMaxSizeEq+1 ) ;
          strMaxVersion = "2" ;
          this._fileName   = val.substring ( 0, posMaxSize ) ;
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
      this._LEVEL = this.LOG ;
      if ( val === "error" ) this._LEVEL = this._LEVEL | this.ERROR ;
      else
      if ( val === "warning" ) this._LEVEL = this._LEVEL | this.ERROR | this.WARNING ;
      else
      if ( val === "info" ) this._LEVEL = this._LEVEL | this.ERROR | this.WARNING | this.INFO ;
      else
      if ( val === "dbg" ) this._LEVEL = this._LEVEL | this.ERROR | this.WARNING | this.INFO | this.DBG ;
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
  if ( this._LEVEL & this.DBG )
  {
    this._writeToBuffer ( "Application '" + this._appName + "' initialized with: " + initString + "\n", true ) ;
  }
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
          this._out = this._file.getWriteStream() ; ;
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
    this._out.write ( type ) ;
    dateLen = type.length ;
  }
  if ( util.isError ( s ) )
  {
    var tt = util.inspect ( s.stack ) ;
    tt = tt.split ( "\\n" ) ;
    s = tt.join ( "\n" ) ;
    ln = true ;
  }
  this._out.write ( s ) ;
  if ( ln ) this._out.write ( "\n" ) ;
  // out.flush() ;
  if ( s != null ) this._CurSize += dateLen + s.length + (ln ? 1 : 0) ;
  else             this._CurSize += dateLen + (ln ? 1 : 0) ;
};
LogFile.prototype.getDatePrefix = function()
{
  var d = new Date() ;
  var DateUtils = require ( "DateUtils" ) ;
  return "[" + DateUtils.getSoapDateTimeWithMillis ( d ) + "] " ;
};
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
LogFile.prototype.debug = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! ( this._LEVEL & this.DBG ) ) return ;
  // if ( _LogCallback != null ) { _LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[DEBUG]" ) ;
};
LogFile.prototype.info = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! ( this._LEVEL & this.INFO ) ) return ;
  // if ( _LogCallback != null ) { _LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[INFO]" ) ;
};
LogFile.prototype.warning = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! ( this._LEVEL & this.WARNING ) ) return ;
  // if ( _LogCallback != null ) { _LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[WARNING]" ) ;
};
LogFile.prototype.error = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! ( this._LEVEL & this.ERROR ) ) return ;
  // if ( _LogCallback != null ) { _LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true, true, "[ERROR]" ) ;
};
LogFile.prototype.log = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! ( this._LEVEL & this.LOG ) ) return ;
  // if ( _LogCallback != null ) { _LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true ) ;
};
LogFile.prototype.logln = function ( str )
{
	if ( ! this._isInitialized ) this.init() ;
	if ( ! ( this._LEVEL & this.LOG ) ) return ;
  // if ( _LogCallback != null ) { _LogCallback.log ( str ) ; return ; }
  this._writeToBuffer ( str, true, true ) ;
};
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
LogFile.prototype.redirectOutput = function ( channelFlags )
{
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
      console.log = function()
      {
        thiz.log ( util.format.apply ( console, arguments ) + "\n");
      };
      console.error = function()
      {
        thiz.error ( util.format.apply ( console, arguments ) + "\n");
      };
      console.info = function()
      {
        thiz.info ( util.format.apply ( console, arguments ) + "\n");
      };
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
var TLOG = new LogFile() ;
module.exports = TLOG ;

process.on ( "exit", function(rc)
{
  TLOG.flush() ;
}) ;

function XX()
{
  // TLOG.warning ( "XXX----------------" ) ;
  var e = new Error ( "error --------------------");
  throw e ;
}
if ( require.main === module )
{
  try
  {
    XX() ;
  }
  catch ( exc )
  {
  TLOG.log ( exc ) ;
  }
  var i = 0 ;
  // TLOG.init ( "appl=TLOG,level=dbg,xfile=TLOG.log:max=100:v=10" ) ;
  // TLOG.init ( "level=dbg,file=TLOG.log:max=1m:v=4" ) ;
  // TLOG.init ( "level=dbg,file=TLOG-%DATE%.log" ) ;
  for ( i = 0 ; i < 10 ; i++ )
  {
  TLOG.logln ( "xxxxxxxxxxxxxxxxxxxxx") ;
  }
  TLOG.info ( "----------------" ) ;
  TLOG.warning ( "----------------" ) ;
  TLOG.error ( "----------------" ) ;
  TLOG.debug ( "----------------" ) ;
  console.log ( "1 ---- console.log ---------" ) ;
  // TLOG.redirectOutput() ;
  console.log ( "%sXXX", "2 ---- console.log ---------" ) ;
  console.log ( "3 ---- console.log ---------" ) ;
  // TLOG.unredirectOutput() ;
  console.log ( "4 ---- console.log ---------" ) ;
  process.stdout.write ( "5 ---- write ---------\n" ) ;
TLOG.flush() ;
// process.exit(0) ;
}