import {getMouse,getRandomUnitVector} from './utilities.js';
import {createImageSprites} from './helpers.js';
export default init;

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const screenWidth = 600;
const screenHeight = 400;

// fake enum
const GameState = Object.freeze({
    START:   		Symbol("START"),
    MAIN:  			Symbol("MAIN"),
    LEVELOVER: 	Symbol("LEVELOVER"),
    GAMEOVER: 	Symbol("GAMEOVER")
});

const MyErrors = Object.freeze({
    drawHUDswitch:  "Invalid value in drawHUD switch",
    mousedownSwitch: "Invalid value in mousedown switch",
    loadLevelSwitch: "Invalid value in loadLevel switch"
});


let gameState = GameState.START;
let imageData;
let sprites = [];
let currentLevel = 1;
let totalScore;
let levelScore;
let cageCount;
let levelGoal;
let levelTarget;
let vectorChangeProb;
let levelTimeLimit;

let hitSound;
let hitWrongSound;
let missSound;

const maxLevel = 3;
const maxScore = 18;

let startTime;
let lastTimeRemaining = 0; // time remaining in integer seconds
let displayTime;
let outOfTime = false;


function init(argImageData){
	imageData = argImageData;
	loadLevel(currentLevel);

	// Load Sounds
  hitSound = new Howl({
    src: ['sounds/shoot.wav'],
    volume: 0.2
  });

  hitWrongSound = new Howl({
    src:['sounds/bonk.mp3'],
    volume: 0.1
  })

  missSound = new Howl({
    src: ['sounds/miss.mp3'],
    volume: 0.2
  });


	// hook up events
	canvas.onmousedown = doMousedown;
	loop();
}

function loop(timestamp){
	// schedule a call to loop() in 1/60th of a second
	requestAnimationFrame(loop);
  if (!startTime) startTime = timestamp; // this runs only once, when the game starts up


	// draw background
	ctx.fillRect(0,0,screenWidth,screenHeight)


  // draw game sprites
  if (gameState == GameState.MAIN){
  	// loop through sprites
  	for (let s of sprites){
      s.move();

      if (s.x <= 0 || s.x >= screenWidth - s.width) {
        s.reflectX();
        s.move();
      }
      if (s.y <= 0 || s.y >= screenHeight -s.height) {
        s.reflectY();
        s.move();
      }

      if (Math.random() < vectorChangeProb)	s.fwd = getRandomUnitVector();

  		// draw sprites
  		s.draw(ctx);

  	} // end for
    displayTime = checkLevelTimer(timestamp);
  } // end if

  // if (displayTime == 0) {
  //   outOfTime = true;
  //   //s.setAttribute({strokeStyle: "red"});
  //
  //   // ctx.fillStyle = "white";
  //   ctx.globalAlpha = 0.2;
  //   ctx.fillRect(0,0,screenWidth,screenHeight);
  //   ctx.globalAlpha = 1.0;
  // }
  if (!outOfTime && displayTime == 0){
    console.log("change")
    manipulatePixels(ctx);
  }

	// draw rest of UI, depending on current gameState
	drawHUD(ctx);

} // end loop()

