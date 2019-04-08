import * as THREE from '../../three/build/three.min.js';
import BaseRubik from './BaseRubik';
import {
    resolveFaceOrder,
    faceOrderEnum,
    turnAxisArray
} from './CONSTANT';
const faceGestureEnum = BaseRubik.getFaceGestureEnum(2);
/**
 * 创建单个方块一面的贴片图片
 *
 * @param  {string} rgbaColor 颜色
 *
 * @return {canvas} 贴片图片
 */
export function createFace(rgbaColor) {
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
 * 创建透明的外层正方体,用于包围魔方， 主要是确定触摸时所在面
 *
 * @param  {number} cubeWidth 方块宽度
 *
 * @return {Object}           外层透明大方块mesh实例
 */
export function createTransparencyMesh(cubeWidth) {
    let cubegeo = new THREE.BoxGeometry(cubeWidth, cubeWidth, cubeWidth);
    let cubemat = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        opacity: 0,
        transparent: true
    });
    let cube = new THREE.Mesh(cubegeo, cubemat);
    return cube;
}

/**
 * 获取实际的转动矩阵
 * @param {vector3} vector 旋转轴
 * @param {number} rad 旋转角度
 * @returns {Matrix4} 旋转矩阵
 */
export function getRotateAroundWorldMatrix(vector, rad) {
    vector.normalize();
    let matrix4 = new THREE.Matrix4();
    matrix4.makeRotationAxis(vector, rad);
    return matrix4;
}
/**
 * 瞬时旋转动画
 *
 * @param  {array} cubes     旋转的小方块数组
 * @param  {Vector3} lineVector  旋转轴
 * @param  {boolean} isAntiClock  是否逆时针旋转
 * @param  {number} currentstamp 当前时间戳
 * @param  {number} startstamp   起始时间戳
 * @param  {number} laststamp    上一次时间戳
 * @param  {function} callback     回调函数
 * @param  {number} totalTime    总持续时间
 * 
 * @return {void}             
 */
