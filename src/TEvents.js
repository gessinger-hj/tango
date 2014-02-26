var T  = require ( "Tango.js" ) ;

/**
 *  @constructor
 */
var FunctionExecutor = function ( object, method, args )
{
  this.jsClassName = "FunctionExecutor" ;
  this.argsArray = null ;
  var strOrig = null ;
  var a ;
  if ( object != null && typeof ( object ) == "object" && typeof ( method ) == 'function' )
  {
    this.object = object ;
    this.method = method ;
    if ( args )
    {
      if ( T.isArray ( args ) ) a = args ;
      else
      {
        a = T.toArray ( arguments ) ;
        a.splice ( 0, 2 ) ;
      }
    }
  }
  else
  if ( typeof ( object ) == "function" )
  {
    this.object = null ;
    this.method = object ;
    if ( method )
    {
      if ( T.isArray ( method ) ) a = method ;
      else { a = T.toArray(arguments) ; a.splice ( 0, 1 ) ; }
    }
  }
  // else
  // {
  //   var estr = "TFunctionExecutor, self & method must be functions or self must be a function: " + strOrig ;
  //   TSys.log ( estr ) ;
  //   throw estr ;
  // }
  if ( a )
  {
    this.argsArray = a ;
  }
};
FunctionExecutor.prototype.flush = function()
{
  if ( this.argsArray ) this.argsArray.length = 0 ;
  this.argsArray = undefined ;
  if ( this.object && typeof ( this.object.flush ) == 'function' )
  {
    this.object.flush() ;
  }
  this.object = null ;
  this.method = null ;
};
FunctionExecutor.prototype.executeWithEvent = function ( event )
{
  if ( ! this.argsArray )
  {
    return this.execute ( event ) ;
  }
  else
  {
    var aa = [] ;
    aa.push ( event ) ;
    for ( var k = 0 ; k < this.argsArray.length ; k++ )
    {
      var o = this.argsArray[k] ;
      aa.push ( o ) ;
    }
    return this.execute ( aa ) ;
  }
};
FunctionExecutor.prototype.execute = function ( argumentArray )
{
  if ( ! this.method && ! this.object ) return ;
  if ( ! argumentArray )
  {
    argumentArray = this.argsArray ;
  }
  else
  if ( ! T.isArray ( argumentArray ) )
  {
    argumentArray = [ argumentArray ] ;
  }
  if ( this.object )
  {
    if ( ! argumentArray ) return this.method.apply ( this.object ) ;
    return this.method.apply ( this.object, argumentArray ) ;
  }
  else
  {
    if ( ! argumentArray ) return this.method.apply ( this.method ) ;
    return this.method.apply ( this.method, argumentArray ) ;
  }
};
/**
 * @constructor
 * @param {eventName} name of the event
 * @param {int} [eventType]
 *   One of the following values:
 * <ul>
 * <li>TEvent.prototype.CHANGED</li>
 * <li>TEvent.prototype.RESET</li>
 * <li>TEvent.prototype.ITEM_SELECTED</li>
 * <li>TEvent.prototype.ITEM_DESELECTED</li>
 * <li>TEvent.prototype.PROPERTY_CHANGE</li>
 * <li>TEvent.prototype.ACTION</li>
 *  </ul>
 */
