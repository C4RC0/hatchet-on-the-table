import React, {useContext, useEffect, useRef} from "react";
import {WappContext} from "wapplr-react/dist/common/Wapp";
import style from "./style.css";
import clsx from "clsx";

import * as THREE from "three";

if (typeof window !== "undefined"){
    window.THREE = THREE;
}

if (typeof global !== "undefined") {
    global.THREE = THREE;
}

import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader.js";
import AmmoLib from "three/examples/js/libs/ammo.wasm.js";
import { AmmoDebugDrawer, DefaultBufferSize } from "./AmmoDebugDrawer.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import { BloomEffect, EffectPass, EffectComposer, RenderPass, KernelSize, BlendFunction } from "postprocessing";

const containers = {};

export default function Canvas(props) {

    const context = useContext(WappContext);

    const {wapp} = context;
    const {fullscreen = true} = props;

    wapp.styles.use(style);

    const container = useRef();
    const composition = useRef();
    const compositionBg = useRef();

    if (!containers[wapp.globals.WAPP]){
        containers[wapp.globals.WAPP] = {};
    }

    useEffect(function didMount(){

        containers[wapp.globals.WAPP].current = container.current;

        let physicsWorld;
        let transformAux1;
        let scene;
        let camera;
        let composer;
        let renderer;
        let reqId = null;
        const rigidBodies = [];
        const gravityConstant = -9.8;
        let collisionConfiguration;
        let dispatcher;
        let broadphase;
        let solver;
        let softBodySolver;
        let Ammo = null;
        const clock = new THREE.Clock();
        let moveing = 0;
        let removeInputListeners;
        let lightBulb;
        let wireCylinder;
        let debugGeometry;
        let debugDrawer;
        let controls;
        let target;

        let bgRenderer;
        let bgScene;
        let bgCamera;
        let bgTarget;

        const wallMaterialParams = {
            color: 0x1d3932,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2,
            bumpScale: 0.0005
        }

        async function initAmmo() {
            Ammo = await AmmoLib();
        }

        function initBgGraphics() {

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

            bgScene = new THREE.Scene();
            bgScene.background = new THREE.Color( 0xe5693e );

            bgCamera = new THREE.PerspectiveCamera( 60, parentContainer.offsetWidth/parentContainer.offsetHeight, 0.01, 1000 );

            bgCamera.position.z = 3.8;
            bgCamera.position.y = 1.3;
            bgCamera.position.x = -1.35;

            bgCamera.lookAt(-1.6, 1.25, 2);
            bgTarget = new THREE.Vector3(-1.6, 1.25, 2);

            bgRenderer = new THREE.WebGLRenderer({antialias: true, canvas: compositionBg.current});
            bgRenderer.setSize( parentContainer.offsetWidth, parentContainer.offsetHeight );
            bgRenderer.shadowMap.enabled = true;
            bgRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

            const planeGeometry = new THREE.PlaneGeometry( 6, 8, 32, 32);
            const planeMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const plane = new THREE.Mesh( planeGeometry, planeMaterial );
            plane.receiveShadow = true;
            plane.rotation.set(Math.PI / -2, 0, 0);

            const wallGeometry = new THREE.PlaneGeometry( 6, 4.5, 32, 32 );
            const wallMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const wall = new THREE.Mesh( wallGeometry, wallMaterial );
            wall.receiveShadow = true;
            wall.rotation.set(Math.PI, 0, 0);
            wall.position.z = -4;
            wall.position.y = 4.5/2;

            const wallBackGeometry = new THREE.BoxGeometry( 6, 0.1, 4.5 );
            const wallBackMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const wallBack = new THREE.Mesh( wallBackGeometry, wallBackMaterial );
            wallBack.receiveShadow = true;
            wallBack.castShadow = true;
            wallBack.rotation.set(Math.PI/2, 0, 0);
            wallBack.position.z = 4;
            wallBack.position.y = 4.5/2;

            const wallSideLeftShape = new THREE.Shape();

            wallSideLeftShape.moveTo( 0, 0 );
            wallSideLeftShape.lineTo( 8, 0 );
            wallSideLeftShape.lineTo( 8, 4.5 );
            wallSideLeftShape.lineTo( 0, 4.5 );
            wallSideLeftShape.lineTo( 0, 0 );
            wallSideLeftShape.moveTo( 7.5, 0.4 );
            wallSideLeftShape.lineTo( 5, 0.4 );
            wallSideLeftShape.lineTo( 5, 4.2 );
            wallSideLeftShape.lineTo( 7.5, 4.2 );
            wallSideLeftShape.lineTo( 7.5, 0.4 );

            const wallSideLeftGeometry = new THREE.ExtrudeGeometry( wallSideLeftShape, { steps: 3, depth: 0.1, bevelEnabled: false } );
            const wallSideLeftMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const wallSideLeft = new THREE.Mesh( wallSideLeftGeometry, wallSideLeftMaterial );

            wallSideLeft.receiveShadow = true;
            wallSideLeft.castShadow = true;
            wallSideLeft.traverse(function(child){child.receiveShadow = true; child.castShadow = true;})
            wallSideLeft.rotation.set(0, Math.PI/2, 0);
            wallSideLeft.position.x = -3;
            wallSideLeft.position.z = 4;

            const wallSideRightGeometry = new THREE.PlaneGeometry( 8, 4.5, 32, 32);
            const wallSideRightMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const wallSideRight = new THREE.Mesh( wallSideRightGeometry, wallSideRightMaterial );
            wallSideRight.receiveShadow = true;
            wallSideRight.rotation.set(Math.PI, Math.PI/2, 0);
            wallSideRight.position.x = 3;
            wallSideRight.position.y = 4.5/2;

            const ceilingGeometry = new THREE.BoxGeometry( 6, 0.05, 8 );
            const ceilingMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const ceiling = new THREE.Mesh( ceilingGeometry, ceilingMaterial );
            ceiling.castShadow = true;
            ceiling.rotation.set(Math.PI, 0, 0);
            ceiling.position.y = 4.5;

            const sunLightTarget = new THREE.Object3D();
            sunLightTarget.position.set(0,2,-9);
            const sunLight = new THREE.SpotLight(0xf8875f, 3, 200, 0.8, 2, 2)
            sunLight.position.set(-5,5,4);
            sunLight.target = sunLightTarget;
            sunLight.castShadow = true;
            sunLight.shadow.camera.near = 0.01;
            sunLight.shadow.camera.far = 200;

            const spot1LightTarget = new THREE.Object3D();
            spot1LightTarget.position.set(-1,0,-4);
            const spot1Light = new THREE.SpotLight(0xf8875f, 10, 5, 0.5, 1, 1)
            spot1Light.position.set(-1,4,-3.5);
            spot1Light.target = spot1LightTarget;
            spot1Light.castShadow = true;
            spot1Light.shadow.camera.near = 0.01;

            const spot2LightTarget = new THREE.Object3D();
            spot2LightTarget.position.set(1,0,-4);
            const spot2Light = new THREE.SpotLight(0xf8875f, 10, 5, 0.5, 1, 1)
            spot2Light.position.set(1,4,-3.5);
            spot2Light.target = spot2LightTarget;
            spot2Light.castShadow = true;
            spot2Light.shadow.camera.near = 0.01;

            const hemiLight = new THREE.HemisphereLight( 0xf8875f, 0xf8875f, 1.8 );

            bgScene.add( hemiLight );
            bgScene.add( sunLightTarget );
            bgScene.add( sunLight );
            bgScene.add( spot1LightTarget );
            bgScene.add( spot1Light );
            bgScene.add( spot2LightTarget );
            bgScene.add( spot2Light );
            bgScene.add( plane );
            bgScene.add( wall );
            bgScene.add( wallBack );
            bgScene.add( wallSideLeft );
            bgScene.add( wallSideRight );
            bgScene.add( ceiling );

        }

        function initGraphics() {

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera( 60, parentContainer.offsetWidth/parentContainer.offsetHeight, 0.01, 1000 );
            camera.layers.enable(1);
            camera.layers.enable(2);
            camera.layers.enable(3);

            camera.position.z = 3.8;
            camera.position.y = 1.3;
            camera.position.x = -1.35;

            camera.lookAt(-1.6, 1.25, 2);
            target = new THREE.Vector3(-1.6, 1.25, 2);

            renderer = new THREE.WebGLRenderer({
                antialias: true,
                canvas: composition.current,
                alpha: true,
                powerPreference: "high-performance",
                stencil: false,
            });

            renderer.setSize( parentContainer.offsetWidth, parentContainer.offsetHeight );
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            renderer.autoClear = false;
            renderer.toneMappingExposure = Math.pow( 1, 4.0 )

            const renderScene = new RenderPass( scene, camera );

            const bloomEffect = new EffectPass(camera, new BloomEffect({
                blendFunction: BlendFunction.EXCLUSION,
                kernelSize: KernelSize.MEDIUM,
                luminanceThreshold: 0.1,
                luminanceSmoothing: 0.7,
                intensity: 5,
            }));

            bloomEffect.renderToScreen = true;

            composer = new EffectComposer( renderer );
            composer.addPass( renderScene );
            composer.addPass(bloomEffect);

            const tableGeometry = new THREE.BoxGeometry( 6, 0.05, 0.9 );
            const tableMaterial = new THREE.MeshStandardMaterial( { color: 0x758c86 } );
            const table = new THREE.Mesh( tableGeometry, tableMaterial );
            table.receiveShadow = true;
            table.castShadow = true;
            table.position.y = 0.9+(-0.05/2);
            table.position.z = 2.6;
            table.layers.set(1);

            let hatchet;

            new MTLLoader().load( "./assets/obj/hatchet/hatchet.mtl", function ( materials ) {

                materials.preload();

                new OBJLoader()
                    .setMaterials( materials )
                    .load("./assets/obj/hatchet/hatchet.obj", function ( object ) {

                            hatchet = object;
                            hatchet.scale.x = 0.023;
                            hatchet.scale.y = 0.045;
                            hatchet.scale.z = 0.023;
                            hatchet.position.y = 0.9;
                            hatchet.position.x = -1.5-0.03;
                            hatchet.position.z = 2.6+0.35-0.15;
                            hatchet.rotation.set(0.1, Math.PI + Math.PI / -4 + Math.PI / 7, 0);
                            hatchet.castShadow = true;
                            hatchet.receiveShadow = true;

                            hatchet.traverse(function(child){child.castShadow = true; child.layers.set(1);})

                            scene.add( hatchet );

                        },
                        function ( xhr ) {},
                        function ( error ) {
                            console.log(error)
                        }
                    );

            } );

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry( 0.04, 16, 16 ),
                new THREE.MeshBasicMaterial( { color: 0xefab93, transparent: true, opacity: 0.8 } )
            )
            bulb.layers.set(3);

            const light = new THREE.PointLight(0xf8875f, 1);
            light.shadow.camera.near = 0.01;
            light.shadow.camera.far = 1.5;
            light.lookAt(0,0,0);
            light.castShadow = true;
            light.layers.set(1);

            const socketGeometry = new THREE.CylinderGeometry( 0.02, 0.02, 0.05, 32 );
            const socketMaterial = new THREE.MeshBasicMaterial( {color: 0x000000} );
            const socketCylinder = new THREE.Mesh( socketGeometry, socketMaterial );
            socketCylinder.position.set(0,0.04 + 0.05/2,0);
            socketCylinder.layers.set(1);

            const socketCapGeometry = new THREE.CylinderGeometry( 0.001, 0.021, 0.02, 32 );
            const socketCapMaterial = new THREE.MeshBasicMaterial( {color: 0x000000} );
            const socketCapCylinder = new THREE.Mesh( socketCapGeometry, socketCapMaterial );
            socketCapCylinder.position.set(0,0.04 + 0.05+(0.02/2),0);
            socketCapCylinder.layers.set(1);

            lightBulb = new THREE.Group();
            lightBulb.add(socketCylinder, socketCapCylinder, bulb, light);
            lightBulb.position.set(-1.5,1.35,2.6)
            lightBulb.layers.set(1);

            const lightBulbShape = new Ammo.btSphereShape( 0.04/2 );
            lightBulbShape.setMargin( 0.01 );
            createRigidBody( lightBulb, lightBulbShape, 0.1, lightBulb.position, lightBulb.quaternion );
            lightBulb.userData.physicsBody.setFriction( 0.5 );

            const blanketGeometry = new THREE.BoxGeometry( 0.5, 0.05, 0.5 );
            const blanketMaterial = new THREE.MeshStandardMaterial( {...wallMaterialParams} );
            const blanket = new THREE.Mesh( blanketGeometry, blanketMaterial );
            blanket.castShadow = true;
            blanket.rotation.set(Math.PI / -2, 0, 0);
            blanket.position.y = 4.5;
            blanket.position.x = lightBulb.position.x;
            blanket.position.z = lightBulb.position.z;
            const blanketShape = new Ammo.btBoxShape( new Ammo.btVector3( 0.5 * 0.5, 0.05 * 0.5, 0.5 * 0.5 ) );
            blanketShape.setMargin( 0.01 );
            createRigidBody( blanket, blanketShape, 0, blanket.position, new THREE.Quaternion(0, 0, 0, 1) );
            blanket.layers.set(1);

            const wireStartY = lightBulb.position.y + 0.07;
            const wireHeight = 4.5-wireStartY;
            const wireNumSegments = Math.floor(wireHeight/0.1);
            const segmentLength = wireHeight / wireNumSegments;
            const wirePos = lightBulb.position.clone();
            wirePos.y = wireStartY;

            const wireGeometry = new THREE.BufferGeometry();
            const wireMaterial = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 5 } );
            const wirePositions = [];
            const wireIndices = [];

            for ( let i = 0; i < wireNumSegments + 1; i ++ ) {
                wirePositions.push( wirePos.x, wirePos.y + i * segmentLength, wirePos.z );
            }

            for ( let i = 0; i < wireNumSegments; i ++ ) {
                wireIndices.push( i, i + 1 );
            }

            wireGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( wireIndices ), 1 ) );
            wireGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( wirePositions ), 3 ) );
            wireGeometry.computeBoundingSphere();
            wireCylinder = new THREE.LineSegments( wireGeometry, wireMaterial );
            wireCylinder.castShadow = true;
            wireCylinder.receiveShadow = true;
            wireCylinder.layers.set(1);

            const softBodyHelpers = new Ammo.btSoftBodyHelpers();
            const wireStart = new Ammo.btVector3( wirePos.x, wirePos.y, wirePos.z );
            const wireEnd = new Ammo.btVector3( wirePos.x, wirePos.y + wireHeight, wirePos.z );
            const wireSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), wireStart, wireEnd, wireNumSegments - 1, 0 );
            const sbConfig = wireSoftBody.get_m_cfg();
            sbConfig.set_viterations( 100 );
            sbConfig.set_piterations( 100 );
            wireSoftBody.setTotalMass( 0.1, false );
            Ammo.castObject( wireSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( 0.01 * 3 );
            physicsWorld.addSoftBody( wireSoftBody, 1, - 1 );
            wireCylinder.userData.physicsBody = wireSoftBody;
            wireSoftBody.setActivationState( 4 );

            wireSoftBody.appendAnchor( 0, lightBulb.userData.physicsBody, true, 1 );
            wireSoftBody.appendAnchor( wireNumSegments, blanket.userData.physicsBody, true, 1 );

            const hemiLight = new THREE.HemisphereLight( 0xf8875f, 0xf8875f, 1 );
            hemiLight.layers.set(3)

            scene.add( hemiLight );
            scene.add( lightBulb );
            scene.add( wireCylinder );
            scene.add( blanket );
            scene.add( table );

        }

        function initControls() {
            controls = new OrbitControls( camera, renderer.domElement );
            controls.target = target;
            controls.update();
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.enableDamping = false;
            controls.minPolarAngle = Math.PI/2-0.1;
            controls.maxPolarAngle = Math.PI/2+0.1;
            controls.minAzimuthAngle = camera.rotation.y-0.5;
            controls.maxAzimuthAngle = camera.rotation.y+0.5;
        }

        function initDebugAmmo() {

            const debugVertices = new Float32Array(DefaultBufferSize);
            const debugColors = new Float32Array(DefaultBufferSize);
            debugGeometry = new THREE.BufferGeometry();
            debugGeometry.addAttribute("position", new THREE.BufferAttribute(debugVertices, 3).setDynamic(true));
            debugGeometry.addAttribute("color", new THREE.BufferAttribute(debugColors, 3).setDynamic(true));
            const debugMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
            const debugMesh = new THREE.LineSegments(debugGeometry, debugMaterial);
            debugMesh.frustumCulled = false;
            scene.add(debugMesh);
            debugDrawer = new AmmoDebugDrawer(null, debugVertices, debugColors, physicsWorld);
            debugDrawer.enable();

            setInterval(() => {
                const mode = (debugDrawer.getDebugMode() + 1) % 3;
                debugDrawer.setDebugMode(mode);
            }, 1000);

        }

        function initPhysics(){
            collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
            dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
            broadphase = new Ammo.btDbvtBroadphase();
            solver = new Ammo.btSequentialImpulseConstraintSolver();
            softBodySolver = new Ammo.btDefaultSoftBodySolver();
            physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
            physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
            physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
            transformAux1 = new Ammo.btTransform();
        }

        function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

            threeObject.position.copy( pos );
            threeObject.quaternion.copy( quat );

            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            const motionState = new Ammo.btDefaultMotionState( transform );

            const localInertia = new Ammo.btVector3( 0, 0, 0 );
            physicsShape.calculateLocalInertia( mass, localInertia );

            const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
            const body = new Ammo.btRigidBody( rbInfo );

            threeObject.userData.physicsBody = body;

            if ( mass > 0 ) {
                rigidBodies.push( threeObject );
                body.setActivationState( 4 );
            }

            physicsWorld.addRigidBody( body );

        }

        function updatePhysics( deltaTime ) {

            physicsWorld.stepSimulation( deltaTime, 10 );

            if (debugDrawer) {
                physicsWorld.debugDrawWorld();
            }

            const softBody = wireCylinder.userData.physicsBody;
            const wirePositions = wireCylinder.geometry.attributes.position.array;
            const numVerts = wirePositions.length / 3;
            const nodes = softBody.get_m_nodes();
            let indexFloat = 0;

            for ( let i = 0; i < numVerts; i ++ ) {

                const node = nodes.at( i );
                const nodePos = node.get_m_x();
                wirePositions[ indexFloat ++ ] = nodePos.x();
                wirePositions[ indexFloat ++ ] = nodePos.y();
                wirePositions[ indexFloat ++ ] = nodePos.z();

            }

            wireCylinder.geometry.attributes.position.needsUpdate = true;

            for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {

                const objThree = rigidBodies[ i ];
                const objPhys = objThree.userData.physicsBody;
                const ms = objPhys.getMotionState();
                if ( ms ) {

                    ms.getWorldTransform( transformAux1 );
                    const p = transformAux1.getOrigin();
                    const q = transformAux1.getRotation();
                    objThree.position.set( p.x(), p.y(), p.z() );
                    objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

                }

            }

        }

        function initInput() {
            let wait;
            const click = function (event) {
                const left = event.offsetX < container.current.offsetWidth / 2;
                moveing = (left) ? -1 : 1;
                if (wait) {
                    clearTimeout(wait);
                }
                wait = setTimeout(function () {
                    moveing = 0;
                },200)
            };
            container.current.addEventListener( "click", click );
            removeInputListeners = function () {
                if (container.current) {
                    container.current.removeEventListener("click", click);
                }
            }
        }

        const render = function () {
            if (reqId) {
                cancelAnimationFrame(reqId)
            }
            reqId = requestAnimationFrame( render );

            if (moveing){
                let physicsBody = lightBulb.userData.physicsBody;
                let resultantImpulse = new Ammo.btVector3( 0.01 * moveing, 0, 0.00001 );
                resultantImpulse.op_mul(20);
                physicsBody.setLinearVelocity( resultantImpulse );
            }

            if (controls) {
                controls.update();
            }

            bgCamera.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
            bgCamera.position.set(camera.position.x, camera.position.y, camera.position.z);

            bgRenderer.render(bgScene, bgCamera);

            renderer.clear();

            const deltaTime = clock.getDelta();
            updatePhysics(deltaTime);

            camera.layers.set(3);
            composer.render();

            renderer.clearDepth();

            camera.layers.set(1);
            camera.layers.enable(3);

            renderer.render(scene, camera);

        };

        async function init() {
            await initAmmo();
            initPhysics();
            initBgGraphics();
            initGraphics();
            //initDebugAmmo();
            initControls();
            render();
            initInput();

            let physicsBody = lightBulb.userData.physicsBody;
            let resultantImpulse = new Ammo.btVector3( 0.01, 0, 0.00001 );
            resultantImpulse.op_mul(20);
            physicsBody.setLinearVelocity( resultantImpulse );

        }

        init();

        function onResize() {

            if (camera && renderer) {
                const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;
                camera.aspect = parentContainer.offsetWidth / parentContainer.offsetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(parentContainer.offsetWidth, parentContainer.offsetHeight);

                bgCamera.aspect = parentContainer.offsetWidth / parentContainer.offsetHeight;
                bgCamera.updateProjectionMatrix();
                bgRenderer.setSize(parentContainer.offsetWidth, parentContainer.offsetHeight);

            }

        }

        function addResizeListeners() {
            if (container.current && typeof ResizeObserver !== "undefined") {
                const resizeObserver = new ResizeObserver((entries) => {
                    onResize(entries);
                });
                resizeObserver.observe(container.current);
                return function removeEventListener(){
                    resizeObserver.disconnect();
                }
            } else {
                window.addEventListener("resize", onResize);
                return function removeEventListener(){
                    window.removeEventListener("resize", onResize);
                }
            }
        }

        const removeResizeListeners = addResizeListeners();

        onResize();

        return function willUnmount() {
            removeResizeListeners();
            if (removeInputListeners){
                removeInputListeners();
            }
            if (reqId) {
                cancelAnimationFrame(reqId);
            }
        }

    }, []);

    return (
        <div
            className={
                clsx(
                    style.canvas,
                    {[style.fullscreen] : fullscreen},
                )}
            ref={container}
        >
            <div className={style.bg} />
            <div className={style.center}>
                <canvas className={style.compositionBg} ref={compositionBg} />
                <canvas className={style.composition} ref={composition} />
            </div>
        </div>
    )
}
