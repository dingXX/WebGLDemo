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

        this.setRotateparams();

        this.initRender();
        this.initCamera();
        this.initScene();
        this.initLight();
        this.initObject();
        this.render();
        this.initEvent();
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
        console.log(1000, 0, 0);
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
        console.log(this.originHeight);
        this.frontRubik = new BasicRubik(this);
        this.frontTypeName = 'front';
        this.frontRubik.model(this.frontTypeName);
        this.backRubik = new BasicRubik(this);
        this.backTypeName = 'back';
        this.backRubik.model(this.backTypeName);
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
        } else {
            this.getIntersects(touch);
            //触摸点在魔方上且魔方没有转动
            if (!this.isRotating && this.intersect) {
                //开始转动，设置起始点
                this.startPoint = this.intersect.point;
            }
        }
    }
    /**
     * 触摸移动
     */
    touchMove(event) {
        var touch = event.touches[0];
        //滑动touchline
        this.touchLine.move(touch.clientY, () => {
            var frontPercent = touch.clientY / window.innerHeight;
            this.rubikResize(frontPercent);
        })
        
    }

    /**
     * 触摸结束
     */
    touchEnd(event) {
        this.touchLine.disable();
        var touch = event.changedTouches[0];
        // console.log(touch);
        // 滑动点在魔方上且魔方没有转动
        if (!this.isRotating && this.startPoint) {
            this.getIntersects(touch);
            if (!this.intersect) {
                return;
            }
            this.movePoint = this.intersect.point;
            if (!this.movePoint.equals(this.startPoint)) { //触摸点和滑动点不一样则意味着可以得到转动向量
                this.rotateRubik();
            }
        }
    }
    /**
     * 正反魔方区域占比变化
     */
    rubikResize(frontPercent) {
        this.frontRubik.resizeHeight(frontPercent, 1);
        this.backRubik.resizeHeight(1 - frontPercent, -1);
    }
    rotateRubik() {
        this.isRotating = true; //转动标识置为true
        var sub = this.movePoint.sub(this.startPoint); //计算转动向量
        var direction = this.targetRubik.getDirection(sub, this.normalize); //计算转动方向
        var cubeIndex = this.intersect.object.cubeIndex;
        console.log(direction,'direction');
        console.log(cubeIndex,'cubeIndex');
        // this.resetRotateParams();
        this.targetRubik.rotateMove(cubeIndex, direction,()=>{
            this.resetRotateParams();
        });
        // var anotherIndex = cubeIndex - this.targetRubik.minCubeIndex + this.anotherRubik.minCubeIndex;
        // this.anotherRubik.rotateMove(anotherIndex, direction, function() {
        //     self.resetRotateParams();
        // });
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
        var targetIntersect;
        for (var i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i].typeName == rubikTypeName) {
                targetIntersect = this.scene.children[i];
                break;
            }
        }

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
    }
}