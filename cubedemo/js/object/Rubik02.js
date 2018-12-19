import * as THREE from '../three/build/three.js';
import Kociemba from '../algorithm/Kociemba.js';
const BasicParams = {
    x: 0,
    y: 0,
    z: 0,
    layerNum: 4,
    cubeWidth: 50,
    //右、左、上、下、前、后
    //橙 红 白 黄 蓝 绿
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
    let canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    let context = canvas.getContext('2d');
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
    // 左上角的小方块的中心点位置
    let leftUpCx = x - (layerNum / 2 - 0.5) * cubeWidth;
    let leftUpCy = y + (layerNum / 2 - 0.5) * cubeWidth;
    let leftUpCz = z + (layerNum / 2 - 0.5) * cubeWidth;
    // 每层
    for (let i = 0; i < layerNum; i++) {
        // 一层9个
        // 材质
        for (let j = 0; j < layerNum * layerNum; j++) {
            // 生成材质贴片，每个面一个颜色
            let materials = [];
            for (let k = 0; k < 6; k++) {
                let face = createFace(colors[k]);
                let texture = new THREE.Texture(face);
                texture.needsUpdate = true;
                let material = new THREE.MeshLambertMaterial({
                    map: texture,
                });
                materials.push(material);
            }
            // 创建小方块形状
            let cubegeo = new THREE.BoxGeometry(cubeWidth, cubeWidth, cubeWidth);
            // 生成小方块
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
 * [createTransparencyMesh 创建透明的外层正方体，主要是确定触摸时所在面]
 * @param  {[type]} cubeWidth 宽度
 * @return {[type]}           [description]
 */
function createTransparencyMesh(x, y, z, cubeWidth) {
    let cubegeo = new THREE.BoxGeometry(cubeWidth, cubeWidth, cubeWidth);
    let cubemat = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        opacity: 0,
        transparent: true
    });
    let cube = new THREE.Mesh(cubegeo, cubemat);
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    return cube;
}

export default class Rubik {
    // 判断小方块是否在对应层 函数map
    judgeTurnFnMap = {
        'zLine': (layerIndex, cubeIndex) => {
            let num = this.params.layerNum * this.params.layerNum;
            return parseInt(cubeIndex / num) === layerIndex;
        },
        'xLine': (layerIndex, cubeIndex) => {
            return cubeIndex % this.params.layerNum === layerIndex;
        },
        'yLine': (layerIndex, cubeIndex) => {
            let num1 = this.params.layerNum;
            let num2 = num1 * num1;
            return parseInt(cubeIndex % num2 / num1) === layerIndex;
        }
    };
    // 根据小方块的cubeIndex，确定它在对应轴层中的哪一层
    getLayerIndexFnMap = {
        'zLine': (cubeIndex) => {
            let num = this.params.layerNum * this.params.layerNum;
            return parseInt(cubeIndex / num);
        },
        'xLine': (cubeIndex) => {
            return cubeIndex % this.params.layerNum;
        },
        'yLine': (cubeIndex) => {
            let num1 = this.params.layerNum;
            let num2 = num1 * num1;
            return parseInt(cubeIndex % num2 / num1);
        }
    };
    getFaceIndexFnMap = {
        'F': (cubeIndex) => {
            return cubeIndex;
        },
        'B': (cubeIndex) => {
            let num = this.params.layerNum * this.params.layerNum;
            let result =  cubeIndex - num*2;
            // todo 有什么逻辑可以适应还原的字符串的内容
            // arr 是还原字符串对应cubeIndex归9化后的对应值
            let arr = [2,1,0,5,4,3,8,7,6];
            return arr[result];

        },
        'U':(cubeIndex)=>{
            let num1 = this.params.layerNum;
            let num2 = num1 * num1;
            let layerIndex = parseInt(cubeIndex / num2);
            let num3 = num2-num1;
            let result = cubeIndex - num3 * layerIndex;
            let arr = [6,7,8,3,4,5,0,1,2];
            return arr[result];
        },
        'D':(cubeIndex)=>{
            let num1 = this.params.layerNum;
            let num2 = num1 * num1;
            let layerIndex = parseInt(cubeIndex / num2);
            let num3 = num2 - num1;
            return cubeIndex - num3 * (layerIndex + 1);
        },
        'L':(cubeIndex)=>{
            let num1 = parseInt(cubeIndex / this.params.layerNum);
            let result = cubeIndex - num1 * (this.params.layerNum - 1);
            let arr = [2,5,8,1,4,7,0,3,6];
            return arr[result];
        },
        'R':(cubeIndex)=>{
            let num1 = parseInt(cubeIndex / this.params.layerNum) + 1;
            let result = cubeIndex - num1 * (this.params.layerNum - 1);
            let arr = [0, 3, 6, 1, 4, 7, 2, 5, 8];
            return arr[result];
        }
    };


    constructor(main, layerNum) {
        this.main = main;
        //默认转动动画时长
        this.defaultTotalTime = 250;
        // 方块中心点？？ todo
        this.origin = new THREE.Vector3(0, 0, 0);
        //魔方的六个转动方向
        this.xLine = new THREE.Vector3(1, 0, 0);
        this.yLine = new THREE.Vector3(0, 1, 0);
        this.zLine = new THREE.Vector3(0, 0, 1);
        this.params = Object.assign({}, BasicParams, {
            layerNum
        });
        // if (this.params.layerNum * this.params.cubeWidth>150) {
        //     this.params.cubeWidth = parseInt(150/this.params.layerNum);
        // }
        this.params.cubeWidth = parseInt(150 / this.params.layerNum);
        this.ThirdGestureMap = {
            'F': this.stringifyGesture('zLine', 0, 0),
            'FA': this.stringifyGesture('zLine', 0, 1),
            'B': this.stringifyGesture('zLine', 2, 1),
            'BA': this.stringifyGesture('zLine', 2, 0),
            'U': this.stringifyGesture('yLine', 0, 0),
            'UA': this.stringifyGesture('yLine', 0, 1),
            'D': this.stringifyGesture('yLine', 2, 1),
            'DA': this.stringifyGesture('yLine', 2, 0),
            'R': this.stringifyGesture('xLine', 2, 0),
            'RA': this.stringifyGesture('xLine', 2, 1),
            'L': this.stringifyGesture('xLine', 0, 1),
            'LA': this.stringifyGesture('xLine', 0, 0),
        };
    }
    /**
     * [model 初始化魔方]
     * @param  {string} type 魔方类型 front|back
     * @return {[type]}      [description]
     */
    model(type = 'front') {
        // 存放小方块的组
        this.group = new THREE.Group();
        this.group.typeName = type;
        // 初始状态下，对应的位置和cubeIndex
        this.initStatus = [];
        // 生成魔方小方块
        this.cubes = createRubik(this.params.x, this.params.y, this.params.z, this.params.layerNum, this.params.cubeWidth, this.params.colors);
        // 获取小方块的最小索引值
        this.getMinCubeIndex();
        // 逐个小方块加入group
        for (var i = 0; i < this.cubes.length; i++) {
            var item = this.cubes[i];
            item.name = 'smallCube';
            item.cubeIndex = item.id - this.minCubeIndex;
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
                cubeIndex: item.cubeIndex
            });
            this.group.add(item);
        }
        // 外层透明大方块
        this.container = createTransparencyMesh(this.params.x, this.params.y, this.params.z, (this.params.cubeWidth + 1) * this.params.layerNum);
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
    }
    /**
     * [resizeHeight 设置魔法在场景中的大小位置]
     * @param  {} percent      [缩放比]
     * @param  {[type]} transformTag [对应位置 1 -1]
     * @return {[type]}              [description]
     */
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
        for (let i = 0; i < elements.length; i++) {
            let temp1 = elements[i];
            for (let j = 0; j < this.initStatus.length; j++) {
                let temp2 = this.initStatus[j];
                // 位置相等的时候，就认为这是小方块新位置索引cubeIndex
                if (Math.abs(temp1.position.x - temp2.x) <= this.params.cubeWidth / 2 &&
                    Math.abs(temp1.position.y - temp2.y) <= this.params.cubeWidth / 2 &&
                    Math.abs(temp1.position.z - temp2.z) <= this.params.cubeWidth / 2) {
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
        let ids = [];
        for (let i = 0; i < this.cubes.length; i++) {
            ids.push(this.cubes[i].id);
        }
        this.minCubeIndex = Math.min.apply(null, ids);
    }
    /**
     * [rotateAroundWorldAxis 获取实际的转动矩阵]
     * @param  {[type]} p      [description]
     * @param  {[type]} vector [description]
     * @param  {[type]} rad    [description]
     * @return {[type]}        [description]
     */
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
    /**
     * [getTurnBoxs 获取转动的小方块]
     * @param  {[type]} gesture [对应的手势]
     * @return {[type]}         [description]
     */
    getTurnBoxs(gesture) {
        // gesture = 'xLine_0'
        // 存放转动小方块的数组
        let elements = [];
        let elementIndexs = [];
        // 获取转动的轴，和层级
        let {
            turnAxis,
            layerIndex
        } = this.parseGesture(gesture);
        // 获取判断函数
        if (layerIndex === -1) {
            return this.cubes;
        }
        let judgeFn = this.judgeTurnFnMap[turnAxis];
        if (!judgeFn) {
            return [];
        }
        for (let i = 0; i < this.cubes.length; i++) {
            let cube = this.cubes[i];
            let cubeIndex = cube.cubeIndex;
            if (judgeFn(layerIndex, cubeIndex)) {
                elements.push(cube);
                elementIndexs.push(cubeIndex);
            }
        }
        return elements;
    }
    // 根据手势获取绕旋转的轴
    getTurnLineVector(gesture) {

        let {
            turnAxis
        } = this.parseGesture(gesture);
        let lineVector;
        switch (turnAxis) {
            case 'xLine':
                lineVector = this.xLine;
                break;
            case 'zLine':
                lineVector = this.zLine;
                break;
            case 'yLine':
                lineVector = this.yLine;
        }
        return lineVector;
    }
    /**
     * [rotateMove 旋转移动]
     * @param  {}   gesture     手势
     * @param  {Function} callback    回调函数
     * @param  {[type]}   totalTime   动画时间
     * @return {[type]}               [description]
     */
    rotateMove(gesture, callback, totalTime) {
        if (this.rotating) {
            return;
        }
        this.rotating = true;
        let {
            isAntiClock
        } = this.parseGesture(gesture);
        isAntiClock = isAntiClock ? 1 : -1;
        // 获取旋转的小方块
        let elements = this.getTurnBoxs(gesture);
        // 旋转方向轴
        let lineVector = this.getTurnLineVector(gesture);
        // 动画时间
        totalTime = totalTime ? totalTime : this.defaultTotalTime;
        requestAnimationFrame((timestamp) => {
            // 旋转动效
            this.rotateAnimation(elements, lineVector, isAntiClock, timestamp, 0, 0, () => {
                // 完成后更新小方块索引值
                this.updateCubeIndex(elements);
                this.rotating = false;
                if (callback) {
                    callback();
                }
            }, totalTime);
        });
    }
    rotateMoveFromList(gestureList,cb){
        let i = 0;
        let rotateFn = (faceGesture) => {
            let gesture = this.ThirdGestureMap[faceGesture];
            this.rotateMove(gesture, () => {
                i++;
                if (i < gestureList.length) {
                    rotateFn(gestureList[i]);
                } else {
                    if (typeof cb === 'function') {
                        cb();
                    }
                }
            });
        }
        rotateFn(gestureList[i]);
    }
    /**
     * [rotateAnimation 旋转动画]
     * @param  {[type]}   elements     [旋转小方块]
     * @param  {[type]}   lineVector   [旋转轴]
     * @param  {Boolean}  isAntiClock  [旋转方向]
     * @param  {[type]}   currentstamp [当前时间]
     * @param  {[type]}   startstamp   [开始时间]
     * @param  {[type]}   laststamp    [上一次的时间]
     * @param  {Function} callback     [回调函数]
     * @param  {[type]}   totalTime    [总时间]
     * @return {[type]}                [description]
     */
    rotateAnimation(elements, lineVector, isAntiClock, currentstamp, startstamp, laststamp, callback, totalTime) {
        var isAnimationEnd = false; //动画是否结束

        if (startstamp === 0) {
            // 起始时间赋值
            startstamp = currentstamp;
            laststamp = currentstamp;
        }
        if (currentstamp - startstamp >= totalTime) {
            isAnimationEnd = true;
            currentstamp = startstamp + totalTime;
        }
        var rotateMatrix = new THREE.Matrix4(); //旋转矩阵
        rotateMatrix = this.rotateAroundWorldAxis(this.origin, lineVector, isAntiClock * 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);

        for (let i = 0; i < elements.length; i++) {
            elements[i].applyMatrix(rotateMatrix);
        }
        if (!isAnimationEnd) {
            requestAnimationFrame((timestamp) => {
                this.rotateAnimation(elements, lineVector, isAntiClock, timestamp, startstamp, currentstamp, callback, totalTime);
            });
        } else {
            callback();
        }
    }
    /**
     * [getGesture 获取手势]
     * @param  {[type]} sub       [滑动的向量]
     * @param  {[type]} normalize [触摸面的法向量]
     * @param  {[type]} cubeIndex [触摸的小方块索引值]
     * @return {[type]}           [description]
     */
    getGesture(sub, normalize, cubeIndex) {
        // 因为getLocal2WorldVector会改变参数值，所以用clone
        // 本地坐标轴方向
        let localLines = {
            x: this.xLine.clone(),
            y: this.yLine.clone(),
            z: this.zLine.clone()
        };
        // sub 和各轴之间的夹角最小值 夹角不过PI
        let minAngle = Math.PI + 1;
        // 法向量的轴类型
        let normalizeLineType;
        // 法向量的轴方向
        let normalizeLineValue;
        // 触摸向量的最近轴
        let touchLineType;
        // 触摸向量的轴方向
        let touchLineValue;
        // 旋转轴
        let turnAxis;
        // 是否逆时针
        let isAntiClock;

        for (let k in localLines) {
            if (localLines.hasOwnProperty(k)) {
                let localLine = localLines[k];
                // 法向量和轴向量的夹角为0或PI，则认为法向量在对应轴上
                let normalizeAngle = normalize.angleTo(localLine);
                // 法向量方向所在轴确定
                if (normalizeAngle === Math.PI) {
                    normalizeLineType = k;
                    normalizeLineValue = 0;
                } else if (normalizeAngle === 0) {
                    normalizeLineType = k;
                    normalizeLineValue = 1;
                }
                // 滑动方向所在轴确定
                let worldLine = this.getLocal2WorldVector(localLine);
                // 单个轴和滑动向量的夹角
                let singleLineangle = sub.angleTo(worldLine);
                // 夹角和补角的最小值
                let angle = Math.min(singleLineangle, Math.PI - singleLineangle);
                if (angle < minAngle) {
                    // 确定最小夹角所在的轴和方向
                    minAngle = angle;
                    touchLineType = k;
                    touchLineValue = (singleLineangle === angle) ? 1 : 0;
                }
            }
        }

        let lines = ['x', 'y', 'z', 'x'];
        for (let i = 0; i < lines.length; i++) {
            // 滑动向量所在轴和法向量所在轴以外的轴就是旋转轴
            let isInclude = [touchLineType, normalizeLineType].includes(lines[i]);
            if (!isInclude) {
                turnAxis = lines[i] + 'Line';
                break;
            }
        }
        // 枚举得到的情况表
        // touchLine normalizeLine isAntiClock(逆方向旋转)
        // x y         y z         z x     
        // 1 1 0       1 1 0       1 1 0       
        // 1 0 1       1 0 1       1 0 1 
        // 0 1 1       0 1 1       0 1 1
        // 0 0 0       0 0 0       0 0 0
        // x z         y x         z y
        // 1 1 1       1 1 1       1 1 1
        // 1 0 0       1 0 0       1 0 0
        // 0 1 0       0 1 0       0 1 0
        // 0 0 1       0 0 1       0 0 1
        // 找到滑动向量所在轴的索引
        let touchLineIndex = lines.indexOf(touchLineType);
        // 如果“法向量所在轴”是“滑动向量所在轴”的下一个，则规律满足条件1 xy/yz/zx
        let isCondition = (normalizeLineType === lines[touchLineIndex + 1]) ? 0 : 1;
        // 规律
        isAntiClock = (touchLineValue === normalizeLineValue) ? isCondition : (+!isCondition);
        // 根据已知的旋转轴和小方块索引，确定旋转层
        let getLayerIndexFn = this.getLayerIndexFnMap[turnAxis];
        let layerIndex = getLayerIndexFn(cubeIndex);
        let gesture = this.stringifyGesture(turnAxis, layerIndex, isAntiClock);
        return gesture;
    }
    getWholeGesture(sub, typeName) {
        let angle = sub.angle();
        angle = angle / Math.PI * 180 + 30;
        if (angle >= 360) {
            angle = angle - 360;
        }
        let turnAxis;
        let isAntiClock;
        let layerIndex = '-1';
        switch (true) {
            case angle >= 0 && angle <= 60:
                // 3点方向
                turnAxis = 'yLine';
                isAntiClock = 1;
                break;
            case angle > 180 && angle <= 240:
                // 9点方向
                turnAxis = 'yLine';
                isAntiClock = 0;
                break;
            case angle > 60 && angle <= 120:
                // 2点方向
                turnAxis = 'zLine';
                isAntiClock = 0;
                break;
            case angle > 240 && angle <= 300:
                // 8点方向
                turnAxis = 'zLine';
                isAntiClock = 1;
                break;
            case angle > 120 && angle <= 180:
                // 11点方向
                turnAxis = 'xLine';
                isAntiClock = 0;
                break;
            case angle > 300 && angle <= 360:
                // 5点方向
                turnAxis = 'xLine';
                isAntiClock = 1;
                break;
        }
        if (typeName === 'back' && (turnAxis === 'zLine' || turnAxis === 'xLine')) {
            isAntiClock = !isAntiClock;
            turnAxis = turnAxis === 'zLine' ? 'xLine' : 'zLine';
        }
        let gesture = this.stringifyGesture(turnAxis, layerIndex, isAntiClock);
        // console.log(gesture);
        return gesture;
    }
    /**
     * [getLocal2WorldVector 从本地坐标转为世界坐标]
     * @param  {[type]} point [本地坐标]
     * @return {[type]}       [description]
     */
    getLocal2WorldVector(point) {
        let center = this.origin.clone();
        let matrix = this.group.matrixWorld; //魔方的在世界坐标系的变换矩阵
        center.applyMatrix4(matrix);
        point.applyMatrix4(matrix);
        return point.sub(center);
    }
    /**
     * [getRandomGestureList 随机手势数列，用于打乱]
     * @return {[type]} [description]
     */
    getRandomGestureList() {
        // let {
        //     layerNum
        // } = this.params;
        // let turnAxisArr = ['xLine', 'yLine', 'zLine'];
        // let randomGestureList = [];
        // for (let i = 0; i < layerNum * 7; i++) {
        //     let turnIndex = Math.floor(Math.random() * 3);
        //     let turnAxis = turnAxisArr[turnIndex];
        //     let isAntiClock = Math.round(Math.random());
        //     let turnLayerNum = Math.floor(Math.random() * layerNum);
        //     if (turnLayerNum === Math.floor(layerNum / 2)) {
        //         // 通常单数魔方是不转中心那一层的
        //         turnLayerNum = 0;
        //     }
        //     let gesture = this.stringifyGesture(turnAxis, turnLayerNum, isAntiClock);
        //     randomGestureList.push(gesture);
        // }
        // return randomGestureList;
        let {
            layerNum
        } = this.params;
        let arr = ['F','FA','B','BA','U','UA','D','DA','L','LA','R','RA'];
        let len = arr.length;
        let randomGestureList = [];
        for (let i = 0; i < layerNum * 7; i++) {
            let turnIndex = Math.floor(Math.random() * len);
            randomGestureList.push(arr[turnIndex]);
        }
        console.log(randomGestureList);
        return randomGestureList;
    }
    reset() {
        for (let i = 0; i < this.cubes.length; i++) {
            // 父类的矩阵
            let matrix = this.cubes[i].matrix.clone();
            // 逆反矩阵
            matrix.getInverse(matrix);
            let cube = this.cubes[i];
            cube.applyMatrix(matrix);
            for (let j = 0; j < this.initStatus.length; j++) {
                let status = this.initStatus[j];
                if ((cube.id - this.minCubeIndex) == status.cubeIndex) {
                    cube.position.x = status.x;
                    cube.position.y = status.y;
                    cube.position.z = status.z;
                    cube.cubeIndex = status.cubeIndex;
                    break;
                }
            }
        }
    }
    /**
     * [getCubeColorByNormal 获取小方块在世界坐标轴上的颜色]
     * @param  {[type]} cube   [description]
     * @param  {[type]} vector [世界坐标轴坐标]
     * @return {[type]}        [description]
     */
    getCubeColorByNormal(cube, vector) {
        // 计算射线在世界坐标原点，在小方块中的中心点的某一侧的width距离的位置
        let origin = new THREE.Vector3();
        cube.getWorldPosition(origin);
        let vec = vector.clone().multiplyScalar(-this.params.cubeWidth);
        origin.add(vec);
        // 方向标准化
        let direction = vector.clone().normalize();
        this.raycaster = this.raycaster || new THREE.Raycaster();
        this.raycaster.set(origin, direction);
        let intersect = this.raycaster.intersectObject(cube);
        if (intersect.length > 0) {
            let materialIndex = intersect[0].face.materialIndex;
            materialIndex += (materialIndex % 2) ? -1 : 1;
            return materialIndex;
        }
    }
    isRestore() {
        // let elements = this.getTurnBoxs('zLine_0_0');
        // let vector = new THREE.Vector3(0,0,1);
        let surfaces = ['F', 'B', 'L', 'R', 'U', 'D'];
        for (let i = 0; i < surfaces.length; i++) {
            let surface = surfaces[i];
            let gesture = this.ThirdGestureMap[surface];
            console.log(gesture);
            let {
                turnAxis,
                isAntiClock
            } = this.parseGesture(gesture);
            let vector = this[turnAxis].clone();
            if (isAntiClock) {
                vector.negate();
            }
            let elements = this.getTurnBoxs(gesture);
            let vec = this.getLocal2WorldVector(vector.clone());
            let faceMaterialIndex = this.getCubeColorByNormal(elements[0], vec);
            for (let j = 0; j < elements.length; j++) {
                let cubeMaterialIndex = this.getCubeColorByNormal(elements[j], vec);
                if (cubeMaterialIndex !== faceMaterialIndex) {
                    return false;
                }
            }
        }
        return true;
    }
    solve(){
        let surfaces = ['U', 'R', 'F', 'D', 'L', 'B'];
        let colorMap = {};
        let colors = [];
        let centerCube = '';
        for (let i = 0; i < this.cubes.length; i++) {
            if (this.cubes[i].cubeIndex === 13) {
                centerCube = this.cubes[i];
                break;
            }
        }
        // 拼凑出还原需要的字符串
        for (let i = 0; i < surfaces.length; i++) {
            let surface = surfaces[i];
            let gesture = this.ThirdGestureMap[surface];
            let {
                turnAxis,
                isAntiClock
            } = this.parseGesture(gesture);
            let vector = this[turnAxis].clone();
            if (isAntiClock) {
                vector.negate();
            }
            let elements = this.getTurnBoxs(gesture);
            let vec = this.getLocal2WorldVector(vector.clone());
            let centerFaceMaterialIndex = this.getCubeColorByNormal(centerCube, vec);
            colorMap[surface] = centerFaceMaterialIndex;
            let faceIndexFn = this.getFaceIndexFnMap[surface];
            let faceColors = new Array(6);
            for (let j = 0; j < elements.length; j++) {
                let cubeMaterialIndex = this.getCubeColorByNormal(elements[j], vec);
                let faceIndex = faceIndexFn(elements[j].cubeIndex);
                faceColors[faceIndex] = cubeMaterialIndex;
            }
            colors.push(faceColors.join(''));
        }
        // 解决还原方法中对字符串的顺序要求URFDLB
        let cubeStr = colors.join('');
        for (const key in colorMap) {
            if (colorMap.hasOwnProperty(key)) {
                let regExp = new RegExp(colorMap[key], 'g');
                cubeStr = cubeStr.replace(regExp, key);
            }
        }
        console.log(cubeStr);
        // 获取还原结果
        let result = Kociemba.solution(cubeStr);
        console.log(result);
        result = result.trim().replace(/\'/g, 'A').replace(/([FBUDLR])2/g, '$1 $1');
        console.log(result);
        let gestureList = result.split(' ');
        this.rotateMoveFromList(gestureList,()=>{
            console.log('over');
        });
    }
    destroy() {
        this.main.scene.remove(this.group);
    }
    /**
     * [parseGesture 解压手势]
     * @param  {[type]} gesture [description]
     * @return {[type]}         [description]
     */
    parseGesture(gesture) {
        let obj = gesture.split('_');
        return {
            turnAxis: obj[0],
            layerIndex: +obj[1],
            isAntiClock: +obj[2]
        }
    }
    stringifyGesture(turnAxis, layerIndex, isAntiClock) {
        let obj = [turnAxis, layerIndex, +isAntiClock];
        return obj.join('_');
    }
}