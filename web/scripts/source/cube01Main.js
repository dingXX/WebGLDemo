var THREE = require('three');
// 创建一个新的Three.js场景
var scene = new THREE.Scene();
// 添加一个相机以便观察整个场景
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 创建Three.js渲染器
var renderer = new THREE.WebGLRenderer();
// 设置视口尺寸
renderer.setSize(window.innerWidth - 10, window.innerHeight - 10);
renderer.setClearColor(0x00ff00);
document.body.appendChild(renderer.domElement);


// 光照
// 定向光
// var light = new THREE.DirectionalLight(0xffffff, 1.5);
// light.position.set(-1, -1, 3);
// scene.add(light);



// 点光
// pointLight = new THREE.PointLight(0xffffff, 1, 20);
// pointLight.position.set(-1, -1, 3);
// scene.add(pointLight);

// 聚光源
spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(-1, -1, 3);
spotLight.target.position.set(0,0,0);
scene.add(spotLight);

// 环境光
// ambientLight = new THREE.AmbientLight(0x888888);
// scene.add(ambientLight);


var pointGeo = new THREE.SphereBufferGeometry( 0.1, 100, 100  );
var pointMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} );
var sphere = new THREE.Mesh( pointGeo, pointMaterial );
sphere.position.set(-1, -1, 3);
scene.add( sphere );



// 创建立方体几何形状
var geometry = new THREE.BoxGeometry(1, 1, 1);
// 创建一个基础材质，传入纹理映射
var mapUrl = "/img/01.jpg";
var map = THREE.ImageUtils.loadTexture(mapUrl);
// Phong 着色法
var material = new THREE.MeshPhongMaterial({
    map: map
});
// var material = new THREE.MeshBasicMaterial({
//     color: 0x00ff00
// });
// 将几何形状和材质整合到一个网格中
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);



// 将网格移动到与相机有一段距离的位置，并朝向观察者倾斜
camera.position.z = 5;
cube.rotation.x = Math.PI / 5;
cube.rotation.y = Math.PI / 5;

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    // cube.rotation.x += 0.1;
    // cube.rotation.y += 0.1;
}
render();