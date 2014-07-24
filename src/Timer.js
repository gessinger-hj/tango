/**
 *  @constructor
 * @param {} timeoutMillis
 * @param {} callback
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
   */
  flush: function()
  {
    this.stop() ;
    this.boundFunction = null ;
  },
  /**
   * Description
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
   * @param {} state
   */
  setRepeats: function ( state )
  {
    this.repeats = state ;
  },
  /**
   * Description
   * @param {} delayMillis
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
   * @return UnaryExpression
   */
  isRunning: function() { return !this.intervallId ; },
  /**
   * Description
   */
  start: function()
  {
    this.first = true ;
    this.intervallId = setInterval(this.boundFunction, this.initialDelayMillis ) ;
  },
  /**
   * Description
   */
  stop: function()
  {
    if ( this.intervallId ) clearInterval ( this.intervallId ) ;
    this.intervallId = null ;
  },
  /**
   * Description
   */
  restart: function()
  {
    this.stop() ;
    this.start() ;
  },
  /**
   * Description
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
