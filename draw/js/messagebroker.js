//a copy of servermessage exists on the server as well
var ServerMessage = function(clientId, messageType, data){
	this.messageType = messageType;
	this.data = data;
	this.clientId = clientId;
};

var MessageBroker = function(params){

	var storage = params.storage,
	serverUrl = params.serverUrl,
	clientUrl = params.clientUrl, //'http://localhost:9999',
	window = params.window,
	drawingStorageKey = params.drawingStorageKey,
	clientIdStorageKey = params.clientIdStorageKey,
	messageTypes = params.messageTypes,
	socket,
	lastMessageId = -1,
	clientId;

	console.log("Opening socket to server");
	//socket = new WebSocket(serverUrl);
	var socket = new io.Socket(null, {port: 8080, rememberTransport: false});



	socket.onopen = function(){
		//Get clientid from server
		console.log("Getting clientid from server");
		socket.send(JSON.stringify(new ServerMessage(null, messageTypes.clientId, null)));	
	};

	socket.connect();
	// send initial request!

	console.log("sending initial request to server");
	//socket.send(JSON.stringify(new ServerMessage(null, messageTypes.clientId, null)));	
	
	socket.on('message', function(e){
		console.log('got message ' + e);
		var msg = JSON.parse(e);

		if(msg.clientId && msg.clientId == clientId){
			console.log("this message was not for me!");
			return;
		}
		/* hvoffor?
	   if(!clientId){
	   console.log("doh! 2");
	   return;
	   }*/

		console.log("message to me!");

		if(msg.messageType == messageTypes.clientId){
			console.log("clientid message!");
			clientId = msg.clientId;
			
			storage[clientIdStorageKey] = msg.clientId;			
		} else if(msg.messageType == messageTypes.addConnector){
			console.log("connector message!");
			
			postMessage(e);
		}
	});

	function postMessage(message){
		console.log('posting message');
		// use communicationapi to notify about the new connector
		window.postMessage(message, clientUrl);
	}


	this.sendUpdatesToServer = function(){
		if(!clientId) {
			return;
		}
		var connectorEntityArray = JSON.parse(storage[drawingStorageKey]);
		for(entity in connectorEntityArray){
			var conEntity = JSON.parse(connectorEntityArray[entity]);
			console.log("skal jeg? " + !conEntity.persisted);
			if(!conEntity.persisted){
				// notify server about the added connector
				socket.send(JSON.stringify(new ServerMessage(clientId, messageTypes.addConnector, connectorEntityArray[entity])));
				conEntity["persisted"] = true;
				connectorEntityArray[entity] = JSON.stringify(conEntity);				
			}
		}
		storage[drawingStorageKey] = JSON.stringify(connectorEntityArray);
	};
};