import {
    resolveFaceOrder
} from './CONSTANT';
/**
 * 魔方基础类
 */
export default class BaseRubik {
    /**
     * 构造函数
     * @param {number} layerNum 魔方层级
     */
    constructor(layerNum) {
        this.layerNum = layerNum;
        this.faceGestureEnum = this.constructor.getFaceGestureEnum(layerNum);
        this.getLayerIndex = this.constructor.getLayerIndexFn(layerNum);
        this.cubeIndexToFaceIndexFnEnum = this.constructor.getCubeIndexToFaceIndexFnEnum(layerNum);
    }
    /**
     * 获取手势字符串
     *
     * @param  {string} turnAxis    旋转轴
     * @param  {number} layerIndex  旋转层级
     * @param  {boolean} isAntiClock 0 or 1 表示是否逆旋转
     *
     * @return {string}             手势数组
     */
    static stringifyGesture(turnAxis, layerIndex, isAntiClock) {
        let obj = [turnAxis, layerIndex, +isAntiClock];
        return obj.join('_');
    }
    /**
     * 解析手势字符串
     *
     * @param  {string} gesture 手势字符串
     *
     * @return {object}         手势对象
     */
    static parseGesture(gesture) {
        let obj = gesture.split('_');
        return {
            turnAxis: obj[0],
            layerIndex: +obj[1],
            isAntiClock: +obj[2]
        };
    }
    /**
     * 获取面手势的枚举对象
     * @param {number} layerNum 层级数
     * @return {object} 面手势的枚举对象
     */
    static getFaceGestureEnum(layerNum) {
        const lastLayerIndex = layerNum - 1;
        return {
            'F': this.stringifyGesture('zLine', 0, 0),
            'FA': this.stringifyGesture('zLine', 0, 1),
            'B': this.stringifyGesture('zLine', lastLayerIndex, 1),
            'BA': this.stringifyGesture('zLine', lastLayerIndex, 0),
            'U': this.stringifyGesture('yLine', 0, 0),
            'UA': this.stringifyGesture('yLine', 0, 1),
            'D': this.stringifyGesture('yLine', lastLayerIndex, 1),
            'DA': this.stringifyGesture('yLine', lastLayerIndex, 0),
            'R': this.stringifyGesture('xLine', lastLayerIndex, 0),
            'RA': this.stringifyGesture('xLine', lastLayerIndex, 1),
            'L': this.stringifyGesture('xLine', 0, 1),
            'LA': this.stringifyGesture('xLine', 0, 0)
        }
    }
    /**
     * 根据魔方层级获取小方块所在层级（ 是否在对应层级） 的函数
     * @param {number} layerNum 层级数
     * @return { function }
     判断小方块所在层级函数
     function (line, cubeIndex, layerIndex) {}
     layerIndex不传的话， 返回方块所在层级数， 否则， 返回boolean值表示是否在对应层
     */
    static getLayerIndexFn(layerNum) {
        let getCubeLayerIndexEnum = {
            'zLine': (cubeIndex) => {
                let num = layerNum * layerNum;
                // 取整
                return ~~(cubeIndex / num);
            },
            'xLine': (cubeIndex) => {
                return cubeIndex % layerNum;
            },
            'yLine': (cubeIndex) => {
                let num = layerNum * layerNum;
                return ~~(cubeIndex % num / layerNum);
            }
        };
        return function (line, cubeIndex, layerIndex) {
            let getCubeLayerIndexFn = getCubeLayerIndexEnum[line];
            if (!getCubeLayerIndexFn) {
                throw Error('getLayerIndexFn_需提供轴名称');
            }
            let cubeLayer = getCubeLayerIndexFn(cubeIndex);
            if (typeof layerIndex === 'number') {
                return cubeLayer === layerIndex;
            } else {
                return cubeLayer;
            }
        };
    }
    /**
     * 根据魔方层级获取 根据方块index获取在不同面上的索引的方法 的枚举对象
     * @param {number}  layerNum 层级数
     * @returns {object}          以面为key的枚举对象
     */
    static getCubeIndexToFaceIndexFnEnum(layerNum) {
        let getFaceIndexFnEnum = {
            'F': (arr) => {
                return (cubeIndex) => {
                    return arr[cubeIndex];
                };
            },
            'B': (arr) => {
                return cubeIndex => {
                    let num = layerNum * layerNum * (layerNum - 1);
                    return arr[cubeIndex - num];
                };
            },
            'U': (arr) => {
                return cubeIndex => {
                    let num = layerNum * layerNum;
                    let layerIndex = ~~(cubeIndex / num);
                    let num2 = num - layerNum;
                    return arr[cubeIndex - num2 * layerIndex];
                };
            },
            'D': (arr) => {
                return cubeIndex => {
                    let num = layerNum * layerNum;
                    let layerIndex = ~~(cubeIndex / num);
                    let num2 = num - layerNum;
                    return arr[cubeIndex - num2 * (layerIndex + 1)];
                };
            },
            'L': (arr) => {
                return cubeIndex => {
                    let num = ~~(cubeIndex / layerNum);
                    return arr[cubeIndex - num * (layerNum - 1)];
                };
            },
            'R': (arr) => {
                return cubeIndex => {
                    let num = ~~(cubeIndex / layerNum) + 1;
                    return arr[cubeIndex - num * (layerNum - 1)];
                };
            }
        };
        let fnEnum = {};
        resolveFaceOrder.forEach(face => {
            let faceIndexArray = this.getFaceIndexArray(layerNum, face);
            fnEnum[face] = getFaceIndexFnEnum[face](faceIndexArray);
        });
        return fnEnum;
    }
    /**
     * 获取在面上的索引数组枚举对象
     * @param {number} layerNum 层级数
     * @param {string} face 对应面
     * @returns {object} 各面的索引数组的枚举对象
     */
    static getFaceIndexArray(layerNum, face) {
        let n = layerNum;
        let faceIndexFnEnum = {
            U: (i, j) => {
                return (n - i - 1) * n + j;
            },
            R: (i, j) => {
                return j * n + i;
            },
            F: (i, j) => {
                return n * i + j;
            },
            D: (i, j) => {
                return n * i + j;
            },
            L: (i, j) => {
                return j * n + (n - i) - 1;
            },
            B: (i, j) => {
                return n * (i + 1) - 1 - j;
            }
        };

        let fn = faceIndexFnEnum[face];
        let arr = [];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                arr.push(fn(i, j));
            }
        }
        return arr;
    }
}