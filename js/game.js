// Some constant values
var GAME_WIDTH = 1024;
var GAME_HEIGHT = 576;
var GAME_SCALE = 3;
var WORLD_HEIGHT = 800;
var WORLD_WIDTH = 800;
var MAX_PLAYER_SPEED = 10;
var TEXT_LIFETIME = 3000;
var TEXT_FADETIME = 500;

// Fetch gameport and add the renderer
var gameport = document.getElementById("gameport");
var renderer = new PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, {backgroundColor: 0x000});
gameport.appendChild(renderer.view);

// Create the main stage
var stage = new PIXI.Container();
stage.scale.x = GAME_SCALE;
stage.scale.y = GAME_SCALE;

// Set up some tracking global variables
var player = {
	"sprite": null,
	"speed": 2,
	"size": 1
};
var textures = {};
var world;
var prevLoc = [];
var currWorld = 0;

var direction = [0,0,0,0];
var pickups = [false, false, false];

var text;
var textOffset;

// Add event listeners to the document
document.addEventListener('keydown', keydownEventHandler);
document.addEventListener('keyup', keyupEventHandler);

// Ensure scaling doesn't caus anti-aliasing
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

// Only load world, tilesheet, and spritesheet
PIXI.loader
	.add("world_json", "assets/world.json")
	.add("world_tiles", "assets/world-tiles.png")
	.add("assets/spritesheet.json")
	.load(ready);

function ready() {

	// Save all of the textures
	textures["player"] = {"slime": []};
	for (var i = 1; i < 7; i++) {
		textures.player.slime.push(PIXI.Texture.fromFrame("slime" + i + ".png"));
	}
	textures.player["slimeCrown"] = [];
	for (var i = 1; i < 7; i++) {
		textures.player.slimeCrown.push(PIXI.Texture.fromFrame("slime-crown" + i + ".png"));
	}

	// Load all of the worlds
	var tileUtil = new TileUtilities(PIXI);
	world = tileUtil.makeTiledWorld("world_json", "assets/world-tiles.png");
	stage.addChild(world);

	// Set up the text element of the HUD
	text = new PIXI.Text("Get the crown",{font: "34px Impact", fill: "#fff", dropShadow: true, align: "center"});
	text.position.x = 50;
	text.position.y = 50;
	text.scale.x = 1/GAME_SCALE;
	text.scale.y = 1/GAME_SCALE;
	stage.addChild(text);

	// Initialize player based on tileset location
	player.sprite = new PIXI.extras.MovieClip(textures.player.slime);
	player.sprite.anchor.x = 0.5;
	player.sprite.anchor.y = 0.5;
	player.sprite.x = world.getObject("player").x;
	player.sprite.y = world.getObject("player").y;
	world.getObject("entities").addChild(player.sprite);

	// Kick off stuff with a message and starting the animate loop
	displayText("Get the crown", 32);
	animate();
}

