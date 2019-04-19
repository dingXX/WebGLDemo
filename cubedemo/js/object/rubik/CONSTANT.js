// 基础的配置信息
export const BasicParams = {
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
// 颜色缩写对应值
export const colorEnum = {
    o: '#ff6b02',
    r: '#dd422f',
    w: '#ffffff',
    y: '#fdcd02',
    b: '#3d81f7',
    g: '#019d53'
};
export const colorFaceMap = {
    o:'R',
    r:'L',
    w:'U',
    y:'D',
    b:'F',
    g:'B'
};
// 还原字符串中的面的顺序
export const resolveFaceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
// 方块贴片对应的面的顺序
export const materialFaceOrder = ['R', 'L', 'U', 'D', 'F', 'B'];

export const faceOrderEnum = {
    xLine: ['U', 'B', 'D', 'F'],
    yLine: ['F', 'L', 'B', 'R'],
    zLine: ['U', 'R', 'D', 'L']
};
export const turnAxisArray = ['xLine', 'yLine', 'zLine'];
export const boxPositionEnum = {
    F: {
        x: 1,
        y: 1
    },
    B: {
        x: 3,
        y: 1
    },
    U: {
        x: 1,
        y: 0
    },
    D: {
        x: 1,
        y: 2
    },
    L: {
        x: 0,
        y: 1
    },
    R: {
        x: 2,
        y: 1
    }
};