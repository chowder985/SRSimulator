const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
var clock = new THREE.Clock();
var mixers = [];
var action;
var actionStop = false;

var statBarData = {
  happiness: 80,
  coding: 80,
  dating: 80,
  health: 80
};

var camRaycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0, 0);
var clickedPos = new THREE.Vector3(0, 0, 0);

//var notebookPos = new THREE.Vector3(50, 4, -50);
var playerPos = new THREE.Vector3(0, 4, 0);
var firstVisit = true;
var firstVisitTennis = true;
var firstVisitTv = true;
var codingStarted = false;

var renderer, scene, camera, light, controls;
var plane, wall, notebook, player, chair;
var loadManager;

var fullPlayer = new THREE.Object3D();
var playerColl;
var tvColl;

var speed = 0.5;
var disX, disZ;
var angle;
var notebookClick = false;
var tabletennisClick = false;
var tvClick = false;

var day=1;
var hours=0;
var startTime;
var checkDayPast=0;

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
  "\<h1\>\<\/h1\>"
];
var selectedLang;

var countDown=2;
var elapse=0.0;
var i=0;
var numOfP=0;
var count = null;
var episodeCnt=1;

var tableTennis;

var onlyOnce=0;

var sendHappinessData=0;

// var disX=null, disZ=null;

document.addEventListener('contextmenu', onMouseClick, false);

