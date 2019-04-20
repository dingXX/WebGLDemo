import HUD from '../HUD';
import {
    resolveFaceOrder,
    boxPositionEnum,
    colorEnum,
    colorFaceMap
} from './CONSTANT';
import {
    transfromRubikStrToResolve
} from './util';
import Search from '../../algorithm/Kociemba';
const boxY = 60 * window.devicePixelRatio * 3;
export default class InputRubki extends HUD {
    /**
     * 构造函数
     * @param {object} main 外层threejs 对象
     * @returns {object} InputRubki实例
     */
    constructor(main, layerNum,doneFn) {
        super(main);
        this.layerNum = layerNum;
        this.doneFn = doneFn
        if (layerNum === 3) {
            this.faceColorObj = {
                F: 'broorbrbb',
                B: 'ooyrogyor',
                U: 'oybgybwyw',
                D: 'grobwwygg',
                L: 'grrybwbyw',
                R: 'gwyogwwgr'
            };
        }else{
            this.faceColorObj = {};
        }
        
        this.faceBoxCanvasEnum = {
            
        };
        
        this.getBoxWidth();
        this.initFaceBox();
        this.drawTxt();
        // this.drawBtn();
        this.draw();
    }
    show(){
        super.show();
        this.bindEvent();
    }
    hide(){
        super.hide();
        this.unBindEvent();
    }

