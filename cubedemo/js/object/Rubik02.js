import * as THREE from '../three/build/three.js';
const BasicParams = {
    x: 0,
    y: 0,
    z: 0,
    layerNum: 3,
    cubeWidth: 50,
    //右、左、上、下、前、后
    colors: ['#ff6b02', '#dd422f',
        '#ffffff', '#fdcd02',
        '#3d81f7', '#019d53'
    ]
};

/**
 * [createFace 创建单个方块一面的贴片图片]
 * @param  {} rgbaColor 填充的颜色
 * @return {[type]}           [description]
 */
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
/**
 * [createRubik 创建魔方]
 * @param  {} x         魔方原点位置X
 * @param  {[type]} y         魔方原点位置y
 * @param  {[type]} z         魔方原点位置z
 * @param  {[type]} layerNum  魔方层级
 * @param  {[type]} cubeWidth 魔方宽度
 * @param  {[type]} colors    魔方颜色数组
 * @return {[type]}           [description]
 */
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

/**
 * [createTransparencyMesh 创建透明的外层正方体]
 * @param  {[type]} cubeWidth 宽度
 * @return {[type]}           [description]
 */
function createTransparencyMesh(x,y,z,cubeWidth) {
    let cubegeo = new THREE.BoxGeometry(cubeWidth, cubeWidth, cubeWidth);
    var hex = 0x000000;
    var cubemat = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        opacity: 0,
        transparent: true
    });
    var cube = new THREE.Mesh(cubegeo, cubemat);
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z =z;
    return cube;
}

