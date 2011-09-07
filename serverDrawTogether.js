/**
 * Important note: this application is not suitable for benchmarks!
 */

$port = 8080;
 
String.prototype.endsWith = function(str) {     
	var lastIndex = this.lastIndexOf(str);     
	return (lastIndex != -1) && (lastIndex + str.length == this.length); 
};

var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('../tools/socket.io/')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , server;
    
server = http.createServer(function(req, res){
  // your normal server code
  var path = url.parse(req.url).pathname;
  /*
  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1>Welcome. Try the <a href="/chat.html">chat</a> example.</h1>');
      res.end();
      break;
      
	  
    case '/json.js':
    case '/chat.html':
	*/

	if (path == '/') { path = "/index.html"; };

	
	 util.log('user is requesting the page "'+path+'"');	
	 fs.readFile(__dirname + path, function(err, data){
	  
	  var str = '.js';
	  var lastIndex = path.lastIndexOf(str);     
	  var isJavascript = (lastIndex != -1) && (lastIndex + str.length == path.length); 
	  
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': isJavascript ? 'text/javascript' : 'text/html'});
        res.write(data, 'utf8');
        res.end();
      });
/*  
  break;
      
    default: send404(res);
  }
*/
  }),

send404 = function(res){
  res.writeHead(404);
  res.write('Jeg kan ikke finde den side du leder efter...');
  res.end();
};

server.listen($port);
util.log('server is listening for requests on port ' + $port);	

var ServerMessage = function(clientId, messageType, data){
    this.messageType = messageType;
    this.data = data;
    this.clientId = clientId;
};
	
// socket.io, I choose you
// simplest chat application evar
var io = io.listen(server)
  , buffer = [];

io.on('connection', function(client){
  util.log("user: " + client.sessionId +" connected");  	
  client.send(JSON.stringify(new ServerMessage(client.sessionId,"clientId","")));	
  client.broadcast(JSON.stringify(new ServerMessage("server","announcement","user: " + client.sessionId + " connected")));
  util.log("sending drawing state to: " + client.sessionId);
  var msg = new ServerMessage("server", "connect", buffer);
  client.send(JSON.stringify(msg));
  
  client.on('message', function(message){
	//util.log("user: " + client.sessionId +" sent msg: " + message);	
	try{
		var msg = JSON.parse(message);
	} catch(ex){
		util.log("user: " + client.sessionId + " sent message that wasn't JSON!");
		return;
	}
	
	if (msg.messageType == "addConnector") {
		buffer.push(msg.data);
		client.broadcast(message); // tell the other clients about the change
	} 
	else if(msg.messageType == "reset"){
		buffer = [];
		client.broadcast(message);
	}
	else if(msg.messageType == "connect"){		
		util.log("sending drawing state to: " + client.sessionId);
		var msg = JSON.stringify(new ServerMessage("server", "connect", buffer));
		client.send(msg);
	}
	else {
		util.log("unknown messagetype from client ("+ client.sessionId +") type: " + msg.messageType);
	}
  });

  client.on('disconnect', function(){    
	client.broadcast(JSON.stringify(new ServerMessage("server","announcement","user: " + client.sessionId + " diconnected")));
  });
});
