import * as THREE from '../three/build/three.js';
const BasicParams = {
    x: 0,
    y: 0,
    z: 0,
    layerNum: 4,
    cubeWidth: 30,
    //右、左、上、下、前、后
    colors: ['#ff6b02', '#dd422f',
        '#ffffff', '#fdcd02',
        '#3d81f7', '#019d53'
    ]
};

function createFace(rgbaColor) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var context = canvas.getContext('2d');
    //画一个宽高都是256的黑色正方形
    context.fillStyle = 'rgba(0,0,0,1)';
    context.fillRect(0, 0, 256, 256);
    //在内部用某颜色的16px宽的线再画一个宽高为224的圆角正方形并用改颜色填充
    context.rect(16, 16, 224, 224);
    context.lineJoin = 'round';
    context.lineWidth = 16;
    context.fillStyle = rgbaColor;
    context.strokeStyle = rgbaColor;
    context.stroke();
    context.fill();
    return canvas;
}

function createRubik(x, y, z, layerNum, cubeWidth, colors) {
    let cubes = [];
    let leftUpCx = x - (layerNum / 2 - 0.5) * cubeWidth;
    let leftUpCy = y + (layerNum / 2 - 0.5) * cubeWidth;
    let leftUpCz = z + (layerNum / 2 - 0.5) * cubeWidth;
    // 每层
    for (let i = 0; i < layerNum; i++) {
        // 一层9个
        // 材质
        for (let j = 0; j < layerNum * layerNum; j++) {
            var materials = [];
            for (var k = 0; k < 6; k++) {
                let face = createFace(colors[k]);
                let texture = new THREE.Texture(face);
                texture.needsUpdate = true;
                let material = new THREE.MeshLambertMaterial({
                    map: texture
                });
                materials.push(material);
            }
            
            let cubegeo = new THREE.BoxGeometry(cubeWidth, cubeWidth, cubeWidth);
            let cube = new THREE.Mesh(cubegeo, materials);
            //x,y,z为魔方中心的位置
            cube.position.x = leftUpCx + (j % layerNum) * cubeWidth;
            cube.position.y = leftUpCy - parseInt(j / layerNum) * cubeWidth;
            cube.position.z = leftUpCz - i * cubeWidth;
            cubes.push(cube);
        }
    }
    return cubes;

}
export default class Rubik {
    constructor(main) {
        this.main = main;
    }
    model(type) {
        this.group = new THREE.Group();
        this.group.childType = type;
        this.cubes = createRubik(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.layerNum, BasicParams.cubeWidth, BasicParams.colors); //生成魔方小正方体
        for (var i = 0; i < this.cubes.length; i++) {
            var item = this.cubes[i];
            // this.main.scene.add(item);
            this.group.add(item);
        }
        this.main.scene.add(this.group);
        //进行一定的旋转变换保证三个面可见
        if(type === 'font'){
            this.group.rotateY(45/180*Math.PI);
        }else if(type === 'back'){
            this.group.rotateY((45+180) / 180 * Math.PI);
        }
        // rotateOnAxis(axis,angle);
        this.group.rotateOnAxis(new THREE.Vector3(1, 0, 1), 25 / 180 * Math.PI);
    }
    resizeHeight(percent, transformTag) {
        if (percent < this.main.minPercent) {
          percent = this.main.minPercent;
        }
        if (percent > (1 - this.main.minPercent)) {
          percent = 1 - this.main.minPercent;
        }
        this.group.scale.set(percent, percent, percent);
        this.group.position.y = this.main.originHeight * (0.5 - percent / 2) * transformTag;
    }
}