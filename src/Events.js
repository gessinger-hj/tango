var T  = require ( "./Tango" ) ;
var util = require ( "util" ) ;

/**
 *  @constructor
 * @method FunctionExecutor
 * @param {} object
 * @param {} method
 * @param {} args
 * @return 
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
/**
 * Description
 * @method flush
 * @return 
 */
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
/**
 * Description
 * @method executeWithEvent
 * @param {} event
 * @return 
 */
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
/**
 * Description
 * @method execute
 * @param {} argumentArray
 * @return 
 */
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
 *   One of the following values:
 * <ul>
 * <li>Event.prototype.CHANGED</li>
 * <li>Event.prototype.RESET</li>
 * <li>Event.prototype.ITEM_SELECTED</li>
 * <li>Event.prototype.ITEM_DESELECTED</li>
 * <li>Event.prototype.PROPERTY_CHANGE</li>
 * <li>Event.prototype.ACTION</li>
 *  </ul>
 * @method Event
 * @param {} eventName
 * @param {} eventType
 * @return 
 */
var Event = function ( eventName, eventType )
{
  this.jsEvent = null ;
  this.consumed = false ;
  this.jsClassName = "Event" ;
  this.eventType = -1 ;
  this.oldValue = null ;
  this.newValue = null ;
  this.propertyName = null ;
  this.eventName = eventName ? eventName : "" ;
  this.action = null ;
  if ( typeof eventType !== 'undefined' ) this.setType ( eventType ) ;
};
Event.prototype =
{
  CHANGED: 1,
  RESET: 2,
  ITEM_SELECTED: 3,
  ITEM_DESELECTED: 6,
  PROPERTY_CHANGE: 7,
  ACTION: 8,
  TYPE_MAX: 9,
  /**
   * Description
   * @method isAction
   * @return BinaryExpression
   */
  isAction: function()
  {
    return this.eventType == this.ACTION ;
  },
  /**
   * Description
   * @method isReset
   * @return BinaryExpression
   */
  isReset: function()
  {
    return this.eventType == this.RESET ;
  },
  /**
   * Description
   * @method isChanged
   * @return BinaryExpression
   */
  isChanged: function()
  {
    return this.eventType == this.CHANGED ;
  },
  /**
   * Description
   * @method isItemSelected
   * @return BinaryExpression
   */
  isItemSelected: function()
  {
    return this.eventType == this.ITEM_SELECTED ;
  },
  /**
   * Description
   * @method isItemDeselected
   * @return BinaryExpression
   */
  isItemDeselected: function()
  {
    return this.eventType == this.ITEM_DESELECTED ;
  },
  /**
   * Description
   * @method isPropertyChange
   * @return BinaryExpression
   */
  isPropertyChange: function()
  {
    return this.eventType == this.PROPERTY_CHANGE ;
  },
  /**
   * Description
   * @method getName
   * @return MemberExpression
   */
  getName: function()
  {
    return this.eventName ;
  },
  /**
   * Description
   * @method setName
   * @param {} eventName
   * @return 
   */
  setName: function ( eventName )
  {
    this.eventName = eventName ;
  },
  /**
   * Description
   * @method getType
   * @return MemberExpression
   */
  getType: function()
  {
    return this.eventType ;
  },
  /**
   * Description
   * @method setType
   * @param {} type
   * @return 
   */
  setType: function ( type )
  {
    if ( typeof ( type ) != 'number' ) throw "Event.setType(): type is not a number: '" + typeof ( type ) ;
    if ( type <= 0 || type > this.TYPE_MAX ) throw "Event.setType(): ivalid type: '" + type ;
    this.eventType = type ;
  },
  /**
   * Description
   * @method typeToString
   * @return 
   */
  typeToString: function()
  {
    if ( this.eventType == this.CHANGED ) return "CHANGED" ;
    if ( this.eventType == this.RESET ) return "RESET" ;
    if ( this.eventType == this.ITEM_SELECTED ) return "ITEM_SELECTED" ;
    if ( this.eventType == this.ITEM_DESELECTED ) return "ITEM_DESELECTED" ;
    if ( this.eventType == this.PROPERTY_CHANGE ) return "PROPERTY_CHANGE" ;
    if ( this.eventType == this.ACTION ) return "ACTION" ;
  },
  /**
   * Description
   * @method getAction
   * @return MemberExpression
   */
  getAction: function()
  {
    return this.action ;
  },
  /**
   * Description
   * @method getItem
   * @return MemberExpression
   */
  getItem: function()
  {
    return this.item ;
  },
  /**
   * Description
   * @method setItem
   * @param {} item
   * @return 
   */
  setItem: function ( item )
  {
    this.item = item ;
  },
  /**
   * Description
   * @method setPropertyName
   * @param {} name
   * @return 
   */
  setPropertyName: function ( name )
  {
    this.propertyName = name ;
  },
  /**
   * Description
   * @method getPropertyName
   * @return MemberExpression
   */
  getPropertyName: function()
  {
    return this.propertyName ;
  },
  /**
   * Description
   * @method getOldValue
   * @return MemberExpression
   */
  getOldValue: function()
  {
    if ( this.jsEvent ) return this.jsEvent.oldValue ;
    return this.oldValue ;
  },
  /**
   * Description
   * @method setOldValue
   * @param {} val
   * @return 
   */
  setOldValue: function ( val )
  {
    this.oldValue = val ;
  },
  /**
   * Description
   * @method getNewValue
   * @return MemberExpression
   */
  getNewValue: function()
  {
    if ( this.jsEvent ) return this.jsEvent.newValue ;
    return this.newValue ;
  },
  /**
   * Description
   * @method setNewValue
   * @param {} val
   * @return 
   */
  setNewValue: function ( val )
  {
    this.newValue = val ;
  },
  /**
   * Description
   * @method isConsumed
   * @return MemberExpression
   */
  isConsumed: function()
  {
    if ( this.jsEvent ) return this.jsEvent.isConsumed() ;
    return this.consumed ;
  },
  /**
   * Description
   * @method consume
   * @return 
   */
  consume: function()
  {
    this.consumed = true ;
  }
};
/**
 * Description
 * @method setAction
 * @param {} name
 * @return 
 */
