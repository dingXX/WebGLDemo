var THREE = require('three');

function initRender() {
    //声明渲染器对象：WebGLRenderer  
    var renderer = new THREE.WebGLRenderer({
        // antialias: true, //反锯齿  
        // precision: "highp", //精度范围
        alpha: true, //是否可以设置背景色透明  
        // premultipliedAlpha: true, //默认true ,canvas与canvas的背景或者整个页面的背景是否融合.
        // stencil: false, //是否支持模板缓冲
        // preserveDrawingBuffer: true, //是否保存绘图缓冲  
    });

    //渲染器的高宽
    renderer.setSize(window.innerWidth - 10, window.innerHeight - 10);
    //将canvas元素到body元素中。  
    document.body.appendChild(renderer.domElement);
    //设置canvas背景色和背景色透明度  
    renderer.setClearColor(0x000000, 0.5);
    return renderer;
}

function initCamera() {
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 4000);
    // camera.position.set(-2, 6, 12);
    camera.position.set(-2,6,12);
    return camera;
}

function initScene() {
    return new THREE.Scene();
}

function initObject(scene) {
    var SHADOW_MAP_WIDTH = 2048;
    var SHADOW_MAP_HEIGHT = 2048;
    // 创建一个用于容纳所有物体的分组
    var root = new THREE.Object3D();
    // 添加一个相机以便观察整个场景
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // 创建并将所有灯光添加到场景中
    directionalLight.position.set(0.5, 0, 3);
    root.add(directionalLight);
    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(2, 8, 15);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);
    console.log(spotLight);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    // spotLight.shadowDarkness = 0.5;
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight(0x888888);
    root.add(ambientLight);

    // 创建一个用于容纳球体的组
    var group = new THREE.Object3D();
    root.add(group);

    var map = THREE.TextureLoader("/img/chess.png");
    // map.wrapS = map.wrapT = THREE.RepeatWrapping;
    // map.repeat.set(8, 8);
    var color = 0xffffff;
    var ambient = 0x888888;
    // 添加一个作为平面的地面，以便更好地观察灯光
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: color,
        // ambient: ambient,
        map: map,
        side: THREE.DoubleSide
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -3;
    // 将网格添加到分组中
    group.add(mesh);
    mesh.castShadow = false;
    mesh.receiveShadow = true;


    // 创建立方体几何形状
    geometry = new THREE.CubeGeometry(2, 2, 2);
    // 然后将几何形状和材质整合到网格中
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: color,
        // ambient: ambient
    }));
    mesh.position.y = 6;
    mesh.rotation.y=-Math.PI / 2;
    mesh.rotation.x=-Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    // 将网格添加到分组中
    group.add(mesh);
    // 将网格持久化到变量中以便对其进行旋转操作
    var cube = mesh;
    // 创建球体几何形状
    geometry = new THREE.SphereGeometry(Math.sqrt(2), 50, 50);
    // 然后将几何形状和材质整合到网格中
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: color,
        // ambient: ambient
    }));
    mesh.position.y = 3;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    // 将网格添加到分组中
    group.add(mesh);
    // 创建圆锥几何形状
    geometry = new THREE.CylinderGeometry(1, 2, 2, 50, 10);
    // 然后将几何形状和材质整合到网格中
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: color,
        // ambient: ambient
    }));
    mesh.position.y = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    // 将网格添加到分组中
    group.add(mesh);
    // 现在将分组添加到场景中
    scene.add(root);
}

function render(scene, camera, renderer) {
    requestAnimationFrame(render.bind(this, scene, camera, renderer));
    renderer.render(scene, camera);
}

function init() {
    var renderer = initRender();
    var camera = initCamera();
    var scene = initScene();
    initObject(scene);
    render(scene, camera, renderer);
}
init();