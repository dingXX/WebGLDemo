/*global canvas wx*/
import * as THREE from './three/build/three.min.js';
// require('./three/build/OrbitControls.js');
import TRubik from './object/rubik/TRubik';
import Btn from './object/StaticBtn.js';
import TWEEN from './tween/Tween.js';
// import RecognizeCube from './object/RecognizeCube.js';
import InputRubik from './object/rubik/InputRubik';
const Context = canvas.getContext('webgl');
/**
 * [Main 主要类]
 */
export default class Main {
    /**
     * 构造函数
     *
     * @return  {void}
     */
    constructor() {
        this.context = Context; //绘图上下文
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.devicePixelRatio = window.devicePixelRatio;
        this.viewCenter = new THREE.Vector3(0, 0, 0); //原点
        this.minPercent = 0.25;

        this.setRotateparams();

        this.initRender();
        this.initCamera();
        this.initScene();
        this.initLight();
        this.initObject();
        this.render();

    }
    /**
     * [setRotateparams 设置魔方参数]
     * @return  {void}
     */
    setRotateparams() {
        this.raycaster = new THREE.Raycaster(); //碰撞射线
        this.intersect; //射线碰撞的元素
        this.normalize; //滑动平面法向量
        this.targetRubik; //目标魔方
        this.anotherRubik; //非目标魔方
        this.startPoint; //触摸点
        this.movePoint; //滑动点
        this.isRotating = false; //魔方是否正在转动
    }
    /**
     * [initRender 初始化]
     * @return  {void}
     */
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
    /**
     * [initCamera 初始化相机]
     * @return  {void}
     */
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
        this.camera.position.set(0, 0, 300 / this.camera.aspect);
        // this.camera.up.set(1, 1, 1); //正方向
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        //轨道视角控制器
        // this.orbitController = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        // this.orbitController.enableZoom = false;
        // this.orbitController.rotateSpeed = 2;
        // this.orbitController.target = this.viewCenter; //设置控制点
    }
    /**
     * [initScene 初始化场景]
     * @return  {void}
     */
    initScene() {
        this.scene = new THREE.Scene();
    }
    /**
     * 初始化灯光
     * @return  {void}
     */
    initLight() {
        this.light = new THREE.AmbientLight(0xfefefe);
        this.scene.add(this.light);
    }
    /**
     * 初始化物体
     * @return  {void}
     */
    initObject() {
        this.originHeight = Math.tan(22.5 / 180 * Math.PI) * this.camera.position.z * 2;
        this.originWidth = this.originHeight * this.camera.aspect;

        this.changeLayNumRubik();
        // this.enterAnimation();
        this.initEvent();

        this.resetBtn = new Btn(this, '重置', 20, 100,()=>{
            this.frontRubik.reset();
        });
        this.disorderBtn = new Btn(this, '打乱', 20, 180,()=>{
            this.randomRubik();
        });
        this.changeBtn = new Btn(this, '换阶', 20, 260,()=>{
            this.changeRubik();
        });
        this.tmBtn = new Btn(this, '还原', 20, 340,()=>{
            this.solveRubik();
        });
        this.recognBtn = new Btn(this, '输入', 20, 420,()=>{
            // let str = this.frontRubik.getRubikFaceStr(0);
            // console.log(str);
            // str = 'FDUBUBUURUUBURLBFRFLBDFFRUDDRLRDDULDDLLBLBFFFLRLDBRBFR';
            // this.frontRubik.rubikStr2rubikState(str);
            this.showRecognWrap();
        });
        // this.hud.draw();
        // this.hideObject();
    }
    /**
     * 隐藏部分内容
     * @return {void}
     */
    hideObject() {
        this.hiding = true;
        this.resetBtn.hide();
        this.disorderBtn.hide();
        this.changeBtn.hide();
        this.tmBtn.hide();
        this.frontRubik.hide();
        this.recognBtn.hide();
    }
    showObject(){
        this.resetBtn.show();
        this.disorderBtn.show();
        this.changeBtn.show();
        this.tmBtn.show();
        this.frontRubik.show();
        this.recognBtn.show();
        this.hiding = false;
    }
    /**
     * 展示识别模块
     * @return {void}
     */
    showRecognWrap() {
        this.hideObject();
        let layNum = this.frontRubik.layerNum;
        this[`inputRubik${layNum}`] = this[`inputRubik${layNum}`] || new InputRubik(this, layNum, (faceStr) => {
            this[`inputRubik${layNum}`].hide();
            this.showObject();
            if (faceStr) {
                this.frontRubik.rubikStr2rubikState(faceStr);
            }
        });
        this[`inputRubik${layNum}`].show();
    }
    /**
     * 渲染
     * @return  {void}
     */
    render() {
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this), canvas);
    }
    /**
     *事件初始化
     * @return  {void}
     */
    initEvent() {
        let that = this;
        wx.onTouchStart(this.touchStart.bind(this));
        wx.onTouchMove(this.touchMove.bind(this));
        wx.onTouchEnd(this.touchEnd.bind(this));
        wx.onHide(()=>{
            that.frontRubik && that.frontRubik.saveRubikStateToStorage();
        });
    }
    /**
     * 触摸事件
     * @param   {object}  eve  事件
     * @return  {void}
     */
    touchStart(eve) {
        if (this.hiding) {
            return;
        }
        var touch = eve.touches[0];
        this.startPoint = touch;

        if(this.frontRubik.isActive){
            this.getIntersects(touch);
            //触摸点在魔方上且魔方没有转动
            if (!this.isRotating) {
                //开始转动，设置起始点
                this.startPoint = this.intersect ? this.intersect.point : (new THREE.Vector2(touch.clientX, touch.clientY));
            }
        }

    }
    /**
     * 触摸移动事件
     * @param   {object}  eve  事件
     * @return  {void}
     */
    touchMove(eve) {
        if (this.hiding) {
            return;
        }
        var touch = eve.touches[0];

        // 滑动点在魔方上且魔方没有转动
        if (!this.isRotating && this.startPoint && this.targetRubik) {
            let rubikTypeName = this.getIntersects(touch);
            if (!this.intersect) {
                this.movePoint = new THREE.Vector2(touch.clientX, touch.clientY);
            } else {
                this.movePoint = this.intersect.point;

            }
            // this.movePoint = touch;
            if (!this.movePoint.equals(this.startPoint)) { //触摸点和滑动点不一样则意味着可以得到转动向量
                this.rotateRubik(rubikTypeName);
            }
        }

    }

    /**
     * 触摸结束事件
     * @param   {object}  eve  事件obj
     * @return  {void}
     */
    touchEnd(eve) {
        // this.touchLine.disable();
        // var touch = event.changedTouches[0];


    }

    /**
     * 转动魔方
     * @param   {string}  rubikTypeName  魔方类型
     * @return  {void}
     */
    rotateRubik(rubikTypeName) {
        this.isRotating = true; //转动标识置为true
        var sub = this.movePoint.sub(this.startPoint); //计算转动向量
        // var direction = this.targetRubik.getDirection(sub, this.normalize); //计算转动方向
        let gesture;
        if (this.intersect) {
            var cubeIndex = this.intersect.object.cubeIndex;
            gesture = this.targetRubik.getGesture(sub, this.normalize, cubeIndex);
        } else {
            // 因为屏幕的坐标是左上角是原点，向上滑的时候，y会是负值
            sub.setY(-1 * sub.y);
            gesture = this.targetRubik.getWholeGesture(sub, rubikTypeName);

        }
        this.targetRubik.rotateMove(gesture, () => {
            this.resetRotateParams();
        });
    }
    /**
     * 入场动画
     * @return  {void}
     */
    enterAnimation() {
        let isAnimationEnd = false;
        let group = this.frontRubik.group;
        let endStatus = {
            rotateY: group.rotation.y,
            y: group.position.y,
            z: group.position.z
        };
        // 重新设置位置
        // group.rotation.y+=(Math.PI/2);
        group.rotateY(-90 / 180 * Math.PI);
        group.position.y += this.originHeight / 3;
        group.position.z -= 350;
        let startStatus = {
            rotateY: group.rotation.y,
            y: group.position.y,
            z: group.position.z
        };
        var tween = new TWEEN.Tween(startStatus)
            .to(endStatus, 1500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(function () {
                group.rotation.y = startStatus.rotateY;
                group.position.y = startStatus.y;
                group.position.z = startStatus.z;
            }).onComplete(() => {
                isAnimationEnd = true;
            });
        /**
         * 动画
         * @param   {number}  time  更新时间
         * @return  {void}
         */
        function animate(time) {
            if (!isAnimationEnd) {
                TWEEN.update(time);

                requestAnimationFrame(animate);
            }
        }
        // tween.start();

        setTimeout(() => {
            tween.start();
            requestAnimationFrame(animate);
        }, 500);
        this.initEvent();
        // this.randomRubik(()=>{
        //     this.initEvent();
        // });



    }
    /**
     * 打乱魔方
     * @param   {function}  cb  回调函数
     * @return  {void}
     */
    randomRubik(cb) {
        if (this.randoming) {
            return;
        }
        this.randoming = true;
        let gestureList = this.frontRubik.getRandomGestureList();
        this.frontRubik.rotateMoveFromList(gestureList, () => {
            console.log('frontRubik_random_over');
            this.randoming = false;
        },100);
    }
    /**
     * 还原魔方
     * @return {void}
     */
    solveRubik(){
        if (this.solving) {
            return;
        }
        this.solving = true;
        wx.showLoading({
            title: '还原计算中...',
        });
        let gestureList = this.frontRubik.solve();
        wx.hideLoading();
        if (!gestureList) {
            this.solving = false;
            return;
        }
        this.frontRubik.rotateMoveFromList(gestureList, () => {
            console.log('frontRubik_solving_over');
            this.solving = false;
        });
    }
    /**
     * 换阶
     * @return {void}
     */
    changeRubik(){
        let that = this;
        var itemList = ['2', '3', '4'];
        wx.showActionSheet({
            itemList,
            success(res) {
                that.frontRubik && that.frontRubik.saveRubikStateToStorage();
                let layNum = +itemList[res.tapIndex];
                that.changeLayNumRubik(layNum);
                if (layNum === 3 || layNum === 2) {
                    that.tmBtn.show();
                    that.recognBtn.show();
                }else{
                    that.tmBtn.hide();
                    that.recognBtn.hide();
                }
            }
        });
    }
    /**
     * 重置魔方转动参数
     * @return  {void}
     */
    resetRotateParams() {
        this.isRotating = false;
        this.targetRubik = null;
        this.anotherRubik = null;
        this.intersect = null;
        this.normalize = null;
        this.startPoint = null;
        this.movePoint = null;
    }
    /**
     * 获取点击的物体
     * @param   {object}  touch  触摸点
     * @return  {void}
     */
    getIntersects(touch) {
        var mouse = new THREE.Vector2();
        // 标准化，取值[-1,1]
        // 用一个新的原点和方向向量来更新射线
        mouse.x = (touch.clientX / this.width) * 2 - 1;
        mouse.y = -(touch.clientY / this.height) * 2 + 1;
        // new Raycaster( origin, direction, near, far );
        // origin: 光线投射的起点向量
        // direction:光线投射的方向向量，应该是被归一化的。
        // .setFromCamera ( coords, camera )
        // coords: 鼠标的二维坐标(direction = camera - coords)
        // camera: 射线起点处的相机，即把射线起点设置在该相机位置处。(origin)
        this.raycaster.setFromCamera(mouse, this.camera);

        // 确定要做碰撞检测的物体
        var rubikTypeName;
        this.targetRubik = this.frontRubik;
        rubikTypeName = this.frontTypeName;
        var targetIntersect = this.scene.getObjectByProperty('typeName', rubikTypeName);

        if (targetIntersect) {
            // 检查射线和物体之间的所有交叉点（包含或不包含后代）。交叉点返回按距离排序，最接近的为第一个。 返回一个交叉点对象数组。
            // .intersectObject ( object, recursive )
            // recursive — 如果为true，它还检查所有后代。否则只检查该对象本身。缺省值为false。
            var intersects = this.raycaster.intersectObjects(targetIntersect.children);

            if (intersects.length >= 2) {
                // 获取点击的小方块和点击的是魔方的哪个面
                this.intersect = intersects[1];
                this.normalize = intersects[0].face.normal;
            }
        }
        return rubikTypeName;
    }
    /**
     * 魔方换阶
     * @param   {number}  layerNum  层级
     * @return  {void}
     */
    changeLayNumRubik(layerNum = 3) {
        if (this.frontRubik && this.frontRubik.layerNum === layerNum) {
            return;
        }
        if (!layerNum) {
            try {
                layerNum = wx.getStorageSync('curLayNum');
            } catch (e) {
                console.log(e);
            }
        }
        layerNum = layerNum || 3;
        this.frontRubik && this.frontRubik.destroy();
        this.frontRubik = new TRubik(this, layerNum);
        this.frontTypeName = 'front';
        this.frontRubik.model(this.frontTypeName);
        wx.setStorage({
            key: 'curLayNum',
            data: layerNum
        });
    }
}