Event.prototype.setAction = function ( name )
{
  this.action = name ;
};
/**
 * Description
 * @method toString
 * @return BinaryExpression
 */
Event.prototype.toString = function()
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
 * @extends Event
 * @method ItemEvent
 * @param {} item
 * @param {} type
 * @return 
 */
var ItemEvent = function ( item, type )
{
  if ( ! type ) type = Event.prototype.ITEM_SELECTED ;
  Event.call ( this,  null, type ) ;
  this.jsClassName = "ItemEvent" ;
  this.item = item ;
};
util.inherits ( ItemEvent, Event ) ;
/**
 *  @constructor
 *  @extends Event
 * @method ActionEvent
 * @param {} actionName
 * @return 
 */
var ActionEvent = function ( actionName )
{
  Event.call ( this, actionName, Event.prototype.ACTION ) ;
  this.jsClassName = "ActionEvent" ;
  this.action = actionName ;
  if ( ! this.action ) this.action = "*" ;
};
util.inherits ( ActionEvent, Event ) ;
/**
 *  @constructor
 *  @extends Event
 * @method PropertyChangeEvent
 * @param {} propertyName
 * @return 
 */
var PropertyChangeEvent = function ( propertyName )
{
  Event.call ( this, propertyName, Event.prototype.PROPERTY_CHANGE ) ;
  this.jsClassName = "PropertyChangeEvent" ;
  this.propertyName = propertyName ;
};
util.inherits ( PropertyChangeEvent, Event ) ;

/**
 *  @constructor
 * @method PropertyChangeHandler
 * @return 
 */
var PropertyChangeHandler = function()
{
  this._flushed = false ;
  this.listenerList = [] ;
  this.propertyNameList = [] ;
  this.jsClassName = "PropertyChangeHandler" ;
};
/**
 * Description
 * @method flush
 * @return 
 */
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
/**
 * Description
 * @method add
 * @param {} obj
 * @param {} method
 * @param {} propertyName
 * @return 
 */
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
/**
 * Description
 * @method fireEvent
 * @param {} ev
 * @param {} propertyName
 * @return 
 */
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
/**
 * Description
 * @method remove
 * @param {} fe
 * @return 
 */
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
PropertyChangeTrait.__propertyChangeHandler = { 
/**
  * Description
  * @method create
  * @return NewExpression
  */
 create: function(){return new PropertyChangeHandler();} } ;
/**
 * Description
 * @method addPropertyChangeListener
 * @param {} obj
 * @param {} method
 * @param {} propertyName
 * @return 
 */
PropertyChangeTrait.addPropertyChangeListener = function ( obj, method, propertyName )
{
  this.__propertyChangeHandler.add ( obj, method, propertyName ) ;
}
/**
 * Description
 * @method removePropertyChangeListener
 * @param {} obj
 * @return 
 */
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
 * @method EventMulticaster
 * @return 
 */
var EventMulticaster = function()
{
  PropertyChangeHandler.call ( this );
  this.jsClassName = "EventMulticaster" ;
}
util.inherits ( EventMulticaster, PropertyChangeHandler ) ;
/**
 * Description
 * @method toString
 * @return BinaryExpression
 */
EventMulticaster.prototype.toString = function()
{
  return "(" + this.jsClassName + ")" ;
};
/**
 * Description
 * @method fireEvent
 * @param {} evt
 * @param {} type
 * @return 
 */
EventMulticaster.prototype.fireEvent = function ( evt, type )
{
  var ev = null ;
  if ( evt instanceof Event )
  {
  }
  else
  if ( typeof ( evt ) == 'string' )
  {
    ev = new Event ( evt ) ;
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
    ev = new Event ( evt ) ;
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
EventMulticasterTrait.__eventMulticaster = { 
/**
  * Description
  * @method create
  * @return NewExpression
  */
 create: function(){return new EventMulticaster();} } ;
/**
 * Description
 * @method addListener
 * @param {} obj
 * @param {} method
 * @param {} propertyName
 * @return 
 */
EventMulticasterTrait.addListener = function ( obj, method, propertyName )
{
  if ( ! this.__eventMulticaster ) return ;
  this.__eventMulticaster.add ( obj, method, propertyName ) ;
}
/**
 * Description
 * @method removeListener
 * @param {} obj
 * @return 
 */
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
/**
 * Description
 * @method flushEventMulticaster
 * @return 
 */
EventMulticasterTrait.flushEventMulticaster = function()
{
  if ( this.__eventMulticaster ) this.__eventMulticaster.flush() ;
  this.__eventMulticaster = null ;
}

events = {} ;
events.EventMulticasterTrait = EventMulticasterTrait ;
events.Event = Event ;
events.FunctionExecutor = FunctionExecutor ;
events.ItemEvent = ItemEvent ;
events.ActionEvent = ActionEvent ;
events.PropertyChangeEvent = PropertyChangeEvent ;
events.PropertyChangeHandler = PropertyChangeHandler ;
events.PropertyChangeTrait = PropertyChangeTrait ;
events.EventMulticaster = EventMulticaster ;

module.exports = events ;
