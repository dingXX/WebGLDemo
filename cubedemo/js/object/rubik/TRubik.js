import * as THREE from '../../three/build/three.js';
import {
    BasicParams,
    materialFaceOrder,
    resolveFaceOrder,
    turnAxisArray
} from './CONSTANT';
import BaseRubik from './BaseRubik';
import * as util from './util';

import Kociemba from '../../algorithm/Kociemba';
/**
 * 魔方类
 */
export default class TRubik extends BaseRubik {
    /**
     * 构造函数
     *
     * @param  {object} main     three舞台
     * @param  {number} layerNum 魔方层级
     *
     * @return {Rubik}          魔方实例
     */
    constructor(main, layerNum) {
        super(layerNum);
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
        this.params.cubeWidth = ~~(120 / layerNum);
    }
    /**
     * 初始化魔方
     * @param {string} type 魔方类型 front|back
     * @returns {void}
     */
    model(type = 'front') {
        // 存放小方块的组
        this.group = new THREE.Group();
        this.group.typeName = type;
        // 初始状态下，对应的位置和cubeIndex
        this.initStatus = [];
        let {
            x,
            y,
            z,
            layerNum,
            cubeWidth,
            colors
        } = this.params;
        this.cubes = this.createRubik({
            x,
            y,
            z
        }, layerNum, cubeWidth, colors);
        // 获取小方块的最小索引值
        let minCubeId = this.getMinCubeId();
        // 逐个小方块加入group
        this.cubes.forEach((cube, i) => {
            cube.name = 'smallCube';
            cube.cubeIndex = cube.id - minCubeId;
            /**
             * 由于筛选运动元素时是根据物体的id规律来的；
             * 但是滚动之后位置发生了变化；
             * 再根据初始规律筛选会出问题，而且id是只读变量；
             * 所以这里给每个物体设置一个额外变量cubeIndex；
             * 每次滚动之后更新根据初始状态更新该cubeIndex；
             * 让该变量一直保持初始规律即可。
             */
            this.initStatus.push({
                x: cube.position.x,
                y: cube.position.y,
                z: cube.position.z,
                cubeIndex: cube.cubeIndex
            });
            this.group.add(cube);
        });
        // 外层透明大方块
        this.container = util.createTransparencyMesh({
            x,
            y,
            z
        }, (cubeWidth + 1) * layerNum);
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
        this.isActive = true;
        this.getRubikStateFromStorage();
    }
    /**
     * 获取方块列表中的最小索引值
     * @returns {number} 最小索引值
     */
    getMinCubeId() {
        let ids = [];
        for (let i = 0; i < this.cubes.length; i++) {
            ids.push(this.cubes[i].id);
        }
        return Math.min.apply(null, ids);
    }
    /**
     * 创建魔方的各个方块
     *
     * @param  {object} position  魔方原点位置
     * @param  {number} position.x         魔方原点位置X
     * @param  {number} position.y         魔方原点位置Y
     * @param  {number} position.z         魔方原点位置Z
     * @param  {Number} layerNum  魔方层级
     * @param  {number} cubeWidth 魔方方块的宽度
     * @param  {array} colors     魔方颜色数组(右、左、上、下、前、后)
     *
     * @return {Array}           魔方小方块mesh实例数据
     */
    createRubik(position, layerNum, cubeWidth, colors) {
        let cubes = [];
        let {
            x,
            y,
            z
        } = position;
        // 左上角的小方块的中心点位置
        let leftUpCx = x - (layerNum / 2 - 0.5) * cubeWidth;
        let leftUpCy = y + (layerNum / 2 - 0.5) * cubeWidth;
        let leftUpCz = z + (layerNum / 2 - 0.5) * cubeWidth;
        // 生成材质贴片，每个面一个颜色
        let materials = [];
        for (let k = 0; k < 6; k++) {
            let face = util.createFace(colors[k]);
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
        let cubeDemo = new THREE.Mesh(cubegeo, materials);

        // 每层
        for (let i = 0; i < layerNum; i++) {
            // 一层9个
            // 材质
            for (let j = 0; j < layerNum * layerNum; j++) {
                let cube = cubeDemo.clone();
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
     * 设置魔方在场景中的大小位置
     * @param {number} percent 缩放比例
     * @param {number} transformTag 对应位置
     * @returns {void}
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
     * 获取手势
     *
     * @param  {vector3} sub       滑动的向量
     * @param  {vector3} normalize  触摸面的法向量
     * @param  {number} cubeIndex 触摸的小方块的索引
     *
     * @return {string}           旋转手势
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
        // 旋转层级
        let layerIndex;
        for (const k in localLines) {
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
        let axis = lines.find(line => {
            return ![touchLineType, normalizeLineType].includes(line);
        });
        turnAxis = `${axis}Line`;
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
        layerIndex = this.getLayerIndex(turnAxis, cubeIndex);
        let gesture = this.constructor.stringifyGesture(turnAxis, layerIndex, isAntiClock);
        console.log('gesture', gesture);
        return gesture;

    }
    /**
     * 获取转动整个魔方时的手势
     *
     * @param  {vector3} sub       滑动的向量
     * @param  {string} typeName 魔方名front|back
     *
     * @return {string}          手势名称
     */
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
        let gesture = this.constructor.stringifyGesture(turnAxis, layerIndex, isAntiClock);
        // console.log(gesture);
        return gesture;
    }
    /**
     * 从本地坐标转为世界坐标
     *
     * @param  {vector3} point 本地坐标
     *
     * @return {vector3}       世界坐标
     */
    getLocal2WorldVector(point) {
        let center = this.origin.clone();
        let matrix = this.group.matrixWorld; //魔方的在世界坐标系的变换矩阵
        center.applyMatrix4(matrix);
        point.applyMatrix4(matrix);
        return point.sub(center);
    }
    /**
     * 更新各个小方块实际所处的位置（ cubeIndex）
     * @param {array} cubes 小方块数组
     * @returns {void}
     */
    updateCubeIndex(cubes) {
        let initStatus = this.initStatus;
        cubes.forEach(cube => {
            let {
                x,
                y,
                z
            } = cube.position;
            // 位置相等的时候，就认为这是小方块新位置索引cubeIndex
            let cubeStatus = initStatus.find(temp => {
                let {
                    x: sx,
                    y: sy,
                    z: sz
                } = temp;
                let deta = this.params.cubeWidth / 2;
                return Math.abs(x - sx) <= deta && Math.abs(y - sy) <= deta && Math.abs(z - sz) <= deta;
            });
            if (cubeStatus) {
                cube.cubeIndex = cubeStatus.cubeIndex;
            }
        });
    }

    /**
     * 获取转动的小方块
     *
     * @param  {string} gesture 手势
     *
     * @return {Array}  需要操作的小方块数组      
     */
    getRotateCubesFromGesture(gesture) {
        // gesture = 'xLine_0'
        // 存放转动小方块的数组
        // 获取转动的轴，和层级
        let {
            turnAxis,
            layerIndex
        } = this.constructor.parseGesture(gesture);
        if (layerIndex === -1) {
            return this.cubes;
        }
        let cubes = this.cubes.filter(cube => {
            return this.getLayerIndex(turnAxis, cube.cubeIndex, layerIndex);
        });
        return cubes;
    }
    /**
     * 根据手势获取绕旋转的轴
     * @param {string} gesture 手势
     * @returns {vector3} 旋转轴向量
     */
    getRotateLineVector(gesture) {
        let {
            turnAxis
        } = this.constructor.parseGesture(gesture);
        return this[turnAxis];
    }
    /**
     * 旋转移动
     * @param {string} gesture 手势
     * @param {function} cb 旋转完成后的回调函数
     * @param {number} totalTime 动画时间
     * @returns {void}
     */
    rotateMove(gesture, cb, totalTime) {
        if (this.rotating) {
            return;
        }
        this.rotating = true;
        let {
            isAntiClock
        } = this.constructor.parseGesture(gesture);
        isAntiClock = isAntiClock ? 1 : -1;
        // 获取旋转的小方块
        let cubes = this.getRotateCubesFromGesture(gesture);
        // 旋转方向轴
        let lineVector = this.getRotateLineVector(gesture);
        // 动画时间
        totalTime = totalTime ? totalTime : this.defaultTotalTime;
        requestAnimationFrame((timestamp) => {
            // 旋转动效
            util.rotateAnimation(cubes, lineVector, isAntiClock, timestamp, 0, 0, () => {
                // 完成后更新小方块索引值
                this.updateCubeIndex(cubes);
                this.rotating = false;
                if (typeof cb === 'function') {
                    cb();
                }
            }, totalTime, this.origin);
        });
    }
    /**
     * 通过手势数组旋转魔方
     *
     * @param  {Array} gestureList 手势数组
     * @param  {function} cb          回调函数
     * @param  {number} time        单次旋转持续时间
     *
     * @return {void}
     */
    rotateMoveFromList(gestureList, cb, time) {
        let i = 0;
        let rotateFn = (faceGesture) => {
            // 先看看手势字符是否是面转动字符，不是的话，就直接使用
            let gesture = this.faceGestureEnum[faceGesture] || faceGesture;
            this.rotateMove(gesture, () => {
                i++;
                if (i < gestureList.length) {
                    rotateFn(gestureList[i]);
                } else {
                    if (typeof cb === 'function') {
                        cb();
                    }
                }
            }, time);
        };
        rotateFn(gestureList[i]);
    }
    /**
     * 获取随机手势数组，用于打乱
     * @returns {Array} 手势数组
     */
    getRandomGestureList() {
        let {
            layerNum
        } = this.params;
        let turnAxisArr = turnAxisArray;
        let randomGestureList = [];
        for (let i = 0; i < layerNum * 7; i++) {
            let turnIndex = Math.floor(Math.random() * 3);
            let turnAxis = turnAxisArr[turnIndex];
            let isAntiClock = Math.round(Math.random());
            let turnLayerNum = Math.floor(Math.random() * layerNum);
            if (turnLayerNum === Math.floor(layerNum / 2)) {
                // 通常单数魔方是不转中心那一层的
                turnLayerNum = 0;
            }
            let gesture = this.constructor.stringifyGesture(turnAxis, turnLayerNum, isAntiClock);
            randomGestureList.push(gesture);
        }
        return randomGestureList;
    }
    /**
     * 重置魔方
     * @returns {void}
     */
    reset() {
        this.cubes.forEach(cube => {
            let matrix = cube.matrix.clone();
            // 逆反矩阵
            matrix.getInverse(matrix);
            cube.applyMatrix(matrix);
            let cubeStatus = this.initStatus.find(item => cube.cubeIndex === item.cubeIndex);
            let {
                x,
                y,
                z
            } = cubeStatus;
            cube.position.x = x;
            cube.position.y = y;
            cube.position.z = z;
        });
        wx.removeStorage({
            key: `matrixStr${this.params.layerNum}`
        });
    }
    /**
     * 保存魔方状态到storage
     * @returns {void}
     */
    saveRubikStateToStorage() {
        let matrixList = this.cubes.map(cube => {
            let matrixObj = {
                i: cube.cubeIndex,
                m: cube.matrix.clone()
            };
            return matrixObj;
        });
        let matrixStr = JSON.stringify(matrixList);
        try {
            wx.setStorageSync(`matrixStr${this.layerNum}`, matrixStr);
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 获取魔方状态
     *
     * @return {void}
     */
    getRubikStateFromStorage() {
        let that = this;
        wx.getStorage({
            key: `matrixStr${this.layerNum}`,
            success(res) {
                let matrixList = res.data;
                if (matrixList) {
                    that.renderRubikState(JSON.parse(matrixList));
                }
            }
        });
    }
    /**
     * 绘制魔方状态
     * @param {array} matrixList 方块状态数组
     * @returns {void}
     */
    renderRubikState(matrixList) {
        this.cubes.forEach(cube => {
            let matrix = cube.matrix.clone();
            let cubeIndex = cube.cubeIndex;
            let {
                m,
                i
            } = matrixList[cubeIndex];
            // 逆反矩阵
            matrix.getInverse(matrix);
            // 复原到原点位置
            cube.applyMatrix(matrix);
            // 新的旋转状态
            cube.applyMatrix(m);
            cube.cubeIndex = i;
        });
    }
    /**
     * 获取魔方的面状态数组
     * @param {boolean} canResolve 转换为还原函数能接受的形式（面中间方块的颜色必须与面一致）
     * @returns {string} 返回以resolveFaceOrder排序的各面状态字符串
     */
    getRubikFaceStr(canResolve) {
        // 根据还原面数组的顺序逐一找各面的状态
        let faceStrArr = resolveFaceOrder.map(rFace => {
            let gesture = this.faceGestureEnum[rFace];
            // 找到这个面上的所以方块
            let cubes = this.getRotateCubesFromGesture(gesture);
            let {
                turnAxis,
                isAntiClock
            } = this.constructor.parseGesture(gesture);
            // 确定在世界坐标上的射线向量
            let vector = this[turnAxis].clone();
            if (isAntiClock) {
                vector.negate();
            }
            vector = this.getLocal2WorldVector(vector.clone());
            // 方块索引值转面能接受的索引大小值
            let cubeIndexToFaceIndexFn = this.cubeIndexToFaceIndexFnEnum[rFace];
            // 遍历方块， 找到其对应面的颜色， 再根据faceIndexArray确定这个颜色放在哪个位置
            let faceColors = new Array(this.layerNum * this.layerNum);
            cubes.forEach(cube => {
                // 确定颜色
                let faceMaterialIndex = this.getCubeMaterialIndex(cube, vector);
                let faceColor = materialFaceOrder[faceMaterialIndex];
                let resolveFaceIndex = cubeIndexToFaceIndexFn(cube.cubeIndex);
                faceColors[resolveFaceIndex] = faceColor;
            });
            return faceColors.join('');
        });
        if (canResolve) {
            return util.transfromRubikStrToResolve(faceStrArr.join(''));
        } else {
            return faceStrArr.join('');
        }
    }
    /**
     * 根据向量，确定方块的贴片索引值
     * @param {mesh} cube 方块实例
     * @param {vector3} vector 世界坐标上的向量
     * @returns {number} 方块的贴片索引值
     */
    getCubeMaterialIndex(cube, vector) {
        // 计算射线在世界坐标原点，在小方块中的中心点的某一侧的width距离的位置
        let origin = new THREE.Vector3();
        cube.getWorldPosition(origin);
        let vec = vector.clone().multiplyScalar(-this.params.cubeWidth);
        origin.add(vec);
        // 方向标准化
        let direction = vector.clone().normalize();
        // 定义射线
        this.raycaster = this.raycaster || new THREE.Raycaster();
        this.raycaster.set(origin, direction);
        // 射线穿过的实体
        let intersect = this.raycaster.intersectObject(cube);
        if (intersect.length > 0) {
            // todo
            let materialIndex = intersect[0].face.materialIndex;
            materialIndex += (materialIndex % 2) ? -1 : 1;
            return materialIndex;
        }
    }
    /**
     * 复原魔方
     * @returns {array} 复原的手势数组
     */
    solve() {
        if (![2, 3].includes(this.layerNum)) {
            return;
        }
        let rubikStr = this.getRubikFaceStr(1);
        if (this.isSolve(rubikStr)) {
            console.log('had solve');
            return;
        }
        // 获取还原结果
        let result = Kociemba.solution(rubikStr);
        console.log(result);
        result = result.trim().replace(/\'/g, 'A').replace(/([FBUDLR])2/g, '$1 $1');
        if (result.match('Error')) {
            // todo 出错了
            return;
        }
        let gestureList = result.split(' ');
        return gestureList;
    }
    /**
     * 是否已复原
     * @param {string} rubikStr 魔方状态字符串
     * @returns {boolean} 是否已复原
     */
    isSolve(rubikStr){
        let strArr = util.sliceRubikStr(rubikStr);
        return strArr.every(fStr => {
            let exp = new RegExp(fStr[0],'g');
            return !fStr.replace(exp, '');
        });
    }
    /**
     * 将魔方字符串状态转为魔方旋转矩阵状态
     *
     * @param {string} rubikStr 魔方字符串
     * @return {object} 魔方旋转矩阵对象数组
     */
    rubikStr2rubikState(rubikStr) {
        let rubikStrArr = util.sliceRubikStr(rubikStr);
        let matrixs = this.initStatus.map(cubeStatus => {
            let {
                cubeIndex,
                x,
                y,
                z
            } = cubeStatus;
            let outFaceState = [];
            let {
                cubeIndexToFaceIndexFnEnum
            } = this;
            // 每个面遍历一遍，找出方块外层面
            resolveFaceOrder.forEach((face, i) => {
                let gesture = this.faceGestureEnum[face];
                let {
                    turnAxis,
                    layerIndex
                } = this.constructor.parseGesture(gesture);
                // 方块不在面上
                if (!this.getLayerIndex(turnAxis, cubeIndex, layerIndex)) {
                    return;
                }
                let faceIndex = cubeIndexToFaceIndexFnEnum[face](cubeIndex);
                let faceValue = rubikStrArr[i].slice(faceIndex, faceIndex + 1);
                outFaceState.push({
                    face: face,
                    color: faceValue
                });
            });
            // 确定单个cube有哪些对外的面
            console.log(cubeIndex, JSON.stringify(outFaceState));
            let matrix = util.getMatrixFromFaceStatus(outFaceState);
            matrix.setPosition(new THREE.Vector3(x, y, z));
            return {
                i: cubeIndex,
                m: matrix
            };
        });
        this.renderRubikState(matrixs);
    }
    /**
     * 显示魔方
     *
     * @return {void}
     */
    show() {
        this.group.visible = true;
        this.isActive = true;
    }
    /**
     * 隐藏魔法
     * @return {void}
     */
    hide() {
        this.group.visible = false;
        this.isActive = false;
    }
    /**
     * 销毁魔方
     *
     * @return {void}
     */
    destroy() {
        this.main.scene.remove(this.group);
    }
}