// Function used to toggle between worlds
function toggleWorld(portal) {
	currWorld = 1 - currWorld;
	player.sprite.position.y += (currWorld) ? WORLD_HEIGHT : -WORLD_HEIGHT;
	if (portal) {
		vect = getMovement();
		player.sprite.position.x += 25 * (vect[0]-vect[2]);
		player.sprite.position.y += 25 * (vect[3]-vect[1]);
	}
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
	if (player.sprite.x > WORLD_WIDTH - player.sprite.width/2) player.sprite.x = WORLD_WIDTH - player.sprite.width/2;
	if (player.sprite.y < (currWorld*WORLD_HEIGHT) + player.sprite.height/2) player.sprite.y = currWorld*WORLD_HEIGHT + player.sprite.height/2;
	if (player.sprite.x < player.sprite.width/2) player.sprite.x = player.sprite.width/2;
	if (player.sprite.y > (currWorld+1)*WORLD_HEIGHT - player.sprite.height/2) player.sprite.y = (currWorld+1)*WORLD_HEIGHT - player.sprite.height/2;

	// Collision boxes by tile sheet
	objects = world.getObject("collision").objects;
	for (var i = 0; i < objects.length; i++) {
		obj = objects[i];
		p = player.sprite;

		// Some variables for checking collision and side of collision
		dx = p.x-(obj.x+obj.width/2), dy = p.y-(obj.y+obj.height/2);
		w = (p.width+obj.width)/2, h = (p.height+obj.height)/2;
		cw = w*dy, ch = h*dx;

		if(Math.abs(dx)<=w && Math.abs(dy)<=h){

			// Check if the player has hit an important object
			if (obj.name === "portal") {
				toggleWorld(true);
			}
			else if (obj.name === "watershoes") {
				displayText("Water Shoes: You feel light on your toes!", 100);
				pickups[0] = true;
				world.getObject("waterShoes").visible = false;
				objects.splice(i, 1);
			}
			else if (obj.name === "glasses") {
				displayText("Intergalactic Glasses: Spacebar .. ?", 80);
				pickups[1] = true;
				world.getObject("glassesSprite").visible = false;
				objects.splice(i, 1);
			}
			else if (obj.name === "water" && pickups[0] === true) {
				// Do nothing about collision if this is the case
			}
			else if (obj.name === "crown") {
				if (pickups[0] && pickups[1]) displayText("You are now the alpha slime, enjoy your dominance!", 127);
				else displayText("How did you get here without getting all of the pickups??", 130);
				player.sprite.textures = textures.player.slimeCrown;
				pickups[2] = true;
				world.getObject("crownSprite").visible = false;
				objects.splice(i, 1);
			}
			else {
				if (cw>ch) {
					(cw>-ch) ? player.sprite.y = prevLoc[1] : player.sprite.x = prevLoc[0];
				}
				else {
					(cw>-ch) ? player.sprite.x = prevLoc[0] : player.sprite.y = prevLoc[1];
				}
			}
			
		}
	}
}

// Function used explicitly to move and animate the player
function movePlayer() {

	// Save previous location
	prevLoc[0] = player.sprite.x, prevLoc[1] = player.sprite.y;

	// Figure out where to move player
	vect = getMovement();
	player.sprite.x += vect[0]-vect[2];
	player.sprite.y += vect[3]-vect[1];

	player.sprite.animationSpeed = player.speed/MAX_PLAYER_SPEED;
	if (getMagnitude(direction) > 0) player.sprite.play();
	else if (player.sprite.currentFrame === 0) player.sprite.stop();

}

// Function used to tell the player things
function displayText(input, offset) {
	textOffset = offset;
	text.alpha = 0;
	text.text = input;
	createjs.Tween.get(text).to({alpha:1}, TEXT_FADETIME, createjs.Ease.quadInOut).wait(TEXT_LIFETIME).call(function() {
		createjs.Tween.get(text).to({alpha:0}, TEXT_FADETIME, createjs.Ease.quadInOut).call(function() { 
			text.text = "none" 
		});
	});
} 

// Function used to update the camera position
function updateCamera() {

	// Position text
	text.position.x = player.sprite.x-textOffset;
	text.position.y = player.sprite.y+25;

	// Update camera location
	stage.x = -player.sprite.x*GAME_SCALE + GAME_WIDTH/2;
	stage.y = -player.sprite.y*GAME_SCALE + GAME_HEIGHT/2;

	// Limit camera to the world the player is in
	stage.x = -Math.max(0, Math.min(WORLD_WIDTH*GAME_SCALE - GAME_WIDTH, -stage.x));
	stage.y = -Math.max(currWorld*WORLD_HEIGHT*GAME_SCALE, Math.min(((currWorld+1)*WORLD_HEIGHT)*GAME_SCALE - GAME_HEIGHT, -stage.y));
}

// Helper methods called throughout the program
function getMagnitude(vector) {
	sum = 0;
	for (var i = 0; i < vector.length; i++) {
		sum += vector[i] * vector[i];
	}
	return Math.sqrt(sum);
}
function getMovement() {
	mag = getMagnitude(direction);
	dVector = (mag) ? [player.speed*direction[0]/mag, player.speed*direction[1]/mag, player.speed*direction[2]/mag, player.speed*direction[3]/mag]: [0,0,0,0];
	return dVector;
}

// Main game loop!
function animate() {
	requestAnimationFrame(animate);
	movePlayer();
	checkCollision();
	updateCamera();
	renderer.render(stage);
}