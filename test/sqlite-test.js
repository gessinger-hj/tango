var sqlite = require ( "node-sqlite-purejs" ) ;
sqlite.open ( 'users.db', {}, function(err, db)
{
  if (err) 
    console.log('Error: ' + err);
  if (!err)
  {
    db.exec("SELECT * FROM lorem", function(err, result)
    {
      if (err) 
        console.log('Error: ' + err);
      else
        console.log(result);
    })
  }
});