export default class Rubik {
    judgeTurnFn = {
        'front':function(cubeIndex){
            return parseInt(cubeIndex/9) === 0;
        },
        'back':function(cubeIndex){
            return parseInt(cubeIndex/9) === 2;
        },
        'frontMid':function(cubeIndex){
            return parseInt(cubeIndex/9) === 1;
        },
        'left':function(cubeIndex){
            return cubeIndex%3 === 0;
        },
        'leftMid':function(cubeIndex){
            return cubeIndex%3 === 1;
        },
        'right':function(cubeIndex){
            return cubeIndex%3 === 2;
        },
        'up':function(cubeIndex){
            return parseInt(cubeIndex%9/3) === 0;
        },
        'upMid':function(cubeIndex){
            return parseInt(cubeIndex%9/3) === 1;
        },
        'down':function(cubeIndex){
            return parseInt(cubeIndex%9/3) === 2;
        }
    };
    constructor(main) {
        this.main = main;
        //默认转动动画时长
        this.defaultTotalTime = 250;
        //魔方的六个转动方向
        this.xLine = new THREE.Vector3(1, 0, 0);
        this.xLineAd = new THREE.Vector3(-1, 0, 0);
        this.yLine = new THREE.Vector3(0, 1, 0);
        this.yLineAd = new THREE.Vector3(0, -1, 0);
        this.zLine = new THREE.Vector3(0, 0, 1);
        this.zLineAd = new THREE.Vector3(0, 0, -1);
    }
    model(type) {
        this.group = new THREE.Group();
        this.group.childType = type;
        this.initStatus = [];

        this.cubes = createRubik(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.layerNum, BasicParams.cubeWidth, BasicParams.colors); //生成魔方小正方体
        for (var i = 0; i < this.cubes.length; i++) {
            var item = this.cubes[i];
            item.name = 'smallCube';
            item.cubeIndex = item.id;
            // this.main.scene.add(item);
            /**
             * 由于筛选运动元素时是根据物体的id规律来的；
             * 但是滚动之后位置发生了变化；
             * 再根据初始规律筛选会出问题，而且id是只读变量；
             * 所以这里给每个物体设置一个额外变量cubeIndex；
             * 每次滚动之后更新根据初始状态更新该cubeIndex；
             * 让该变量一直保持初始规律即可。
             */
            this.initStatus.push({
                x: item.position.x,
                y: item.position.y,
                z: item.position.z,
                cubeIndex: item.id
            });
            this.group.add(item);
        }

        this.group.typeName = type;
        this.container = createTransparencyMesh(BasicParams.x, BasicParams.y, BasicParams.z,(BasicParams.cubeWidth + 1) * BasicParams.layerNum);
        this.container.name = 'coverCube';
        this.group.add(this.container);

        this.main.scene.add(this.group);

        //进行一定的旋转变换保证三个面可见
        if (type === 'front') {
            this.group.rotateY(45 / 180 * Math.PI);
        } else if (type === 'back') {
            this.group.rotateY((45 + 180) / 180 * Math.PI);
        }
        // rotateOnAxis(axis,angle);
        this.group.rotateOnAxis(new THREE.Vector3(1, 0, 1), 25 / 180 * Math.PI);
        this.getMinCubeIndex();
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
    /**
     * [updateCubeIndex 更新各个小方块实际所处的位置（cubeIndex）]
     * @param  {[type]} elements [description]
     * @return {[type]}          [description]
     */
    updateCubeIndex(elements) {
        for (var i = 0; i < elements.length; i++) {
            var temp1 = elements[i];
            for (var j = 0; j < this.initStatus.length; j++) {
                var temp2 = this.initStatus[j];
                if (Math.abs(temp1.position.x - temp2.x) <= BasicParams.cubeWidth / 2 &&
                    Math.abs(temp1.position.y - temp2.y) <= BasicParams.cubeWidth / 2 &&
                    Math.abs(temp1.position.z - temp2.z) <= BasicParams.cubeWidth / 2) {
                    temp1.cubeIndex = temp2.cubeIndex;
                    break;
                }
            }
        }
    }
    /**
     * 获取最小索引值
     */
    getMinCubeIndex() {
        var ids = [];
        for (var i = 0; i < this.cubes.length; i++) {
            ids.push(this.cubes[i].cubeIndex);
        }
        this.minCubeIndex = Math.min.apply(null, ids);
    }
    rotateAroundWorldAxis(p, vector, rad) {
        vector.normalize();
        var u = vector.x;
        var v = vector.y;
        var w = vector.z;

        var a = p.x;
        var b = p.y;
        var c = p.z;

        var matrix4 = new THREE.Matrix4();

        matrix4.set(u * u + (v * v + w * w) * Math.cos(rad), u * v * (1 - Math.cos(rad)) - w * Math.sin(rad), u * w * (1 - Math.cos(rad)) + v * Math.sin(rad), (a * (v * v + w * w) - u * (b * v + c * w)) * (1 - Math.cos(rad)) + (b * w - c * v) * Math.sin(rad),
            u * v * (1 - Math.cos(rad)) + w * Math.sin(rad), v * v + (u * u + w * w) * Math.cos(rad), v * w * (1 - Math.cos(rad)) - u * Math.sin(rad), (b * (u * u + w * w) - v * (a * u + c * w)) * (1 - Math.cos(rad)) + (c * u - a * w) * Math.sin(rad),
            u * w * (1 - Math.cos(rad)) - v * Math.sin(rad), v * w * (1 - Math.cos(rad)) + u * Math.sin(rad), w * w + (u * u + v * v) * Math.cos(rad), (c * (u * u + v * v) - w * (a * u + b * v)) * (1 - Math.cos(rad)) + (a * v - b * u) * Math.sin(rad),
            0, 0, 0, 1);

        return matrix4;
    }
    getTurnBoxs(gesture){
        var elements = [];
        var elementIndexs = [];
        var judgeFn = this.judgeTurnFn[gesture];
        if (!judgeFn) {
            return [];
        }
        for (var i = 0; i < this.cubes.length; i++) {
            var cube = this.cubes[i];
            var cubeIndex = cube.cubeIndex - this.minCubeIndex;
            if (judgeFn(cubeIndex)) {
                elements.push(cube);
                elementIndexs.push(cubeIndex);
            }
        }
        return elements;
    }
    rotateMove02(gesture,isAntiClock, callback, totalTime){
        isAntiClock = isAntiClock?-1:1;
        var elements = this.getTurnBoxs(gesture);
        totalTime = totalTime ? totalTime : this.defaultTotalTime;
        requestAnimationFrame((timestamp) =>{
            this.rotateAnimation02(elements, gesture,isAntiClock , timestamp, 0, 0, ()=> {
                this.updateCubeIndex(elements);
                if (callback) {
                    callback();
                }
            }, totalTime);
        });
    }
    rotateAnimation02(elements, gesture,isAntiClock, currentstamp, startstamp, laststamp, callback, totalTime){
        var isAnimationEnd = false; //动画是否结束

        if (startstamp === 0) {
            startstamp = currentstamp;
            laststamp = currentstamp;
        }
        if (currentstamp - startstamp >= totalTime) {
            isAnimationEnd = true;
            currentstamp = startstamp + totalTime;
        }
        var rotateMatrix = new THREE.Matrix4(); //旋转矩阵
        var origin = new THREE.Vector3(0, 0, 0);
        var xLine = new THREE.Vector3(1, 0, 0);
        var yLine = new THREE.Vector3(0, 1, 0);
        var zLine = new THREE.Vector3(0, 0, 1);
        switch(gesture) {
            case 'front':
            case 'frontMid':
            case 'back':
                rotateMatrix = this.rotateAroundWorldAxis(origin, zLine, isAntiClock*90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                break;
            case 'left':
            case 'leftMid':
            case 'right':
                rotateMatrix = this.rotateAroundWorldAxis(origin, xLine, isAntiClock*90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                
                break;
            case 'up':
            case 'upMid':
            case 'down':
                rotateMatrix = this.rotateAroundWorldAxis(origin, yLine, isAntiClock*90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
                break;
        }
        

        for (var i = 0; i < elements.length; i++) {
            elements[i].applyMatrix(rotateMatrix);
        }
        if (!isAnimationEnd) {
            requestAnimationFrame((timestamp) =>{
                this.rotateAnimation02(elements, gesture,isAntiClock, timestamp, startstamp, currentstamp, callback, totalTime);
            });
        } else {
            callback();
        }
    }
    getGesture(sub, normalize){

    }
    getLocal2WorldVector(point){
        var center = new THREE.Vector3(0, 0, 0);
        var matrix = this.group.matrixWorld; //魔方的在世界坐标系的变换矩阵
        center.applyMatrix4(matrix);
        point.applyMatrix4(matrix);
        return point.sub(center);
    }
}