function init(){
  // 시간 개념
  // 새로 고침 했을 시 바로 업데이트
  hours = Number(localStorage.getItem("hours"));
  console.log(hours);
  day = Number(localStorage.getItem("day"));
  console.log(day+1);
  if(hours%12===0 && hours>0){
    day++;
    localStorage.setItem("day", day);
    var minus = -16;
    localStorage.setItem("healthData", Number(localStorage.getItem("healthData"))+minus);
    localStorage.setItem("codingData", Number(localStorage.getItem("codingData"))+minus);
    localStorage.setItem("happinessData", Number(localStorage.getItem("happinessData"))+minus);
    localStorage.setItem("datingData", Number(localStorage.getItem("datingData"))+minus);
    $(".sleep").fadeIn("slow", function(){
      setTimeout(function(){
        $(".sleep").fadeOut("slow", function(){
          try{
            player.position.set(-20, 4, 0);
            playerColl.position.set(-20, 4, 0);
            fullPlayer.position.set(-20, 4, 0);
            clickedPos.set(-20, 4, 0);
            localStorage.setItem("playerX", player.position.x);
            localStorage.setItem("playerY", player.position.y);
            localStorage.setItem("playerZ", player.position.z);
          }catch(e){

          }
        });
      }, 1000);
    });
    hours=0;
    localStorage.setItem("hours", hours);
  }
  document.querySelector(".Hour").textContent = hours+":00";
  document.querySelector("#dateText").textContent="Day "+(day+1);
  console.log(document.querySelector("#dateText").textContent);
  if((day+1)%3===1){
    console.log((day+1)%3);
    window.location.href = "episode"+(Number(day/3)+1)+".html";
  }

  // 1분이 지날때마다 한시간이 지나감
  startTime = setInterval(function(){
    hours++;
    localStorage.setItem("hours", hours);
    console.log(hours);
    if(hours%12===0 && hours>0){
      day++;
      localStorage.setItem("day", day);
      var minus = -16;
      localStorage.setItem("healthData", Number(localStorage.getItem("healthData"))+minus);
      localStorage.setItem("codingData", Number(localStorage.getItem("codingData"))+minus);
      localStorage.setItem("happinessData", Number(localStorage.getItem("happinessData"))+minus);
      localStorage.setItem("datingData", Number(localStorage.getItem("datingData"))+minus);
      $(".sleep").fadeIn("slow", function(){
        setTimeout(function(){
          $(".sleep").fadeOut("slow", function(){
            try{
              player.position.set(-20, 4, 0);
              playerColl.position.set(-20, 4, 0);
              fullPlayer.position.set(-20, 4, 0);
              clickedPos.set(-20, 4, 0);
              localStorage.setItem("playerX", player.position.x);
              localStorage.setItem("playerY", player.position.y);
              localStorage.setItem("playerZ", player.position.z);
            }catch(e){

            }
          });
        }, 1000);
      });
      hours=0;
      localStorage.setItem("hours", hours);
    }
    document.querySelector(".Hour").textContent = hours+":00";
    document.querySelector("#dateText").textContent="Day "+(day+1);
    if((day+1)%3===1){
      window.location.href = "episode"+(Number(day/3)+1)+".html";
    }
  }, 60000);

  // 서버로부터 플레이어의 스탯 가져오기
  // 서버로부터 데이터 받고 아래와 같이 스탯바에 적용
  statBarData.coding += Number(localStorage.getItem("codingData"));
  statBarData.dating += Number(localStorage.getItem("datingData"));
  statBarData.health += Number(localStorage.getItem("healthData"));
  statBarData.happiness += Number(localStorage.getItem("happinessData"));
  console.log(statBarData.coding);
  console.log(statBarData.dating);
  console.log(statBarData.health);
  console.log(statBarData.happiness);

  $(".Coding>.gage").css({"width": statBarData.coding+"px"});
  $(".Health>.gage").css({"width": statBarData.health+"px"});
  $(".Happiness>.gage").css({"width": statBarData.happiness+"px"});
  $(".Dating>.gage").css({"width": statBarData.dating+"px"});

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
  fullPlayer.position.set(0, 4, 0);
  scene.add(fullPlayer);

  // 카메라 구현
  camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0, 130, 100);
  //camera.rotation.x = -Math.PI/6;
  camera.lookAt(fullPlayer);
  scene.add(camera);

  fullPlayer.add(camera);

  // 카메라 조절
  controls = new THREE.OrbitControls( camera );
  controls.enableKeys = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI/6;
  controls.minPolarAngle = Math.PI/6;

  // 화면 반응형
  window.addEventListener( 'resize', onWindowResize, false );

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
  var fbxLoader = new THREE.FBXLoader(loadManager);

  // 바닥 구현
  var planeGeometry = new THREE.PlaneGeometry(2000, 2000);
  var planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, map: new THREE.TextureLoader().load("img/grass.jpg")});
  planeMaterial.map.repeat.set(12, 12);
  planeMaterial.map.wrapS = THREE.RepeatWrapping;
  planeMaterial.map.wrapT = THREE.RepeatWrapping;
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI/2;
  plane.position.set(0, -4, 0);
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

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  // light = new THREE.PointLight(0xffffff, 0.5, 10000);
  // light.position.set(0, 100, 200);
  // light.castShadow = true;
  // light.shadow.camera.near = 0.1;
  // light.shadow.camera.far = 10000;
  // scene.add(light);

  // light = new THREE.DirectionalLight(0xffffff, 0.5);
  // light.position.set(0, 400, 200);
  // light.castShadow = true;
  // light.shadow.darkness = 0.8;
  // light.shadow.camera.near = 200;
  // light.shadow.camera.far = 1600;
  // light.shadowCameraLeft = -300;
  // light.shadowCameraBottom =  -400;
  // light.shadowCameraRight = 500;
  // light.shadowCameraTop = 500;

  light = new THREE.SpotLight( 0xffffff, 0.5 );
	light.position.set(0, 400, 200);
	light.lookAt(scene.position);
	light.penumbra = 0.05;
	light.decay = 2;
	light.distance = 10000;
	light.castShadow = true;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	light.shadow.camera.near = 10;
	light.shadow.camera.far = 1600;
  scene.add(light);

  // 플레이어 구현
  fbxLoader.load("models/illhoon.fbx", function(object){
    console.log(object);
    player = object;
    player.scale.set(0.05, 0.05, 0.05);
    player.position.y +=4;
    player.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    player.position.x = Number(localStorage.getItem("playerX"));
    player.position.y = Number(localStorage.getItem("playerY"));
    player.position.z = Number(localStorage.getItem("playerZ"));

    player.mixer = new THREE.AnimationMixer(player);
    mixers.push(player.mixer);
    action = player.mixer.clipAction(player.animations[0]);

    action.time = 1;
    action.setDuration(3.3);
    action.repetitions = 0;
    action.play();

    scene.add(player);
  });

  var playerGeometry = new THREE.CylinderGeometry(8, 8, 32, 32);
  var playerMaterial = new THREE.MeshPhongMaterial({opacity: 0.0, transparent: true});
  playerColl = new THREE.Mesh(playerGeometry, playerMaterial);
  playerColl.position.x = Number(localStorage.getItem("playerX"));
  playerColl.position.y = Number(localStorage.getItem("playerY"));
  playerColl.position.z = Number(localStorage.getItem("playerZ"));
  scene.add(playerColl);

  fullPlayer.position.x = Number(localStorage.getItem("playerX"));
  fullPlayer.position.y = Number(localStorage.getItem("playerY"));
  fullPlayer.position.z = Number(localStorage.getItem("playerZ"));

  clickedPos.x = Number(localStorage.getItem("playerX"));
  clickedPos.y = Number(localStorage.getItem("playerY"));
  clickedPos.z = Number(localStorage.getItem("playerZ"));

  var playerLeftFaceGeo = new THREE.PlaneGeometry(10, 10);
  var playerLeftFaceMat = new THREE.MeshPhongMaterial({color: 0xD5825C});
  var playerLeftFace = new THREE.Mesh(playerLeftFaceGeo, playerLeftFaceMat);
  playerLeftFace.position.set(4.5, 32, 0);
  playerLeftFace.rotation.y = Math.PI/2;
  scene.add(playerLeftFace);
  playerColl.add(playerLeftFace);

  var deskGeo = new THREE.BoxGeometry(40, 30, 65);
  var deskMat = new THREE.MeshBasicMaterial({opacity:0.0, transparent: true});
  desk = new THREE.Mesh(deskGeo, deskMat);
  collidableMeshList.push(desk);
  desk.position.set(-170, 20, 200);
  desk.castShadow = true;
  desk.receiveShadow = true;
  collidableMeshList.push(desk);
  scene.add(desk);

  var notebookCollMeshGeo = new THREE.BoxGeometry(10, 20, 20);
  var notebookCollMeshMat = new THREE.MeshPhongMaterial({color: 0xfff, opacity: 0.0, transparent: true});
  var notebookCollMesh = new THREE.Mesh(notebookCollMeshGeo, notebookCollMeshMat);
  notebookCollMesh.position.set(-170, 29, 210);
  notebookCollMesh.name = "notebook";
  scene.add(notebookCollMesh);

  fbxLoader.load("models/bed.fbx", function(object){
    object.position.set(30, 15, -60);
    object.scale.set(1.5, 1.5, 1.5);
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
    object.position.set(-145, 0, 210);
    object.rotation.y = -Math.PI/3-Math.PI/2;
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  });

  fbxLoader.load('models/bookshelf.fbx', function(object){
    object.scale.set(0.15, 0.15, 0.15);
    object.position.set(-190, 40, 300);
    object.traverse(function(child){
      child.castShadow = true;
      child.receiveShadow = true;
    })
    scene.add(object);
  });

  fbxLoader.load('models/desk.fbx', function(object){
    object.scale.set(0.02, 0.02, 0.02);
    object.position.set(-170, 12, 200);
    object.rotation.y = Math.PI/2;
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  });

  fbxLoader.load('models/hanger.fbx', function(object){
    object.scale.set(0.8, 0.8, 0.8);
    object.position.set(-40, -8, -50);
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  });

  fbxLoader.load('models/laptop.fbx', function(object){
    object.position.set(-170, 29, 210);
    object.scale.set(0.5, 0.5, 0.5);
    //console.log(object);
    notebook = object;
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  });

  fbxLoader.load('models/room.fbx', function(object){
    object.position.set(0, -5, 0);
    object.scale.set(0.8, 1, 0.8);
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  })
  fbxLoader.load('models/table.fbx', function(object){
    object.position.set(150, 15, 200);
    object.rotation.y = -Math.PI/2;
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  })

  fbxLoader.load('models/tv.fbx', function(object){
    object.position.set(150, 23, 300);
    object.rotation.y = Math.PI/2;
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  })
  var tvGeometry = new THREE.BoxGeometry(73, 47, 2);
  var tvMaterial = new THREE.MeshPhongMaterial({color: 0x000000});
  var tvMesh = new THREE.Mesh(tvGeometry, tvMaterial);
  tvMesh.position.set(150, 53, 301);
  tvMesh.castShadow = true;
  tvMesh.receiveShadow = true;
  scene.add(tvMesh);

  fbxLoader.load('models/tvstand.fbx', function(object){
    //console.log(object);
    object.rotation.y = -Math.PI;
    object.position.set(150, -15, 300);
    object.scale.set(0.7, 0.5, 0.7);
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    })
    scene.add(object);
  });

  fbxLoader.load('models/pingpongtable.fbx', function(object){
    object.scale.set(0.3, 0.3, 0.3);
    object.rotation.y = -Math.PI/2;
    object.position.set(-20, 15, 200);
    object.traverse(function(child){
      if(child instanceof THREE.Mesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(object);
  })

  var chairGeometry = new THREE.CylinderGeometry(12, 12, 20, 32);
  var chairMaterial = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true}); //opacity: 0.0, transparent: true
  chair = new THREE.Mesh(chairGeometry, chairMaterial);
  collidableMeshList.push(chair);
  chair.position.set(-145, 0, 210);
  scene.add(chair);

  // 방 벽
  var roomWallNorthGeo = new THREE.BoxGeometry(150, 100, 5);
  var roomWallNorthMat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  var roomWallNorth = new THREE.Mesh(roomWallNorthGeo, roomWallNorthMat);
  roomWallNorth.position.set(0, 0, -80);
  collidableMeshList.push(roomWallNorth);
  scene.add(roomWallNorth);

  var roomWallWestGeo = new THREE.BoxGeometry(155, 100, 5);
  var roomWallWestMat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  var roomWallWest = new THREE.Mesh(roomWallWestGeo, roomWallWestMat);
  roomWallWest.rotation.y = -Math.PI/2;
  roomWallWest.position.set(-64, 0, 0);
  collidableMeshList.push(roomWallWest);
  scene.add(roomWallWest);

  var roomWallEastGeo = new THREE.BoxGeometry(155, 100, 5);
  var roomWallEastMat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  var roomWallEast = new THREE.Mesh(roomWallEastGeo, roomWallEastMat);
  roomWallEast.rotation.y = -Math.PI/2;
  roomWallEast.position.set(64, 0, 0);
  collidableMeshList.push(roomWallEast);
  scene.add(roomWallEast);

  var wallNorthGeo = new THREE.BoxGeometry(300, 100, 5);
  var wallNorthMat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  var wallNorth = new THREE.Mesh(wallNorthGeo, wallNorthMat);
  wallNorth.position.set(135, 10, 80);
  collidableMeshList.push(wallNorth);
  scene.add(wallNorth);

  var wallNorth2Geo = new THREE.BoxGeometry(140, 100, 5);
  var wallNorth2Mat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  var wallNorth2 = new THREE.Mesh(wallNorth2Geo, wallNorth2Mat);
  wallNorth2.position.set(-125, 10, 80);
  collidableMeshList.push(wallNorth2);
  scene.add(wallNorth2);

  var wallEastGeo = new THREE.BoxGeometry(5, 100, 250);
  var wallEastMat = new THREE.MeshBasicMaterial({color: 0xfff, opacity: 0.0, transparent: true});
  var wallEast = new THREE.Mesh(wallEastGeo, wallEastMat);
  wallEast.position.set(282, 10, 200);
  collidableMeshList.push(wallEast);
  scene.add(wallEast);

  var wallWestGeo = new THREE.BoxGeometry(5, 100, 250);
  var wallWestMat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: true});
  var wallWest = new THREE.Mesh(wallWestGeo, wallWestMat);
  wallWest.position.set(-200, 10, 200);
  collidableMeshList.push(wallWest);
  scene.add(wallWest);

  var wallSouthGeo = new THREE.BoxGeometry(500, 100, 5);
  var wallSouthMat = new THREE.MeshPhongMaterial({color: 0x7E7E7E});
  var wallSouth = new THREE.Mesh(wallSouthGeo, wallSouthMat);
  wallSouth.position.set(50, 43, 328);
  collidableMeshList.push(wallSouth);
  wallSouth.receiveShadow = true;
  scene.add(wallSouth);

  //침대 충돌 메시
  var bedCollGeo = new THREE.BoxGeometry(50, 10, 85);
  var bedCollMat = new THREE.MeshPhongMaterial({color: 0xffffff, opacity:0.0, transparent:true});
  var bedColl = new THREE.Mesh(bedCollGeo, bedCollMat);
  bedColl.position.set(30, 0, -20);
  collidableMeshList.push(bedColl);
  scene.add(bedColl);

  var standGeo = new THREE.CylinderGeometry(6, 6, 20, 32);
  var standMat = new THREE.MeshPhongMaterial({color: 0xffffff, opacity:0.0, transparent:true});
  var stand = new THREE.Mesh(standGeo, standMat);
  stand.position.set(-40, 0, -50);
  collidableMeshList.push(stand);
  scene.add(stand);

  var bookshelfCollGeo = new THREE.BoxGeometry(23, 10, 40);
  var bookshelfCollMat = new THREE.MeshPhongMaterial({color: 0xffffff, opacity:0.0, transparent:true});
  var bookshelfColl = new THREE.Mesh(bookshelfCollGeo, bookshelfCollMat);
  bookshelfColl.position.set(-190, 0, 300);
  collidableMeshList.push(bookshelfColl);
  scene.add(bookshelfColl);

  var tableTennisGeo = new THREE.BoxGeometry(50, 10, 80);
  var tableTennisMat = new THREE.MeshPhongMaterial({color: 0xffffff, opacity:0.0, transparent:true});
  tableTennis = new THREE.Mesh(tableTennisGeo, tableTennisMat);
  tableTennis.position.set(-20, 15, 200);
  tableTennis.name = "tabletennis";
  collidableMeshList.push(tableTennis);
  scene.add(tableTennis);

  var tableCollGeo = new THREE.BoxGeometry(85, 10, 50);
  var tableCollMat = new THREE.MeshPhongMaterial({color: 0xffffff, opacity:0.0, transparent:true});
  var tableColl = new THREE.Mesh(tableCollGeo, tableCollMat);
  tableColl.position.set(150, 15, 200);
  collidableMeshList.push(tableColl);
  scene.add(tableColl);

  var tvCollGeo = new THREE.BoxGeometry(80, 10, 30);
  var tvCollMat = new THREE.MeshPhongMaterial({color: 0xffffff, opacity:0.0, transparent:true});
  tvColl = new THREE.Mesh(tvCollGeo, tvCollMat);
  tvColl.position.set(150, 0, 300);
  collidableMeshList.push(tvColl);
  tvColl.name="tv";
  scene.add(tvColl);

  // 이동 처리
  try{
    disX = (clickedPos.x - player.position.x);
    disZ = (clickedPos.z - player.position.z);
  }catch(e){
    console.log("player loaded");
  }
  angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;

  render();
}

