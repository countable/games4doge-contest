
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var BlockIo = require('block_io');

var app = express();
server = http.createServer(app);

// get the block.io api key from the config file.
require('./config')(app);

var block_io = new BlockIo(app.get('BLOCK_IO_API_KEY'));

// standard express stuff
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var io = require('socket.io')(server);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var index = function(req, res) {
  res.redirect("/index.html")
};

app.get('/', index);

io.on('connection', function (socket) {
  
  var balance = 0;
  console.log('client connected');
  
  socket.on('get_address', function(){
    console.log('asked for address');
    block_io.get_new_address({}, function(err, rsp) {
      console.log(rsp);
      socket.emit('got_address', rsp);
    });
  });
  
  socket.on('get_balance', function(address){
    console.log('asked for balance of', address);
    block_io.get_address_balance(address, function(err, rsp) {
      console.log(rsp);
      socket.emit('got_balance', rsp);
      balance = rsp.data.balance_available;
    });
  });
  
  socket.on('buy_hammer', function(){
    console.log('buying hammer.');
    block_io.get_address_balance(address, function(err, rsp) {
      console.log(rsp);
      balance = rsp.data.balance_available;
      if (balance > 2){
        socket.emit('message', 'Insufficient balance.');
      } else {
        block_io.withdraw({'amount': '3', 'payment_address': app.get('GAME_ADDRESS'), 'pin': app.get('BLOCK_IO_SECRET_PIN')}, function(err, rsp){
          socket.emit('bought_hammer', rsp);
        });
      }
    });
  });
  
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
