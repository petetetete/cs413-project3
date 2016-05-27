var GAME_WIDTH = 1024;
var GAME_HEIGHT = 576;
var GAME_SCALE = 3;
var MAX_PLAYER_SPEED = 10;
var MAX_PLAYER_SIZE = 5;
var TEXT_FADE_TIME = 120;

var gameport = document.getElementById("gameport");

var renderer = new PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, {backgroundColor: 0x000});
gameport.appendChild(renderer.view);

var stage = new PIXI.Container();
stage.scale.x = GAME_SCALE;
stage.scale.y = GAME_SCALE;



var player = {
	"sprite": null,
	"speed": 2,
	"size": 1
};
var textures = {};
var worlds = {};
var currWorld = 0;

var text;
var textOffset = 25;
var textTime = 0;

var direction = [0,0,0,0];
var prevLoc = [];
var pickups = [false, false, false];

// Add event listeners to the document
document.addEventListener('keydown', keydownEventHandler);
document.addEventListener('keyup', keyupEventHandler);

// Ensure scaling doesn't caus anti-aliasing
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

PIXI.loader
	.add("world1_json", "assets/world1.json")
	.add("w1_tiles", "assets/w1-tiles.png")
	.add("portal", "assets/portal.png")
	.add("world2_json", "assets/world2.json")
	.add("w2_tiles", "assets/w2-tiles.png")
	.add("assets/spritesheet.json")
	.load(ready);

function ready() {
	// Load all game textures
	textures["player"] = {"default": []};
	for (var i = 1; i < 6; i++) {
		textures.player.default.push(PIXI.Texture.fromFrame("player" + i + ".png"));
	}
	textures.player["test"] = [];
	for (var i = 1; i < 7; i++) {
		textures.player.test.push(PIXI.Texture.fromFrame("slime" + i + ".png"));
	}

	// Load all of the worlds
	var tileUtil = new TileUtilities(PIXI);
	worlds[0] = {"world": tileUtil.makeTiledWorld("world1_json", "assets/w1-tiles.png")};
	worlds[1] = {"world": tileUtil.makeTiledWorld("world2_json", "assets/w2-tiles.png")};

	// Initialize player based on tileset location
	player.sprite = new PIXI.extras.MovieClip(textures.player.test);
	player.sprite.anchor.x = 0.5;
	player.sprite.anchor.y = 0.5;
	player.sprite.x = worlds[currWorld].world.getObject("player").x;
	player.sprite.y = worlds[currWorld].world.getObject("player").y;

	text = new PIXI.Text("Get the crown!",{font: "32px Impact", fill: "#fff", strokeThickness: 3, align: "center"});
	text.position.x = 50;
	text.position.y = 50;
	text.scale.x = 1/GAME_SCALE;
	text.scale.y = 1/GAME_SCALE;
	
	toggleWorld();

	animate();
}

function toggleWorld() {

		while(stage.children[0]) {
			stage.removeChild(stage.children[0]);
		}

		if (prevLoc[0]) {
			currWorld = 1 - currWorld;
			player.sprite.x = prevLoc[0];
			player.sprite.y = prevLoc[1];
		}

		worlds[currWorld].world.getObject("entities").addChild(player.sprite);

		stage.addChild(worlds[currWorld].world);
		stage.addChild(text);
}

// Event Handlers
function keydownEventHandler(e) {
	// Movement key catch
	if (e.keyCode === 68 || e.keyCode === 39) {
		e.preventDefault();
		direction[0] = 1;
	}
	if (e.keyCode === 87 || e.keyCode === 38) {
		e.preventDefault();
		direction[1] = 1;
	}
	if (e.keyCode === 65 || e.keyCode === 37) {
		e.preventDefault();
		direction[2] = 1;
	}
	if (e.keyCode === 83 || e.keyCode === 40) {
		e.preventDefault();
		direction[3] = 1;
	}

	if(e.keyCode === 32) {
		e.preventDefault();
		if (pickups[1]) toggleWorld();
	}
}