function render(){
  stats.update();

  try{
    if(action.time >= 3.3){
      action.time = 1;
      action.repetitions = 0;
      action.play();
    }
  }catch(e){
    console.log("cant find action");
  }
  //console.log("x: "+clickedPos.position.x+", y: "+clickedPos.position.y+", z: "+clickedPos.position.z);

  if ( mixers.length > 0 ) {
		for ( var i = 0; i < mixers.length; i ++ ) {
			mixers[ i ].update( clock.getDelta() );
		}
	}

  // 충돌 처리
  try{
    for (var vertexIndex = 0; vertexIndex < playerColl.geometry.vertices.length; vertexIndex++)
    {
        var localVertex = playerColl.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(playerColl.matrix);
        var directionVector = globalVertex.sub( playerColl.position );

        var ray = new THREE.Raycaster( playerColl.position, directionVector.clone().normalize() );
        var collisionResults = ray.intersectObjects( collidableMeshList );
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() )
        {
            // a collision occurred... do something...
             console.log("충돌");
            //clickedPos.set(player.position.x, player.position.y, player.position.z);
            player.position.x -= Math.cos(angle * Math.PI/180)*speed*0.05;
            player.position.z -= Math.sin(angle * Math.PI/180)*speed*0.05;
            playerColl.position.x -= Math.cos(angle * Math.PI/180)*speed*0.05;
            playerColl.position.z -= Math.sin(angle * Math.PI/180)*speed*0.05;
            fullPlayer.position.x -= Math.cos(angle * Math.PI/180)*speed*0.05;
            fullPlayer.position.z -= Math.sin(angle * Math.PI/180)*speed*0.05;
            clickedPos.set(player.position.x, player.position.y, player.position.z);
        }
    }
  }catch(e){

  }

  // 마우스 클릭한 좌표로 이동
  try{
    disX = (clickedPos.x - player.position.x);
    disZ = (clickedPos.z - player.position.z);
  }catch(e){

  }

  try{
    if(Math.floor(player.position.x) !== Math.floor(clickedPos.x) || Math.floor(player.position.z) !== Math.floor(clickedPos.z)){
      try{
        if(action.time >= 0.9){
          action.time = 0;
          action.repetitions = 0;
          action.play();
        }
      }catch(e){
        console.log("걷는거 안됨");
      }
      actionStop = true;
      angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;
      player.position.x += Math.cos(angle * Math.PI/180)*speed;
      player.position.z += Math.sin(angle * Math.PI/180)*speed;

      playerColl.position.x += Math.cos(angle * Math.PI/180)*speed;
      playerColl.position.z += Math.sin(angle * Math.PI/180)*speed;

      fullPlayer.position.x += Math.cos(angle * Math.PI/180)*speed;
      fullPlayer.position.z += Math.sin(angle * Math.PI/180)*speed;

      playerPos.copy(player.position);
    }else{
      try{
        if(actionStop === true){
          action.time = 1;
          action.repetitions = 0;
          action.play();
          actionStop = false;
        }
      }catch(e){

      }
    }
  }catch(e){

  }

  //노트북에 근접하면 게임 시작
  try{
    if((notebookClick === true) && (playerPos.distanceTo(notebook.position) < 80) && (firstVisit === true)){
      $(".codingStart").css({"display": ""})
      firstVisit = false;
      codingStarted = true;
      clickedPos.set(player.position.x, player.position.y, player.position.z);
      // localStorage.setItem("playerX", playerPos.x);
      // localStorage.setItem("playerY", playerPos.y);
      // localStorage.setItem("playerZ", playerPos.z);

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
    }else if(playerPos.distanceTo(notebook.position) >= 80){
      $(".codingActivity").css({"display": "none"})
      firstVisit = true;
      resetGame();
    }
  }catch(e){

  }

  // 탁구대와 가까워지면 페이지 이동
  try{
    if((tabletennisClick === true) && (playerPos.distanceTo(tableTennis.position) < 80) && (firstVisitTennis === true)){
        firstVisitTennis = false;
        // 탁구 소요 시간 4시간 추가
        hours+=4;
        if((hours/12) > 1){
          hours = 12;
        }
        localStorage.setItem("hours", hours);
        // document.querySelector(".Hour").textContent = hours+":00";
        // document.querySelector("#dateText").textContent="Day "+(day+1);
        localStorage.setItem("playerX", playerPos.x);
        localStorage.setItem("playerY", playerPos.y);
        localStorage.setItem("playerZ", playerPos.z);
        window.location.href = "tableTennis.html";
    }else if(playerPos.distanceTo(tableTennis.position) >= 80){
      firstVisitTennis = true;
    }
  }catch(e){

  }
  try{
    if((tvClick === true) && (playerPos.distanceTo(tvColl.position) < 80) && (firstVisitTv === true)){
      onlyOnce++;
      if(onlyOnce===1){
        console.log(onlyOnce);
        firstVisitTv = false;
        clickedPos.set(player.position.x, player.position.y, player.position.z);
        console.log("한번 출력");

        $(".watch").css({"display": ""});
        new moment.duration(1000).timer({wait: 5000, executeAfterWait: true}, function(){
          $(".watch").css({"display": "none"});
          console.log("Hi");
        });

        sendHappinessData += 10;
        // 서버
        statBarData.happiness+=sendHappinessData;
        $(".Happiness>.gage").css({"width": statBarData.happiness+"px"});
        localStorage.setItem("happinessData", sendHappinessData);

        hours+=2;
        if((hours/12) > 1){
          hours = 0;
          day++;
        }
      }
    }else if(playerPos.distanceTo(tvColl.position) >= 80){
      firstVisitTv = true;
      onlyOnce=0;
    }
  }catch(e){

  }

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
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
  count = setInterval(function(){
    if(countDown <= 0){
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
  action.reset();
  if(codingStarted === false){
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    camRaycaster.setFromCamera( mouse, camera );

    var intersects = camRaycaster.intersectObjects(scene.children);
    var isNote = false;
    var isTable = false;
    var isTv = false;

    for ( var i = 0; i < intersects.length; i++ ) {
      console.log(intersects);
      clickedPos.copy(intersects[i].point);
      if(intersects[i].object.name === "notebook"){
        notebookClick = true;
        isNote = true;
      }
      if(intersects[i].object.name === "tabletennis"){
        console.log("탁구 클릭");
        tabletennisClick = true;
        isTable = true;
      }
      if(intersects[i].object.name === "tv"){
        console.log("티비 켜짐");
        tvClick = true;
        isTv = true;
      }
    }
    if(isNote === false){
      notebookClick = false;
    }
    if(isTable === false){
      tabletennisClick = false;
    }
    if(isTv === false){
      tvClick = false;
    }

    var lookVector = new THREE.Vector3();
    try{
      lookVector.set(clickedPos.x, player.position.y, clickedPos.z);
      player.lookAt(lookVector);
      playerColl.lookAt(lookVector);
    }catch(e){

    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.onload = init;
