var T = require ( "./Tango" ) ;
var Event = require ( "Event" ) ;
var Client = require ( "Client" ) ;
var FSWatcher = require ( "./FSWatcher" ) ;
var DateUtils = require ( "./DateUtils" ) ;
var os = require ( "os" ) ;
var File = require ( "./File" ) ;
var EventEmitter = require ( "events" ).EventEmitter ;
var util = require ( "util" ) ;
var Timer = require ( "./Timer" ) ;
var Log = require ( "./LogFile" ) ;
var Path = require ( "path" ) ;

/**
 * Description
 * @constructor
 * @param {} port
 * @param {} host
 */
var GPResourceSentinel = function ( port, host )
{
  this.port = port ; 
  this.host = host ; 
  this.client = null ;
  this.hostname = os.hostname() ;
  this.resourceList = [] ;
  this.mainEventName = "notify" ;
  this.ignoreHidden = true ;
  var thiz = this ;
  this.timer = new Timer ( 5000, function(e)
  {
    thiz.removeOutdated() ;
  });
};
/**
 * Description
 */
GPResourceSentinel.prototype.init = function()
{
  this.client = new Client ( this.port, this.host ) ;
};
/**
 * Description
 * @param {} name
 * @param {} state
 * @param {} id
 * @return data
 */
GPResourceSentinel.prototype.make_data = function ( name, state, id )
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
/**
 * Description
 * @param {} resource
 */
GPResourceSentinel.prototype.add = function ( resource )
{
  resource.setParent ( this ) ;
  if ( ! this.resourceList.length )
  {
    this.timer.start() ;
  }
  this.resourceList.push ( resource ) ;
};
/**
 * Description
 * @param {} resource
 */
GPResourceSentinel.prototype.addChange = function ( resource )
{
  resource.setParent ( this ) ;
  var thiz = this ;
  if ( ! this.resourceList.length )
  {
    this.timer.start() ;
  }
  this.resourceList.push ( resource ) ;
  var e ;
  resource.on ( "change", function onchange ( name, resourceId, displayName, params )
  {
    if ( thiz.ignoreHidden )
    {
      if ( name.charAt ( 0 ) === '.' || name.indexOf ( '~' ) >= 0 )
      {
        return ;
      }
    }
    e = new Event ( thiz.mainEventName ) ;
    e.body = thiz.make_data ( name, "show", resourceId ) ;
    e.body.type = this.getNotificationType() ;
    e.body.text = displayName ? displayName : name ;
    e.body.millis = 5000 ;
    if ( params )
    {
      for ( var k in params )
      {
        e.body[k] = params[k] ;
      }
    }
    Log.debug ( e.body.id ) ;
    thiz.client.fire ( e ) ;
  }) ;
};
/*
 * 
 * Description
 */
GPResourceSentinel.prototype.removeOutdated = function()
{
  var thiz = this ;
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
        e = new Event ( thiz.mainEventName ) ;
        e.body = this.make_data ( p.name, "stop", p.resourceId ) ;
        e.body.type = "notify" ;
        e.body.text = p.displayName ? p.displayName : p.name ;
        e.body.millis = 5000 ;
        Log.debug ( e.body.id ) ;
        this.client.fire ( e ) ;
      }
    }
  }
};
GPResourceSentinel.prototype.shutdown = function()
{
  this.closeAll() ;
  this.client.end() ;
};
GPResourceSentinel.prototype.closeAll = function()
{
  for ( var i = 0 ; i < this.resourceList.length ; i++ )
  {
    this.resourceList[i].close() ;
  }
  this.resourceList.length = null ;
};
/**
 * Description
 * @constructor
 */
var WatchResource = function()
{
  EventEmitter.call ( this ) ;
  this.resourceId = null ;
  this.notificationType = "notify" ;
  this.parent = null ;
  this._canOutdate = false ;
  this.watcher = null ;
};
util.inherits ( WatchResource, EventEmitter ) ;
/**
 * Description
 * @return MemberExpression
 */
WatchResource.prototype.canOutdate = function()
{
  return this._canOutdate ;
};
/**
 * Description
 * @param {} state
 */
WatchResource.prototype.setCanOutdate = function ( state )
{
  state = !! state ;
  this._canOutdate = state ;
};
/**
 * Description
 * @param {} id
 */
WatchResource.prototype.setResourceId = function ( id )
{
  this.resourceId = id ;
};
/**
 * Description
 * @param {} sentinel
 */
WatchResource.prototype.setParent = function ( sentinel )
{
  this.parent = sentinel ;
};
WatchResource.prototype.close = function()
{
  if ( this.watcher )
  {
    this.watcher.close() ;
  }
  this.watcher = null ;
};
/**
 * Description
 * @constructor
 * @extends WatchResource
 * @param {} log_dir
 * @param {} MRT_dir
 */
