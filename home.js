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

var fullPlayer = new THREE.Object3D();

var speed = 0.5;
var disX, disZ;
var angle;

var date=1;
var hours=0;
var startTime;

var collidableMeshList = [];
// var collided = false;

var stats = initStats();

// coding Game Variables
var c = [
  "printf('Hello World!');",
  "scanf('%d', &num);",
  "for(i=1; i<=rows; ++i){",
  "for(j=1; j<=i; ++j){",
  "printf('*');}",
  "printf(\"\\n\");"
];
var java = [
  "System.out.println('Hello World!');"
];
var javascript = [
  "for(var i=0; i<10; i++){"
];
var html = [
  "<h1></h1>"
];
var selectedLang;

var countDown=2;
var elapse=0.0;
var i=0;
var numOfP=0;

// var disX=null, disZ=null;

document.addEventListener('contextmenu', onMouseClick, false);

function init(){
  // 시간 개념
  document.querySelector("#dateText").textContent="Day "+date;
  console.log(document.querySelector("#dateText").textContent);
  startTime = setInterval(function(){
    hours++;
    console.log(hours);
    if(hours === 12){
      date++;
      hours=0;
      if(date%3===0){
        window.location.href = "episode"+date/3+".html";
      }
      document.querySelector("#dateText").textContent="Day "+date;
    }
  }, 60000);

  // 렌더러 구현
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0x00ffff, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  renderer.autoClear = false;

  // 씬 구현
  scene = new THREE.Scene();
  scene.add(fullPlayer);

  // 카메라 구현
  camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0, 75, 125);
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
  var playerGeometry = new THREE.BoxGeometry(10, 10, 10);
  var playerMaterial = new THREE.MeshPhongMaterial({color: 0x00ffff});
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.y=4;
  player.position.x=0;
  player.position.z=0;
  player.castShadow = true;
  player.receiveShadow = true;
  scene.add(player);

  fullPlayer.add(player);
  fullPlayer.add(camera);

  var notebookGeo = new THREE.BoxGeometry(10, 10, 10);
  var notebookMat = new THREE.MeshPhongMaterial({color: 0x00ffff});
  notebook = new THREE.Mesh(notebookGeo, notebookMat);
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

  var fbxLoader = new THREE.FBXLoader(loadManager);
  fbxLoader.load("models/bed.fbx", function(object){
    object.position.set(40, 11, 0);
    //var bedMesh = new THREE.Mesh(object, new THREE.MeshPhongMaterial({color: 0x00ffff}));
    //console.log(object);
    object.traverse( function(child){
      if(child instanceof THREE.Mesh){
        //child.material.color.setRGB(1, 0, 0);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(object);
  });

  fbxLoader.load("models/chair.fbx", function(object){
    //console.log(object);
    object.scale.set(0.05, 0.05, 0.05);
    object.position.set(-50, 0, 0);
    scene.add(object);
  });

  // fbxLoader.load('models/bookshelf.fbx', function(object){
  //   scene.add(object);
  // });

  fbxLoader.load('models/desk.fbx', function(object){
    object.scale.set(0.02, 0.02, 0.02);
    object.position.set(-100, 12, 200);
    scene.add(object);
  });

  fbxLoader.load('models/hanger.fbx', function(object){
    object.scale.set(0.5, 0.5, 0.5);
    object.position.set(0, -5, 50);
    scene.add(object);
  });

  fbxLoader.load('models/laptop.fbx', function(object){
    object.position.set(-40, 0, -50);
    scene.add(object);
  });

  fbxLoader.load('models/room.fbx', function(object){
    object.position.set(0, -5, 0);
    object.scale.set(0.8, 0.8, 0.8);
    scene.add(object);
  });

  fbxLoader.load('models/table.fbx', function(object){
    object.position.set(0, 15, 200);
    scene.add(object);
  });

  fbxLoader.load('models/tv.fbx', function(object){
    object.position.set(50, 0, 200);
    scene.add(object);
  });

  fbxLoader.load('models/tvstand.fbx', function(object){
    console.log(object);
    object.position.set(-100, -27, 300);
    scene.add(object);
  });

  var chairGeometry = new THREE.CylinderGeometry(12, 12, 20, 32);
  var chairMaterial = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  chair = new THREE.Mesh(chairGeometry, chairMaterial);
  collidableMeshList.push(chair);
  chair.position.set(0, 0, -43);
  scene.add(chair);

  // 이동 처리
  disX = (clickedPos.x - fullPlayer.position.x);
  disZ = (clickedPos.z - fullPlayer.position.z);
  angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;

  render();
}

function render(){
  stats.update();
  //console.log("x: "+clickedPos.position.x+", y: "+clickedPos.position.y+", z: "+clickedPos.position.z);

  var lookVector = new THREE.Vector3();
  lookVector.set(clickedPos.x, player.position.y, clickedPos.z);
  player.lookAt(lookVector);

  // 충돌 처리
  for (var vertexIndex = 0; vertexIndex < player.geometry.vertices.length; vertexIndex++)
  {
      var localVertex = player.geometry.vertices[vertexIndex].clone();
      var globalVertex = localVertex.applyMatrix4(fullPlayer.matrix);
      var directionVector = globalVertex.sub( fullPlayer.position );

      var ray = new THREE.Raycaster( fullPlayer.position, directionVector.clone().normalize() );
      var collisionResults = ray.intersectObjects( collidableMeshList );
      if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() )
      {
          // a collision occurred... do something...
          //clickedPos.set(player.position.x, player.position.y, player.position.z);
          fullPlayer.position.x -= Math.cos(angle * Math.PI/180)*speed*0.01;
          fullPlayer.position.z -= Math.sin(angle * Math.PI/180)*speed*0.01;
          clickedPos.set(fullPlayer.position.x, fullPlayer.position.y, fullPlayer.position.z);
      }
  }

  // 마우스 클릭한 좌표로 이동
  disX = (clickedPos.x - fullPlayer.position.x);
  disZ = (clickedPos.z - fullPlayer.position.z);

  if(Math.floor(fullPlayer.position.x) !== Math.floor(clickedPos.x) || Math.floor(fullPlayer.position.z) !== Math.floor(clickedPos.z)){
    angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;
    fullPlayer.position.x += Math.cos(angle * Math.PI/180)*speed;
    fullPlayer.position.z += Math.sin(angle * Math.PI/180)*speed;
    playerPos.copy(fullPlayer.position);
  }

  //노트북에 근접하면 게임 시작
  if(playerPos.distanceTo(notebookPos) < 20 && firstVisit === true){
    $(".codingStart").css({"display": ""})
    firstVisit = false;
    codingStarted = true;

    $("#startGame").click(function(){
      $(".codingStart").css({"display": "none"})
      $(".codingSelect").css({"display": ""})

      $("#C").click(function(){
        c = shuffle(c);
        selectedLang = c;
        loadGame();
      })

      $("#Java").click(function(){
        java = shuffle(java);
        selectedLang = java;
        loadGame();
      })

      $("#Javascript").click(function(){
        javascript = shuffle(javascript);
        selectedLang = javascript;
        loadGame();
      })

      $("#HTML").click(function(){
        html = shuffle(html);
        selectedLang = html;
        loadGame();
      })
    })
  }else if(playerPos.distanceTo(notebookPos) >= 20){
    $(".codingActivity").css({"display": "none"})
    firstVisit = true;
    resetGame();
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function loadGame(){
  $(".codingSelect").css({"display": "none"})
  $(".codingActivity").css({"display": ""})
  setTimeout(startGame, 3000);
  document.getElementById("inputCode").disabled = true;
  var count = setInterval(function(){
    if(countDown<=0){
      clearInterval(count);
    }
    $(".timer>p").text(countDown);
    countDown--;
  }, 1000);
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
