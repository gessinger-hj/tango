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
var Log = require ( "LogFile" ) ;
var Path = require ( "path" ) ;

var ResourceSentinel = function ( port, host )
{
  this.port = port ; 
  this.host = host ; 
  this.gpclient = null ;
  this.hostname = os.hostname() ;
  this.resourceList = [] ;
  var thiz = this ;
  this.timer = new Timer ( 5000, function(e)
  {
    thiz.removeOutdated() ;
  });
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
ResourceSentinel.prototype.add = function ( resource )
{
  resource.setParent ( this ) ;
  if ( ! this.resourceList.length )
  {
    this.timer.start() ;
  }
  this.resourceList.push ( resource ) ;
};
ResourceSentinel.prototype.addChange = function ( resource )
{
  resource.setParent ( this ) ;
  var thiz = this ;
  if ( ! this.resourceList.length )
  {
    this.timer.start() ;
  }
  this.resourceList.push ( resource ) ;
  var e ;
  resource.on ( "change", function onchange ( name, resourceId, displayName )
  {
    e = new NEvent ( "notify" ) ;
    e.data = thiz.make_data ( name, "show", resourceId ) ;
    e.data.type = this.getNotificationType() ;
    e.data.text = displayName ? displayName : name ;
    e.data.millis = 5000 ;
console.log ( "change: " + resourceId ) ;
    thiz.gpclient.fire ( e ) ;
  }) ;
};
ResourceSentinel.prototype.removeOutdated = function()
{
  for ( var i = 0 ; i < this.resourceList.length ; i++ )
  {
    if ( ! this.resourceList[i].canOutdate() )
    {
      continue ;
    }
    var resourceIdList = this.resourceList[i].removeOutdated() ;
    if ( resourceIdList.length )
    {
      for ( var j = 0 ; j < resourceIdList.length ; j++ )
      {
        var p = resourceIdList[j] ;
        e = new NEvent ( "notify" ) ;
        e.data = this.make_data ( p.name, "stop", p.resourceId ) ;
        e.data.type = "notify" ;
        e.data.text = p.displayName ? p.displayName : p.name ;
        e.data.millis = 5000 ;
console.log ( "remove: " + p.resourceId ) ;
        this.gpclient.fire ( e ) ;
      }
    }
  }
};
var WatchResource = function()
{
  EventEmitter.call ( this ) ;
  this.resourceId = null ;
  this.notificationType = "notify" ;
  this.parent = null ;
  this._canOutdate = false ;
};
util.inherits ( WatchResource, EventEmitter ) ;
WatchResource.prototype.canOutdate = function()
{
  return this._canOutdate ;
};
WatchResource.prototype.setCanOutdate = function ( state )
{
  state = !! state ;
  this._canOutdate = state ;
};
WatchResource.prototype.setResourceId = function ( id )
{
  this.resourceId = id ;
};
WatchResource.prototype.setParent = function ( sentinel )
{
  this.parent = sentinel ;
};
var MRTResource = function ( log_dir, MRT_dir )
{
  WatchResource.apply ( this, arguments ) ;
  this.MRT_dir = log_dir ;
  this.log_dir = MRT_dir ;
};
util.inherits ( MRTResource, WatchResource ) ;
MRTResource.prototype.setParent = function ( sentinel )
{
  WatchResource.prototype.setParent.apply ( this, arguments )
  var pattern = "log_.*_MRTExport_.*\\.log$"
  var regexp_MRTExport = new RegExp ( pattern ) ; //,modifiers)
  var previous_file_name = "" ;

  var thiz = this ;
  this.w = new FSWatcher ( this.MRT_dir + "/rating.guiding.rul.tmp" ) ;

  this.w.on ( "create", function oncreate ( name )
  {
    e = new NEvent ( "notify" ) ;
    e.data = thiz.parent.make_data ( name, "start", "MRTExport" ) ;
    thiz.parent.gpclient.fire ( e ) ;
  });
  this.w.on ( "delete", function ondelete ( name )
  {
    previous_file_name = "" ;
    e = new NEvent ( "notify" ) ;
    e.data = thiz.parent.make_data ( name, "stop", "MRTExport" ) ;
    thiz.parent.gpclient.fire ( e ) ;
  });
  this.w.watch() ;
  this.w2 = new FSWatcher ( this.log_dir ) ;
  this.w2.on ( "change", function onchange ( name )
  {
    if ( regexp_MRTExport.test ( name ) )
    {
      if ( previous_file_name === name )
      {
        return ;
      }
      previous_file_name = name ;
      e = new NEvent ( "notify" ) ;
      e.data = thiz.parent.make_data ( name, "start", "MRTExport" ) ;
      thiz.parent.gpclient.fire ( e ) ;
    }
  })
  this.w2.watch() ;
};
var DirectoryResource = function ( dirname, pattern, displayPattern )
{
  WatchResource.apply ( this, arguments ) ;
  this.dirname = Path.resolve ( dirname ) ;
  if ( ! pattern )
  {
    pattern = /.*/ ;
  }
  if ( ! Array.isArray ( pattern ) )
  {
    pattern = [ pattern ] ;
  }
  if ( ! displayPattern )
  {
    displayPattern = /(.*)/ ;
  }
  if ( ! Array.isArray ( displayPattern ) )
  {
    displayPattern = [ displayPattern ] ;
  }
  this.displayPatternList = displayPattern ;
  var i = 0 ;
  this.patternList = [] ;
  for ( i = 0 ; i < pattern.length ; i++ )
  {
    if ( typeof pattern[i] === 'string' )
    {
      this.patternList[i] = new RegExp ( pattern[i] ) ;
    }
    else
    {
      this.patternList[i] = pattern[i] ;
    }
  }
  this.watcher = new FSWatcher ( dirname ) ;
  this.knownFiles = {} ;
  this.maxMillis = 5000 ;
  this.accept = null ;
  this._isWatching = false ;
  this._canOutdate = true ;
};
util.inherits ( DirectoryResource, WatchResource ) ;
DirectoryResource.prototype.setAcceptCallback = function ( callback )
{
  this.accept = callback ;
};
DirectoryResource.prototype.setNotificationType = function ( notificationType )
{
  this.notificationType = notificationType ;
};
DirectoryResource.prototype.getNotificationType = function()
{
  return this.notificationType ;
};
DirectoryResource.prototype.on = function ( eventName, callback )
{
  EventEmitter.prototype.on.apply ( this, arguments ) ;
  if ( eventName === "change" )
  {
    this.watcher.on ( "change", this._onchange.bind ( this ) ) ;
  }
  else
  {
    return ;
  }
  if ( ! this._isWatching )
  {
    this._isWatching = true ;
    this.watcher.watch() ;
  }
};
DirectoryResource.prototype._onchange = function ( name )
{
  if ( typeof this.accept === 'function' )
  {
    if ( ! this.accept ( name ) )
    {
      return ;
    }
  }
  var i = 0 ;
  var p = this.knownFiles[name] ;
  if ( p )
  {
    p.LAST_MODIFIED = new Date().getTime() ;
    return ;
  }
  for ( i = 0 ; i < this.patternList.length ; i++ )
  {
    if ( this.patternList[i].test ( name ) )
    {
      var resourceId = this.resourceId ;
      if ( ! resourceId )
      {
        resourceId = this.dirname + "/" + name ;
      }
      this.knownFiles[name] = { name: name, resourceId: resourceId, LAST_MODIFIED: new Date().getTime() } ;
      var displayName = "" ;
      if ( this.displayPatternList[i] instanceof RegExp )
      {
        var a = this.displayPatternList[i].exec ( name ) ;
        if ( a )
        {
          if ( a.length > 1 )
          {
            displayName = a[1] ;
          }
        }
      }
      else
      {
        displayName = this.displayPatternList[i] ;
      }
      this.emit ( "change", name, resourceId, displayName ) ;
    }
  };
};
DirectoryResource.prototype.removeOutdated = function()
{
  var now = new Date().getTime() ;
  var limit = now - this.maxMillis ;
  var toBeRemoved = [] ;
  for ( var k in this.knownFiles )
  {
    var p = this.knownFiles[k] ;
    if ( p.LAST_MODIFIED < limit )
    {
      toBeRemoved.push ( p ) ;
    }
  }
  for ( var i = 0 ; i < toBeRemoved.length ; i++ )
  {
    delete this.knownFiles[toBeRemoved[i].name] ;
  }
  return toBeRemoved ;
};

module.exports =
{ ResourceSentinel: ResourceSentinel
, DirectoryResource: DirectoryResource
, WatchResource: WatchResource
, MRTResource: MRTResource
} ;

if ( require.main === module )
{
  Log.init() ;
  // Log.setLevel ( Log.LogLevel.DEBUG ) ;
  var XmlElement = require ( "Xml" ).XmlElement ;
  var XmlTree = require ( "Xml" ).XmlTree ;

  var config = T.getProperty ( "watch.config" ) ;
  if ( config )
  {
    xConfig = new File ( config ).toXml() ;
  }
  else
  {
    xConfig = new XmlTree() ;
    var xItemList = xConfig.add ( "ItemList" ) ;
    var xItem = xItemList.add ( "Item" ) ;
    xItem.addAttribute ( "dir", "../test" ) ;
    xItem.addAttribute ( "pattern", ".*" ) ;
    xItem.addAttribute ( "namePattern", "(.*)" ) ;
  }
  var RS = new ResourceSentinel() ;
  RS.init() ;

  var dlist = [] ;
  xConfig.elem ( "ItemList" ).elements ( function(x)
  {
    var r = new DirectoryResource ( x.getAttribute ( "dir" )
                                  , new RegExp ( x.getAttribute ( "pattern" ) )
                                  , new RegExp ( x.getAttribute ( "namePattern" ) )
                                  ) ;
    dlist.push ( r ) ;
  });

  for ( var i = 0 ; i < dlist.length ; i++ )
  {
  //   dlist[i].on ( "change", function onchange ( name )
  //   {
  // console.log ( "name=" + name ) ;
  //   } ) ;
    RS.addChange ( dlist[i] ) ;
  }

  // r.setAcceptCallback ( function ( name )
  // {
  //   if ( name.indexOf ( "MRTExport" ) >= 0 )
  //   {
  //     return false ;
  //   }
  //   return true ;
  // })
  // RS.addChange ( r ) ;
}



