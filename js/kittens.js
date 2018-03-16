// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 525;
var GAME_HEIGHT = 700;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 96;
var MAX_ENEMIES = 3;
var MAX_VHS = 1;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var UP_ARROW_CODE = 38;
var DOWN_ARROW_CODE = 40;
var ENTER_KEY =13;



// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';
var MOVE_UP ="up";
var MOVE_DOWN = "down";
var RESTART = "restart"

var theme = 'day';

// Preload game images
var images = { day: {}, night: {} };
['enemy', 'stars', 'player','TAPE' ].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName + '.png';
    images.day[imgName] = img;
});
['enemy', 'stars', 'player' ].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName + '2.png';
    images.night[imgName] = img;
});

var revive = document.getElementById("revive");
var video = document.getElementById("winnerVideo");

class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}


// This section is where you will be doing most of your coding
class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images[theme]['enemy'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 3 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

   
}

class Vhs extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images.day['TAPE'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 3 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

   
}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images[theme]['player'];
        this.playerColumn = 2;
       
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
            this.playerColumn = this.playerColumn - 1;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
            this.playerColumn = this.playerColumn + 1;
          
        }
        else if (direction === MOVE_UP && this.y  > 0) {
            this.y = this.y - PLAYER_HEIGHT;
          }
          else if (direction === MOVE_DOWN && this.y < GAME_HEIGHT - PLAYER_HEIGHT) {
            this.y = this.y + PLAYER_HEIGHT;
          }

          else if (direction === RESTART ) {
            console.log("restart")
            gameEngine.restart();
          }
    }

    
}





/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();
        this.vhs= [];
        this.gotVhs = false;
        // Setup enemies, making sure there are always three
        this.setupEnemies();
       

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    setupVhs() {
        if (!this.vhs) {
            this.vhs = [];
        }

        while (this.vhs.filter(e => !!e).length < MAX_VHS) {
            this.addVHS();
        }
    }


    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (enemySpot === undefined || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
        this.enemies[enemySpot].enemyColumn = enemySpot;

        
    }
     // This method finds a random spot where there is VHS, and puts one in there
     addVHS() {
        var vhsSpots = GAME_WIDTH / ENEMY_WIDTH;

        var vhsSpot;
        // Keep looping until we find a free enemy spot at random
        while (vhsSpot === undefined || this.vhs[vhsSpot]) {
            vhsSpot = Math.floor(Math.random() * vhsSpots);
        }

        this.vhs[vhsSpot] = new Vhs(vhsSpot * ENEMY_WIDTH);
        this.vhs[vhsSpot].vhsColumn = vhsSpot;

        
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();
      
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
            else if (e.keyCode === UP_ARROW_CODE) {
                this.player.move(MOVE_UP);
            }
            else if (e.keyCode === DOWN_ARROW_CODE) {
                this.player.move(MOVE_DOWN);
            }
            else if (e.keyCode === ENTER_KEY && this.isPlayerDead() === true  ) {
                tryAgain();
            }
        });

 
           
        

        this.gameLoop();
       
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill
    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));
        this.vhs.forEach(TAPE => TAPE.update(timeDiff));

        // Draw everything!x
        this.ctx.drawImage(images[theme]['stars'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.vhs.forEach(TAPE => TAPE.render(this.ctx));

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        // Check if any enemies should die
        this.vhs.forEach((TAPE, TAPEIdx) => {
            if (TAPE.y > GAME_HEIGHT) {
                delete this.vhs[TAPEIdx];
            }
        });
   
        if (this.score > 6000 && !this.gotVhs){
            this.setupVhs();
           
        }

        if(this.score > 2000){
            MAX_ENEMIES = 4;
        }

        if(this.score > 6000){
            MAX_ENEMIES = 5;
        }

        if(this.score > 8000){
            MAX_ENEMIES = 6;
        }
        if(this.score > 10000){
            MAX_ENEMIES = 7;
        }
    
    
    
          

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = theme === 'day' ? '#000000' : '#fff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
            revive.className = "";
        }
       
       
       ////// youu are a winner bravo 
        else if (this.weHaveWinner()) {
            console.log('winnnnerrr bravo')
            video.className = "";
        }




        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle =  theme === 'day' ? '#000000' : '#fff';
            this.ctx.fillText(this.score, 5, 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
           
          



        
    }

    isPlayerDead() {
        
        var x = this.enemies.some((enemy) => {
            if ( enemy.y + ENEMY_HEIGHT > this.player.y && enemy.enemyColumn === this.player.playerColumn && enemy.y  < this.player.y ) {
               
               return true;
            }
        });
        return x;
    }

    weHaveWinner() {
        var x = this.vhs.some((TAPE) => {
            if ( TAPE.y +47 > this.player.y && TAPE.vhsColumn === this.player.playerColumn && TAPE.y  < this.player.y ) {
               
               return true;
            }
        });
        return x;
    }



    
}





// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();


function continueGame(){
     video.className = "hidden";
     gameEngine.gotVhs = true;
     gameEngine.vhs = [];
     theme = 'night';
     gameEngine.player.sprite = images[theme]['player'];
     document.getElementsByTagName('body')[0].className = 'bg-black';
     document.querySelectorAll('.bg-img').forEach(img => img.className = 'night-filter');
     requestAnimationFrame(gameEngine.gameLoop);
}

function tryAgain(){
    revive.className = "hidden";

    gameEngine.player = new Player();
    gameEngine.score = 0;
    gameEngine.lastFrame = Date.now();
    gameEngine.enemies = [];
    gameEngine.vhs = [];
   
    
     
     requestAnimationFrame(gameEngine.gameLoop);
}

