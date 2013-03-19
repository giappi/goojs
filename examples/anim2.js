require.config({
	baseUrl: "./",
	paths: {
		goo: "../src/goo",
		'goo/lib': '../lib'
	}
});
require([
	'goo/renderer/MeshData',
	'goo/renderer/Material',
	'goo/entities/GooRunner',
	'goo/loaders/JSONImporter',
	'goo/entities/components/ScriptComponent',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/PointLight',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/math/Vector3',
	'goo/renderer/Util',
	'goo/animation/AnimationManager',
	'goo/animation/blendtree/SimpleAnimationApplier',
	'goo/renderer/shaders/ShaderLib',
	'goo/scripts/OrbitCamControlScript'
], function (
	MeshData,
	Material,
	GooRunner,
	JSONImporter,
	ScriptComponent,
	LightComponent,
	PointLight,
	Camera,
	CameraComponent,
	Vector3,
	Util,
	AnimationManager,
	SimpleAnimationApplier,
	ShaderLib,
	OrbitCamControlScript
) {
	"use strict";

	var resourcePath = "../resources";

	var animationManager = null;
	var walking = true;

	function init () {
		// Create typical goo application
		var goo = new GooRunner({
			showStats: true
		});
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		// var ui = new DebugUI(goo);

		var camera = new Camera(45, 1, 1, 1000);
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.set(0, 20, 150);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();

		var scripts = new ScriptComponent();
		scripts.scripts.push(new OrbitCamControlScript({
			domElement : goo.renderer.domElement,
			baseDistance : 150,
			spherical : new Vector3(150, Math.PI / 2, 0)
		}));
		cameraEntity.setComponent(scripts);

		// Setup light
		var light = new PointLight();
		var entity = goo.world.createEntity('Light1');
		entity.setComponent(new LightComponent(light));
		var transformComponent = entity.transformComponent;
		transformComponent.transform.translation.x = 80;
		transformComponent.transform.translation.y = 50;
		transformComponent.transform.translation.z = 80;
		entity.addToWorld();

		// Load skeleton
		loadModels(goo);
	}

	function loadModels (goo) {
		var importer = new JSONImporter(goo.world);

		var skinMeshes = [];

		// Load asynchronous with callback
		importer.load(resourcePath + '/skeleton/skeleton.model', resourcePath + '/skeleton/', {
			onSuccess: function (entities) {
				for ( var i in entities) {
					entities[i].addToWorld();
				}
				entities[0].transformComponent.transform.scale.set(1, 1, 1);
				entities[0].transformComponent.transform.translation.y = -50;

				for ( var i = 0; i < entities.length; i++) {
					var entity = entities[i];
					console.log(entity.name);
					if (entity.meshDataComponent && entity.meshDataComponent.meshData.type === MeshData.SKINMESH) {
						skinMeshes.push(entity);
					}
				}

				if (skinMeshes.length > 0) {
					for (var i=0;i<skinMeshes.length;i++) {
						var skinShader = Material.createShader(Util.clone(ShaderLib.skinning));
						skinShader.defines.JOINT_COUNT = skinMeshes[i].meshDataComponent.meshData.paletteMap.length;
						skinShader.defines.WEIGHTS = skinMeshes[i].meshDataComponent.meshData.weightsPerVertex;
						console.log(skinMeshes[i].name + ' - joint count: ', skinShader.defines.JOINT_COUNT, ' weight count: ', skinShader.defines.WEIGHTS);

						skinMeshes[i].meshRendererComponent.materials[0].shader = skinShader;
					}
					loadAnimations(skinMeshes[0].meshDataComponent.meshData.currentPose);
				}
			},
			onError: function (error) {
				console.error(error);
			}
		});

		goo.callbacks.push(function (tpf) {
			if (animationManager) {
				animationManager.update(tpf);
			}
		});
	}

	function loadAnimations (pose) {
		var request = new XMLHttpRequest();
		request.open('GET', resourcePath + '/skeleton/skeleton.anim', true);
		request.onreadystatechange = function () {
			if (request.readyState === 4) {
				if (request.status >= 200 && request.status <= 299) {
					setupAnimations(pose, request.responseText);
				} else {
					console.error(request.statusText);
				}
			}
		};
		request.send();
	}

	function setupAnimations (pose, animationTree) {
		// setup manager
		animationManager = new AnimationManager(pose);
		animationManager._applier = new SimpleAnimationApplier();

		new JSONImporter().importAnimationTree(animationManager, animationTree, {
			onSuccess: function (outputStore) {
				animationManager.getBaseAnimationLayer().setCurrentStateByName("walk_anim", true);
			},
			onError: function (error) {
				console.error(error);
			}
		});

		document.addEventListener('keydown', function (e) {
			e = window.event || e;
			var code = e.charCode || e.keyCode;
			if (code === 32) { // space bar
				animationManager.getBaseAnimationLayer().doTransition(walking ? "run" : "walk");
				walking = !walking;
			} else if (code === 13) { // enter
				animationManager.findAnimationLayer("punchLayer").setCurrentStateByName("punch_right", true);
			}
		}, false);
	}

	init();
});
