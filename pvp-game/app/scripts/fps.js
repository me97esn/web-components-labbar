'use strict'
let explosion;

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const VIEW_ANGLE = 145;
const ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
const NEAR = 0.1;
const FAR = 20000;
const scene = new THREE.Scene();

var axisHelper = new THREE.AxisHelper( 50 );
axisHelper.position.set(5,-45,-25)
scene.add( axisHelper );

// export for three.js inspector
window.scene = scene;

const socket = require('scripts/socket.js')

const opponents = [];

const hit = new Image();
hit.src = 'images/hit.svg';

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  canvas: document.getElementById('layer1')
});
renderer.domElement.setAttribute('id', 'layer1');
renderer.setClearColor(0x000000, 0);
renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

scene.position.set(0, 0, 0);

const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0, 20, 0);

const cameraContainer = new THREE.Object3D();
cameraContainer.add(camera);
cameraContainer.rotation.order = 'YXZ';
scene.add(cameraContainer);

const controls = new THREE.DeviceOrientationControls(cameraContainer);

const createExplosion = function() {
  var material;
  material = new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture('images/gunshot.svg')
  });
  explosion = new THREE.Mesh(new THREE.CubeGeometry(2, 2, 0.01), material);
  explosion.position.set(0.7, 19.5, -6);
  explosion.visible = false;
  return cameraContainer.add(explosion);
};

createExplosion();

const light = new THREE.PointLight(0xffffff);
light.position.set(0, 0, 0);
scene.add(light);

const hemispherelight = new THREE.HemisphereLight(0x000000);
scene.add(hemispherelight);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

var geometry = new THREE.BoxGeometry(100, 100, 100, 4, 4, 4);
var material = new THREE.MeshBasicMaterial({
  color: 0xff00ff,
  side: THREE.BackSide,
  wireframe: true
});
var mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const jsonLoader = new THREE.JSONLoader();
jsonLoader.load('3dmodels/hand-with-gun/Gun-hand.js', function(geometry, materials) {
  const handGun = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
  cameraContainer.add(handGun);
  handGun.position.set(0.6, 10.5, -1);
  return handGun.rotation.y = -Math.PI / 2;
});

const displayFns = [
  function() {
    renderer.render(scene, camera);
    // camera.rotateY(0.03);
    controls.update();
  },
];


const init = function() {
  var drawStuff = () => {
    displayFns.forEach(function(f) {
      f();
    });
  };

  var draw = function() {
    window.requestAnimationFrame(draw);
    drawStuff();
  };

  draw();
};

function updateThreeModel(user) {
  // const scale = 1 * (user.accuracy);
  // console.log('TODO: ADD MY ACCURACY!');

  // user.threeModel.scale.set(scale, scale, scale);
}

function battleChanged(_battle) {
  console.log('battle changed. TODO: add the code from the listener above ', _battle)

  // Add or replace all users
  _battle.users.forEach(user => {
    if (!opponents.find(opp => opp.id === user.id)) {
      console.log(`the user ${user.name} is not added to the opponents yet, add...`);
      opponents.push(user);

      // create three model. only do this for new users, just change existing models
      const geometry = new THREE.SphereGeometry(3, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
      const material = new THREE.MeshNormalMaterial();
      user.threeModel = new THREE.Mesh(geometry, material);
      console.log('created three model')

      user.threeModel.name = user.name;
      user.threeModel.position.set(0,0,-20)

      scene.add(user.threeModel);
    }

    console.log('TODO: FILTER OUT REMOVED OPPONENTS')



  })

  opponents.forEach(updateThreeModel)

}

module.exports = {
  hit,
  explosion,
  init,
  battleChanged
}