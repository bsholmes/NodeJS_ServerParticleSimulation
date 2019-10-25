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

var url = require("url");
var fs = require("fs");

function start(response, request) {
	//load html file
	fs.readFile("./src/canvas_interactive_particles.html" , function(error, data){

		if(error)
		{
			console.log('error: ' + error);
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(error);
			response.end();
		}
		else
		{
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(data);
			response.end();
		}
		
	});

	
}

//serve source files
function three(response, request) {
	var pathname = url.parse(request.url).pathname;

	//load html file
	fs.readFile("./src/" + pathname , function(error, data){

		if(error)
		{
			console.log('error: ' + error);
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(error);
			response.end();
		}
		else
		{
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(data);
			response.end();
		}
		
	});

	
}

//serve texture files
function textures(response, request) {
	var pathname = url.parse(request.url).pathname;

	//load png file
	fs.readFile("./src/" + pathname , function(error, data){

		if(error)
		{
			console.log('error: ' + error);
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(error);
			response.end();
		}
		else
		{
			response.writeHead(200, {"Content-Type": "image/png"});
			response.write(data);
			response.end();
		}
		
	});

	
}

exports.start = start;
exports.three = three;
exports.textures = textures;

