var T = require ( "Tango" ) ;
var Log = require ( "LogFile" ) ;
var Broker = require ( "gp/Broker" ) ;

Log.init ( "level=info,Xedirect=3,file=%APPNAME%.log:max=1m:v=4") ;

new Broker().listen() ;
var GPResourceSentinel = require ( "GPResourceSentinel" ).GPResourceSentinel ;
var DirectoryResource = require ( "GPResourceSentinel" ).DirectoryResource ;
var MRTResource = require ( "GPResourceSentinel" ).MRTResource ;

var MRT_dir = "/home/ciss2/ciss_rating/MRT" ;
var log_dir = "/home/ciss2/ciss/logs" ;

var RS = new GPResourceSentinel() ;
RS.init() ;
var r ;
// ------------------- log_1051360_MRTExport_20140626_17_07_41.log ------------------------
var r = new DirectoryResource ( log_dir, /^log_\d*_[^_]*_.*\.log$/, /^log_\d*_([^_]*)_.*\.log$/ ) ;

r.setAcceptCallback ( function ( name )
{
  if ( name.indexOf ( "MRTExport" ) >= 0 )
  {
    return false ;
  }
  return true ;
})
RS.addChange ( r ) ;
var rr = new MRTResource ( log_dir, MRT_dir ) ;
RS.add ( rr ) ;