function drawHUD(ctx){
		ctx.save();

		switch(gameState){
			case GameState.START:
  			ctx.save();

  			// Draw background
        ctx.translate(screenWidth/2,screenHeight/2);
        ctx.scale(6,6);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(imageData.cage2,-20,-30,41,59);
        ctx.restore();


  			// Draw Text
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        fillText(ctx,"Nick Cage", screenWidth/2, screenHeight/2-100, "36pt 'Press Start 2P', cursive", "red");
        strokeText(ctx,"Nick Cage", screenWidth/2, screenHeight/2-100, "36pt 'Press Start 2P', cursive", "white",2);
        fillText(ctx,"Clicker!", screenWidth/2, screenHeight/2-20, "38pt 'Press Start 2P', cursive", "red");
        strokeText(ctx,"Clicker!", screenWidth/2, screenHeight/2-20, "38pt 'Press Start 2P', cursive", "white",2);

        ctx.drawImage(imageData.cage1,100,screenHeight/2+40,50,60);
        ctx.drawImage(imageData.cage1,screenWidth-100-50,screenHeight/2+40,50,60);

        fillText(ctx,"By Calvin To",screenWidth/2,screenHeight/2+70,"16pt 'Press Start 2P',cursive","red");
        strokeText(ctx,"By Calvin To",screenWidth/2,screenHeight/2+70,"16pt 'Press Start 2P',cursive","white");

        fillText(ctx,"YOUR GOAL: To click all the Nick Cage's!",screenWidth/2,screenHeight/2+130,"8pt 'Press Start 2P',cursive","red");
        fillText(ctx,"Click anywhere to begin",screenWidth/2,screenHeight/2+170,"8pt 'Press Start 2P',cursive","red");
  			break;

			case GameState.MAIN:
  			// draw score
      	// fillText(string, x, y, css, color)
        fillText(ctx,`Score: ${levelScore}`, 10, 20, "14pt courier", "white");
        fillText(ctx,`Round: ${currentLevel}`, screenWidth - 110, 20, "14pt courier", "white");
        fillText(ctx,`Goal: ${levelGoal} Nick's!`, screenWidth-180, screenHeight-20, "14pt courier", "white");

      // draw level timer
        let displayColor = "white";           // normal color is white
        if (displayTime < 0) displayTime = 0; // don't display negative time remaining
        if (displayTime <= 3) displayColor = "yellow"; // "warning - running out of time" color
        if (displayTime == 0) displayColor = "red"  // "out of time and losing points!" color
        fillText(ctx,`Time remaining: ${displayTime}`, 10, screenHeight-20, "14pt courier", displayColor);
  			break;

			case GameState.LEVELOVER:
  			// draw level results
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        fillText(ctx,`Round #${currentLevel} over!`, screenWidth/2, screenHeight/2 - 50, "30pt courier", "red");
        fillText(ctx,`Level Score: ${levelScore} out of ${levelGoal}`, screenWidth/2, screenHeight/2, "26pt courier", "white");
        fillText(ctx,"Click to Continue!", screenWidth/2, screenHeight/2 + 50, "12pt courier", "red");
  			break;

			case GameState.GAMEOVER:
  			// draw game results
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        fillText(ctx,"Game Over!", screenWidth/2, screenHeight/2 - 65, "38pt courier", "red");
        fillText(ctx,`Total Score: ${totalScore} out of ${maxScore}`, screenWidth/2, screenHeight/2, "26pt courier", "white");
        fillText(ctx,"Click to play again!", screenWidth/2, screenHeight/2 + 55, "20pt courier", "red");
  			break;

			default:
			throw new Error(MyErrors.drawHUDswitch);

		}

		ctx.restore();

	}

	function loadLevel(levelNum){
    levelScore = 0;
    cageCount = 0;
    let margin = 50;
    let rect = {left: margin, top: margin, width: screenWidth - margin*2, height: screenHeight-margin*3}
    sprites = [];
    switch(currentLevel){
    		case 1:
      		// 3 Nick Cage's, 5 others

      		sprites = sprites.concat(
      			createImageSprites(3,50,60,imageData.cage1,"cage",rect),
      			createImageSprites(5,60,45,imageData.tommy1,"tommy",rect)
      		);

      		levelGoal = 3;
      		levelTarget = "cage";
      		vectorChangeProb = .005;
      		levelTimeLimit = 5;
      		break;

        case 2:
          //6 Nick Cages, 10 others
          sprites = sprites.concat(createImageSprites(3,50,60,imageData.cage1,"cage",rect),
                                   createImageSprites(3,41,59,imageData.cage2,"cage",rect),
                                   createImageSprites(5,60,45,imageData.tommy1,"tommy",rect),
                                   createImageSprites(5,50,71,imageData.franco1,"franco",rect),
                                 )
          levelGoal = 6;
          levelTarget = "cage";
          vectorChangeProb = .008;
          levelTimeLimit = 10;
          break;

        case 3:
          //9 Nick Cage's, 20 others
          sprites = sprites.concat(createImageSprites(3,50,60,imageData.cage1,"cage",rect),
                                   createImageSprites(3,41,59,imageData.cage2,"cage",rect),
                                   createImageSprites(3,57,70,imageData.cage3,"cage",rect),
                                   createImageSprites(5,60,45,imageData.tommy1,"tommy",rect),
                                   createImageSprites(7,50,71,imageData.franco1,"franco",rect),
                                   createImageSprites(8,50,70,imageData.garofalo1,"garofalo",rect),
                                   createImageSprites(5,90,90,imageData.aang,"Aang",rect)
                                 );
          levelGoal = 9;
          levelTarget = "cage";
          vectorChangeProb = .01;
          levelTimeLimit = 15;
          break;

    		default:
    		throw new Error(MyErrors.loadLevelSwitch);
    } // end switch
    startTime = performance.now();
	}


