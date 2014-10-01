
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
  res.redirect("/index.html"); // For this simple app, just redirect the root to a static html file.
};

app.get('/', index);

io.on('connection', function (socket) {
  
  var balance = 0;
  
  // Client asked for a new Dogecoin address.
  // For production use, make sure each client IP only requests one address,
  // or require email verification before issuing one,
  // because a malicious client could request many addresses which are a finite resource.
  socket.on('get_address', function(){
    block_io.get_new_address({}, function(err, rsp) {
      socket.emit('got_address', rsp);
    });
  });
  
  // Client requested the balance of their address.
  socket.on('get_balance', function(address){
    block_io.get_address_balance(address, function(err, rsp) {
      socket.emit('got_balance', rsp);
    });
  });
  
  // Client made an in-game purchase.
  // We shouldn't really allow the client to specify any address here.
  // Since if one client discovers another player's address they could make a charge against it.
  // A better option would be to store the client's address in their user record in a database.
  socket.on('buy_hammer', function(address){
    // Check the client has sufficient funds.
    block_io.get_address_balance(address, function(err, rsp) {
      balance = rsp.data.balance_available;
      if (balance > 2){
        socket.emit('message', 'Insufficient balance.');
      } else {
        block_io.withdraw_from_addresses({
          'amount': '3',
          'from_addresses': address,
          'payment_address': app.get('GAME_ADDRESS'),
          'pin': app.get('BLOCK_IO_SECRET_PIN')
        }, function(err, rsp){
          if (rsp.status==='success') {
            socket.emit('bought_hammer', rsp);
          }
          // Typically, we'd store a record of the purchase in the user's database record.
        });
      }
    });
  });
  
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
