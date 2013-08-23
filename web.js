// Define routes for simple SSJS web app. 
// Writes Coinbase orders to database.
var async    = require('async')
  , express  = require('express')
  , fs       = require('fs')
  , http     = require('http')
  , https    = require('https')
  , controlf = require('./utils')
  , db       = require('./models');

var app = express();
app.use("/images", express.static(__dirname + '/images'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080);

// Render homepage (note trailing slash): example.com/
app.get('/', function(request, response) {
  // passing crowdfunding control parameters
  global.cf.Refresh(function(r){
     response.render("index", { cfcontrol: r });
   });
});

app.get('/about', function(request, response) {
    response.render("about", {});
});

//app.get('/contact', function(request, response) {
//    response.render("contact", {});
//});

app.get('/videos', function(request, response) {
    https.get("https://gdata.youtube.com/feeds/api/users/" + process.env.YOUTUBE_API_KEY+"/uploads?alt=json", function(res) {
        var body = '';
        res.on('data', function(chunk) {body += chunk;});
        res.on('end', function() {   
           try{
             var data = JSON.parse(body);    
             var videos = [];       
             for (var i=0;i<data.feed.entry.length; i++){
                  var entry = data.feed.entry[i];
                  var temp = entry.id.$t.split("videos/");
                  var xid = temp[1];
                  videos.push({ id: xid, title : entry.title.$t, content: entry.content.$t, published: entry.published.$t }) ;
             }
             videos.sort(function(a,b){
                var strcmp = function (a, b) {
                    if (a.toString() < b.toString()) return -1;
                    if (a.toString() > b.toString()) return 1;
                    return 0;
                };
                return strcmp(a.published,b.published);
             });    
             response.render("videos", {v: videos });
           }
           catch(e){
             console.log(e);
             response.send("error reading youtube videos");  
           }  
        });
        res.on('error', function(e) {
            console.log(e);
            response.send("error reading youtube videos");
        });
    }); 
    
});


app.get('/backers', function(request, response) {
  global.db.Backer.findAll().success(function(backers) {
    var backers_json = [];
    backers.forEach(function(backer) {
      backers_json.push({userid: backer.userid, amount: backer.amount});
    });
    // Uses views/backers.ejs
    response.render("backers", {backers: backers_json});
  }).error(function(err) {
    console.log(err);
    response.send("error retrieving backers");
  });
});

// Hit this URL while on example.com/backers to refresh
app.get('/refresh_backers', function(request, response) {

   global.cf.Refresh(function(r){
        async.forEach(r.trans, addBacker, function(err) {
           if (err) {
               console.log(err);
               response.send("error adding backer");
           } else {
               // backers added successfully
            response.redirect("/backers");
           }
        });

   });   
   

});



// Render example.com/orders
app.get('/orders', function(request, response) {
  global.db.Order.findAll().success(function(orders) {
    var orders_json = [];
    orders.forEach(function(order) {
      orders_json.push({id: order.coinbase_id, amount: order.amount, time: order.time});
    });
    // Uses views/orders.ejs
    response.render("orders", {orders: orders_json});
  }).error(function(err) {
    console.log(err);
    response.send("error retrieving orders");
  });
});

// Hit this URL while on example.com/orders to refresh
app.get('/refresh_orders', function(request, response) {
  https.get("https://coinbase.com/api/v1/orders?api_key=" + process.env.COINBASE_API_KEY, function(res) {
    var body = '';
    res.on('data', function(chunk) {body += chunk;});
    res.on('end', function() {
      try {
        var orders_json = JSON.parse(body);
        if (orders_json.error) {
          response.send(orders_json.error);
          return;
        }
        // add each order asynchronously
        async.forEach(orders_json.orders, addOrder, function(err) {
          if (err) {
            console.log(err);
            response.send("error adding orders");
          } else {
            // orders added successfully
            response.redirect("/orders");
          }
        });
      } catch (error) {
        console.log(error);
        response.send("error parsing json");
      }
    });

    res.on('error', function(e) {
      console.log(e);
      response.send("error syncing orders");
    });
  });

});

// sync the database and start the server
db.sequelize.sync().complete(function(err) {
  if (err) {
    throw err;
  } else {
    http.createServer(app).listen(app.get('port'), function() {
      console.log("Listening on " + app.get('port'));
    });
  }
});

// add order to the database if it doesn't already exist
var addOrder = function(order_obj, callback) {
  var order = order_obj.order; // order json from coinbase
  if (order.status != "completed") {
    // only add completed orders
    callback();
  } else {
    var Order = global.db.Order;
    // find if order has already been added to our database
    Order.find({where: {coinbase_id: order.id}}).success(function(order_instance) {
      if (order_instance) {
        // order already exists, do nothing
        callback();
      } else {
        // build instance and save
          var new_order_instance = Order.build({
          coinbase_id: order.id,
          amount: order.total_btc.cents / 100000000, // convert satoshis to BTC
          time: order.created_at
        });
          new_order_instance.save().success(function() {
          callback();
        }).error(function(err) {
          callback(err);
        });
      }
    });
  }
};

// add order to the database if it doesn't already exist
var addBacker = function(backer_obj, callback) {
    var Backer = global.db.Backer;
    // find if backer has already been added to our database
    Backer.find({where: {userid: backer_obj.userid}}).success(function(backer_instance) {
      if (backer_instance) {
        // backer already exists, do nothing
        callback();
      } else {
        // build instance and save
        var new_backer_instance = Backer.build({
              userid: backer_obj.userid,
              name: backer_obj.name,
              email: backer_obj.email,
              amount: backer_obj.amount
        });
        new_backer_instance.save().success(function() {
              callback();
        }).error(function(err) {
              callback(err);
        });
      }
    });
};


