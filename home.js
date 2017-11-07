const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
var clock = new THREE.Clock();
var mixers = [];

var camRaycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0, 0);
var clickedPos = new THREE.Vector3(0, 0, 0);

var notebookPos = new THREE.Vector3(50, 4, -50);
var playerPos = new THREE.Vector3(0, 4, 0);
var firstVisit = true;
var codingStarted = false;

var renderer, scene, camera, light, controls;
var plane, wall, notebook, player, chair;
var loadManager;

var speed = 0.5;
var disX, disZ;
var angle;

var collidableMeshList = [];
// var collided = false;

var stats = initStats();

// coding Game Variables
var fakeData = [
  "printf('Hello World!');",
  "System.out.println('Hello World!');",
  "for(var i=0; i<10; i++){"
];
var countDown=2;
var elapse;
var i=0;
var numOfP=0;

// var disX=null, disZ=null;

document.addEventListener('contextmenu', onMouseClick, false);

function init(){

  // 렌더러 구현
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0xDDDDDD, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  renderer.autoClear = false;

  // 씬 구현
  scene = new THREE.Scene();

  // 카메라 구현
  camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0, 55, 105);
  camera.rotation.x = -Math.PI/6;
  scene.add(camera);

  // 카메라 조절
  controls = new THREE.OrbitControls( camera );
  controls.enableKeys = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI*0.5;

  // 화면 반응형
  window.addEventListener( 'resize', onWindowResize, false );

  // 바닥 구현
  var planeGeometry = new THREE.PlaneGeometry(10000, 10000);
  var planeMaterial = new THREE.MeshPhongMaterial({color: 0x2194ce, side: THREE.DoubleSide});
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI/2;
  plane.position.set(0, -1, 0);
  plane.receiveShadow = true;
  //camera.lookAt(plane.position);
  scene.add(plane);

  // 빛 구현
  // light = new THREE.SpotLight(0xffffff);
  // light.position.set(0, 100, 200);
  // light.castShadow = true;
  //
  // light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 70, 1, 0.1, 10000 ) );
  // light.shadow.bias = 0.0001;
  //
  // light.shadow.mapSize.width = 2048;
  // light.shadow.mapSize.height = 2048;
  //
  // light.shadow.camera.visible = true;
  //
  // scene.add(light);

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  light = new THREE.PointLight(0xffffff, 0.7, 10000);
  light.position.set(-50, 70, 70);
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 10000;
  scene.add(light);

  // 플레이어 구현
  var playerGeometry = new THREE.SphereGeometry(5, 32, 32);
  var playerMaterial = new THREE.MeshPhongMaterial({color: 0x00ffff});
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.y=4;
  player.position.x=0;
  player.position.z=0;
  player.castShadow = true;
  player.receiveShadow = true;
  scene.add(player);

  player.add(camera);

  var notebookGeo = new THREE.BoxGeometry(10, 10, 10);
  var notebookMat = new THREE.MeshPhongMaterial({color: 0x00ffff});
  notebook = new Physijs.BoxMesh(notebookGeo, notebookMat);
  collidableMeshList.push(notebook);
  notebook.position.set(50, 4, -50);
  notebook.castShadow = true;
  notebook.receiveShadow = true;
  scene.add(notebook);

  loadManager = new THREE.LoadingManager();
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

  // jsonLoader = new THREE.JSONLoader(loadManager);
  // jsonLoader.load('models/labtop.js', function(geometry, materials){
  //   //var material = materials[0];
  //   var object = new THREE.Mesh(geometry, materials);
  //   //object.castShadow = true;
  //
  //   scene.add(object);
  // }, onProgress, onError);

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath("models/");
  mtlLoader.load("chair.mtl", function(materials){
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath("models/");
    objLoader.load("chair.obj", function(object){
      object.scale.set(0.05, 0.05, 0.05);
      object.position.set(0, 0, -50);
      object.traverse(function(node){
        if(node instanceof THREE.Mesh){
          node.castShadow = true;
          node.receiveShadow = true;
          //collidableMeshList.push(node);
        }
      });
      scene.add(object);
    }, onProgress, onError);
  });

  var chairGeometry = new THREE.CylinderGeometry(12, 12, 20, 32);
  var chairMaterial = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  chair = new THREE.Mesh(chairGeometry, chairMaterial);
  collidableMeshList.push(chair);
  chair.position.set(0, 0, -43);
  scene.add(chair);

  // 이동 처리
  disX = (clickedPos.x - player.position.x);
  disZ = (clickedPos.z - player.position.z);
  angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;

  render();
}

function render(){
  stats.update();
  //console.log("x: "+clickedPos.position.x+", y: "+clickedPos.position.y+", z: "+clickedPos.position.z);

  // 충돌 처리
  for (var vertexIndex = 0; vertexIndex < player.geometry.vertices.length; vertexIndex++)
  {
      var localVertex = player.geometry.vertices[vertexIndex].clone();
      var globalVertex = localVertex.applyMatrix4(player.matrix);
      var directionVector = globalVertex.sub( player.position );

      var ray = new THREE.Raycaster( player.position, directionVector.clone().normalize() );
      var collisionResults = ray.intersectObjects( collidableMeshList );
      if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() )
      {
          // a collision occurred... do something...
          //clickedPos.set(player.position.x, player.position.y, player.position.z);
          player.position.x -= Math.cos(angle * Math.PI/180)*speed*0.01;
          player.position.z -= Math.sin(angle * Math.PI/180)*speed*0.01;
          clickedPos.set(player.position.x, player.position.y, player.position.z);
      }
  }

  // 마우스 클릭한 좌표로 이동
  disX = (clickedPos.x - player.position.x);
  disZ = (clickedPos.z - player.position.z);

  if(Math.floor(player.position.x) !== Math.floor(clickedPos.x) || Math.floor(player.position.z) !== Math.floor(clickedPos.z)){
    angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;

    player.position.x += Math.cos(angle * Math.PI/180)*speed;
    player.position.z += Math.sin(angle * Math.PI/180)*speed;
    playerPos.copy(player.position);
  }

  //노트북에 근접하면 게임 시작
  if(playerPos.distanceTo(notebookPos) < 20 && firstVisit === true){
    $(".codingActivity").css({"display": ""})
    firstVisit = false;
    codingStarted = true;

    setTimeout(startGame, 3000);
    document.getElementById("inputCode").disabled = true;
    var count = setInterval(function(){
      if(countDown<=0){
        clearInterval(count);
      }
      $(".timer>p").text(countDown);
      countDown--;
    }, 1000);

  }else if(playerPos.distanceTo(notebookPos) >= 20){
    $(".codingActivity").css({"display": "none"})
    firstVisit = true;
    resetGame();
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

// 알빠 아님
function initStats() {
    var stats = new Stats();

    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.getElementById("Stats-output").appendChild(stats.domElement);

    return stats;
}

// 마우스 클릭 좌표 구함
function onMouseClick(event){
  if(codingStarted === false){
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    camRaycaster.setFromCamera( mouse, camera );

    var intersects = camRaycaster.intersectObjects(scene.children);

    for ( var i = 0; i < intersects.length; i++ ) {
      clickedPos.copy(intersects[i].point);
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.onload = init;