var MRTResource = function ( log_dir, MRT_dir )
{
  WatchResource.apply ( this, arguments ) ;
  this.MRT_dir = MRT_dir ;
  this.log_dir = log_dir ;
  this.watcher2 = null ;
};
util.inherits ( MRTResource, WatchResource ) ;
MRTResource.prototype.close = function()
{
  WatchResource.prototype.close.apply ( this, arguments ) ;
  if ( this.watcher2 )
  {
    this.watcher2.close() ;
  }
  this.watcher2 = null ;
};
/**
 * Description
 * @param {} sentinel
 */
MRTResource.prototype.setParent = function ( sentinel )
{
  WatchResource.prototype.setParent.apply ( this, arguments )
  var pattern = "log_.*_MRTExport_.*\\.log$"
  var regexp_MRTExport = new RegExp ( pattern ) ; //,modifiers)
  var previous_file_name = "" ;

  var thiz = this ;
  this.watcher = new FSWatcher ( this.MRT_dir + "/rating.guiding.rul.tmp" ) ;
  var e ;
  this.watcher.on ( "create", function oncreate ( name )
  {
    e = new Event ( thiz.parent.mainEventName ) ;
    e.body = thiz.parent.make_data ( name, "start", "MRTExport", { path:thiz.MRT_dir } ) ;
    Log.debug ( e.body ) ;
    thiz.parent.client.fire ( e ) ;
  });
  this.watcher.on ( "delete", function ondelete ( name )
  {
    previous_file_name = "" ;
    e = new Event ( thiz.parent.mainEventName ) ;
    e.body = thiz.parent.make_data ( name, "stop", "MRTExport", { path:thiz.MRT_dir } ) ;
    Log.debug ( e.body ) ;
    thiz.parent.client.fire ( e ) ;
  });
  this.watcher.watch() ;
  this.watcher2 = new FSWatcher ( this.log_dir ) ;
  this.watcher2.on ( "change", function onchange ( name )
  {
    Log.debug ( "name=" + name ) ;
    if ( regexp_MRTExport.test ( name ) )
    {
      if ( previous_file_name === name )
      {
        return ;
      }
      previous_file_name = name ;
      e = new Event ( thiz.parent.mainEventName ) ;
      e.body = thiz.parent.make_data ( name, "start", "MRTExport", { path:thiz.log_dir } ) ;
      Log.debug ( e.body ) ;
      thiz.parent.client.fire ( e ) ;
    }
  })
  this.watcher2.watch() ;
};
/**
 * Description
 * @constructor
 * @extends WatchResource
 * @param {} dirname
 * @param {} pattern
 * @param {} displayPattern
 */
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
/**
 * Description
 * @param {} callback
 */
DirectoryResource.prototype.setAcceptCallback = function ( callback )
{
  this.accept = callback ;
};
/**
 * Description
 * @param {} notificationType
 */
DirectoryResource.prototype.setNotificationType = function ( notificationType )
{
  this.notificationType = notificationType ;
};
/**
 * Description
 * @return MemberExpression
 */
DirectoryResource.prototype.getNotificationType = function()
{
  return this.notificationType ;
};
/**
 * Description
 * @param {} eventName
 * @param {} callback
 */
DirectoryResource.prototype.on = function ( eventName, callback )
{
  EventEmitter.prototype.on.apply ( this, arguments ) ;
  if ( eventName === "change" )
  {
    this.watcher.on ( "change", this._onchange.bind ( this ) ) ;
    this.watcher.on ( "rename", this._onchange.bind ( this ) ) ;
  }
  else
  if ( eventName === "rename" )
  {
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
      this.emit ( "change", name, resourceId, displayName, { path:this.dirname } ) ;
    }
  };
};
/**
 * Description
 * @return toBeRemoved
 */
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
{ GPResourceSentinel: GPResourceSentinel
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
    xConfig = new File ( config ).getXml() ;
  }
  else
  {
    xConfig = new XmlTree() ;
    var xItemList = xConfig.add ( "ItemList" ) ;
    var xItem = xItemList.add ( "Item" ) ;
    xItem.addAttribute ( "dir", "../src" ) ;
    xItem.addAttribute ( "pattern", ".*" ) ;
    xItem.addAttribute ( "namePattern", "(.*)" ) ;
  }
  var RS = new GPResourceSentinel() ;
  RS.init() ;
RS.mainEventName = "notification" ;
  var dlist = [] ;
  xConfig.elem ( "ItemList" ).elements ( function(x)
  {
    var r = new DirectoryResource ( x.getAttribute ( "dir" )
                                  // , new RegExp ( x.getAttribute ( "pattern" ) )
                                  // , new RegExp ( x.getAttribute ( "namePattern" ) )
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
}



