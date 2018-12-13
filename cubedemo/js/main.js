import * as THREE from './three/build/three.js';
// require('./three/build/OrbitControls.js');
import BasicRubik from './object/Rubik02.js';
import TouchLine from './object/TouchLine.js';
import Btn from './object/StaticBtn.js';

import TWEEN from './tween/Tween.js';
const Context = canvas.getContext('webgl');
export default class Main {
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
        this.camera.position.set(0, 0, 300 / this.camera.aspect);
        // this.camera.up.set(1, 1, 1); //正方向
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

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
        
        this.changeLayNumRubik();
        // this.enterAnimation();
        this.initEvent();

        this.touchLine = new TouchLine(this);
        this.resetBtn = new Btn(this,'重置',20,20);
        this.disorderBtn = new Btn(this,'打乱',20,100);
        this.changeBtn = new Btn(this,'换阶',20,180);



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
        }else if(this.resetBtn.isHover(touch) && !this.isRotating){
            this.frontRubik.reset();
            this.backRubik.reset();
        }else if(this.disorderBtn.isHover(touch) && !this.isRotating){
            // this.randomRubik();
            var istrue = this.frontRubik.isRestore();
            console.log(istrue,'isRestore');
            
        }else if(this.changeBtn.isHover(touch) && !this.isRotating){
            let that = this;
            var itemList = ['2', '3', '4']
            wx.showActionSheet({
                itemList,
                success(res) {
                    that.changeLayNumRubik(+itemList[res.tapIndex]);
                }
            })
        } else {
            this.getIntersects(touch);
            //触摸点在魔方上且魔方没有转动
            if (!this.isRotating) {
                //开始转动，设置起始点
                this.startPoint = this.intersect?this.intersect.point:(new THREE.Vector2(touch.clientX,touch.clientY));
            }
        }

    }
    /**
     * 触摸移动
     */
    touchMove(event) {
        var touch = event.touches[0];
        //滑动touchline
        this.touchLine.move(touch.clientY, (percent) => {
            // var frontPercent = touch.clientY / window.innerHeight;
            // console.log(percent,frontPercent);

            this.rubikResize(percent);
        })
        // console.log(touch);
        // 滑动点在魔方上且魔方没有转动
        if (!this.isRotating && this.startPoint && this.targetRubik) {
            let rubikTypeName = this.getIntersects(touch);
            if (!this.intersect) {
                this.movePoint = new THREE.Vector2(touch.clientX,touch.clientY);
            }else{
                this.movePoint = this.intersect.point;

            }
            // this.movePoint = touch;
            if (!this.movePoint.equals(this.startPoint)) { //触摸点和滑动点不一样则意味着可以得到转动向量
                this.rotateRubik(rubikTypeName);
            }
        }
        
    }

    /**
     * 触摸结束
     */
    touchEnd(event) {
        this.touchLine.disable();
        var touch = event.changedTouches[0];

        
    }
    /**
     * 正反魔方区域占比变化
     */
    rubikResize(frontPercent) {
        this.frontRubik.resizeHeight(frontPercent, 1);
        this.backRubik.resizeHeight(1 - frontPercent, -1);
    }
    rotateRubik(rubikTypeName) {
        this.isRotating = true; //转动标识置为true
        var sub = this.movePoint.sub(this.startPoint); //计算转动向量
        // var direction = this.targetRubik.getDirection(sub, this.normalize); //计算转动方向
        let gesture ;
        if (this.intersect) {
            var cubeIndex = this.intersect.object.cubeIndex;
            gesture = this.targetRubik.getGesture(sub,this.normalize,cubeIndex);
        }else{
            // 因为屏幕的坐标是左上角是原点，向上滑的时候，y会是负值
            sub.setY(-1*sub.y);
            gesture = this.targetRubik.getWholeGesture(sub,rubikTypeName);

        }
        this.targetRubik.rotateMove(gesture,()=>{
            this.resetRotateParams();
        });
        this.anotherRubik.rotateMove(gesture);
        // this.resetRotateParams();
        // this.targetRubik.rotateMove(cubeIndex, direction,()=>{
        //     this.resetRotateParams();
        // });
        // var anotherIndex = cubeIndex - this.targetRubik.minCubeIndex + this.anotherRubik.minCubeIndex;
        // this.anotherRubik.rotateMove(anotherIndex, direction, function() {
        //     self.resetRotateParams();
        // });
    };
    enterAnimation(){
        let isAnimationEnd = false;
        let group = this.frontRubik.group;
        let endStatus = {
            rotateY :group.rotation.y,
            y:group.position.y,
            z:group.position.z
        };
        // 重新设置位置
        // group.rotation.y+=(Math.PI/2);
        group.rotateY(-90 / 180 * Math.PI);
        group.position.y += this.originHeight/3;
        group.position.z -=350;
        let startStatus = {
            rotateY :group.rotation.y,
            y:group.position.y,
            z:group.position.z
        };
        var tween = new TWEEN.Tween(startStatus)
                    .to(endStatus,1500)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onUpdate(function(){
                        group.rotation.y = startStatus.rotateY;
                        group.position.y = startStatus.y;
                        group.position.z = startStatus.z;
                    }).onComplete(()=>{
                        isAnimationEnd = true;
                    });
        
        function animate(time){
            if (!isAnimationEnd) {
                TWEEN.update(time);

                requestAnimationFrame(animate);
            }
        }
        // tween.start();

        setTimeout(()=>{
            tween.start();
            requestAnimationFrame(animate);
        },500);
        this.initEvent();
        // this.randomRubik(()=>{
        //     this.initEvent();
        // });

        

    }
    randomRubik(cb){
        if (this.randoming) {
            return;
        }
        this.randoming = true;
        let gestureList = this.frontRubik.getRandomGestureList();
        let gesture = gestureList.shift();
        let that = this;
        let rotateFn = function(gesture){
            that.frontRubik.rotateMove(gesture,0,100);
            that.backRubik.rotateMove(gesture,()=>{
                gesture = gestureList.shift();
               
                if (gesture) {
                    rotateFn(gesture);
                }else{
                    that.randoming = false;

                    if (typeof cb === 'function') {
                        cb();
                    }
                }
            },100);
        }
        rotateFn(gesture);
    };
    /**
     * 重置魔方转动参数
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
        if (this.touchLine.screenRect.top > touch.clientY) { //正视图
            this.targetRubik = this.frontRubik;
            this.anotherRubik = this.backRubik;
            rubikTypeName = this.frontTypeName;
        } else if (this.touchLine.screenRect.top + this.touchLine.screenRect.height < touch.clientY) { //反视图
            this.targetRubik = this.backRubik;
            this.anotherRubik = this.frontRubik;
            rubikTypeName = this.backTypeName;
        }
        var targetIntersect = this.scene.getObjectByProperty('typeName',rubikTypeName);

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
    changeLayNumRubik(layerNum=3){
        if (this.frontRubik && this.frontRubik.params.layerNum ===layerNum) {
            return;
        }
        this.frontRubik && this.frontRubik.destroy();
        this.backRubik && this.backRubik.destroy();
        this.frontRubik = new BasicRubik(this,layerNum);
        this.frontTypeName = 'front';
        this.frontRubik.model(this.frontTypeName);
        this.backRubik = new BasicRubik(this,layerNum);
        this.backTypeName = 'back';
        this.backRubik.model(this.backTypeName);

        this.rubikResize(1-this.minPercent);
        let percent = (this.touchLine&&this.touchLine.hPercent) || (1-this.minPercent);
        this.rubikResize(percent);
    }
}