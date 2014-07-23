/**
 *  @constructor
 * @param {} timeoutMillis
 * @param {} callback
 * @return 
 */
Timer = function ( timeoutMillis, callback )
{
  if ( typeof ( callback.timedout ) == 'function' )
  {
    this.callback = callback.timedout.bind ( callback ) ;
  }
  else
  if ( typeof ( callback ) == 'function' )
  {
    this.callback = callback;
  }
  else
  {
    throw "Timer: Neither callback.timedout nor callback is a function." ;
  }
  this.timeoutMillis = timeoutMillis ;
  if ( this.timeoutMillis < 1 )
  {
    this.timeoutMillis = 1000 ;
  }
  this.currentlyExecuting = false;
  this.intervallId = null ;
  this.initialDelayMillis = this.timeoutMillis ;
  this.boundFunction = this.onTimerEvent.bind(this) ;
  this.first = true ;
  this.repeats = true ;
} ;
Timer.prototype =
{
  /**
   * Description
   * @method flush
   * @return 
   */
  flush: function()
  {
    this.stop() ;
    this.boundFunction = null ;
  },
  /**
   * Description
   * @method toString
   * @return BinaryExpression
   */
  toString: function()
  {
    return "(Timer)"
         + "[initial-delay=" + this.initialDelayMillis
         + ",timeout=" + this.timeoutMillis 
         + ",repeats=" + this.repeats 
         + "]"
         ;
  },
  /**
   * Description
   * @method setRepeats
   * @param {} state
   * @return 
   */
  setRepeats: function ( state )
  {
    this.repeats = state ;
  },
  /**
   * Description
   * @method setInitialDelay
   * @param {} delayMillis
   * @return 
   */
  setInitialDelay: function ( delayMillis )
  {
    this.initialDelayMillis = delayMillis ;
    if ( this.initialDelayMillis < 1 )
    {
      this.initialDelayMillis = 1 ;
    } 
  },
  /**
   * Description
   * @method isRunning
   * @return UnaryExpression
   */
  isRunning: function() { return !this.intervallId ; },
  /**
   * Description
   * @method start
   * @return 
   */
  start: function()
  {
    this.first = true ;
    this.intervallId = setInterval(this.boundFunction, this.initialDelayMillis ) ;
  },
  /**
   * Description
   * @method stop
   * @return 
   */
  stop: function()
  {
    if ( this.intervallId ) clearInterval ( this.intervallId ) ;
    this.intervallId = null ;
  },
  /**
   * Description
   * @method restart
   * @return 
   */
  restart: function()
  {
    this.stop() ;
    this.start() ;
  },
  /**
   * Description
   * @method onTimerEvent
   * @return 
   */
  onTimerEvent: function()
  {
    if ( ! this.intervallId ) return ;
    if ( !this.currentlyExecuting )
    {
      try
      {
        this.currentlyExecuting = true;
        this.callback(this);
        if ( ! this.repeats )
        {
          this.stop() ;
          return ;
        }
        if ( ! this.intervallId ) return ;
        if ( this.first )
        {
          this.first = false ;
          if ( this.timeoutMillis != this.initialDelayMillis )
          {
            window.clearInterval ( this.intervallId ) ;
            this.intervallId = setInterval(this.boundFunction, this.timeoutMillis ) ;
          }
        }
      }
      catch ( exc )
      {
        console.log ( "Timer:\n" + String ( exc ) ) ;
        this.stop() ;
      }
      finally
      {
        this.currentlyExecuting = false;
      }
    }
  }
};
if ( require.main === module )
{
  var t = new Timer ( 1000, function(e)
  {
    console.log (  ("--------------------") ) ;
    console.log ( e ) ;
  });
  t.setRepeats ( false ) ;
  t.start() ;
}
module.exports = Timer ;