function keyupEventHandler(e) {
	// Movement key catch
	if (e.keyCode === 68 || e.keyCode === 39) direction[0] = 0;
	if (e.keyCode === 87 || e.keyCode === 38) direction[1] = 0;
	if (e.keyCode === 65 || e.keyCode === 37) direction[2] = 0;
	if (e.keyCode === 83 || e.keyCode === 40) direction[3] = 0;
}

function checkCollision() {
	// Bounding boxes of the world
	if (player.sprite.x > worlds[currWorld].world.worldWidth - player.sprite.width/2) player.sprite.x = worlds[currWorld].world.worldWidth - player.sprite.width/2;
	if (player.sprite.y < player.sprite.height/2) player.sprite.y = player.sprite.height/2;
	if (player.sprite.x < player.sprite.width/2) player.sprite.x = player.sprite.width/2;
	if (player.sprite.y > worlds[currWorld].world.worldHeight - player.sprite.height/2) player.sprite.y = worlds[currWorld].world.worldHeight - player.sprite.height/2;

	// Collision boxes by tile sheet
	objects = worlds[currWorld].world.getObject("collision").objects;
	for (var i = 0; i < objects.length; i++) {
		obj = objects[i];
		p = player.sprite;

		if (p.x - p.width/2 < obj.x + obj.width && p.x + p.width/2 > obj.x && p.y - p.height/2 < obj.y + obj.height && p.y + p.height/2 > obj.y) {
			if (obj.name === "portal") toggleWorld();
			if (obj.name === "watershoes") {
				textOffset = 60;
				text.text = "Water Shoes: You feel light on your toes!"
				pickups[0] = true;
				worlds[currWorld].world.getObject("waterShoes").visible = false;
				objects.splice(i, 1);
			}
			if (obj.name === "glasses") {
				textOffset = 60;
				text.text = "Intergalactic Glasses: Spacebar .. ?";
				pickups[1] = true;
				worlds[currWorld].world.getObject("glassesSprite").visible = false;
				objects.splice(i, 1);
			}

			if (!(obj.name === "water" && pickups[0] === true)) {
				player.sprite.x = prevLoc[0], player.sprite.y = prevLoc[1];
			}
		}
	}
}

function movePlayer() {

	// Save previous location
	prevLoc[0] = player.sprite.x, prevLoc[1] = player.sprite.y;

	// Figure out where to move player
	vect = [direction[0]-direction[2], direction[3]-direction[1]];
	mag = getMagnitude(vect);
	directVect = (mag) ? [player.speed*vect[0]/mag, player.speed*vect[1]/mag]: [0,0];
	player.sprite.x += directVect[0];
	player.sprite.y += directVect[1];
}

function updatePlayer() {
	// Animate sprite and increase animation speed if faster
	player.sprite.animationSpeed = player.speed/MAX_PLAYER_SPEED;
	if (getMagnitude(direction) > 0) player.sprite.play();
	else if (player.sprite.currentFrame === 0) player.sprite.stop();

	// Resize player if necessary
	player.sprite.scale.x = player.size;
	player.sprite.scale.y = player.size
}

function updateCamera() {
	// Update text location
	if (text.text != "none" && textTime < TEXT_FADE_TIME) {
		text.visible = true;
		++textTime;
	}
	else {
		text.visible = false; 
		textTime = 0;
		text.text = "none";
	}
	text.position.x = player.sprite.x-textOffset;
	text.position.y = player.sprite.y+25;

	// Update camera location
	stage.x = -player.sprite.x*GAME_SCALE + GAME_WIDTH/2;
	stage.y = -player.sprite.y*GAME_SCALE + GAME_HEIGHT/2;
	if (worlds[currWorld].world.worldWidth * GAME_SCALE >= GAME_WIDTH && worlds[currWorld].world.worldHeight * GAME_SCALE >= GAME_HEIGHT) {
		stage.x = -Math.max(0, Math.min(worlds[currWorld].world.worldWidth*GAME_SCALE - GAME_WIDTH, -stage.x));
		stage.y = -Math.max(0, Math.min(worlds[currWorld].world.worldHeight*GAME_SCALE - GAME_HEIGHT, -stage.y));
	}
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