var TEvent = function ( eventName, eventType )
{
  this.jsEvent = null ;
  this.consumed = false ;
  this.jsClassName = "TEvent" ;
  this.eventType = -1 ;
  this.oldValue = null ;
  this.newValue = null ;
  this.propertyName = null ;
  this.eventName = eventName ? eventName : "" ;
  this.action = null ;
  if ( typeof eventType !== 'undefined' ) this.setType ( eventType ) ;
};
TEvent.prototype =
{
  CHANGED: 1,
  RESET: 2,
  ITEM_SELECTED: 3,
  ITEM_DESELECTED: 6,
  PROPERTY_CHANGE: 7,
  ACTION: 8,
  TYPE_MAX: 9,
  isAction: function()
  {
    return this.eventType == this.ACTION ;
  },
  isReset: function()
  {
    return this.eventType == this.RESET ;
  },
  isChanged: function()
  {
    return this.eventType == this.CHANGED ;
  },
  isItemSelected: function()
  {
    return this.eventType == this.ITEM_SELECTED ;
  },
  isItemDeselected: function()
  {
    return this.eventType == this.ITEM_DESELECTED ;
  },
  isPropertyChange: function()
  {
    return this.eventType == this.PROPERTY_CHANGE ;
  },
  getName: function()
  {
    return this.eventName ;
  },
  setName: function ( eventName )
  {
    this.eventName = eventName ;
  },
  getType: function()
  {
    return this.eventType ;
  },
  setType: function ( type )
  {
    if ( typeof ( type ) != 'number' ) throw "TEvent.setType(): type is not a number: '" + typeof ( type ) ;
    if ( type <= 0 || type > this.TYPE_MAX ) throw "TEvent.setType(): ivalid type: '" + type ;
    this.eventType = type ;
  },
  typeToString: function()
  {
    if ( this.eventType == this.CHANGED ) return "CHANGED" ;
    if ( this.eventType == this.RESET ) return "RESET" ;
    if ( this.eventType == this.ITEM_SELECTED ) return "ITEM_SELECTED" ;
    if ( this.eventType == this.ITEM_DESELECTED ) return "ITEM_DESELECTED" ;
    if ( this.eventType == this.PROPERTY_CHANGE ) return "PROPERTY_CHANGE" ;
    if ( this.eventType == this.ACTION ) return "ACTION" ;
  },
  getAction: function()
  {
    return this.action ;
  },
  getItem: function()
  {
    return this.item ;
  },
  setItem: function ( item )
  {
    this.item = item ;
  },
  setPropertyName: function ( name )
  {
    this.propertyName = name ;
  },
  getPropertyName: function()
  {
    return this.propertyName ;
  },
  getOldValue: function()
  {
    if ( this.jsEvent ) return this.jsEvent.oldValue ;
    return this.oldValue ;
  },
  setOldValue: function ( val )
  {
    this.oldValue = val ;
  },
  getNewValue: function()
  {
    if ( this.jsEvent ) return this.jsEvent.newValue ;
    return this.newValue ;
  },
  setNewValue: function ( val )
  {
    this.newValue = val ;
  },
  isConsumed: function()
  {
    if ( this.jsEvent ) return this.jsEvent.isConsumed() ;
    return this.consumed ;
  },
  consume: function()
  {
    this.consumed = true ;
  }
};
TEvent.prototype.setAction = function ( name )
{
  this.action = name ;
};
TEvent.prototype.toString = function()
{
  return "(" + this.jsClassName + ")[consumed=" + this.consumed + ",name=" + this.eventName
        + ( this.eventType >= 0 || typeof ( this.eventType ) == 'string' ? ",type=" + this.typeToString() + "(" + this.eventType + ")" : "" )
        + ( this.action ? ",action=" + this.getAction() : "" )
        + ( this.propertyName ? ",propertyName=" + this.propertyName : "" )
        + ( this.oldValue || typeof ( this.oldValue ) == 'number' || typeof ( this.oldValue ) == 'string' ? ",old-value=" + this.oldValue : "" )
        + ( this.newValue || typeof ( this.newValue ) == 'number' || typeof ( this.newValue ) == 'string' ? ",new-value=" + this.newValue : "" )
        + "]"
        ;
};
/**
  * @constructor
  * @extends TEvent
  */
var TItemEvent = function ( item, type )
{
  if ( ! type ) type = TEvent.prototype.ITEM_SELECTED ;
  T.initSuper ( this, TEvent, null, type ) ;
  this.jsClassName = "TItemEvent" ;
  this.item = item ;
};
T.inherits ( TItemEvent, TEvent ) ;
/**
 *  @constructor
 *  @extends TEvent
 */
var TActionEvent = function ( actionName )
{
  T.initSuper ( this, TEvent, actionName, TEvent.prototype.ACTION ) ;
  this.jsClassName = "TActionEvent" ;
  this.action = actionName ;
  if ( ! this.action ) this.action = "*" ;
};
T.inherits ( TActionEvent, TEvent ) ;
/**
 *  @constructor
 *  @extends TEvent
 */
