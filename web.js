var express = require('express');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  var fs = require('fs');
  var data = fs.readFileSync('./index.html'); 
  var buffer = new Buffer(data);
  response.send(buffer.toString());
});

var port = process.env.PORT || 5002;
app.listen(port, function() {
  console.log("Listening on " + port);
});
