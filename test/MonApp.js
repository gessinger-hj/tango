var T = require ( "Tango" ) ;
var GPBroker = require ( "GPBroker" ) ;

T.setProperty ( "tango.env", "level=info,redirect=3") ;

new GPBroker().listen() ;
var GPResourceSentinel = require ( "GPResourceSentinel" ).GPResourceSentinel ;
var DirectoryResource = require ( "GPResourceSentinel" ).DirectoryResource ;
var MRTResource = require ( "GPResourceSentinel" ).MRTResource ;

var RS = new GPResourceSentinel() ;
RS.init() ;
var r ;
// ------------------- log_1051360_MRTExport_20140626_17_07_41.log ------------------------
var r = new DirectoryResource ( "/home/ciss/ciss/logs", /^log_\d*_[^_]*_.*\.log$/, /^log_\d*_([^_]*)_.*\.log$/ ) ;

r.setAcceptCallback ( function ( name )
{
  if ( name.indexOf ( "MRTExport" ) >= 0 )
  {
    return false ;
  }
  return true ;
})
RS.addChange ( r ) ;

var MRT_dir = "/vol1/wevli154/home/ciss/ciss_rating/MRT" ;
var log_dir = "/vol1/wevli154/home/ciss/ciss/logs" ;

var rr = new MRTResource ( log_dir, MRT_dir ) ;
RS.add ( rr ) ;
