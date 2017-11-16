var camera;
var scene;
var webGLRenderer;

var delta
var time;
var oldTime;

var mouseX = 0;
var mouseY = 0;

var mouseXpercent = 0;
var mouseYpercent = 0;

var mouse = new THREE.Vector2();

var cameraTarget = new THREE.Vector3(0,40,0);
var paddle;
var paddleChild;
var paddleAI;
var paddleChildAI;
var hitMesh;
var paddleTarget = new THREE.Vector3();
var paddleTargetAI = new THREE.Vector3();
var paddleBehaviour = { divider: 3, spinx: 0, spiny: 0 };
var ballBehaviour = { spinx: 0, spiny: 0 };

var ball;
var ballRadius = 0.6;
var shadow;
var shadowMaterial;
var lastHit = 0;
var initHit = 0;
var hitPosition = new THREE.Vector3();
var initX = 0;
var hitX = 0;
var hitY = 0;
var hitting = false;
var hitComplete = true;
var ballInactive = false;
var hitTimeAI = 0;
var lastTableHit = 0;

var inactiveCounter = 0;

var bound = {left:32, right:-32, top:56.3, bottom:-56.3, table:33.2+ballRadius, floor:0+ballRadius, net: 39.2, netleft: 35.2, netright: -35.2};

var vx = 0;
var vz = 0;
var vy = 0;
var gravity = 0.040;

var touchDevice = false;
//var sizeRatio = 1;

var userplayerScore=0;
var aiplayerScore=0;
var hitTable = false;

