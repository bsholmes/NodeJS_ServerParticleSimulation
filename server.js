var http = require("http");
var url = require("url");
var particleSimulation = require("./particleSimulation");
var timers = require("timers");

var inputEvents = [];

var clientParticleData = [];

var sockets = [];

var framerate = 60;

function start(route, handle) {
	function onRequest(request, response) {	
		var pathname = url.parse(request.url).pathname;
		//console.log("Request for " + pathname + " received");

		//parse again so we're only using the first part of the path to route
		var firstPath = pathname.split('/')[1].toLowerCase();

		route(handle, firstPath, response, request);
	}
// Copyright (c) 2017 Ben Holmes

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

	//start http server
	var server = http.createServer(onRequest);
	var io = require('socket.io')(server, function(sockrequest, sockresponse){
		console.log("socket request");
		sockresponse(null, true);
	});
	server.listen(8888);


	//listen for connection
	io.on('connection', function (socket) {
		console.log("socket connection");
		var id = guid();
		console.log("socket at id: " + id);
		sockets[id] = socket;
		inputEvents[id] = [];

		//set up the particle system
		clientParticleData[id] = {pfxSystem: new particleSimulation.particleSystem(), guid: id};

		clientParticleData[id].pfxSystem.getInitialParticleData();
		clientParticleData[id].pfxSystem.inputEvents = inputEvents[id];
		clientParticleData[id].pfxSystem.id = id;

		// send initial data on connection
		socket.emit('initParticleData', JSON.stringify(clientParticleData[id].pfxSystem.particles)); // Send data to client

		//get input events from client
		socket.on('onInputEvent', function (data) {
			 // console.log("onInputEvent");

			inputEvents[id].push(JSON.parse(data));
		});

		socket.on('disconnect', function (data) {
			//kill update loop
			clientParticleData[id].pfxSystem.thread.kill();
			timers.clearInterval(clientParticleData[id].pfxSystem.intervalId);

			//remove input events
			inputEvents.splice(id, 1);

			//remove particle data
			clientParticleData.splice(id, 1);
			
			console.log("disconnect, cleaned up thread and data");
		});

		clientParticleData[id].pfxSystem.simulateTick(new Date().getTime(), 1/framerate, id);
	});

	

	console.log("Server has started");
}

function getSocket(id)
{
	return sockets[id];
}

function getParticleSystem(id)
{
	return clientParticleData[id].pfxSystem;
}
function getInputEvents(id)
{
	return inputEvents[id];
}

function clearInputEvents(id)
{
	return inputEvents[id] = [];
}

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

exports.start = start;
exports.getSocket = getSocket;
exports.getParticleSystem = getParticleSystem;
exports.getInputEvents = getInputEvents;
exports.clearInputEvents = clearInputEvents;