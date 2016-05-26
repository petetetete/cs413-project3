var gameWidth = 1024;
var gameHeight = 576;

var gameport = document.getElementById("gameport");

var renderer = new PIXI.autoDetectRenderer(gameWidth, gameHeight, {backgroundColor: 0x000});
gameport.appendChild(renderer.view);

var stage = new PIXI.Container();

PIXI.loader
	.add("assets/spritesheet.json")
	.load(ready);

function ready() {
	
}