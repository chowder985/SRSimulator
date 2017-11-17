var camera;
var scene;
var webGLRenderer;
var d;
var t;
var ot;
var mousx = 0;
var mousy = 0;
var mousxPer = 0;
var mousyPer = 0;
var mouse = new THREE.Vector2();
var camTarg = new THREE.Vector3(0,40,0);
var player;
var playerChild;
var playerRobot;
var playerRobotChild;

var hitMes;
var playerTarg = new THREE.Vector3();
var playerTargRobot = new THREE.Vector3();
var playerBeh = { div: 3, spinX: 0, spinY: 0 };
var ballBeh = { spinX: 0, spinY: 0 };
var lastHit = 0;
var initHit = 0;
var ball;
var ballRad = 0.6;
var shadow;
var shadowMat;
var hitPos = new THREE.Vector3();
var initX = 0;
var hit = {x:0, y:0};
var hitting = false;
var hitComp = true;
var ballInactive = false;
var hitTimeRobot = 0;
var lastTableHit = 0;
var inactiveCnt = 0;
var bound = {left:32, right:-32, top:56.3, bottom:-56.3, table:33.2+ballRad, floor:0+ballRad, net: 39.2, netleft: 35.2, netright: -35.2};

var speed = {
  vx: 0,
  vz: 0,
  vy: 0
};
var gravity = 0.04;

var userplayerScore=0;
var aiplayerScore=0;
var hitTable = false;

document.addEventListener('contextmenu', function ( e ) { e.preventDefault(); }, false );
document.addEventListener('mousedown', function ( e ) { e.preventDefault(); }, false );
document.addEventListener('mousemove', onMouseMove, false);

init();

function init() {
  webGLRenderer = new THREE.WebGLRenderer( { antialias: true } );
  webGLRenderer.setSize( window.innerWidth, window.innerHeight );
  webGLRenderer.setClearColor(0xDDDDDD, 1);

  webGLRenderer.shadowMap.enabled = true;
  webGLRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(webGLRenderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 700 );
  camera.position.set(0,50,-112);
  scene.add(camera);

  window.addEventListener( 'resize', onWindowResize, false );

  // 바닥
  var floorTexture = new THREE.TextureLoader().load("wildtextures-clean-plywood-plate.jpg");
  var floorGeometry = new THREE.PlaneGeometry(400,1000);
  var floorMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: floorTexture } );
  floorMaterial.map.offset.set(0, 0);
  floorMaterial.map.repeat.set(4, 12);
  floorMaterial.map.wrapS = THREE.RepeatWrapping;
  floorMaterial.map.wrapT = THREE.RepeatWrapping;
  var floor = new THREE.Mesh( floorGeometry, floorMaterial );
  floor.rotation.x = -Math.PI/2;
  floor.castShadow = true;
  floor.receiveShadow = true;
  scene.add(floor);
  console.log("Made the floor");

  // 라켓이 움직일 바닥
  var hitPlane = new THREE.PlaneGeometry(100,100);
  hitMes = new THREE.Mesh(hitPlane, new THREE.MeshBasicMaterial({color: 0xfff, transparent: true, opacity: 0.0})); //, transparent: true, opacity: 0.0
  hitMes.rotation.x = -Math.PI/2-0.5;
  hitMes.position.y = 36;
  hitMes.position.z = -65;
  scene.add(hitMes);

  // 플레이어 라켓
  player = new THREE.Object3D();
  scene.add(player);

  // 로봇 라켓
  playerRobot = new THREE.Object3D();
  playerRobot.position.set(16,42,bound.top+15);
  scene.add(playerRobot);

  // 탁구공
  var ballGeomertry = new THREE.SphereGeometry(ballRad,24,16);
  var ballMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
  ball = new THREE.Mesh( ballGeomertry, ballMaterial );
  ball.position.set(0,50,0);
  ball.castShadow = true;
  ball.receiveShadow = false;
  scene.add(ball);

  // 빛
  var ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
  scene.add( ambientLight );

  var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
  pointLight.position.set(40,70,-130);
  scene.add( pointLight );

  var light = new THREE.SpotLight( 0xffffff, 0.5 );
  light.position.set( 10, 100, -30 );
  light.target.position.set( 0, 0, 20 );
  light.target.updateMatrixWorld();
  light.castShadow = true;
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 300;
  light.shadow.camera.fov = 60;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  scene.add( light );

  // 모델 임포트
  var loadManager = new THREE.LoadingManager();
  loadManager.onProgress = function( item, loaded, total ) {
    console.log( item, loaded, total );
  };
  var onProgress = function( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
    }
  };
  var onError = function( xhr ) {
    console.error( xhr );
  };

  var loader = new THREE.FBXLoader(loadManager);
  loader.load( "models/pr.fbx", function(object){
    console.log("Loaded racketAI");
    playerRobotChild = object;
    playerRobotChild.rotation.y = -Math.PI/2;
    playerRobotChild.scale.set(0.4,0.4,0.4);
    playerRobot.add(playerRobotChild);
  }, onProgress, onError);

  loader.load( "models/pr.fbx", function(object){
    console.log("Loaded racket");
    playerChild = object;
    playerChild.rotation.y = -Math.PI/2;
    playerChild.scale.set(0.4,0.4,0.4);
    player.add(playerChild);
  }, onProgress, onError);

  loader.load( "models/pingpongtable.fbx", function(object){
    console.log("table loaded");
    var netPlane = new THREE.PlaneGeometry(60,5);
    var material = new THREE.MeshBasicMaterial( {opacity:0.5, transparent: true, color: 0x222222, map: new THREE.TextureLoader().load( "img/net.png")} );
    material.map.repeat.x = 28;
    material.map.repeat.y = 2;
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;

    var net = new THREE.Mesh(netPlane, material);
    net.position.y = 36.3;
    net.rotation.x = -Math.PI;
    net.matrixAutoUpdate = false;
    net.updateMatrix();
    scene.add(net);

    var table = object;
    table.scale.set(0.4,0.4,0.4);
    table.rotation.y = -Math.PI/2;
    table.position.y = 20;
    table.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
        child.matrixAutoUpdate = false;
        child.updateMatrix();
      }
    });
    scene.add(table);
  }, onProgress, onError);

  makeBall();
  animate();
}

