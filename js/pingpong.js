const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

var renderer, scene, camera, light;
var plane, ball, player1, player2;
var fieldWidth=200, fieldHeight=300;
var ballDirX=0, ballDirZ=1, ballSpeed=2;
var player1DirX=0, player2DirX=0, playerSpeed=3;

var score1 = 0, score2 = 0;
document.querySelector(".scoreboard").innerHTML = score1+"-"+score2;

var difficulty = 1;

function init(){
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0xDDDDDD, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  renderer.autoClear = false;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0, 100, 270);
  scene.add(camera);

  window.addEventListener( 'resize', onWindowResize, false );

  var planeGeometry = new THREE.PlaneGeometry(fieldWidth, fieldHeight);
  var planeMaterial = new THREE.MeshPhongMaterial({color: 0x6699ff});
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  camera.lookAt(scene.position);
  plane.rotation.x = -Math.PI/2;
  plane.position.set(0, 0, 0);
  plane.receiveShadow = true;
  scene.add(plane);

  controls = new THREE.OrbitControls( camera );
  controls.enableKeys = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI*0.5;

  var ballGeometry = new THREE.SphereGeometry(5, 32, 32);
  var ballMaterial = new THREE.MeshPhongMaterial({color: 0x66ff99});
  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.castShadow = true;
  ball.receiveShadow = true;
  ball.position.set(0, 5, 0);
  scene.add(ball);

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  light = new THREE.PointLight(0xffffff, 0.7, 10000);
  light.position.set(-100, 80, 200);
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 10000;
  scene.add(light);

  var player1Geometry = new THREE.CubeGeometry(30, 10, 10);
  var player1Material = new THREE.MeshPhongMaterial({color: 0xff6600});
  player1 = new THREE.Mesh(player1Geometry, player1Material);
  player1.position.set(0, 5, 140);
  player1.castShadow = true;
  player1.receiveShadow = true;
  scene.add(player1);

  var player2Geometry = new THREE.CubeGeometry(30, 10, 10);
  var player2Material = new THREE.MeshPhongMaterial({color: 0xff6600});
  player2 = new THREE.Mesh(player2Geometry, player2Material);
  player2.position.set(0, 5, -140);
  player2.castShadow = true;
  player2.receiveShadow = true;
  scene.add(player2);

  render();
}

function render(){
  ballPhysics();
  playerPhysics();
  opponentplayerMovement();
  playerMovement();

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function ballPhysics(){
  if(ball.position.x <= -fieldWidth/2){
    ballDirX = -ballDirX;
  }
  if(ball.position.x >= fieldWidth/2){
    ballDirX = -ballDirX;
  }
  if(ball.position.z <= -fieldHeight/2){
    // player1 wins
    score1++;
    document.querySelector(".scoreboard").innerHTML = score1+"-"+score2;
    resetBall(2);
    //matchScoreCheck();
  }
  if(ball.position.z >= fieldHeight/2){
    // player2 wins
    score2++;
    document.querySelector(".scoreboard").innerHTML = score1+"-"+score2;
    resetBall(1);
    //matchScoreCheck();
  }

  ball.position.x += ballDirX*ballSpeed;
  ball.position.z += ballDirZ*ballSpeed;

  if(ballDirZ > ballSpeed * 2){
    ballDirZ = ballSpeed*2;
  }else if(ballDirZ < -ballSpeed*2){
    ballDirZ = -ballSpeed*2;
  }
}

function resetBall(loser){
  ball.position.x = 0;
  ball.position.z = 0;

  if(loser == 1){
    ballDirZ = -1;
  }else{
    ballDirZ = 1;
  }

  ballDirX = 0;
}

function opponentplayerMovement()
{
  // going to change this code using socket.io

	player2DirX = (ball.position.x - player2.position.x) * difficulty;

	if (Math.abs(player2DirX) <= playerSpeed)
	{
		player2.position.x += player2DirX;
	}
	else
	{
		if (player2DirX > playerSpeed)
		{
			player2.position.x += playerSpeed;
		}
		else if (player2DirX < -playerSpeed)
		{
			player2.position.x -= playerSpeed;
		}
	}
}

function playerPhysics(){
  if(ball.position.z >= player1.position.z-10 && ball.position.z <= player1.position.z)
	{
		if (ball.position.x >= player1.position.x - 15 && ball.position.x <= player1.position.x + 15)
		{
			if (ballDirZ > 0)
			{
				ballDirZ = -ballDirZ;
				ballDirX += player1DirX * 0.7;
			}
		}
	}

  if(ball.position.z <= player2.position.z+10 && ball.position.z >= player2.position.z+5)
	{
		if (ball.position.x >= player2.position.x - 15 && ball.position.x <= player2.position.x + 15)
		{
			if (ballDirZ < 0)
			{
        console.log("충돌");
				ballDirZ = -ballDirZ;
				ballDirX += player2DirX * 0.3;
			}
		}
	}
}

function playerMovement(){
  if(Key.isDown(Key.D)){
    if(player1.position.x+15 < fieldWidth * 0.5){
      player1DirX = playerSpeed * 0.5;
    }else{
      player1DirX = 0;
    }
  }else if(Key.isDown(Key.A)){
    if(player1.position.x-15 > -fieldWidth * 0.5){
      player1DirX = -playerSpeed * 0.5;
    }else{
      player1DirX = 0;
    }
  }else{
    player1DirX = 0;
  }

  player1.position.x += player1DirX;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.onload = init;
