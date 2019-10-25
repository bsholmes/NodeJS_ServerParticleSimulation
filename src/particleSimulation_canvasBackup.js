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

var spawn = require("threads").spawn;
var server = require("./server");
var timers = require("timers");

function vector3(_x, _y, _z)
{
	this.x = _x;
	this.y = _y;
	this.z = _z;
}

//object to hold all of the relevant particle data
// function particleData(pos, vel, color)
// {
// 	this.position = pos;
// 	this.velocity = vel;
// 	this.color = color;
// }

var frameTime = 1/60;

function particleSystem()
{
	this.particles = [];
	this.id;
	this.intervalId;
	this.dSeconds = 0.01667;

	this.getInitialParticleData = function() {
		for(i = 0; i < 7; ++i)
		{
			for(j = 0; j < 7; ++j)
			{
				for(k = 0; k < 7; ++k)
				{
					this.particles.push({position: new vector3((j-3)*40,(i-3)*40,(k-3)*40), 
										// velocity: new vector3((j-3)*40,(i-3)*40,(k-3)*40), 
										velocity: new vector3(0,0,0),
										color: new vector3(255,0,0)});
				}
			}
		}
		
	};

	this.simulateTick = function(callTime, deltaSeconds) {
		//this.lastTimeTickCalled = callTime;
		//we want to do this asynchronously, and threading should help performance as well
		// console.log("start thread");

		var thread = spawn(function(input, done)
		{
			// console.log("thread spawned");

			//can't see functions outside the thread so we need to define some here
			function vectorMagnitude(vector3)
			{
				return Math.sqrt(Math.pow(vector3.x, 2) + Math.pow(vector3.y, 2) + Math.pow(vector3.z, 2));
			}

			function vectorAdd(firstVec, secondVec)
			{
				return {x:firstVec.x + secondVec.x, y:firstVec.y + secondVec.y, z:firstVec.z + secondVec.z};
			}

			function vectorNormalize(vector3)
			{
				return {x:vector3.x/vectorMagnitude(vector3), y:vector3.y/vectorMagnitude(vector3), z:vector3.z/vectorMagnitude(vector3)};
			}

			function vectorMultiply(vector3, num)
			{
				return {x:(vector3.x * num), y:(vector3.y * num), z:(vector3.z * num)};
			}

			function vectorDivide(vector3, num)
			{
				return {x:(vector3.x / num), y:(vector3.y / num), z:(vector3.z / num)};
			}

			function vectorDifference(firstVector3, secondVector3)
			{
				return {x:(firstVector3.x - secondVector3.x), y:(firstVector3.y - secondVector3.y), z:(firstVector3.z - secondVector3.z)};
			}

			function vector2Difference(firstVector2, secondVector2)
			{
				return {x:(firstVector2.x - secondVector2.x), y:(firstVector2.y - secondVector2.y)};
			}

			function vector2Magnitude(vector2)
			{
				return Math.sqrt(Math.pow(vector2.x, 2) + Math.pow(vector2.y, 2));
			}

			function applyMatrix4 (v, m ) {
				var x = v.x, y = v.y, z = v.z;

				v.x = m[ 0 ] * x + m[ 4 ] * y + m[ 8 ]  * z + m[ 12 ];
				v.y = m[ 1 ] * x + m[ 5 ] * y + m[ 9 ]  * z + m[ 13 ];
				v.z = m[ 2 ] * x + m[ 6 ] * y + m[ 10 ] * z + m[ 14 ];
				var w =  m[ 3 ] * x + m[ 7 ] * y + m[ 11 ] * z + m[ 15 ];

				v = vectorDivide(v, w);

				return v;
			}

			function crossVectors( a, b ) {
				var ax = a.x, ay = a.y, az = a.z;
				var bx = b.x, by = b.y, bz = b.z;

				var newVec = {x:0, y:0, z:0};

				newVec.x = ay * bz - az * by;
				newVec.y = az * bx - ax * bz;
				newVec.z = ax * by - ay * bx;

				return newVec;
			}

			var inputObject = JSON.parse(input);

			inputObject.particleArray.forEach(function(p)
			{
				//console.log("tick particle");
				//apply drag to velocity
				p.velocity = vectorMultiply(p.velocity, 0.995);

				//process input events (affect velocity)
				//push particles away from the mouse position if held
				//have to transform particle world position to view position to check distance
				
				inputObject.inputEvents.forEach(function(event){

					var mousePos = {x:event.mouseX, y:event.mouseY};

					var particlePosition = {x:p.position.x, y:p.position.y, z:p.position.z};

					//project to view space
					particlePosition = applyMatrix4(particlePosition, event.cameraViewProjectionMatrix);

					//map to screen space
					particlePosition.x = ( particlePosition.x * event.canvasWidthHalf * 2 );// + event.canvasWidthHalf;
    				particlePosition.y = ( particlePosition.y * event.canvasHeightHalf * 2 );// + event.canvasHeightHalf;

					if(vector2Magnitude(vector2Difference(mousePos, particlePosition)) < 120)
					{
						var direction = vector2Difference(mousePos, particlePosition);
						direction['z'] = 0;
						direction = vectorNormalize(direction);

						var pushVec = vectorMultiply(direction, Math.max(1 - (vector2Magnitude(vector2Difference(mousePos, particlePosition))/120), 0) * 300 * inputObject.deltaSeconds);
						var camRightVec = crossVectors(event.cameraForwardVec, {x:0, y:1, z:0});
						var cameraAlignedPushVec = vectorMultiply(camRightVec, pushVec.x);

						cameraAlignedPushVec = vectorAdd(cameraAlignedPushVec, vectorMultiply(crossVectors(camRightVec, event.cameraForwardVec), pushVec.y));
						// var upVec = crossVectors(camRightVec, event.cameraForwardVec);

						// console.log("event.cameraForwardVec: (" + event.cameraForwardVec.x + ", " + event.cameraForwardVec.y + ", " + event.cameraForwardVec.z + ")");
						// console.log("camRightVec: (" + camRightVec.x + ", " + camRightVec.y + ", " + camRightVec.z + ")");
						// console.log("upVec: (" + upVec.x + ", " + upVec.y + ", " + upVec.z + ")");

						p.velocity = vectorAdd(p.velocity, cameraAlignedPushVec);
						// p.velocity = vectorAdd(p.velocity, pushVec);
					}
				});

				//bounce particles off of hard coded "walls"
				var nextPos = vectorAdd(p.position, vectorMultiply(p.velocity, inputObject.deltaSeconds))

				//bounce Negative X
				if(nextPos.x <= -220)
				{
					var propXtoY = p.velocity.y / p.velocity.x;
					var propXtoZ = p.velocity.z / p.velocity.x;

					var xDist = (p.position.x + 220);

					//find intersection point with wall
					var collidePos = {x:-220, y: p.position.y + (xDist * propXtoY), z: p.position.z + (xDist * propXtoZ)};

					var speedAfterCollide = vectorMagnitude(p.velocity) - vectorMagnitude(vectorDifference(collidePos, p.position));

					//reflect velocity dir over X
					p.velocity.x *= -1;
					//find velocity after bouncing (no energy loss)
					p.velocity = vectorMultiply(vectorNormalize(p.velocity), speedAfterCollide);

					//place particle at collision point, normal moving should put it where it should be after bounce
					p.position.x = collidePos.x;
					p.position.y = collidePos.y;
					p.position.z = collidePos.z;
				}

				//bounce Positive X
				if(nextPos.x >= 220)
				{
					var propXtoY = p.velocity.y / p.velocity.x;
					var propXtoZ = p.velocity.z / p.velocity.x;

					var xDist = (p.position.x - 220);

					var collidePos = {x:220, y: p.position.y + (xDist * propXtoY), z: p.position.z + (xDist * propXtoZ)};

					var speedAfterCollide = vectorMagnitude(p.velocity) - vectorMagnitude(vectorDifference(collidePos, p.position));

					//reflect velocity dir over X
					p.velocity.x *= -1;

					p.velocity = vectorMultiply(vectorNormalize(p.velocity), speedAfterCollide);

					p.position.x = collidePos.x;
					p.position.y = collidePos.y;
					p.position.z = collidePos.z;
				}

				//bounce Negative Y
				if(nextPos.y <= -220)
				{
					var propYtoX = p.velocity.x / p.velocity.y;
					var propYtoZ = p.velocity.z / p.velocity.y;

					var yDist = (p.position.y + 220);

					var collidePos = {x:p.position.x + (yDist * propYtoX), y: -220, z: p.position.z + (yDist * propYtoZ)};

					var speedAfterCollide = vectorMagnitude(p.velocity) - vectorMagnitude(vectorDifference(collidePos, p.position));

					//reflect velocity dir over Y
					p.velocity.y *= -1;
					p.velocity = vectorMultiply(vectorNormalize(p.velocity), speedAfterCollide);
					p.position.x = collidePos.x;
					p.position.y = collidePos.y;
					p.position.z = collidePos.z;
				}

				//bounce Positive Y
				if(nextPos.y >= 220)
				{
					var propYtoX = p.velocity.x / p.velocity.y;
					var propYtoZ = p.velocity.z / p.velocity.y;

					var yDist = (p.position.y - 220);

					var collidePos = {x:p.position.x + (yDist * propYtoX), y: 220, z: p.position.z + (yDist * propYtoZ)};

					var speedAfterCollide = vectorMagnitude(p.velocity) - vectorMagnitude(vectorDifference(collidePos, p.position));

					//reflect velocity dir over Y
					p.velocity.y *= -1;
					p.velocity = vectorMultiply(vectorNormalize(p.velocity), speedAfterCollide);
					p.position.x = collidePos.x;
					p.position.y = collidePos.y;
					p.position.z = collidePos.z;
				}

				//bounce Negative Z
				if(nextPos.z <= -220)
				{
					var propZtoX = p.velocity.x / p.velocity.z;
					var propZtoY = p.velocity.y / p.velocity.z;

					var zDist = (p.position.z + 220);

					var collidePos = {x:p.position.x + (zDist * propZtoX), y: p.position.y + (zDist * propZtoY), z:-220};

					var speedAfterCollide = vectorMagnitude(p.velocity) - vectorMagnitude(vectorDifference(collidePos, p.position));

					//reflect velocity dir over Z
					p.velocity.z *= -1;
					p.velocity = vectorMultiply(vectorNormalize(p.velocity), speedAfterCollide);
					p.position.x = collidePos.x;
					p.position.y = collidePos.y;
					p.position.z = collidePos.z;
				}

				//bounce Positive Z
				if(nextPos.z >= 220)
				{
					var propZtoX = p.velocity.x / p.velocity.z;
					var propZtoY = p.velocity.y / p.velocity.z;

					var zDist = (p.position.z - 220);

					var collidePos = {x:p.position.x + (zDist * propZtoX), y: p.position.y + (zDist * propZtoY), z:220};

					var speedAfterCollide = vectorMagnitude(p.velocity) - vectorMagnitude(vectorDifference(collidePos, p.position));

					//reflect velocity dir over Z
					p.velocity.z *= -1;
					p.velocity = vectorMultiply(vectorNormalize(p.velocity), speedAfterCollide);
					p.position.x = collidePos.x;
					p.position.y = collidePos.y;
					p.position.z = collidePos.z;
				}

				//move particles and set color
				p.color.x = Math.max(Math.round(Math.min(Math.abs(p.velocity.x) / 40, 1) * 255), 20);
				p.color.y = Math.max(Math.round(Math.min(Math.abs(p.velocity.y) / 40, 1) * 255), 20);
				p.color.z = Math.max(Math.round(Math.min(Math.abs(p.velocity.z) / 40, 1) * 255), 20);

				p.position.x += p.velocity.x * inputObject.deltaSeconds;
				p.position.y += p.velocity.y * inputObject.deltaSeconds;
				p.position.z += p.velocity.z * inputObject.deltaSeconds;
			});
			// console.log("thread finished");

			// console.log("send id back from thread: " + inputObject.id);

			done({id: inputObject.id, particleArray: inputObject.particleArray, threadId: inputObject.threadId});
		});

		//callback handlers
		thread.on('message', function(response)
			{
				//thread finished updating

				// console.log("updateParticleData");

				//set particle system data
				var pSystem = server.getParticleSystem(response.id);
				pSystem.particles = response.particleArray;

				server.clearInputEvents(response.id);

				// console.log("time between updates: " + (new Date().getTime() - pSystem.lastTimeTickCalled) + "ms");

				//set deltaSeconds so we can be frameRate independent
				pSystem.dSeconds = (new Date().getTime() - pSystem.lastTimeTickCalled) / 1000;
				pSystem.lastTimeTickCalled = new Date().getTime();

				//send particle data to client
				server.getSocket(response.id).emit('updateParticleData', JSON.stringify(pSystem.particles));
			})
			.on('error', function(err){
					console.log(err);
			})
			.on('exit', function(){
					console.log("exited");
			});

		//start tick loop
		this.intervalId = timers.setInterval(function(pfxId){
			var pfxSystem = server.getParticleSystem(pfxId);

			thread.send(JSON.stringify({particleArray: pfxSystem.particles, deltaSeconds: pfxSystem.dSeconds, inputEvents: server.getInputEvents(pfxId), id: pfxId}));
		}, 32, this.id);

		//keep reference to thread so we can kill it later
		this.thread = thread;
	};

}

exports.particleSystem = particleSystem;