function makeBall() {
  ball.position.set(0,50,0);
  speed.vx = -0.20;
  speed.vz = -1.30;
  speed.vy = 0;
  ballBeh.spinX *= 0.5;
  playerBeh.spinX *= 0.5;
  ballInactive = false;
  inactiveCnt = 0;
}

// 마우스의 위치 받아오기
function onMouseMove(e) {
  var windowHalfX = window.innerWidth >> 1;
  var windowHalfY = window.innerHeight >> 1;
  mousx = (e.clientX - windowHalfX);
  mousy = (e.clientY - windowHalfY);
  mousxPer = mousx/(window.innerWidth/2);
  mousyPer = mousy/(window.innerHeight/2);
  mouse.x = (e.clientX / window.innerWidth)*2-1;
  mouse.y = -(e.clientY / window.innerHeight)*2+1;

  // 마우스 커서 없애기
  if (mousyPer <= -0.75 && document.querySelector("canvas").style.cursor != "default") {
    document.querySelector("canvas").style.cursor = "default";
  } else if (mousyPer > -0.75 && document.querySelector("canvas").style.cursor != "none") {
    document.querySelector("canvas").style.cursor = "none";
  }
}

function animate() {
  render();
  requestAnimationFrame( animate );
}

function render() {
  // 시간
  t = new Date().getTime();
  d = t - ot;
  ot = t;

  // 시간 계산
  if (isNaN(d) || d > 1000 || d == 0 ) {
		d = 1000/60;
	}

  // 공의 움직임이 없어짐, 게임이 끝나게된다.
  if (ballInactive) {
    ++inactiveCnt;
    if (inactiveCnt >= 75) {
      if(ball.position.z>0 && hitTable===true){
        userplayerScore++;
        document.getElementById("userplayer").textContent = userplayerScore;
      }else if(ball.position.z<0 && hitTable===true){
        aiplayerScore++;
        document.getElementById("aiplayer").textContent = aiplayerScore;
      }else if(ball.position.z>0 && hitTable===false){
        aiplayerScore++;
        document.getElementById("aiplayer").textContent = aiplayerScore;
      }else if(ball.position.z<0 && hitTable===false){
        userplayerScore++;
        document.getElementById("userplayer").textContent = userplayerScore;
      }

      if(userplayerScore === 7){
        $("#message").css({"display": ""});
        document.getElementById("message").textContent = "You Win!"
        var difScore = userplayerScore - aiplayerScore;
        var sendHealthData=0;
        if(difScore >= 6){
          sendHealthData+=16;
        }else if(difScore >= 3){
          sendHealthData+=8;
        }else{
          sendHealthData+=5;
        }
        localStorage.setItem("healthData", sendHealthData);

        window.location.href = "home.html";
      }
      else if(aiplayerScore === 7){
        $("#message").css({"display": ""});
        document.getElementById("message").textContent = "You Lose"
        var sendHealthData=-16;
        // 서버로 sendHealthData를 주고 서버에서 Health 데이터에 값 추가하기
        localStorage.setItem("healthData", sendHealthData);

        window.location.href = "home.html";
      }

      makeBall();
    }
  }

  // 공과 라켓의 충돌
  var temp = new THREE.Vector3();
  temp.subVectors(ball.position, player.position);
  var distance = temp.lengthSq();
  var diffY = Math.abs(ball.position.y - player.position.y);
  if ((distance < 15 || t > initHit+200) && hitting) {
    playerBeh.spinX = ((mousx - hit.x)*-1)/200;
    playerBeh.spinY = ((mousy - hit.y)*-1)/200;
    if (playerBeh.spinX > 2)
      playerBeh.spinX = 2;
    if (playerBeh.spinX < -2)
      playerBeh.spinX = -2;
    if (playerBeh.spinY > 1.5)
      playerBeh.spinY = 1.5;
    if (playerBeh.spinY < -1.5)
      playerBeh.spinY = -1.5;
    ballBeh.spinX = playerBeh.spinX;
    speed.vz = 2.2 + (Math.abs(playerBeh.spinY+playerBeh.spinX)/4) + Math.abs(ball.position.z)/500;
    speed.vy = Math.max(0.3, 0.9-(ball.position.y/100));
    speed.vx = ((-ball.position.x-initX)/50) - playerBeh.spinX/300;
    hitting = false;
    hitComp = false;

    hitPos.copy(ball.position);
    hitPos.z += 10;
    hitPos.x += playerBeh.spinX*30;
    hitPos.y += playerBeh.spinY*20;
    hitPos.y += 3;
    lastHit = t;
    //var rnd = Math.floor( Math.random()*6 );
    //Sound.playStaticSound(Sound["player"+rnd],0.6+Math.random()*0.4);
  }

  if (distance<150 && diffY<6 && player.position.z<ball.position.z && t>lastHit+500 && !hitting) {
    hitting = true;
    hitTable = false;
    initX = player.position.x;
    hit.x = mousx;
    hit.y = mousy;
    initHit = t;
  }

  // 마우스로부터 광선을 쏴서 위치 값 구하기
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  var intersect = raycaster.intersectObject( hitMes );
  if ( intersect.length > 0 && !hitting) {
      playerTarg = intersect[0].point;
      if (playerTarg.y > 48) {
        playerTarg.y = 48;
      }
  }

  if (hitting) {
    playerTarg = ball.position;
  }

  if (!hitComp) {
    if (ball.position.z < player.position.z+(ballRad*6)) {
      ball.position.z = player.position.z+(ballRad*6)
    }
    playerTarg = hitPos;
  }

  if (t > lastHit+150 && !hitComp) {
    hitComp = true;
    playerBeh.div = 30;
    var divTween = new TWEEN.Tween(playerBeh)
      .to({div: 4}, 300)
      .easing(TWEEN.Easing.Quadratic.EaseOut);
    divTween.start();
  }

  if (playerChild) {
    player.position.x += (playerTarg.x - player.position.x)/playerBeh.div;
    player.position.y += (playerTarg.y - player.position.y)/playerBeh.div;
    player.position.z += (playerTarg.z - player.position.z)/playerBeh.div;
    var amount = 1;
    if (distance < 2000) {
      amount = distance/2000;
    }
    player.rotation.y = (Math.PI/2+player.position.x/3);
    if (player.rotation.y < 0) {
      player.rotation.y = 0;
    }
    if (player.rotation.y > Math.PI) {
      player.rotation.y = Math.PI;
    }
    if (player.rotation.y > 0 && player.rotation.y < Math.PI && hitting) {
      if (player.position.x < 0) {
        player.rotation.y = ( Math.PI/2+player.position.x/3 )*amount;
      } else {
        player.rotation.y = ( Math.PI/2-player.position.x/3 )*amount;
      }
    }
    hitMes.position.z += (-60 - (mousyPer*50) - hitMes.position.z)/2;
    if (hitMes.position.z < -80) {
      hitMes.position.z = -80;
    }
    if (hitMes.position.z > -40) {
      hitMes.position.z = -40;
    }
  }
  // 공 중력 작용
  speed.vy -= gravity;
  // 스핀
  if (playerBeh.spinX > 0) {
    var rm = playerBeh.spinX/15;
    ballBeh.spinX -= rm;
    if (ballBeh.spinX < -playerBeh.spinX) {
      ballBeh.spinX = -playerBeh.spinX;
    }
  } else {
    var rm = playerBeh.spinX/15;
    ballBeh.spinX -= rm;
    if (ballBeh.spinX > Math.abs(playerBeh.spinX)) {
      ballBeh.spinX = Math.abs(playerBeh.spinX);
    }
  }

  ball.position.x += speed.vx+ballBeh.spinX;
  ball.position.y += speed.vy;
  ball.position.z += speed.vz;

  // 로봇이 공을 칠때
  if (ball.position.z > bound.top+12 && ball.position.x < bound.left+20 && ball.position.x > bound.right-20 && ball.position.y > bound.table+2) {
    ballBeh.spinX *= 0.5;
    playerBeh.spinX *= 0.5;
    hitTable=false;
    speed.vz = -(2.3+Math.random()*0.3);
    speed.vy = 0.35+Math.random()*0.2;
    speed.vx = ( -ball.position.x/80 + Math.random()*0.7-0.35 ) - ballBeh.spinX*Math.random();
    hitTimeRobot = t;
    playerTargRobot.copy(ball.position);
    playerTargRobot.z -= 20+Math.random()*20;
    playerTargRobot.y += 4+Math.random()*4;
    if (ball.position.x < 0) {
      playerTargRobot.x -= 4+Math.random()*4;
    } else {
      playerTargRobot.x += 4+Math.random()*4;
    }
    // var rnd = Math.floor( Math.random()*6 );
    // Sound.playStaticSound(Sound["player"+rnd],0.2+Math.random()*0.3);
  }

  // 탁구대와 충돌할 떄
  if (ball.position.y <= bound.table && ball.position.x <= bound.left+ballRad && ball.position.x >= bound.right-ballRad && ball.position.z >= bound.bottom-ballRad && ball.position.z <= bound.top+ballRad) {
    var overlap = 0;
    var timeDiff = t - lastTableHit;
    var startFriction = 0.98;
    if (timeDiff < 800) startFriction = timeDiff/800;
    var friction = Math.max(startFriction, 0.75);
    lastTableHit = t;
    hitTable=true;
    // 에지 볼 체크
    if (Math.abs(speed.vy) > 0.25) {
      // 왼쪽
      if (ball.position.x > bound.left && ball.position.x <= bound.left+ballRad) {
        overlap = Math.abs(ball.position.x - bound.left)/ballRad;
        speed.vx += overlap;
      }
      // 오른쪽
      if (ball.position.x < bound.right && ball.position.x >= bound.right-ballRad) {
        overlap = Math.abs(ball.position.x - bound.right)/ballRad;
        speed.vx -= overlap;
      }

      // 위
      if (ball.position.z > bound.top && ball.position.z <= bound.top+ballRad) {
        overlap = Math.abs(ball.position.z - bound.top)/ballRad;
        speed.vz += overlap;
      }

      // 아래
      if (ball.position.z < bound.bottom && ball.position.z >= bound.bottom-ballRad) {
        overlap = Math.abs(ball.position.z - bound.bottom)/ballRad;
        speed.vz -= overlap;
      }
    }
    ball.position.y = bound.table;
    speed.vy *= -friction+overlap;
    speed.vx *= Math.max(startFriction,0.5);
    speed.vz *= Math.max(startFriction,0.5);
    ballBeh.spinX *= Math.max(startFriction,0.7);
    playerBeh.spinX *= Math.max(startFriction,0.7);
    if (Math.abs(speed.vy) < 0.025) {
      ballInactive = true;
    }
    // if (Math.abs(vy) > 0.025) {
    // 	var rnd = Math.floor( Math.random()*6 );
    // 	var volume = (1*Math.max(startFriction,0.4))-(ball.position.z-bound.bottom)/(bound.top*3);
    // 	Sound.playStaticSound(Sound["table"+rnd],volume + Math.random()*0.2);
    // }
  }

  // 네트와 충돌
  if (ball.position.z > -(ballRad+Math.abs(speed.vz)) && ball.position.z < (ballRad+Math.abs(speed.vz))) {
    if (ball.position.y < bound.net+ballRad && ball.position.x < bound.netleft+ballRad && ball.position.x > bound.netright-ballRad) {
      var overlap = 0;
      if (ball.position.y > bound.net) {
        overlap = Math.abs(ball.position.y - bound.net)/ballRad;
      }
      if (overlap == 0) {
        if (speed.vz > 0) ball.position.z = -ballRad;
        if (speed.vz < 0) ball.position.z = ballRad;
        speed.vz *= -0.1;
        speed.vy *= 0.25;
        speed.vx *= 0.25;
        ballBeh.spinX *= 0.25;
        playerBeh.spinX *= 0.25;
      } else {
        speed.vz *= 0.8-(overlap*0.5);
        speed.vy += 1-overlap;
        speed.vx *= 0.8-(overlap*0.5);
        ballBeh.spinX *= 0.8-(overlap*0.5);
        playerBeh.spinX *= 0.8-(overlap*0.5);
      }
    }
  }

  // 바닥과 충돌
  if (ball.position.y < bound.floor) {
    ball.position.y = bound.floor;
    speed.vy *= -0.7;
    speed.vx *= 0.6;
    speed.vz *= 0.6;
    ballInactive = true;
    // if (Math.abs(vy) > 0.025) {
    // 	var rnd = Math.floor( Math.random()*2 );
    // 	var volume = Math.max(1-(distance/80000), 0.1)*0.3;
    //
    // 	Sound.playStaticSound(Sound["floor"+rnd],volume + Math.random()*0.1);
    // }
  }
  ball.rotation.x += speed.vx/5;
  ball.rotation.y += speed.vy/5;
  ball.rotation.z += speed.vz/5;
  var size = (ball.position.y - 34)/20;

  // 로봇 플레이어
  if (playerRobotChild) {
    var div = 6;
    if (t > hitTimeRobot+500) {
      if (ball.position.z >= 0 && !ballInactive) {
        playerTargRobot.copy(ball.position);
        div = 3;
      } else {
        playerTargRobot.x = ball.position.x/2;
        if (ballInactive) playerTargRobot.x = 6 + Math.sin(t/1000)*5;
        playerTargRobot.y = 40 - Math.cos(t/1000)*2;
        div = 15;
      }
      playerTargRobot.z = bound.top+15;
    }
    if (playerTargRobot.y < bound.table+5) {
      playerTargRobot.y = bound.table+5;
    }
    playerRobot.position.x += (playerTargRobot.x - playerRobot.position.x)/div;
    playerRobot.position.y += (playerTargRobot.y - playerRobot.position.y)/div;
    playerRobot.position.z += (playerTargRobot.z - playerRobot.position.z)/div;

    if (t < hitTimeRobot+500) {
      if (ball.position.z > playerRobot.position.z-ballRad) {
        ball.position.z = playerRobot.position.z-ballRad;
      }
    }
    playerRobot.rotation.y = ( Math.PI/2+playerRobot.position.x/3 );
    if (playerRobot.rotation.y < 0) {
      playerRobot.rotation.y = 0;
    }
    if (playerRobot.rotation.y > Math.PI) {
      playerRobot.rotation.y = Math.PI;
    }
  }
  camera.lookAt(camTarg);
  TWEEN.update();
  webGLRenderer.render( scene, camera );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  webGLRenderer.setSize( window.innerWidth, window.innerHeight );
}