export function rotateAnimation(cubes, lineVector, isAntiClock, currentstamp, startstamp, laststamp, callback, totalTime) {
    //动画是否结束
    let isAnimationEnd = false;
    if (startstamp === 0) {
        // 起始时间赋值
        startstamp = currentstamp;
        laststamp = currentstamp;
    }
    if (currentstamp - startstamp >= totalTime) {
        isAnimationEnd = true;
        currentstamp = startstamp + totalTime;
    }
    // 获取当前时间的旋转矩阵
    let rotateMatrix = getRotateAroundWorldMatrix(lineVector, isAntiClock * 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
    // 应用旋转矩阵
    cubes.forEach(cube => {
        cube.applyMatrix(rotateMatrix);
    });
    if (!isAnimationEnd) {
        requestAnimationFrame((timestamp) => {
            rotateAnimation(cubes, lineVector, isAntiClock, timestamp, startstamp, currentstamp, callback, totalTime);
        });
    } else if (typeof callback === 'function') {
        callback();
    }
}
/**
 * 转为还原函数能接受的字符串
 * @param {string} rubikStr 魔方状态字符串
 * @returns {string} 魔方状态字符串
 */
export function transfromRubikStrToResolve(rubikStr) {
    let layerNum = Math.sqrt(rubikStr.length / 6);
    // 只处理2阶和3阶的
    if (layerNum !== 2 && layerNum !== 3) {
        return rubikStr;
    }
    let strArr = sliceRubikStr(rubikStr);
    if (layerNum === 2) {
        strArr = strArr.map((str, index) => {
            let face = resolveFaceOrder[index];
            // axaxxxaxa
            str = str.slice(0, 1) + face + str.slice(1, 2) + face + face + face + str.slice(2, 3) + face + str.slice(3);
            return str;
        });
        return strArr.join('');
    } else if (layerNum === 3) {
        return trans2resolveStr(strArr);
    }
}
/**
 * 将字符串转为resolve相关面的字符串
 *
 * @param  {array} rubikStrArr 返回按还原面顺序的字符串数组
 *
 * @return {string}  转换后的字符串
 */
export function trans2resolveStr(rubikStrArr) {
    let str = rubikStrArr.join('');
    if (!rubikStrArr[0].length % 2) {
        return str;
    }
    let centerIndex = ~~rubikStrArr[0].length / 2;
    let centers = rubikStrArr.map(fStr => fStr.slice(centerIndex, centerIndex + 1));
    if (centers.join('') === resolveFaceOrder.join('')) {
        // 中间方块的排序和要求的一致，不处理
        return str;
    } else {
        // 先变为数字的中间态
        centers.forEach((center, index) => {
            let exp = new RegExp(center, 'g');
            str = str.replace(exp, index);
        });
        resolveFaceOrder.forEach((face, index) => {
            let exp = new RegExp(index, 'g');
            str = str.replace(exp, face);
        });
        return str;
    }
}
/**
 * 按面切割魔方字符串
 *
 * @param  {string} rubikStr 魔方字符串
 *
 * @return {array}          返回按还原面顺序的数组字符串
 */
export function sliceRubikStr(rubikStr) {
    let num = rubikStr.length / 6;
    let strArr = [];
    for (let i = 0; i < 6; i++) {
        strArr.push(rubikStr.slice(i * num, (i + 1) * num));
    }
    return strArr;
}
/**
 * 从方块的外层面状态获取对应的旋转矩阵
 *
 * @param  {array} faceStatus 方块的面状态数组[{face:'U',color:'U'},{'face':'F',color:'F'}]
 *
 * @return {matrix4}  旋转矩阵
 */
export function getMatrixFromFaceStatus(faceStatus) {
    let faceColorObj = {
        F: '蓝',
        B: '绿',
        L: '红',
        R: '橙',
        U: '白',
        D: '黄'
    };
    let faceList = Object.keys(faceColorObj);
    // 先将方块状态的颜色变为颜色值
    faceStatus.forEach(fStatus => {
        fStatus.color = faceColorObj[fStatus.color];
    });
    let matrix = new THREE.Matrix4();
    let turnAxis = '';
    // 变为方块的目标状态，最多转两次
    let turnCount = Math.min(faceStatus.length, 2);
    // 记录实际转动次数
    let turnNum = 0;
    while (turnNum < turnCount) {
        // 目标面的颜色状态
        let sFaceStatus = faceStatus[turnNum];
        if (!sFaceStatus) {
            // 没有数据
            break;
        }
        let {
            face: sFace,
            color
        } = sFaceStatus;
        let tFace = faceList.find(face => faceColorObj[face] === color);
        // 源面的手势和方向
        let {
            turnAxis: sAxis
        } = BaseRubik.parseGesture(faceGestureEnum[sFace]);

        if (sFace !== tFace) {
            let {
                turnAxis: tAxis
            } = BaseRubik.parseGesture(faceGestureEnum[tFace]);
            // 源面颜色和目标颜色不一致
            if (turnAxis === sAxis || turnAxis === tAxis) {
                // 指定的旋转方向和实际的面是同一方向的话，是转不了的
                throw Error('getMatrixFromFaceStatus_旋转轴不能与面的轴一致');
            }
            if (!turnAxis) {
                // 没有定义旋转轴，就根据两个面去确定
                let turnAttr = turnAxisArray;
                let axisArr = [sAxis, tAxis];
                turnAxis = turnAttr.find(axis => {
                    return !axisArr.includes(axis);
                });
            }
            let faceOrder = faceOrderEnum[turnAxis];
            let sOrder = faceOrder.indexOf(sFace);
            let tOrder = faceOrder.indexOf(tFace);
            if (!~sOrder || !~tOrder) {
                throw Error('getMatrixFromFaceStatus_要旋转的面不在对应的轴顺序中');
            }
            // 转动位数
            let stepNum = sOrder - tOrder;
            let angle = -stepNum / 2 * Math.PI;
            let turn = turnAxis.slice(0, 1).toLocaleUpperCase();
            let turnMatrix = new THREE.Matrix4();
            turnMatrix[`makeRotation${turn}`](angle);
            matrix.premultiply(turnMatrix);
            // 转动后的,新方块颜色
            let newFaceColorObj = {};
            faceOrder.forEach((face, index) => {
                let newFaceIndex = (index - stepNum + 4) % 4;
                let newFace = faceOrder[newFaceIndex];
                newFaceColorObj[face] = faceColorObj[newFace];
            });
            faceColorObj = Object.assign(faceColorObj, newFaceColorObj);
            console.log(stepNum, turnAxis);
        }
        // 目标面已经相同，不用再处理
        turnAxis = sAxis;
        turnNum++;
    }
    return matrix;
}