var TPropertyChangeEvent = function ( propertyName )
{
  T.initSuper ( this, TEvent, propertyName, TEvent.prototype.PROPERTY_CHANGE ) ;
  this.jsClassName = "TPropertyChangeEvent" ;
  this.propertyName = propertyName ;
};
T.inherits ( TPropertyChangeEvent, TEvent ) ;

/**
 *  @constructor
 */
PropertyChangeHandler = function()
{
  this._flushed = false ;
  this.listenerList = [] ;
  this.propertyNameList = [] ;
  this.jsClassName = "PropertyChangeHandler" ;
};
PropertyChangeHandler.prototype.flush = function()
{
  if ( this._flushed ) return ;
  this._flushed = true ;
  for ( var i = 0 ; i < this.listenerList.length ; i++ )
  {
    this.listenerList[i].flush() ;
  }
  this.listenerList.length = 0 ;
  this.propertyNameList.length = 0 ;
};
PropertyChangeHandler.prototype.add = function ( obj, method, propertyName )
{
  var pn = '.*' ;
  if ( obj instanceof FunctionExecutor )
  {
    if ( typeof ( method ) == 'string' ) pn = method ;
    this.listenerList.push ( obj ) ;
    this.propertyNameList.push ( pn ) ;
    return ;
  }
  else
  if ( typeof ( obj ) == 'string' )
  {
    if ( typeof ( method ) == 'string' ) pn = method ;
    else
    if ( typeof ( propertyName ) == 'string' ) pn = propertyName ;
  }
  else
  if ( typeof ( obj ) == 'object' && typeof ( method ) == 'function' )
  {
    if ( typeof ( propertyName ) == 'string' ) pn = propertyName ;
  }
  else
  if ( typeof ( obj ) == 'function' )
  {
    if ( typeof ( method ) == 'string' ) pn = method ;
    else
    if ( typeof ( propertyName ) == 'string' ) pn = propertyName ;
  }
  var fe = new FunctionExecutor ( obj, method ) ;
  fe.o = obj ;
  fe.m = method ;
  this.listenerList.push ( fe ) ;
  this.propertyNameList.push ( pn ) ;
};
PropertyChangeHandler.prototype.fireEvent = function ( ev, propertyName )
{
  if ( typeof ( propertyName ) == 'string' )
  {
  }
  else
  {
    propertyName = ev.getPropertyName() ;
  }
  if ( ! propertyName ) propertyName = "" ;

  var oldVal = ev.getOldValue() ;
  var newVal = ev.getNewValue() ;
  if (  ( oldVal != null && typeof ( oldVal ) != 'undefined' )
     || ( newVal != null && typeof ( newVal ) != 'undefined' )
     )
  {
    if ( oldVal == newVal ) return ;
  }
  for ( var i = 0 ; i < this.listenerList.length ; i++ )
  {
    if (  this.propertyNameList[i] == '.*'
       || this.propertyNameList[i] == propertyName
       )
    {
      this.listenerList[i].executeWithEvent ( ev ) ;
      if ( this._flushed ) break ;
    }
  }
};
PropertyChangeHandler.prototype.remove = function ( fe )
{
  for ( var i = 0 ; i < this.listenerList.length ; i++ )
  {
    var e = this.listenerList[i] ;
    if ( e === fe )
    {
      this.listenerList.splice ( i, 1 ) ;
      this.propertyNameList.splice ( i, 1 ) ;
      break ;
    }
    if ( this.listenerList.o === fe )
    {
      this.listenerList.splice ( i, 1 ) ;
      this.propertyNameList.splice ( i, 1 ) ;
      break ;
    }
    if ( this.listenerList.m === fe )
    {
      this.listenerList.splice ( i, 1 ) ;
      this.propertyNameList.splice ( i, 1 ) ;
      break ;
    }
  }
};

