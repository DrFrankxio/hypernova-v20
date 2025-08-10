const express = require('express')
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ip = require('ip')

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})
app.use(express.static('public'));

distance=(obj1,obj2)=>{
  return (((obj1.x-obj2.x)**2+(obj1.y-obj2.y)**2+(obj1.z-obj2.z)**2)**0.5)
}

players={}

io.on('connect', (socket) => {
  socket.id = Math.random();
  players[socket.id] = {
    socket: socket.id,
    x: 2,
    z: 2,
    walkSpeed: 0.2,
    pressingRight: false,
    pressingLeft: false,
    pressingUp: false,
    pressingDown: false,
    health:10000,
  };

  socket.on('angle', (e) => {
    if(players[socket.id].health>0){
      players[socket.id].xa = e.x;
      players[socket.id].ya = e.y;
    }
  });

  socket.on('keyPress', function (data) {
    if (data.inputId === 'left') players[socket.id].pressingLeft = data.state;
    else if (data.inputId === 'right') players[socket.id].pressingRight = data.state;
    else if (data.inputId === 'up') players[socket.id].pressingUp = data.state;
    else if (data.inputId === 'down') players[socket.id].pressingDown = data.state;
    else if (data.inputId === 'attack') players[socket.id].pressingAttack = data.state;
  });

  // Mover al jugador basándote en el estado de las teclas presionadas
  setInterval(() => {

    socket.emit("health",{headers: socket.handshake.headers['user-agent'],health:players[socket.id].health})

    if(players[socket.id].pressingLeft&&players[socket.id].health>0){
      players[socket.id].x+=players[socket.id].walkSpeed*Math.cos(players[socket.id].xa)
      players[socket.id].z-=players[socket.id].walkSpeed*Math.sin(players[socket.id].xa)
    }
    if(players[socket.id].pressingUp&&players[socket.id].health>0){
      players[socket.id].x+=players[socket.id].walkSpeed*Math.sin(players[socket.id].xa)
      players[socket.id].z+=players[socket.id].walkSpeed*Math.cos(players[socket.id].xa)
    }
    if(players[socket.id].pressingRight&&players[socket.id].health>0){
      players[socket.id].x-=players[socket.id].walkSpeed*Math.cos(players[socket.id].xa)
      players[socket.id].z+=players[socket.id].walkSpeed*Math.sin(players[socket.id].xa)
    }
    if(players[socket.id].pressingDown&&players[socket.id].health>0){
      players[socket.id].x-=players[socket.id].walkSpeed*Math.sin(players[socket.id].xa)
      players[socket.id].z-=players[socket.id].walkSpeed*Math.cos(players[socket.id].xa)
    }

    if (players[socket.id].pressingAttack && players[socket.id].health > 0) {
      for (i1 in players) {
        if (i1 !== socket.id){     
          for (let i2 = 5; i2 < 10; i2 += 0.1) {
            const check_x = players[socket.id].x + i2 * Math.sin(players[socket.id].xa) * Math.cos(players[socket.id].ya);
            const check_y = 0
            const check_z = players[socket.id].z + i2 * Math.cos(players[socket.id].xa) * Math.cos(players[socket.id].ya);

            if (distance({x:players[i1].x,y:0,z:players[i1].z}, { x: check_x, y: 0, z: check_z }) < 1) { // Rango ajustado
              players[i1].health-=20;
            }
          }
        }
      }
    }
    socket.emit("eval", { code : `
      sun.position.set(camera.position.x,camera.position.y+800*Math.sin(`+time+`/1000),camera.position.z+800*Math.cos(`+time+`/1000))
      moon.position.set(camera.position.x,camera.position.y+400*Math.sin(`+time+`/400),camera.position.z+400*Math.cos(`+time+`/400))
      moon.rotation.x-=0.02
      moon.rotation.z=Math.PI/2
      scene.background = new THREE.Color("rgb(0,"+Math.floor((Math.sin(`+time+`/1000)*1/2+1/2)*127)+","+Math.floor((Math.sin(`+time+`/1000)*1/2+1/2)*255)+")")
    ` })
    socket.emit('pack', { x: players[socket.id].x, z: players[socket.id].z });
    socket.emit('all', { all: players });

  }, 1000 / 60); // 60 FPS
});

server.listen(8000, () => {
  console.log(`Servidor escuchando en el puerto 8000.`);
});

time=0
setInterval(()=>{
  time++
},1000/60)