function doMousedown(e){
	console.log(e);
	let mouse=getMouse(e);
	console.log(`canvas coordinates: x=${mouse.x} y=${mouse.y}`);

  switch(gameState){
			case GameState.START:
				currentLevel = 1;
				totalScore = 0;
				levelScore = 0;
				cageCount = 0;
				gameState = GameState.MAIN;
				loadLevel(currentLevel);
				break;

			case GameState.MAIN:
				// TODO
        // we are going to loop through the array backwards so we check the sprites that are "on top" first
        for (let i = sprites.length - 1; i >= 0; --i) {
        	let s = sprites[i];
        	if (s.getRect().containsPoint(mouse)){
        		if (s.speed == 0) continue; // don't score the sprite if it's already been clicked
        		if (s.type != levelTarget){
        			// don't score the sprite if it is the wrong type
        			levelScore --;
        			totalScore --;
        			s.speed = 0;
        		  hitWrongSound.play(); // we will write the sound code later
        			break; // break out of loop so that we only penalize one sprite per click
        		}
        		s.speed = 0;
        		cageCount ++;
        		levelScore ++;
        		totalScore ++;
        	  hitSound.play(); // we will write the sound code later
            sprites = sprites.filter((s) => {if(s.type != levelTarget && s.speed == 0) return false; return true;});
        		break; // break out of loop so that we only score one sprite per click
        	}
        } // end for loop

        if (cageCount == levelGoal && currentLevel >= maxLevel){
        	gameState = GameState.GAMEOVER;
        	break;
        }

        if (cageCount == levelGoal){
        	gameState = GameState.LEVELOVER;
        }
				break;


			case GameState.LEVELOVER:
					// TODO
        case GameState.LEVELOVER:
        currentLevel ++;
        cageCount = 0;
        levelScore = 0;
        loadLevel(currentLevel);
        gameState = GameState.MAIN;
        break;


			case GameState.GAMEOVER:
				gameState = GameState.START;
				break;

			default:
				throw new Error(MyErrors.mousedownSwitch);
	} // end switch
}

function fillText(ctx,string,x,y,css,color){
  ctx.save();
  ctx.font = css;
  ctx.fillStyle = color;
  ctx.fillText(string,x,y);
  ctx.restore();
}

function strokeText(ctx,string,x,y,css,color,lineWidth){
  ctx.save()
  ctx.font = css;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeText(string,x,y);
  ctx.restore();
}

function checkLevelTimer(timestamp){
  let elaspedTime = (timestamp - startTime)/1000;
  let timeRemaining = Math.ceil(levelTimeLimit - elaspedTime);
  if (timeRemaining < 0 && timeRemaining < lastTimeRemaining) {
    levelScore --;
    totalScore --;
    hitWrongSound.play();
  }
  lastTimeRemaining = timeRemaining;
  //let displayTime = timeRemaining
  return timeRemaining;
}

function manipulatePixels(ctx){
  let imageData = ctx.getImageData(0,0,screenWidth,screenHeight);
  let data = imageData.data;
  let length = imageData.length;

  for (var i = 0; i < length; i+=4) {
      data[i] += 255;
      data[i + 1] += 50;
      data[i + 2] += 100;
      data[i + 3] += 0.4;
    }

  ctx.putImageData(imageData,0,0);
}
