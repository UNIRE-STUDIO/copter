

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................


// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.querySelector(".hud #fpsCounter");
var scoreCounter = document.querySelector(".game-header div #scoreCounter");
var recordCounter = document.querySelector(".game-header .hud #recordCounter");

// Пауза
var buttonPause = document.getElementById("pause"); 
buttonPause.onclick = function() {
    game.pauseIsActive(!game.isPause);
}
var buttonContinue = document.getElementById("continue");
buttonContinue.onclick = function () {
    game.pauseIsActive(false);
}

var gameOverPanel = document.getElementById("game-over");
var buttonRestart = document.getElementById("restart");
buttonRestart.onclick = function () {
    game.startGame();
}

// ЗАГРУЗКА ДОКУМЕНТА ..........................................
document.addEventListener('DOMContentLoaded', function() {

     // Внутренний размер окна — это ширина и высота области просмотра (вьюпорта).
    console.log(window.innerHeight);

    canvas.width = window.innerWidth - 200;
    if (canvas.width < 600) canvas.width = 600;

    mapManager.loadJsonMaps();
    game.startGame();
    glManager.gameLoop();
});

// ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ..........................................

// Отлавливаев клики мышкой
document.addEventListener('click', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    /*
    if (isInside(mousePos, panelPause)){
        game.isPause = false;
    }
    */
}, false);

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', function() {
    if (event.which === 80){
        game.pauseIsActive(!game.isPause);
    }
    if (game.isPause) return;

    if (event.which === 38 || event.which === 87 || event.which === 32){
        copter.jump();
    }
});

/* ДЕБАГ
document.addEventListener('mousemove',function() {
    let mousePos = getMousePos(canvas, event);
    copter.x = mousePos.x;
    copter.y = mousePos.y;
});
*/

// СУЩНОСТИ ....................................................................

var game = {

    score: 0,
    isPause: true,
    
    pauseIsActive(flag){
        this.isPause = flag;
        buttonContinue.style.display = flag ? "block" : "none";
        buttonPause.style.display = !flag ? "" : "none";
    },
    startGame(){
        this.isPause = false;
        this.score = 0;
        scoreCounter.innerHTML = "" + game.score;
        buttonPause.style.display = "block";
        gameOverPanel.style.display = "none";

        mapManager.x = 0;
        copter.x = 120,
        copter.y = canvas.height/4;
        copter.currentJumpForce = 0;
        copter.time = 0;
    },
    addScore(){
        game.score++;
        scoreCounter.innerHTML = "" + game.score;
    },
    gameOver(){
        buttonPause.style.display = "none";
        this.isPause = true;
        gameOverPanel.style.display = "block";
    }
}

var config = {
    grid: 48 // Размер сетки
}

var copter = {
    x: 120,                  // Отступ от края должен быть кратен половину размера сетки (блока)
    y: canvas.height/4,
    width: 40,
    height: 40,
    gravity: 0,           // Гравитация
    time: 0,                // Копим время полета и сбрасываем при прыжке
    jumpForce: 90,          // Сила прыжка
    currentJumpForce: 0,    // Текущая сила прыжка
    dampingJumpForce: 0.4,  // Демпфирование силы прыжка

    update() {
        
        copter.time += (glManager.lag/1000); // Получаем время между кадрами в миллесекундах (делим на 1000)
        copter.y += ((copter.gravity * copter.time) - copter.currentJumpForce) * (glManager.lag/1000); // Ускорение свободного падения минус сила прыжка
    
        // Оставим это если надумаем смягчать силу прыжка
        //if (copter.currentJumpForce > 0) copter.currentJumpForce -= copter.dampingJumpForce;

        // Проверка на столкновения
        let centerX = copter.x + (copter.width/2);
        let centerY = copter.y + (copter.height/2);
        
        let leftLimit = Math.floor((Math.abs(mapManager.x)+centerX)/config.grid)-1;
        let rightLimit = leftLimit + 3; //
        
        if (rightLimit >= mapManager.currentMap.length) rightLimit = mapManager.currentMap.length;
        for (let i = leftLimit; i < rightLimit; i++) {
            for (let j = 0; j < mapManager.currentMap[i].length; j++) {
                let block = mapManager.currentMap[i][j];
                
                let collision = detectCollision({x:copter.x, y:copter.y, side:copter.width}, 
                                                {x:block.x*config.grid+mapManager.x, y:block.y*config.grid, side:config.grid});

                if (collision) game.gameOver();
                /* Вычисление радиусом
                let blockCenterX = (block.x * config.grid) + mapManager.x + (config.grid/2);
                let blockCenterY = (block.y * config.grid) + (config.grid/2);
                

                let distance = Math.sqrt(Math.pow(blockCenterX-centerX, 2)+Math.pow(blockCenterY-centerY, 2));
                if (distance < 50){
                    console.log("DESTROY");
                }
                */
            }
        }
    },

    draw(){
        // Рисуем квадрат
        drawRect(copter.x, copter.y, copter.width, copter.height, "#67ED31")
    },

    jump(){
        copter.time = 0;                             // Обнуляем время полёта
        copter.currentJumpForce = copter.jumpForce; // Прибовляем силу прыжка
    }
}