PropertyChangeTrait = {} ;
PropertyChangeTrait.__propertyChangeHandler = { create: function(){return new PropertyChangeHandler();} } ;
PropertyChangeTrait.addPropertyChangeListener = function ( obj, method, propertyName )
{
  this.__propertyChangeHandler.add ( obj, method, propertyName ) ;
}
PropertyChangeTrait.removePropertyChangeListener = function ( obj )
{
  this.__propertyChangeHandler.remove ( obj ) ;
}
PropertyChangeTrait._firePropertyChangeEvent = function ( ev, propertyName )
{
  this.__propertyChangeHandler.fireEvent ( ev, propertyName ) ;
};

/**
 *  @constructor
 *  @extends PropertyChangeHandler
 */
EventMulticaster = function()
{
  T.initSuper ( this, PropertyChangeHandler );
  this.jsClassName = "EventMulticaster" ;
}
T.inherits ( EventMulticaster, PropertyChangeHandler ) ;
EventMulticaster.prototype.toString = function()
{
  return "(" + this.jsClassName + ")" ;
};
EventMulticaster.prototype.fireEvent = function ( evt, type )
{
  var ev = null ;
  if ( evt instanceof TEvent )
  {
  }
  else
  if ( typeof ( evt ) == 'string' )
  {
    ev = new TEvent ( evt ) ;
    ev.eventType = evt  ;
  }
  else
  if ( evt && typeof ( evt ) == 'object' && evt.jsClassName )
  {
    ev = evt ;
    if ( type ) ev.eventType = type  ;
  }
  else
  {
    ev = new TEvent ( evt ) ;
    if ( type ) ev.eventType = type  ;
  }
  for ( var i = 0 ; i < this.listenerList.length ; i++ )
  {
    if (  this.propertyNameList[i] == '*'
       || this.propertyNameList[i] == '.*'
       || this.propertyNameList[i] == ev.eventType
       )
    {
      this.listenerList[i].executeWithEvent ( ev ) ;
      if ( ev.isConsumed() ) break ;
      if ( this._flushed ) break ;
    }
    else
    if ( this.propertyNameList[i].indexOf ( '*' ) > 0 )
    {
      if ( this.propertyNameList[i].indexOf ( ".*" ) < 0 ) this.propertyNameList[i] = this.propertyNameList[i].replace ( /\*/g, ".*" ) ;
      var reg = new RegExp ( this.propertyNameList[i], 'i' ) ;
      if ( this.propertyNameList[i].match ( reg ) )
      {
        this.listenerList[i].executeWithEvent ( ev ) ;
        if ( ev.isConsumed() ) break ;
        if ( this._flushed ) break ;
      }
    }
  }
}
EventMulticasterTrait = {} ;
EventMulticasterTrait.__eventMulticaster = { create: function(){return new EventMulticaster();} } ;
EventMulticasterTrait.addListener = function ( obj, method, propertyName )
{
  if ( ! this.__eventMulticaster ) return ;
  this.__eventMulticaster.add ( obj, method, propertyName ) ;
}
EventMulticasterTrait.removeListener = function ( obj )
{
  if ( ! this.__eventMulticaster ) return ;
  this.__eventMulticaster.remove ( obj ) ;
}
EventMulticasterTrait._fireEvent = function ( ev, type )
{
  if ( ! this.__eventMulticaster ) return ;
  this.__eventMulticaster.fireEvent ( ev, type ) ;
}
EventMulticasterTrait.flushEventMulticaster = function()
{
  if ( this.__eventMulticaster ) this.__eventMulticaster.flush() ;
  this.__eventMulticaster = null ;
}

events = {} ;
events.EventMulticasterTrait = EventMulticasterTrait ;
events.TEvent = TEvent ;
events.FunctionExecutor = FunctionExecutor ;
events.TItemEvent = TItemEvent ;
events.TActionEvent = TActionEvent ;
events.TPropertyChangeEvent = TPropertyChangeEvent ;
events.PropertyChangeHandler = PropertyChangeHandler ;
events.PropertyChangeTrait = PropertyChangeTrait ;
events.EventMulticaster = EventMulticaster ;

module.exports = events ;