document.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
document.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); }, false );
//document.addEventListener( 'touchstart', function ( event ) { event.preventDefault(); }, false );
document.addEventListener('mousemove', onDocumentMouseMove, false);
//document.addEventListener( 'touchmove', onTouchMove, false );

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 700 );
  camera.position.set(0,50,-112);
  scene.add(camera);

  var controls = new THREE.OrbitControls( camera );
  controls.enableKeys = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI*0.5;

  window.addEventListener( 'resize', onWindowResize, false );

  // 바닥
  var floorTexture = new THREE.TextureLoader().load("img/floor.jpg");
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
  floor.renderDepth = 1;
  floor.depthTest = false;
  floor.matrixAutoUpdate = false;
  floor.updateMatrix();
  scene.add(floor);
  console.log("Made the floor");

  // 라켓이 움직일 바닥
  var hitPlane = new THREE.PlaneGeometry(100,100);
  hitMesh = new THREE.Mesh(hitPlane, new THREE.MeshBasicMaterial({color: 0xfff, transparent: true, opacity: 0.0})); //, transparent: true, opacity: 0.0
  hitMesh.rotation.x = -Math.PI/2-0.5;
  hitMesh.position.y = 36;
  hitMesh.position.z = -65;
  hitMesh.visible = true;
  scene.add(hitMesh);

  // 플레이어 라켓
  paddle = new THREE.Object3D();
  scene.add(paddle);

  // 로봇 라켓
  paddleAI = new THREE.Object3D();
  paddleAI.position.set(16,42,bound.top+15);
  scene.add(paddleAI);

  // 탁구공
  var ballGeomertry = new THREE.SphereGeometry(ballRadius,24,16);
  var material = new THREE.MeshLambertMaterial( { color: 0x666666, map: new THREE.TextureLoader().load( "img/ball2.jpg") } );
  ball = new THREE.Mesh( ballGeomertry, material );
  ball.position.set(0,50,0);

  ball.rotation.y = Math.PI/2;
  ball.castShadow = true;
  ball.receiveShadow = false;
  scene.add(ball);

  // 그림자
  var shadowPlane = new THREE.PlaneGeometry(2.2,2.2);
  shadowMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, map: new THREE.TextureLoader().load( "img/shadow.png"), transparent: true } );
  shadow = new THREE.Mesh( shadowPlane, shadowMaterial );
  shadow.depthTest = false;
  shadow.position.set(0,bound.table-ballRadius+0.05,0);
  scene.add(shadow);

  // 빛
  var ambient = new THREE.AmbientLight( 0xffffff );
  scene.add( ambient );

  var pointLight = new THREE.PointLight( 0xf0e7c8, 0.9 );
  pointLight.position.set(40,70,-130);
  scene.add( pointLight );

  var light = new THREE.SpotLight( 0xffffff, 0.8 );
  light.position.set( 10, 100, -30 );
  light.target.position.set( 0, 0, 20 );
  light.target.updateMatrixWorld();

  light.castShadow = true;

  light.shadow.camera.near = 40;
  light.shadow.camera.far = 200;
  light.shadow.camera.fov = 60;

  light.shadow.darkness = 0.85;

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
    paddleChildAI = object;
    paddleChildAI.rotation.y = -Math.PI/2;
    paddleChildAI.scale.set(0.4,0.4,0.4);
    paddleAI.add(paddleChildAI);
  }, onProgress, onError);

  loader.load( "models/pr.fbx", function(object){
    console.log("Loaded racket");
    paddleChild = object;
    paddleChild.rotation.y = -Math.PI/2;
    paddleChild.scale.set(0.4,0.4,0.4);
    paddle.add(paddleChild);
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

  webGLRenderer = new THREE.WebGLRenderer( { scene: scene, clearColor: 0xDDDDDD, clearAlpha: 1.0, antialias: true } );
  webGLRenderer.setSize( window.innerWidth, window.innerHeight );
  webGLRenderer.setClearColor(0xDDDDDD, 1);

  webGLRenderer.shadowMap.enabled = true;
  webGLRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(webGLRenderer.domElement);

  respawnBall();
  animate();
}

function respawnBall() {
  ball.position.set(0,50,0);
  vx = -0.25;
  vz = -1.35;
  vy = 0;

  ballBehaviour.spinx *= 0.5;
  paddleBehaviour.spinx *= 0.5;

  ballInactive = false;
  inactiveCounter = 0;
}

// 마우스의 위치 받아오기
function onDocumentMouseMove(event) {
  var windowHalfX = window.innerWidth >> 1;
  var windowHalfY = window.innerHeight >> 1;

  mouseX = ( event.clientX - windowHalfX );
  mouseY = ( event.clientY - windowHalfY );

  mouseXpercent = mouseX/(window.innerWidth/2);
  mouseYpercent = mouseY/(window.innerHeight/2);

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // 마우스 커서 없애기
  if (mouseYpercent <= -0.75 && document.querySelector("canvas").style.cursor != "default") {
    document.querySelector("canvas").style.cursor = "default";
  } else if (mouseYpercent > -0.75 && document.querySelector("canvas").style.cursor != "none") {
    document.querySelector("canvas").style.cursor = "none";
  }
}

function animate() {
  loop();
  requestAnimationFrame( animate );
}

function loop() {
  time = new Date().getTime();
  delta = time - oldTime;
  oldTime = time;

  if (isNaN(delta) || delta > 1000 || delta == 0 ) {
		delta = 1000/60;
	}

  if (ballInactive) {
    ++inactiveCounter;
    if (inactiveCounter >= 75) {
      if(ball.position.z > 0 && hitTable === true){
        userplayerScore++;
        document.getElementById("userplayer").textContent = userplayerScore;
      }else if(ball.position.z < 0 && hitTable === true){
        aiplayerScore++;
        document.getElementById("aiplayer").textContent = aiplayerScore;
      }else if(ball.position.z > 0 && hitTable === false){
        aiplayerScore++;
        document.getElementById("aiplayer").textContent = aiplayerScore;
      }else if(ball.position.z < 0 && hitTable === false){
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
        // 서버로 sendHealthData를 주고 서버에서 Health 데이터에 값 추가하기
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

      respawnBall();
    }
  }

  // 공과 라켓의 충돌
  var normal = new THREE.Vector3();

  normal.subVectors( ball.position, paddle.position );
  var distance = normal.lengthSq();
  var dify = Math.abs(ball.position.y - paddle.position.y);

  if ((distance < 15 || time > initHit+200) && hitting) {

    paddleBehaviour.spinx = ((mouseX - hitX)*-1)/200;
    paddleBehaviour.spiny = ((mouseY - hitY)*-1)/200;


    if (paddleBehaviour.spinx > 2) paddleBehaviour.spinx = 2;
    if (paddleBehaviour.spinx < -2) paddleBehaviour.spinx = -2;

    if (paddleBehaviour.spiny > 1.5) paddleBehaviour.spiny = 1.5;
    if (paddleBehaviour.spiny < -1.5) paddleBehaviour.spiny = -1.5;

    ballBehaviour.spinx = paddleBehaviour.spinx;

    vz = 2.2 + ( Math.abs(paddleBehaviour.spiny+paddleBehaviour.spinx)/4 ) + Math.abs(ball.position.z)/500;
    vy = Math.max(0.3, 0.9-(ball.position.y/100) );
    vx = ( (-ball.position.x-initX)/50 ) - paddleBehaviour.spinx/300;

    hitting = false;
    hitComplete = false;

    hitPosition.copy(ball.position);
    hitPosition.z += 10;
    hitPosition.x += paddleBehaviour.spinx*30;
    hitPosition.y += paddleBehaviour.spiny*20;
    hitPosition.y += 3;

    lastHit = time;

    //var rnd = Math.floor( Math.random()*6 );
    //Sound.playStaticSound(Sound["paddle"+rnd],0.6+Math.random()*0.4);
  }

  if (distance < 150 && dify < 6 && paddle.position.z < ball.position.z && time > lastHit+500 && !hitting) {

    hitting = true;
    hitTable = false;

    initX = paddle.position.x;
    hitX = mouseX;
    hitY = mouseY;

    initHit = time;
  }


  // find intersections
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  var intersect = raycaster.intersectObject( hitMesh );
  //console.log(intersect);

  if ( intersect.length > 0 && !hitting) {
      paddleTarget = intersect[0].point;

      if (paddleTarget.y > 48) {
        paddleTarget.y = 48;
      }
  }

  if (hitting) {
    paddleTarget = ball.position;
  }

  if (!hitComplete) {
    if (ball.position.z < paddle.position.z+(ballRadius*6)) {
      ball.position.z = paddle.position.z+(ballRadius*6)
    }
    paddleTarget = hitPosition;
  }

  if (time > lastHit+150 && !hitComplete) {
    hitComplete = true;
    paddleBehaviour.divider = 30;
    var divideTween = new TWEEN.Tween(paddleBehaviour)
      .to({divider: 3}, 300)
      .easing(TWEEN.Easing.Quadratic.EaseOut);
    divideTween.start();
  }

  if (paddleChild) {
    paddle.position.x += (paddleTarget.x - paddle.position.x)/paddleBehaviour.divider;
    paddle.position.y += (paddleTarget.y - paddle.position.y)/paddleBehaviour.divider;
    paddle.position.z += (paddleTarget.z - paddle.position.z)/paddleBehaviour.divider;

    // if (paddle.position.x < 0) {
    // 	paddleChild.rotation.z = -paddle.position.x/15;
    // } else {
    // 	paddleChild.rotation.z = paddle.position.x/15;
    // }

    var amount = 1;
    if (distance < 2000) {
      amount = distance/2000;
    }

    //paddleChild.rotation.x = ( -paddle.position.x/30 )*amount;
    paddle.rotation.y = ( Math.PI/2+paddle.position.x/3 );

    if (paddle.rotation.y < 0) {
      paddle.rotation.y = 0;
    }
    if (paddle.rotation.y > Math.PI) {
      paddle.rotation.y = Math.PI;
    }

    if (paddle.rotation.y > 0 && paddle.rotation.y < Math.PI && hitting) {
      if (paddle.position.x < 0) {
        paddle.rotation.y = ( Math.PI/2+paddle.position.x/3 )*amount;
      } else {
        paddle.rotation.y = ( Math.PI/2-paddle.position.x/3 )*amount;
      }

    }

    hitMesh.position.z += (-60 - (mouseYpercent*50) - hitMesh.position.z)/2;

    if (hitMesh.position.z < -80) {
      hitMesh.position.z = -80;
    }
    if (hitMesh.position.z > -40) {
      hitMesh.position.z = -40;
    }

  }

  // camera
  // camera.position.y += (55+-mouseYpercent*10 - camera.position.y)/10;
  // camera.position.x += (-mouseXpercent*25 - camera.position.x)/10;

  // ball
  vy -= gravity;

  // spin
  if (paddleBehaviour.spinx > 0) {
    var rm = paddleBehaviour.spinx/15;
    ballBehaviour.spinx -= rm;
    if (ballBehaviour.spinx < -paddleBehaviour.spinx) {
      ballBehaviour.spinx = -paddleBehaviour.spinx;
    }
  } else {
    var rm = paddleBehaviour.spinx/15;
    ballBehaviour.spinx -= rm;
    if (ballBehaviour.spinx > Math.abs(paddleBehaviour.spinx)) {
      ballBehaviour.spinx = Math.abs(paddleBehaviour.spinx);
    }
  }

  ball.position.x += vx+ballBehaviour.spinx;
  ball.position.y += vy;
  ball.position.z += vz;

  // temp opponent hit
  if (ball.position.z > bound.top+12 && ball.position.x < bound.left+20 && ball.position.x > bound.right-20 && ball.position.y > bound.table+2) {
    //ball.position.z = bound.top;
    ballBehaviour.spinx *= 0.5;
    paddleBehaviour.spinx *= 0.5;

    hitTable=false;

    vz = -(2.3+Math.random()*0.3);
    vy = 0.35+Math.random()*0.2;
    vx = ( -ball.position.x/80 + Math.random()*0.7-0.35 ) - ballBehaviour.spinx*Math.random();
    hitTimeAI = time;
    paddleTargetAI.copy(ball.position);
    paddleTargetAI.z -= 20+Math.random()*20;
    paddleTargetAI.y += 4+Math.random()*4;

    if (ball.position.x < 0) {
      paddleTargetAI.x -= 4+Math.random()*4;
    } else {
      paddleTargetAI.x += 4+Math.random()*4;
    }

    // var rnd = Math.floor( Math.random()*6 );
    // Sound.playStaticSound(Sound["paddle"+rnd],0.2+Math.random()*0.3);

  }

  // hit on table
  if (ball.position.y <= bound.table && ball.position.x <= bound.left+ballRadius && ball.position.x >= bound.right-ballRadius && ball.position.z >= bound.bottom-ballRadius && ball.position.z <= bound.top+ballRadius) {

    var overlap = 0;
    var timeDif = time - lastTableHit;
    var startFriction = 0.98;
    if (timeDif < 800) startFriction = timeDif/800;
    var friction = Math.max(startFriction, 0.75);

    lastTableHit = time;
    hitTable=true;

    // check for edge balls
    if (Math.abs(vy) > 0.25) {
      // left
      if (ball.position.x > bound.left && ball.position.x <= bound.left+ballRadius) {
        overlap = Math.abs(ball.position.x - bound.left)/ballRadius;
        //console.log("left edge ball", overlap);
        vx += overlap;
      }
      // right
      if (ball.position.x < bound.right && ball.position.x >= bound.right-ballRadius) {
        overlap = Math.abs(ball.position.x - bound.right)/ballRadius;
        //console.log("right edge ball", overlap);
        vx -= overlap;
      }

      // top
      if (ball.position.z > bound.top && ball.position.z <= bound.top+ballRadius) {
        overlap = Math.abs(ball.position.z - bound.top)/ballRadius;
        //console.log("top edge ball", overlap);
        vz += overlap;
      }

      // bottom
      if (ball.position.z < bound.bottom && ball.position.z >= bound.bottom-ballRadius) {
        overlap = Math.abs(ball.position.z - bound.bottom)/ballRadius;
        //console.log("bottom edge ball", overlap);
        vz -= overlap;
      }
    }

    ball.position.y = bound.table;
    vy *= -friction+overlap;
    vx *= Math.max(startFriction,0.5);
    vz *= Math.max(startFriction,0.5);

    ballBehaviour.spinx *= Math.max(startFriction,0.7);
    paddleBehaviour.spinx *= Math.max(startFriction,0.7);

    if (Math.abs(vy) < 0.025) {
      ballInactive = true;
    }

    // if (Math.abs(vy) > 0.025) {
    // 	var rnd = Math.floor( Math.random()*6 );
    // 	var volume = (1*Math.max(startFriction,0.4))-(ball.position.z-bound.bottom)/(bound.top*3);
    // 	Sound.playStaticSound(Sound["table"+rnd],volume + Math.random()*0.2);
    // }
  }

  // hit net
  if (ball.position.z > -(ballRadius+Math.abs(vz)) && ball.position.z < (ballRadius+Math.abs(vz))) {
    if (ball.position.y < bound.net+ballRadius && ball.position.x < bound.netleft+ballRadius && ball.position.x > bound.netright-ballRadius) {
      var overlap = 0;
      if (ball.position.y > bound.net) {
        overlap = Math.abs(ball.position.y - bound.net)/ballRadius;
      }

      if (overlap == 0) {
        if (vz > 0) ball.position.z = -ballRadius;
        if (vz < 0) ball.position.z = ballRadius;

        vz *= -0.1;
        vy *= 0.25;
        vx *= 0.25;
        ballBehaviour.spinx *= 0.25;
        paddleBehaviour.spinx *= 0.25;

      } else {
        //console.log("net roller", overlap);
        vz *= 0.8-(overlap*0.5);
        vy += 1-overlap;
        vx *= 0.8-(overlap*0.5);
        ballBehaviour.spinx *= 0.8-(overlap*0.5);
        paddleBehaviour.spinx *= 0.8-(overlap*0.5);
      }
    }
  }

  // hit on floor
  if (ball.position.y < bound.floor) {
    ball.position.y = bound.floor;
    vy *= -0.7;
    vx *= 0.6;
    vz *= 0.6;
    ballInactive = true;
    // if (Math.abs(vy) > 0.025) {
    // 	var rnd = Math.floor( Math.random()*2 );
    // 	var volume = Math.max(1-(distance/80000), 0.1)*0.3;
    //
    // 	Sound.playStaticSound(Sound["floor"+rnd],volume + Math.random()*0.1);
    // }
  }

  ball.rotation.x += vx/5;
  ball.rotation.y += vy/5;
  ball.rotation.z += vz/5;

  var size = (ball.position.y - 34)/20;

  // ball shadow
  shadow.position.x = ball.position.x-(5*size);
  shadow.position.z = ball.position.z-(5*size);

  shadowMaterial.opacity = 0.5-(size/2);

  shadow.scale.set(1+size,1+size,1+size)

  shadowMaterial.visible = true;

  if (shadow.position.z < bound.bottom) {
    shadowMaterial.visible = false;
  }
  if (shadow.position.z > bound.top) {
    shadowMaterial.visible = false;
  }
  if (shadow.position.x < bound.right) {
    shadowMaterial.visible = false;
  }
  if (shadow.position.x > bound.left) {
    shadowMaterial.visible = false;
  }
  if (ball.position.y < bound.table) {
    shadowMaterial.visible = false;
  }

  // AI paddle
  if (paddleChildAI) {
    var divider = 6;
    if (time > hitTimeAI+500) {
      if (ball.position.z >= 0 && !ballInactive) {
        paddleTargetAI.copy(ball.position);
        divider = 3;
      } else {
        paddleTargetAI.x = ball.position.x/2;
        if (ballInactive) paddleTargetAI.x = 6 + Math.sin(time/1000)*5;
        paddleTargetAI.y = 40 - Math.cos(time/1000)*2;
        divider = 15;
      }
      paddleTargetAI.z = bound.top+15;
    }


    if (paddleTargetAI.y < bound.table+5) {
      paddleTargetAI.y = bound.table+5;
    }

    paddleAI.position.x += (paddleTargetAI.x - paddleAI.position.x)/divider;
    paddleAI.position.y += (paddleTargetAI.y - paddleAI.position.y)/divider;
    paddleAI.position.z += (paddleTargetAI.z - paddleAI.position.z)/divider;


    if (time < hitTimeAI+500) {
      if (ball.position.z > paddleAI.position.z-ballRadius) {
        ball.position.z = paddleAI.position.z-ballRadius;
      }
    }

    // if (paddleAI.position.x < 0) {
    // 	paddleChildAI.rotation.z = -paddleAI.position.x/15;
    // } else {
    // 	paddleChildAI.rotation.z = paddleAI.position.x/15;
    // }

    //paddleChildAI.rotation.x = ( -paddleAI.position.x/30 )//*amount;
    paddleAI.rotation.y = ( Math.PI/2+paddleAI.position.x/3 );

    if (paddleAI.rotation.y < 0) {
      paddleAI.rotation.y = 0;
    }
    if (paddleAI.rotation.y > Math.PI) {
      paddleAI.rotation.y = Math.PI;
    }

  }

  camera.lookAt(cameraTarget);

  TWEEN.update();

  webGLRenderer.render( scene, camera );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  webGLRenderer.setSize( window.innerWidth, window.innerHeight );
}