var mapManager = {
    x: 0,
    speed: 40,
    currentSpeed: 0,
    currentMapId: 0,
    currentMap: [],
    maps: [],

    turnOnMove(){
        mapManager.currentSpeed = mapManager.speed;
    },

    loadJsonMaps(){
        var url = 'assets/map.json';
        fetch(url)
            .then(response => response.json())
            .then(json => {
                mapManager.parseJsonToMap(json);
            });
    },

    parseJsonToMap(json){
        json.forEach(map => {
            var columnNum = 0;              // Счетчик стобцов
            var columns = [];
            var blocks = [];

            // Перебираем блоки на карте
            map.forEach(block => {
                if (block.x == columnNum){  // Если столбец блока совпадает с текущим, то собираем массив
                    blocks.push(block);     // Так мы собираем все блоки расположенные в одном столбце
                }
                else {                      // Если предыдущий столбец закончился, переходим к следующему 
                    columnNum++;            // Даём понять, что-мы готовы считать следующий столбец
                    columns.push(blocks);   // Все собранные блоки добавляем в массив столбцов
                    blocks = [];            // обнуляем сборщик блоков
                    blocks.push(block);     // Добавляем блок нового столбца
                }
            });
            columns.push(blocks);           // (Для последнего столбца)
            var modifiedMap = columns;      // Пересобрали карту стобцами
            mapManager.maps.push(modifiedMap); // Добавляем собранную карту в массив карт
        });
        console.log(mapManager.maps);
        mapManager.loadCurrentMap();
    },

    loadCurrentMap(){
        console.log(mapManager.maps[0]);
        mapManager.currentMap = mapManager.maps[mapManager.currentMapId];
    },

    update(){
        mapManager.x -= mapManager.currentSpeed * (glManager.lag/1000);

        if (mapManager.x < -4656){          // Для тестирования
            mapManager.x = 0;
        }
    },

    draw(){
        let leftLimit = Math.floor(Math.abs(mapManager.x/config.grid));
        let sizeMapToGrid = Math.round(canvas.width/config.grid);
        let rightLimit = sizeMapToGrid + leftLimit + 2;
        if (rightLimit >= mapManager.currentMap.length) rightLimit = mapManager.currentMap.length;
        for (let i = leftLimit; i < rightLimit; i++) {
            for (let j = 0; j < mapManager.currentMap[i].length; j++) {
                let block = mapManager.currentMap[i][j];
                let color;
                switch (block.t) {
                    case "element1":
                        color = "#1F618D";
                        break;
                    case "element2":
                        color = "#B03A2E";
                        break;
                    default:
                        color = "#B7950B";
                        break;
                }
                drawRect(block.x * config.grid + mapManager.x, block.y * config.grid, config.grid, config.grid, color);
            }
        }
    }
}


// ИГРОВОЙ ЦИКЛ ................................................................

