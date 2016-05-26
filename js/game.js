var GAME_WIDTH = 1024;
var GAME_HEIGHT = 576;
var GAME_SCALE = 3;
var START_SPEED = 2;

var MAX_PLAYER_SPEED = 10;
var START_PLAYER_SIZE = 1;

var SPEED_RATE = 500;
var GROW_RATE = 500;
var EASE_TYPE = createjs.Ease.quadInOut;

var gameport = document.getElementById("gameport");

var renderer = new PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, {backgroundColor: 0x000});
gameport.appendChild(renderer.view);

var stage = new PIXI.Container();
stage.scale.x = GAME_SCALE;
stage.scale.y = GAME_SCALE;

var player;

var playerSize = START_PLAYER_SIZE;
var playerSpeed = START_SPEED;

var world;
var textures = {};

var direction = [0,0,0,0];

// Add event listeners to the document
document.addEventListener('keydown', keydownEventHandler);
document.addEventListener('keyup', keyupEventHandler);
gameport.addEventListener('mousedown', mousedownEventHandler);

// Ensure scaling doesn't caus anti-aliasing
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

PIXI.loader
	.add("map_json", "assets/map.json")
	.add("tiles", "assets/tiles.png")
	.add("assets/spritesheet.json")
	.load(ready);

function ready() {
	// Load all game textures
	textures["player"] = {"frames": []};
	for (var i = 1; i < 6; i++) {
		textures.player.frames.push(PIXI.Texture.fromFrame("player" + i + ".png"));
	}

	// Create world from tileset
	var tu = new TileUtilities(PIXI);
	world = tu.makeTiledWorld("map_json", "assets/tiles.png");
	stage.addChild(world);

	// Initialize player based on tileset location
	player = new PIXI.extras.MovieClip(textures.player.frames);
	hero = world.getObject("player");
	player.x = hero.x;
	player.y = hero.y
	player.anchor.x = 0.5;
	player.anchor.y = 0.5;

	// Save entities layer
	var entityLayer = world.getObject("entities");
	entityLayer.addChild(player);

	animate();
}

// Event Handlers
function keydownEventHandler(e) {
	// Movement key catch
	if (e.keyCode === 68) {
		e.preventDefault();
		direction[0] = 1;
	}
	if (e.keyCode === 87) {
		e.preventDefault();
		direction[1] = 1;
	}
	if (e.keyCode === 65) {
		e.preventDefault();
		direction[2] = 1;
	}
	if (e.keyCode === 83) {
		e.preventDefault();
		direction[3] = 1;
	}

	if(e.keyCode === 32) {
		e.preventDefault();
		playerSpeed = 5;
		playerSize = 5;
	}
}

function keyupEventHandler(e) {
	// Movement key catch
	if (e.keyCode === 68) direction[0] = 0;
	if (e.keyCode === 87) direction[1] = 0;
	if (e.keyCode === 65) direction[2] = 0;
	if (e.keyCode === 83) direction[3] = 0;

	if(e.keyCode === 32) {
		playerSpeed = 2;
		playerSize = 1;
	}
}

function mousedownEventHandler(e) {
	console.log(e.worldX);
}

function checkCollision() {
	// Bounding boxes of the world
	if (player.x > world.worldWidth - player.width/2) player.x = world.worldWidth - player.width/2;
	if (player.y < player.height/2) player.y = player.height/2;
	if (player.x < player.width/2) player.x = player.width/2;
	if (player.y > world.worldHeight - player.height/2) player.y = world.worldHeight - player.height/2;
}

function movePlayer() {
	vect = [direction[0]-direction[2], direction[3]-direction[1]];
	mag = getMagnitude(vect);
	directVect = (mag) ? [playerSpeed*vect[0]/mag, playerSpeed*vect[1]/mag]: [0,0];
	player.x += directVect[0];
	player.y += directVect[1];
}

function updatePlayer() {
	// Animate sprite and increase animation speed if faster
	player.animationSpeed = playerSpeed/MAX_PLAYER_SPEED;
	if (getMagnitude(direction) > 0) player.play();
	else if (player.currentFrame === 0) player.stop();

	// Resize player if necessary
	player.scale.x = playerSize;
	player.scale.y = playerSize
}

function updateCamera() {
	stage.x = -player.x*GAME_SCALE + GAME_WIDTH/2;
	stage.y = -player.y*GAME_SCALE + GAME_HEIGHT/2;
	stage.x = -Math.max(0, Math.min(world.worldWidth*GAME_SCALE - GAME_WIDTH, -stage.x));
	stage.y = -Math.max(0, Math.min(world.worldHeight*GAME_SCALE - GAME_HEIGHT, -stage.y));
}

function getMagnitude(vector) {
	sum = 0;
	for (var i = 0; i < vector.length; i++) {
		sum += vector[i] * vector[i];
	}
	return Math.sqrt(sum);
}

function animate() {
	requestAnimationFrame(animate);
	movePlayer();
	checkCollision();
	updateCamera();
	updatePlayer();
	renderer.render(stage);
}