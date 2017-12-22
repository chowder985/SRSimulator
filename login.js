// 로그인 애니메이션
$('.message a').click(function(){
 $('form').animate({height: "toggle", opacity: "toggle"}, "fast");
});

// 로그인 서버 통신
document.querySelector("#executeSignUp").addEventListener('click', function(){
  var regForm = document.querySelector(".register-form");
  regForm.submit();
});

document.querySelector("#executeSignIn").addEventListener("click", function(){
  var logForm = document.querySelector(".login-form")
  logForm.submit();
})

var WIDTH = window.innerWidth;
var HEIGHT = 400;
var mouseX=0, mouseY=0;
var camera;
var loader = new THREE.FontLoader();
var renderer;
var scene;
var directionalLight;

// 게임 제목 3D
function init(){
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

  // 렌더러 추가
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0xffffff, 0);
  document.getElementById("WebGL-output").appendChild(renderer.domElement);
  renderer.shadowMapEnabled = true;

  // 장면 추가
  scene = new THREE.Scene();

  // 카메라 추가
  camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0, 0, 300);
  scene.add(camera);

  // 반응형
  window.addEventListener( 'resize', onWindowResize, false );

  // 텍스트 오브젝트 생성
  loader.load('fonts/helvetiker_regular.typeface.json', function(font){
    var textGeometry = new THREE.TextGeometry('SRSimulator', {
      font: font,
      size: 80,
      height: 10,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 5,
      bevelSize: 2,
      bevelSegments: 5
    })
    var textMaterial = new THREE.MeshPhongMaterial({color: 0x0095DD});
    var text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.x = -300;
    text.position.y = -30;
    scene.add(text);
  });

  directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  directionalLight.castShadow = true;
  directionalLight.position.set(-100, 50, 100);
  scene.add( directionalLight );

  render();
}

function render() {

    camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    camera.position.y += ( - mouseY - camera.position.y ) * 0.05;

    camera.lookAt(scene.position);

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / HEIGHT;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, HEIGHT );
}

function onDocumentMouseMove(event){
  mouseX = (event.clientX - (window.innerWidth / 2));
  mouseY = (event.clientY - (window.innerHeight / 2));
}

window.onload = init