var glManager = {
    ms_per_update: 16,    // Интервал между вычислениями
    fps: 0,
    elapsed: 0,            // Счетчик времени между кадрами
    currentTime: 0,
    pervious: Date.now(),
    lag: 0.0,

    gameLoop(){
        // Текущее вермя
        glManager.currentTime = Date.now();
        glManager.elapsed = glManager.currentTime - glManager.pervious; // Время между предыдущим и текущим кадром
        glManager.pervious = glManager.currentTime;             // Сохраняем время текущего кадра
        glManager.lag += glManager.elapsed;                     // Суммированное время между кадрами
        
        if (glManager.lag < glManager.ms_per_update){           // Если процессор обработал быстрее чем нужно, то пропускаем вычисления
            requestAnimFrame(glManager.gameLoop);
            return;
        }

        // Сохраняем лаг, т.е время с предыдущего РАБОЧЕГО кадра (для подсчета ФПС)
        // Так-как потом мы изменяем glManager.lag
        var curLag = glManager.lag;
        
        // При накоплении лагов, змейка начнёт отставать на несколько итераций т.е перемещений
        // с помощью этого цикла мы нагоняем змейку к её нужному положению
        while (glManager.lag >= glManager.ms_per_update) {
            update();
            glManager.lag -= glManager.ms_per_update;
        }
        // Рендерим кадр с нужны интервалом (glManager.ms_per_update)
        render();
        
        // Ограничем показ ФПС
        if (Date.now() % 5 === 0) glManager.fpsUpdate(curLag);

        requestAnimFrame(glManager.gameLoop);
    },

    fpsUpdate(curLag){
        glManager.fps = (1000/curLag).toFixed(0);
        fpsCounter.innerHTML = "FPS: "+ glManager.fps;
    }
}

function update() {
    if (game.isPause) return;
    copter.update();
    mapManager.update();
}

function render (){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    copter.draw();
    mapManager.draw();
}

// ВСПОМОГАТЕЛЬНЫЕ, УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ................................................................

var requestAnimFrame = (function(){
    return  window.requestAnimationFrame        ||
            window.webkitRequestAnimationFrame  ||
            window.mozRequestAnimationFrame     ||
            window.oRequestAnimationFrame       ||
            window.msRequestAnimationFrame      ||
            function(callback){
                window.setTimeout(callback, 1000 / 20);
            };
})();

// Получаем рандомное целое число в диапазоне
function randomRange(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
}

// Функция проверяет попадает ли точка в область прямоугольника
function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y
}

// Рисуем квадрат
function drawRect(posX, posY, scaleX, scaleY, color){
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(posX, posY, scaleX, scaleY);
    ctx.fill();
}

// Рисуем текст в канвасе
function drawText(text){
    ctx.font = '10pt arial';
    ctx.fillStyle = '#000000'
    ctx.fillText('label: ' + text, 13, 50);
}

// Получаем позицию мыши
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

var drawDebbug = {
    drawObject: {posX: 0, posY: 0, scaleX: 0, scaleY: 0, color: "ffffff"},
    text: '',
    draw(){
        drawRect(drawDebbug.drawObject.posX, 
            drawDebbug.drawObject.posY, 
            drawDebbug.drawObject.scaleX, 
            drawDebbug.drawObject.scaleY, 
            drawDebbug.drawObject.color);
        drawText(drawDebbug.text);
    }
}

function detectCollision(sq1, sq2) {

    // вычисляем границы квадратов
    const sq1_left = sq1.x;
    const sq1_right = sq1.x + sq1.side;
    const sq1_top = sq1.y;
    const sq1_bottom = sq1.y + sq1.side;
    
    const sq2_left = sq2.x;
    const sq2_right = sq2.x + sq2.side;
    const sq2_top = sq2.y;
    const sq2_bottom = sq2.y + sq2.side;
    
    // проверяем, пересекаются ли границы квадратов по осям X и Y
    const x_collide = sq1_right >= sq2_left && sq1_left <= sq2_right;
    const y_collide = sq1_bottom >= sq2_top && sq1_top <= sq2_bottom;
    
    return x_collide && y_collide;
  }
