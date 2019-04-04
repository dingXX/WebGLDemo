import * as THREE from '../three/build/three.min.js';

/**
 * 生成按钮texture
 * @param   {string}  txt  按钮文字
 * @return  {texture}       贴片
 */
function createBtn(txt) {
    let devicePixelRatio = window.devicePixelRatio;
    let canvas = document.createElement('canvas');
    canvas.width = 84 * devicePixelRatio;
    canvas.height = 64 * devicePixelRatio;
    let ctx = canvas.getContext('2d');
    //在内部用某颜色的16px宽的线再画一个宽高为224的圆角正方形并用改颜色填充
    ctx.rect(2 * devicePixelRatio, 2 * devicePixelRatio, 80 * devicePixelRatio, 60 * devicePixelRatio);
    ctx.lineWidth = 4 * devicePixelRatio;
    ctx.strokeStyle = '#44b549';
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = 24 * devicePixelRatio + 'px serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(txt, 42 * devicePixelRatio, 32 * devicePixelRatio);
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}
/**
 * 触摸条
 */
export default class StaticBtn {
    /**
     * 构造函数
     *
     * @param   {object}  main  ctx
     * @param   {string}  txt   文案
     * @param   {number}  x     初始位置
     * @param   {number}  y     初始位置
     *
     * @return  {void}
     */
    constructor(main, txt, x, y, touchFn) {
        this.main = main;
        let devicePixelRatio = window.devicePixelRatio;
        this.radio = this.main.originWidth / 750;

        //加载图片

        // var loader = new THREE.TextureLoader();
        let texture = createBtn(txt);
        // loader.load(pic, (texture) => {
        // 生成平面几何类
        let img = texture.image;

        //实际尺寸
        this.realWidth = img.width / devicePixelRatio;
        this.realHeight = img.height / devicePixelRatio;
        //在程序中的实体尺寸
        this.width = this.realWidth * this.radio;
        this.height = this.realHeight * this.radio;
        this.uiRadio = this.main.originWidth / window.innerWidth;
        //屏幕尺寸
        this.screenRect = {
            width: this.width / this.uiRadio,
            height: this.height / this.uiRadio
        };

        var geometry = new THREE.PlaneGeometry(this.width, this.height);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            // color:0xff0000
            transparent: true
        });
        this.plane = new THREE.Mesh(geometry, material);
        this.plane.position.set(0, 0, 0);
        this.main.scene.add(this.plane);
        this.defaultPosition(x, y);
        this.enable();
        if (typeof touchFn === 'function') {
            this.touchFn = touchFn;
            this.bindEvent();
        }
    }

    /**
     * 默认位置 （屏幕左上角位置）
     *
     * @param   {number}  x  x轴位置
     * @param   {number}  y  y轴位置
     *
     * @return  {void}
     */
    defaultPosition(x = 0, y = 0) {
        this.plane.position.x = -this.main.originWidth / 2 + this.width / 2 + x * this.radio;
        this.plane.position.y = this.main.originHeight / 2 - this.height / 2 - y * this.radio;
        this.screenRect.left = (this.main.originWidth / 2 + this.plane.position.x - this.width / 2) / this.uiRadio;
        this.screenRect.top = (this.main.originHeight / 2 - this.plane.position.y - this.height / 2) / this.uiRadio;
    }

    /**
     * 判断是否在触摸范围内
     *
     * @param   {object}  touch  点击事件
     *
     * @return  {void}
     */
    isHover(touch) {
        if (!this.isActive) {
            return;
        }
        var isHover = false;
        if (touch.clientY >= this.screenRect.top && touch.clientY <= this.screenRect.top + this.screenRect.height && touch.clientX >= this.screenRect.left && touch.clientX <= this.screenRect.left + this.screenRect.width) {
            isHover = true;
        }
        return isHover;
    }
    /**
     * 处理中
     *
     * @return  {void}
     */
    enable() {
        this.isActive = true;
    }
    /**
     * 非处理中
     *
     * @return  {void}
     */
    disable() {
        this.isActive = false;
    }
    /**
     * 展示按钮
     * @return {void}
     */
    show(){
        this.plane.visible = true;
        this.enable();
    }
    /**
     * 隐藏按钮
     * @return {void}
     */
    hide(){
        this.plane.visible = false;
        this.disable();
    }
    touch(eve) {
        var touchInfo = eve.touches[0];
        if (this.isHover(touchInfo) && !this.main.isRotating) {
            this.touchFn(eve);
        }
    }
    bindEvent(){
        wx.onTouchStart((eve) => {
            this.touch(eve);
        });
    }
}