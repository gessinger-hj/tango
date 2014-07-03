var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;
var FSWatcher = require ( "FSWatcher" ) ;
var DateUtils = require ( "DateUtils" ) ;
var os = require ( "os" ) ;

var gpclient = new GPClient() ;

var e ;
var hostname = os.hostname() ;

var pattern = "log_.*_MRTExport_.*\\.log$"
var regexp = new RegExp ( pattern ) ; //,modifiers)
var previous_file_name = "" ;

var w = new FSWatcher ( "./rating.guiding.rul.tmp" ) ;

function make_data ( name, state )
{
  var data = { id: hostname + ":" + process.pid + ":" + w.getFullname()
             , state: state
             , name: name
             , type: "progress"
             , hostname: hostname
             , date: new Date()
             , text: "MRT Sync started."
             } ;
  return data ;
}
w.on ( "create", function oncreate ( name )
{
  var time = DateUtils.formatDate ( new Date(), "HH:mm:ss" ) ;
  e = new NEvent ( "notify" ) ;
  e.data = make_data ( name, "start" ) ;
  gpclient.fire ( e ) ;
})
w.on ( "delete", function ondelete ( name )
{
  previous_file_name = "" ;
  e = new NEvent ( "notify" ) ;
  e.data = make_data ( name, "stop" ) ;
  gpclient.fire ( e ) ;
})
w.watch() ;
// var w2 = new FSWatcher ( "./log_1051360_MRTExport_20140626_17_07_41.log" ) ;
// var w2 = new FSWatcher ( "/home/ciss/ciss/logs" ) ;
var w2 = new FSWatcher ( "." ) ;
w2.on ( "change", function ondelete ( name )
{
  if ( regexp.test ( name ) )
  {
    if ( previous_file_name === name )
    {
      return ;
    }
    var time = DateUtils.formatDate ( new Date(), "HH:mm:ss" ) ;
    previous_file_name = name ;
    e = new NEvent ( "notify" ) ;
    e.data = make_data ( name, "start" ) ;
    gpclient.fire ( e ) ;
  }
})
w2.watch() ;



