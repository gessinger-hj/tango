File.prototype.collect = function ( pattern )
{
  if ( ! this.isDirectory() )
  {
    throw "Directory does not exist: " + this ;
  }
  var basedir = this.getAbsolutePath() ;
  var d = new File ( basedir ) ;
  if ( ! pattern ) pattern = '*' ;

  var i ;
  var patternList = null ;
  var separator = null ;
  if ( pattern.indexOf ( ',' ) >= 0 ) separator = "," ;
  else
  if ( pattern.indexOf ( ';' ) >= 0 ) separator = ";" ;
  else
  if ( pattern.indexOf ( ' ' ) >= 0 ) separator = " " ;
  else
  if ( pattern.indexOf ( ':' ) >= 0 ) separator = ":" ;

  if ( separator )
  {
    patternList = pattern.split ( separator ) ;
    for ( i = 0 ; i < patternList.length ; i++ )
    {
      patternList[i] = patternList[i].trim() ;
      if ( patternList[i].length === 0 ) patternList[i] = null ;
    }
  }
	else
	{
	  patternList = [ pattern ] ;
	}
  var filesOnly = true ;

  var resultList = [] ;
  for ( i = 0 ; i < patternList.length ; i++ )
  {
    if ( ! patternList[i] ) continue ;
    var fv = new WalkFileVisitor ( basedir, patternList[i], resultList ) ;
    fv._FilesOnly = filesOnly ;
    try
    {
      d.visit ( fv ) ;
    }
    catch ( exc )
    {
      break ;
    }
  }
  return resultList ;
};
// class WalkFileVisitor implements QCFileObjectVisitor
WalkFileVisitor = function ( basedir, path, resultList )
{
  this._DirMatcher  = null ;
  this._FileMatcher  = null ;

  this._Dir = "" ;
  this._File = null ;
  this._BaseDir = basedir ;
  this._BaseDirLen = basedir.length ;
  this.resultList = resultList ;

  this._FilesOnly = false ;
  var f = new File  ( path ) ;

  var sb = "" ;
  var wildcardFound = false ;
  path = path.replace ( /\\/g, '/' ) ;
  if ( path.charAt ( 0 ) == '/' && path.length > 1 )
  {
    path = path.substring ( 1 ) ;
  }
  var pos = path.lastIndexOf ( '/' ) ;
  if ( pos >= 0 )
  {
    this._Dir = path.substring ( 0, pos ) ;
    if ( path.length - 1 == pos )
    {
      this._File = "*" ;
    }
    else
    {
      this._File = path ;
    }
  }
  else
  {
    this._Dir = "" ;
    this._File = path ;
  }
  for ( i = 0 ; i < this._Dir.length ; i++ )
  {
    if ( this._Dir.charAt ( i ) == '*' )
    {
      wildcardFound = true ;
      sb += ".*" ;
    }
    else
    if ( this._Dir.charAt ( i ) == '?' )
    {
      wildcardFound = true ;
      sb += '.' ;
    }
    else
    if ( this._Dir.charAt ( i ) == '\\' ) sb += '/' ;
    else
    if ( this._Dir.charAt ( i ) == '.' ) sb += "\\." ;
    else
    if ( this._Dir.charAt ( i ) == '/' ) sb += "\\/" ;
    else                            sb += this._Dir.charAt ( i ) ;
  }
  if ( wildcardFound )
  {
    this._Dir = sb ;
    if ( this._Dir.charAt ( this._Dir.length-1 ) != '*' )
    {
      this._Dir += "$" ;
    }
    this._DirMatcher = new RegExp ( this._Dir ) ;
  }
  sb = "" ;

  wildcardFound = false ;
  sb = "^" ;
console.log ( "this._File=" + this._File ) ;
  var t1 = this._File.replace ( /\*\*/g, "#&&#" ) ;
console.log ( "t1=" + t1 ) ;
  for ( i = 0 ; i < t1.length ; i++ )
  {
    if ( t1.charAt ( i ) == '*' )
    {
      wildcardFound = true ;
      sb += "([^/]+)" ;
      // sb += ".*" ;
    }
    else
    if ( t1.charAt ( i ) == '?' )
    {
      wildcardFound = true ;
      sb += '.' ;
    }
    else
    if ( t1.charAt ( i ) == '\\' ) sb += '/' ;
    else
    if ( t1.charAt ( i ) == '.' ) sb += "\\." ;
    else
    if ( t1.charAt ( i ) == '/' ) sb += "\\/" ;
    else sb += t1.charAt ( i ) ;
  }
  sb = sb.replace  ( /#&&#/, ".*" ) ;
console.log ( "sb=" + sb ) ;
  if ( wildcardFound )
  {
    this._File = sb ;
    if ( this._File.charAt ( this._File.length - 1 ) != '*' )
    {
      this._File += "$" ;
    }
    this._FileMatcher = new RegExp ( this._File ) ;
console.log ( "this._FileMatcher=" + this._FileMatcher ) ;
  }
};
WalkFileVisitor.prototype.visitDirectory = function ( file )
{
return true ;
  var s = file.toString() ;
  if ( s === this._BaseDir ) return true ;
  s = s.replace ( /\\/g, '/' ) ;
  if ( s === this._BaseDir ) return true ;

  var t = null ;
  var match = false ;
  if ( this._DirMatcher )
  {
    t = s.substring ( this._BaseDirLen + 1 ) + "/" ;
    match = this._DirMatcher.test ( t ) ;
  }
  else
  {
    t = s.substring ( this._BaseDirLen+1 ) ;
    match = this._Dir === t ;
  }
  if ( match )
  {
    if ( ! this._FilesOnly )
    {
      this.resultList.push ( new File ( s ) ) ;
    }
    return true ;
  }
  if ( this._Dir.indexOf ( t ) === 0 )
  {
    return true ;
  }
  return false ;
};
WalkFileVisitor.prototype.visitFile = function ( file )
{
  var s = file.toString().replace ( /\\/g, '/' ) ;
  var t = s.substring ( this._BaseDirLen + 1 ) ;
  var match = false ;
  if ( this._FileMatcher )
  {
    match = this._FileMatcher.test ( t ) ;
console.log ( "t=" + t + " -- " + match ) ;
  }
  else
  {
    match = this._File === t ;
  }

  if ( match )
  {
    this.resultList.push ( new File ( s ) ) ;
  }
  return true ;
};
WalkFileVisitor.prototype.toString = function()
{
  return "(WalkFileVisitor)"
       + "\n this._DirPattern: " + this._Dir
       + "\n this._FilePattern: " + this._File
       ;
};

module.exports = File ;