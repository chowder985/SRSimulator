const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
var clock = new THREE.Clock();
var mixers = [];

var camRaycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0, 0);
var clickedPos = new THREE.Vector3(0, 0, 0);

var renderer, scene, camera, light;
var plane, wall, object, player;
var loadManager, mtlLoader, fbxLoader;

var stats = initStats();

// var disX=null, disZ=null;

document.addEventListener('click', onMouseClick, false);

function init(){

  // 렌더러 구현
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0xDDDDDD, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);

  renderer.autoClear = false;

  // 씬 구현
  scene = new THREE.Scene();

  // 카메라 구현
  camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0, 55, 105);
  camera.rotation.x = -Math.PI/6;
  scene.add(camera);

  // 바닥 구현
  var planeGeometry = new THREE.PlaneGeometry(100, 100);
  var planeMaterial = new THREE.MeshPhongMaterial({color: 0x2194ce, side: THREE.DoubleSide});
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI/2;
  plane.position.set(0, -1, 0);
  plane.receiveShadow = true;
  //camera.lookAt(plane.position);
  scene.add(plane);

  // 빛 구현
  light = new THREE.SpotLight(0xffffff);
  light.position.set(0, 100, 200);
  light.castShadow = true;

  light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 ) );
  light.shadow.bias = 0.0001;

  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;

  scene.add(light);

  // 플레이어 구현
  var playerGeometry = new THREE.SphereGeometry(5, 32, 32);
  var playerMaterial = new THREE.MeshPhongMaterial({color: 0x00ffff});
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.y=4;
  player.position.x=-4;
  player.position.z=4;
  player.castShadow = true;
  scene.add(player);



  render();
}

function render(){
  stats.update();
  camRaycaster.setFromCamera( mouse, camera );

  var intersects = camRaycaster.intersectObjects(scene.children);

  for ( var i = 0; i < intersects.length; i++ ) {
    clickedPos.position = intersects[i].point;
  }
  //console.log("x: "+clickedPos.position.x+", y: "+clickedPos.position.y+", z: "+clickedPos.position.z);

  // 스무드 이펙트
  // player.position.x = clickedPos.position.x;
  // player.position.z = clickedPos.position.z;

  // if(disX===null){
  //   disX = (player.position.x - clickedPos.position.x);
  //   disX = Math.round(disX);
  // }
  // if(disZ===null){
  //   disZ = (player.position.z - clickedPos.position.z);
  //   disZ = Math.round(disZ);
  // }
  //
  // var speed = 50;
  // //disZ = Math.sqrt((player.position.z - clickedPos.position.z)*(player.position.z - clickedPos.position.z));
  // if(Math.round(player.position.x) !== Math.round(clickedPos.position.x) /*&& player.position.z !== clickedPos.position.z*/){
  //   if(disX >= 0 && player.position.x > clickedPos.position.x){
  //     player.position.x -= (disX/speed);
  //   } else if(disX >= 0 && player.position.x < clickedPos.position.x) {
  //     player.position.x += (disX/speed);
  //   } else if(disX < 0 && player.position.x > clickedPos.position.x){
  //     player.position.x += (disX/speed);
  //   } else {
  //     player.position.x -= (disX/speed);
  //   }
  // }else{
  //   disX = null;
  // }
  //
  // if(Math.round(player.position.z) !== Math.round(clickedPos.position.z) /*&& player.position.z !== clickedPos.position.z*/){
  //   if(disZ >= 0 && player.position.z > clickedPos.position.z){
  //     player.position.z -= (disZ/speed);
  //   } else if(disZ >= 0 && player.position.z < clickedPos.position.z) {
  //     player.position.z += (disZ/speed);
  //   } else if(disZ < 0 && player.position.z > clickedPos.position.z){
  //     player.position.z += (disZ/speed);
  //   } else {
  //     player.position.z -= (disZ/speed);
  //   }
  // }else{
  //   disZ = null;
  // }

  var disX, disZ;
  disX = (clickedPos.position.x - player.position.x);

  disZ = (clickedPos.position.z - player.position.z);

  var speed = 0.5;

  if(Math.floor(player.position.x) !== Math.floor(clickedPos.position.x) || Math.floor(player.position.z) !== Math.floor(clickedPos.position.z)){
    var angle = Number(Math.atan2(disZ, disX)) * 180/Math.PI;

    player.position.x += Math.cos(angle * Math.PI/180)*speed;
    player.position.z += Math.sin(angle * Math.PI/180)*speed;
  }
  console.log(player.position)

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

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

function onMouseClick(event){
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

window.onload = init;
