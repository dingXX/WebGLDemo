import * as THREE from './three/build/three.js';
// require('./three/build/OrbitControls.js');
import BasicRubik from './object/Rubik.js';
import TouchLine from './object/TouchLine.js';
const Context = canvas.getContext('webgl');
console.log('Main');
export default class Main {
    constructor() {
        this.context = Context; //绘图上下文
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.devicePixelRatio = window.devicePixelRatio;
        this.viewCenter = new THREE.Vector3(0, 0, 0); //原点
        this.minPercent = 0.25;
        this.initRender();
        this.initCamera();
        this.initScene();
        this.initLight();
        this.initObject();
        this.render();
        this.initEvent();
    }
    initRender() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, //抗锯齿开启
            context: this.context
        });
        this.renderer.setSize(this.width, this.height); //设置渲染器宽度和高度
        this.renderer.setClearColor(0xFFFFFF, 1.0); //设置背景颜色
        canvas.width = this.width * this.devicePixelRatio;
        canvas.height = this.height * this.devicePixelRatio;
        this.renderer.setPixelRatio(this.devicePixelRatio);
    }
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
        console.log(1000, 0, 0);
        this.camera.position.set(0, 0, 300 / this.camera.aspect);
        // this.camera.up.set(1, 1, 1); //正方向
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        //轨道视角控制器
        // this.orbitController = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        // this.orbitController.enableZoom = false;
        // this.orbitController.rotateSpeed = 2;
        // this.orbitController.target = this.viewCenter; //设置控制点
    }
    initScene() {
        this.scene = new THREE.Scene();
    }
    initLight() {
        this.light = new THREE.AmbientLight(0xfefefe);
        this.scene.add(this.light);
    }
    initObject() {
        this.originHeight = Math.tan(22.5 / 180 * Math.PI) * this.camera.position.z * 2;
        this.originWidth = this.originHeight * this.camera.aspect;
        console.log(this.originHeight);
        this.frontRubik = new BasicRubik(this);
        this.frontRubik.model('font');
        this.backRubik = new BasicRubik(this);
        this.backRubik.model('back');
        this.touchLine = new TouchLine(this);
        this.rubikResize(0.5);
    }
    render() {
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this), canvas);
    }
    /**
     * 初始化事件
     */
    initEvent() {
        wx.onTouchStart(this.touchStart.bind(this));
        wx.onTouchMove(this.touchMove.bind(this));
        wx.onTouchEnd(this.touchEnd.bind(this));
    }
    /**
     * 触摸开始
     */
    touchStart(event) {
        var touch = event.touches[0];
        this.startPoint = touch;
        // 触摸的是控制条时，才可以移动
        if (touch.clientY >= this.touchLine.screenRect.top && touch.clientY <= this.touchLine.screenRect.top + this.touchLine.screenRect.height) {
            this.touchLine.enable();
        }
    }
    /**
     * 触摸移动
     */
    touchMove(event) {
        var touch = event.touches[0];
        //滑动touchline
        this.touchLine.move(touch.clientY,()=>{
            var frontPercent = touch.clientY / window.innerHeight;
            this.rubikResize(frontPercent);
        })
    }

    /**
     * 触摸结束
     */
    touchEnd() {
        this.touchLine.disable();
    }
    /**
     * 正反魔方区域占比变化
     */
    rubikResize(frontPercent) {
        this.frontRubik.resizeHeight(frontPercent, 1);
        this.backRubik.resizeHeight(1-frontPercent, -1);
    }
}