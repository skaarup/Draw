var Point = function (x, y) {
	this.x = x;
	this.y = y;
};

var Connector = function (startPoint, endPoint) {
	this.endPoint = endPoint;
	this.startPoint = startPoint;
};

var ConnectorEntity = function(connector, persisted, clientId){
	this.connector = connector;	
	this.persisted = persisted;	
	this.clientId = clientId;
};

var Drawing = function (params) {

	var lastPoint,
		canvas = document.getElementById("canvas"),
		context = canvas.getContext('2d'),
		resetButton = document.getElementById("reset"),
		myLineColor = "red",
		messageBroker = params.messageBroker,
		storage = params.storage,
		window = params.window,
		drawingStorageKey = params.drawingStorageKey,
		clientId = params.clientId,		
		clientUrl = params.clientUrl;


	function init(){
		function canvasClicked(e) {
			x = e.clientX - e.target.offsetLeft;
			y = e.clientY - e.target.offsetTop;
			point = new Point(x,y);
			addPoint(point);
		};	
		canvas.addEventListener("click", canvasClicked, false);	
	}
	
	function addPoint(point) {
		if(lastPoint){
			connector = new Connector(lastPoint, point);
			drawConnector(connector, true);
			saveConnector(connector, false);	
			persist();			
		}		
		lastPoint = point;
	}

	function saveConnector(connector, persisted){		
		if(!clientId){
			alert("No clientId has been assigned by the server");
			return;
		}
		var connectorEntity = new ConnectorEntity(connector, persisted, clientId);
		var storedDrawing = JSON.parse(storage[drawingStorageKey]);
		storedDrawing.push(JSON.stringify(connectorEntity));
		storage[drawingStorageKey] = JSON.stringify(storedDrawing);
	}

	function clear() {
		//setting the width or height resets the canvas			
		canvas.width = canvas.width;
		lastPoint = null;
		storage[drawingStorageKey] = "[]";
	}

	function persist() {
		messageBroker.sendUpdatesToServer();
	}

	function messageHandler(e) {
		switch(e.origin) {
		case clientUrl:
			// process message
			processMessage(e);
			break;
		default:
			console.log("message origin not recognized" + e.origin);
		    // ignoring message
		}
	}
	
	function processMessage(message) {
		
		// fetch message contents
		var serverMsg = JSON.parse(message.data);		
		var otherClientId = serverMsg.clientId;
		var msgType = serverMsg.messageType;
		
		switch(msgType){
			case messageTypes.reset:
				clear();
				break;
			case messageTypes.addConnector:			
				var connector = JSON.parse(serverMsg.data).connector;
				drawConnector(connector, false);
				saveConnector(connector, true);	
				break;	
			case messageTypes.connect:
				var drawing = serverMsg.data;
				for(i in drawing){
					var data = JSON.parse(drawing[i]);
					drawConnector(data.connector, false);
					saveConnector(data.connector, true);
				}
				init();
				break;
			default:
				console.log("Unknown messageType received from server: " + msgType);
		}
	}
	
	window.addEventListener("message", messageHandler, true);
			
	 function drawConnector(connector, isMyConnector){
		context.beginPath();
		context.moveTo(connector.startPoint.x, connector.startPoint.y);
		context.lineTo(connector.endPoint.x, connector.endPoint.y);
		if(isMyConnector){
			context.strokeStyle = myLineColor;
		} else {
			context.strokeStyle = "green";
		}
		context.stroke();
	};
	
	resetButton.onclick = function(){
		var confirmed = confirm("Reset the drawing for ALL connected users?");
		if(confirmed) {
			clear();
			messageBroker.sendServerReset();
		}
		return false;
	};
};

var MessageTypes = function(){
	this.addConnector = "addConnector";
	this.clientId = "clientId";
	this.reset = "reset";
	this.announcement = "announcement";
	this.connect = "connect";
};