    /**
     * 绘制九宫格
     * @param {number} boxWidth 宫格宽度
     * @param {number} grapNum 宫格内格子行数
     * @param {string} colorStr 颜色字符串
     * @returns {canvas} 返回一个canvas
     */
    drawBox(boxWidth, grapNum, colorStr) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = boxWidth;
        canvas.height = boxWidth;
        let devicePixelRatio = this.devicePixelRatio;
        ctx.fillStyle = '#e5e5e5';
        ctx.fillRect(0, 0, boxWidth, boxWidth);
        ctx.strokeStyle = 'black';
        let grapW = ~~(boxWidth / grapNum);
        [0, grapNum].forEach(i => {
            ctx.moveTo(0, i * grapW);
            ctx.lineTo(boxWidth, i * grapW);
            ctx.moveTo(i * grapW, 0);
            ctx.lineTo(i * grapW, boxWidth);
        });
        let lineWidth = 2 * devicePixelRatio;
        ctx.lineWidth = lineWidth * 2;
        ctx.stroke();
        for (let i = 1; i < grapNum; i++) {
            ctx.moveTo(0, i * grapW);
            ctx.lineTo(boxWidth, i * grapW);
            ctx.moveTo(i * grapW, 0);
            ctx.lineTo(i * grapW, boxWidth);
        }
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        if (colorStr) {
            let colorArr = colorStr.split('');
            colorArr.forEach((color, i) => {
                let x = i % grapNum;
                let y = ~~(i / grapNum);
                ctx.save();
                ctx.fillStyle = colorEnum[color];
                ctx.fillRect(
                    x * grapW + lineWidth,
                    y * grapW + lineWidth,
                    grapW - lineWidth * 2,
                    grapW - lineWidth * 2
                );
                ctx.restore();
            });
        }
        return canvas;
    }
    draw() {
        let ctx = this.ctx;
        let canvas = this.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let TxtY = this.sixBoxCanvas.height + boxY + 50;
        ctx.drawImage(
            this.txtCanvas,
            0,
            TxtY,
            this.txtCanvas.width,
            this.txtCanvas.height
        );
        ctx.drawImage(
            this.sixBoxCanvas,
            0,
            boxY,
            this.sixBoxCanvas.width,
            this.sixBoxCanvas.height
        );
        this.drawBackbtn();
        this.updateTexture();
    }
    showErr(errTxt){
        let devicePixelRatio = window.devicePixelRatio;
        let ctx = this.ctx;
        let canvas = this.canvas;
        ctx.save();
        ctx.font = `${34*devicePixelRatio}px serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        let txtArr = errTxt.split('<br/>');
        txtArr.forEach((txt,i)=>{
            ctx.fillText(txt, canvas.width / 2, (i + 2) * 50 * devicePixelRatio);
        });
        ctx.restore();
    }
    drawBackbtn(){
        let devicePixelRatio = window.devicePixelRatio;
        let ctx = this.ctx;
        let canvas = this.canvas;
        ctx.save();
        ctx.font = `${34*devicePixelRatio}px serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText('<返回', 40 * devicePixelRatio, 100 * devicePixelRatio);
        ctx.restore();
    }
    drawBtn(){
        let devicePixelRatio = window.devicePixelRatio;
        this.btnCanvas = document.createElement('canvas');
        let canvas = this.btnCanvas;
        canvas.width = this.realWidth;
        canvas.height = 52 * devicePixelRatio;
        let ctx = canvas.getContext('2d');
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2 * devicePixelRatio;
        let x = this.realWidth * 0.1;
        ctx.rect(x, ctx.lineWidth/2, this.realWidth * 0.8, 50 * devicePixelRatio);
        ctx.stroke();
        ctx.font = `${30*devicePixelRatio}px serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('提交', this.realWidth / 2, canvas.height/2);
    }
    drawTxt(){
        let devicePixelRatio = window.devicePixelRatio;
        this.txtCanvas = document.createElement('canvas');
        this.txtCanvas.width = this.realWidth;
        this.txtCanvas.height = this.realHight / 2;
        let canvas = this.txtCanvas;
        let ctx = this.txtCanvas.getContext('2d');
        ctx.font = `${24*devicePixelRatio}px serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('点击选择任意面，输入该面的颜色状态', canvas.width / 2, 30 * devicePixelRatio);
        let txt = '从左到右，从上到下，输入表示该小方块的颜色字母';
        ctx.fillText(txt, canvas.width / 2, 60 * devicePixelRatio);
        ctx.fillText('W(白)/Y(黄)/R(红)/O(橙)/B(蓝)/G(绿)[不区分大小写]', canvas.width / 2, 90 * devicePixelRatio);
    }
    updateBoxCanvas(face, reRender) {
        let ctx = this.sixBoxCanvas.getContext('2d');
        let { x, y } = boxPositionEnum[face];
        let { boxWidth } = this;
        let faceStr = this.faceColorObj[face] || '';
        let boxCanvas = this.drawBox(
            this.boxWidth - 20,
            this.layerNum,
            faceStr
        );
        this.faceBoxCanvasEnum[face] = boxCanvas;
        ctx.clearRect(
            x * boxWidth + 10,
            y * boxWidth,
            boxCanvas.width,
            boxCanvas.height
        );
        ctx.drawImage(
            boxCanvas,
            x * boxWidth + 10,
            y * boxWidth,
            boxCanvas.width,
            boxCanvas.height
        );
        if (reRender) {
            this.draw();
        }
    }
    /**
     * 获取单个宫格宽度
     */
    getBoxWidth() {
        this.boxWidth = ~~this.realWidth / 4;
    }
    initFaceBox() {
        this.sixBoxCanvas = document.createElement('canvas');
        this.sixBoxCanvas.width = this.realWidth;
        this.sixBoxCanvas.height = this.boxWidth * 3;
        for (const face in boxPositionEnum) {
            if (boxPositionEnum.hasOwnProperty(face)) {
                this.updateBoxCanvas(face);
            }
        }
    }
    bindEvent() {
        this.bindTouchStart = this.bindTouchStart || this.touchStart.bind(this);
        this.bindKeyBoardComplete = this.bindKeyBoardComplete || this.keyBoardComplete.bind(this);
        this.bindKeyBoardInput = this.bindKeyBoardInput || this.keyBoardInput.bind(this);
        wx.onTouchStart(this.bindTouchStart);
        // 键盘收起
        wx.onKeyboardComplete(this.bindKeyBoardComplete);
        wx.onKeyboardInput(this.bindKeyBoardInput);
    }
    unBindEvent() {
        wx.offTouchStart(this.bindTouchStart);
        // 键盘收起
        wx.offKeyboardComplete(this.bindKeyBoardComplete);
        wx.offKeyboardInput(this.bindKeyBoardInput);
    }
    touchStart(eve){
        let touch = eve.touches[0];
        let touchY = this.getRealPixel(touch.clientY);
        let touchX = this.getRealPixel(touch.clientX);
        if (touchY > boxY && touchY < this.sixBoxCanvas.height + boxY) {
            // 在展开图范围内
            let j = ~~((touchY - boxY) / this.boxWidth);
            let i = ~~(touchX / this.boxWidth);
            let touchFace = '';
            for (const face in boxPositionEnum) {
                if (boxPositionEnum.hasOwnProperty(face)) {
                    const boxP = boxPositionEnum[face];
                    if (boxP.x === i && boxP.y === j) {
                        touchFace = face;
                        break;
                    }
                }
            }
            console.log(touchFace);
            touchFace && this.inputFace(touchFace);
            return;
        }
        if (touchX< 400 && touchY<400) {
            if (typeof this.doneFn === 'function') {
                this.doneFn();
            }
        }
    }
    keyBoardComplete(res) {
        this.inputting = 0;
        this.updateInputFaceValue(res.value,this.inputtingFace);
        console.log('keyBoardComplete');
        if (this.checkInPutAll()) {
            this.getFaceStr();
        }
    }
    keyBoardInput(res){
        console.log('keyBoardInput');
        let inputValue = res.value;
        this.updateInputFaceValue(inputValue,this.inputtingFace);
    }
    updateInputFaceValue(value = '',face){
        let formatValue = value.toLocaleLowerCase().replace(/[^bgorwy]/g, '');
        this.faceColorObj[face] = formatValue;
        this.updateBoxCanvas(face, 1);
    }
    inputFace(face){
        this.inputtingFace = face;
        if (this.inputting) {
            wx.updateKeyboard({
                value: this.faceColorObj[face]
            });
            return;
        }
        this.inputting = 1;
        wx.showKeyboard({
            defaultValue: this.faceColorObj[face],
            maxLength:this.layerNum * this.layerNum,
            multiple:true,
            fail:()=>{
                this.inputting = 0;
            }
        });
    }
    checkInPutAll(){
        let faceArr = Object.values(this.faceColorObj);
        if (faceArr.length<6) {
            return false;
        }
        return faceArr.every(faceStr => {
            return faceStr.length === this.layerNum*this.layerNum;
        });
    }
    getFaceStr(){
        let faceStr = resolveFaceOrder.map(faceOder => this.faceColorObj[faceOder]).join('').toLocaleLowerCase();
        let colors = Object.keys(colorEnum);
        // debugger;
        colors.forEach(color => {
            let reg = new RegExp(color, 'g');
            faceStr = faceStr.replace(reg, colorFaceMap[color]);
        });
        console.log('oldFaceStr', faceStr);
        let resolveStr = transfromRubikStrToResolve(faceStr);
        wx.showLoading({
            title: '合法性检测中...',
        });
        let isVerify = Search.isVerify(resolveStr);
        console.log(resolveStr, isVerify);
        wx.hideLoading();
        if (isVerify) {
            if (typeof this.doneFn === 'function') {
                this.doneFn(faceStr);
            }
        }else{
            this.showErr('当前输入的颜色值无法生成合法魔方<br/>请重新校对并输入');
        }
    }
}
