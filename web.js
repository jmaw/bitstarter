var express = require('express');

var app = express.createServer(express.logger());

app.use("/resources/css", express.static(__dirname + '/resources/css'));
app.use("/resources/fonts", express.static(__dirname + '/resources/fonts'));
app.use("/resources/scripts", express.static(__dirname + '/resources/scripts'));
app.use("/resources/buttons", express.static(__dirname + '/resources/buttons'));
app.use("/images", express.static(__dirname + '/images'));
<<<<<<< HEAD
app.use("/",express.static(__dirname + '/'));
=======
app.use("", express.static(__dirname));
>>>>>>> develop

app.get('/', function(request, response) {
  var fs = require('fs');
  var data = fs.readFileSync('./index.html'); 
  var buffer = new Buffer(data);
  response.send(buffer.toString());
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
