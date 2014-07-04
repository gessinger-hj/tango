var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var GPClient = require ( "GPClient" ) ;
var FSWatcher = require ( "FSWatcher" ) ;
var DateUtils = require ( "DateUtils" ) ;
var os = require ( "os" ) ;
var File = require ( "File" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var util = require ( "util" ) ;
var Timer = require ( "Timer" ) ;

var ResourceSentinel = function ( port, host )
{
  this.port = port ; 
  this.host = host ; 
  this.gpclient = null ;
  this.hostname = os.hostname() ;
  this.resourceList = [] ;
};
ResourceSentinel.prototype.init = function()
{
  this.gpclient = new GPClient ( this.port, this.host ) ;
};
ResourceSentinel.prototype.make_data = function ( name, state, id )
{
  var data = { id: this.hostname + ":" + process.pid + ":" + id
             , state: state
             , name: name
             , type: "progress"
             , hostname: this.hostname
             , date: new Date()
             , text: "MRT Sync started."
             } ;
  return data ;
};
ResourceSentinel.prototype.addChange = function ( resource )
{
  var thiz = this ;
  if ( ! this.resourceList.length )
  {
    this.timer = new Timer ( 5000, function(e)
    {
      thiz.removeOutDated() ;
    });
    this.timer.start() ;
  }
  this.resourceList.push ( resource ) ;
  var e ;
  resource.on ( "change", function onchange ( name, resourceId )
  {
    e = new NEvent ( "notification" ) ;
    e.data = thiz.make_data ( name, "show", resourceId ) ;
    e.data.type = "notify" ;
    e.data.text = name ;
    e.data.millis = 5000 ;
    thiz.gpclient.fire ( e ) ;
  }) ;
};
ResourceSentinel.prototype.removeOutDated = function()
{
  for ( var i = 0 ; i < this.resourceList.length ; i++ )
  {
    var list = this.resourceList[i].removeOlderThan ( 10000 ) ;
    if ( list.length )
    {
console.log ( list ) ;
    }
  }
};
/*
var RS = new ResourceSentinel() ;
RS.init() ;

var e ;
var hostname = os.hostname() ;

var pattern = "log_.*_MRTExport_.*\\.log$"
var regexp_MRTExport = new RegExp ( pattern ) ; //,modifiers)
var previous_file_name = "" ;

var w = new FSWatcher ( "./rating.guiding.rul.tmp" ) ;

w.on ( "create", function oncreate ( name )
{
  e = new NEvent ( "notify" ) ;
  e.data = RS.make_data ( name, "start" ) ;
  RS.gpclient.fire ( e ) ;
})
w.on ( "delete", function ondelete ( name )
{
  previous_file_name = "" ;
  e = new NEvent ( "notify" ) ;
  e.data = RS.make_data ( name, "stop" ) ;
  RS.gpclient.fire ( e ) ;
})
w.watch() ;
// var w2 = new FSWatcher ( "./log_1051360_MRTExport_20140626_17_07_41.log" ) ;
// var w2 = new FSWatcher ( "/home/ciss/ciss/logs" ) ;
var w2 = new FSWatcher ( "." ) ;
w2.on ( "change", function onchange ( name )
{
  if ( regexp_MRTExport.test ( name ) )
  {
    if ( previous_file_name === name )
    {
      return ;
    }
    previous_file_name = name ;
    e = new NEvent ( "notify" ) ;
    e.data = RS.make_data ( name, "start" ) ;
    RS.gpclient.fire ( e ) ;
  }
})
w2.watch() ;
*/
var DirectoryResource = function ( dirname, pattern )
{
  EventEmitter.call ( this ) ;
  this.watcher = null ;
  this.dirname = dirname ;
  if ( ! pattern )
  {
    pattern = ".*" ;
  }
  if ( ! Array.isArray ( pattern ) )
  {
    pattern = [ pattern ] ;
  }
  var i = 0 ;
  this.patternList = [] ;
  for ( i = 0 ; i < pattern.length ; i++ )
  {
    this.patternList[i] = new RegExp ( pattern[i] ) ;
  }
  this.watcher = new FSWatcher ( dirname ) ;
  this.knownFiles = {} ;
};
util.inherits ( DirectoryResource, EventEmitter ) ;
DirectoryResource.prototype.on = function ( eventName, callback )
{
  EventEmitter.prototype.on.apply ( this, arguments ) ;
  if ( eventName !== "change" )
  {
    return ;
  }
  this.watcher.on ( "change", this._onchange.bind ( this ) ) ;
  this.watcher.watch() ;
};
DirectoryResource.prototype._onchange = function ( name )
{
  var i = 0 ;
  if ( this.knownFiles[name] )
  {
    return ;
  }
  for ( i = 0 ; i < this.patternList.length ; i++ )
  {
    if ( this.patternList[i].test ( name ) )
    {
      this.knownFiles[name] = new Date().getTime() ;
      this.emit ( "change", name, this.dirname + "/" + name ) ;
    }
  };
};
DirectoryResource.prototype.removeOlderThan = function ( millis )
{
  var now = new Date().getTime() ;
  var limit = now - millis ;
  var toBeRemoved = [] ;
  for ( var k in this.knownFiles )
  {
    var m = this.knownFiles[k] ;
    if ( m < limit )
    {
      toBeRemoved.push ( k ) ;
    }
  }
  for ( var i = 0 ; i < toBeRemoved.length ; i++ )
  {
    delete this.knownFiles[toBeRemoved[i]] ;
  }
  return toBeRemoved ;
};
/*
module.exports = new ResourceSentinel() ;
*/
if ( require.main === module )
{
  var r = new DirectoryResource ( "." ) ;
//   r.on ( "change", function onchange ( name )
//   {
// console.log ( "name=" + name ) ;
//   } )
  var RS = new ResourceSentinel() ;
  RS.init() ;

  RS.addChange ( r ) ;
}



