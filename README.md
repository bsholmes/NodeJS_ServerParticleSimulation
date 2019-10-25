# NodeJS_ServerParticleSimulation

This project is available under the MIT License which can be found in the source files.

This project was intended to refresh my javascript skills, to help me learn NodeJS, to give me a chance to use Websockets and realtime 3d in a web environment, and finally to have a code example to use for employment purposes.

The project is a server written with NodeJS using websockets for real-time communication with the client and uses a worker thread for quick, parallel physics simulation. The server simulates physics for a set of particles that can be interacted with through the client. The client renders the particles and gets input events which are sent to the server for use in physics simulation.

The client uses Three.js for the 3d environment and rendering.

To run first 'npm install' then 'npm start' then navigate to
localhost:8080/start in a web browser.

Particles can be pulled by clicking and dragging the mouse, and the camera can be rotated with the 'a' and 'd' keys.