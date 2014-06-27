var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;
var FSWatcher = require ( "./FSWatcher" ) ;

var gpclient = new GPClient() ;

var e ;

var w = new FSWatcher ( "./rating.guiding.rul.tmp" ) ;
w.on ( "create", function oncreate ( name )
{
  e = new NEvent ( "notify" ) ;
  e.data = { id: w.getFullname(), state: "start", name: name, type: "progress", text: "MRT Sync started." } ;
  gpclient.fire ( e ) ;
})
w.on ( "delete", function ondelete ( name )
{
  e = new NEvent ( "notify" ) ;
  e.data = { id: w.getFullname(), state: "stop", name: name } ;
  gpclient.fire ( e ) ;
})
w.watch() ;



