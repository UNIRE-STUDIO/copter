/*
    - Реализовать плавный старт


*/

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................


// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.querySelector(".hud #fpsCounter");
var scoreCounter = document.querySelector(".game-header div #scoreCounter");

// Пауза
var pauseButton = document.getElementById("pause-button"); 
pauseButton.onclick = function() {
    game.changeState(GameStates.PAUSE);
}
var continueButton = document.getElementById("continue-button");
continueButton.onclick = function () {
    game.changeState(GameStates.PLAY);
}

var gameOverPanel = document.getElementById("game-over-panel");
var restartButton = document.getElementById("restart-button");
restartButton.onclick = function () {
    game.changeState(GameStates.READYTOPLAY);
}

var pressKeyToStart = document.getElementById("pressKeyToStart");
var currentLevel = document.getElementById("current-level");

var finishLevel = document.getElementById("finish-level-panel");
var nextLevel = document.getElementById("next-level-button");
nextLevel.onclick = function () {
    // Если это не последняя карта 
    if (mapManager.maps.length-1 > mapManager.currentMapId) mapManager.currentMapId++ // То включаем следующую
    mapManager.loadCurrentMap();
    game.changeState(GameStates.READYTOPLAY);
}

var levelMenuPanel = document.getElementById("level-menu-panel");

var mapsButtons = document.getElementsByClassName("maps");
for (let i = 0; i < mapsButtons.length; i++) {
    mapsButtons[i].onclick = function () {
        if (i === mapManager.currentMapId) return;
        mapManager.currentMapId = i;
        mapManager.loadCurrentMap();
    }
}

// При нажатии на кнопку CUSTOM MAP
document.getElementById("custom-maps-button").onclick = function () {
    if (mapManager.currentMapId < 0) return;
    if (localStorage.getItem("mapeditor") != null){
        mapManager.loadCustomMap();
        game.changeState(GameStates.READYTOPLAY);
    }
    else {
        mapManager.loadCustomMap();
        game.customMapMenu();
    }
}

var openMapEditorInstructions = document.getElementById("open-mapeditor-instructions");
openMapEditorInstructions.addEventListener('click', function(evt) {
    mapManager.currentMap = []; // Отключаем отрисовку карты
    game.customMapMenu();
}, false);

var instructionsRulesToMapeditor = document.getElementById("instructions-rules-to-mapeditor");

var continueCustomMapButton = document.getElementById("continue-custom-map-button");
continueCustomMapButton.onclick = function () {
    mapManager.loadCustomMap();
    game.startGame();
}

// ЗАГРУЗКА ДОКУМЕНТА ..........................................
document.addEventListener('DOMContentLoaded', function() {

     // Внутренний размер окна — это ширина и высота области просмотра (вьюпорта).
    // console.log(window.innerHeight);

    canvas.width = window.innerWidth - 200;
    if (canvas.width < 600) canvas.width = 600;
    mapManager.initialization();
    game.changeState(GameStates.LEVEL_SELECTION);
    glManager.gameLoop();
});

// ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ..........................................

// Отлавливаев клики мышкой
pressKeyToStart.addEventListener('click', function(evt) {
    game.pressKeyToStart();
    copter.jump();
}, false);

canvas.addEventListener('click', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    /*
    if (isInside(mousePos, panelPause)){
        game.isPause = false;
    }
    */
    if (game.isReadyToStart){
        game.pressKeyToStart();
    }
    copter.jump();
}, false);

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', function() {
    if (event.which === 80){
        game.pauseIsActive(!game.isPause);
    }
    if (game.isPause) return;

    if (event.which === 38 || event.which === 87 || event.which === 32){
        if (game.isReadyToStart){
            game.pressKeyToStart();
        }
        copter.jump();
    }
});

// СУЩНОСТИ ....................................................................

// Состояния в которых игра может находиться
const GameStates = {LEVEL_SELECTION: 0, READYTOPLAY: 1, PLAY: 2, PAUSE: 3, GAMEOVER: 4, WIN: 5}

var game = {
    score: 0,
    currentState: GameStates.LEVEL_SELECTION,

    changeState(state){
        switch (state) {
            case GameStates.LEVEL_SELECTION:
                game._LevelSelection();    
            break;
            case GameStates.READYTOPLAY:
                    // Костыль, который не позволяет одновременно срабатывать методу Click и Нажатию на кнопку рестарт или выбор уровня
                    setTimeout(game._ReadyToPlay, 20);
            break;
            case GameStates.PLAY:
                if (game.currentState != GameStates.READYTOPLAY) return;
                game._Play();
            break;
            case GameStates.PAUSE:
                game._Pause();
            break;
            case GameStates.GAMEOVER:
                game._Gameover();
            break;
            case GameStates.WIN:
                game._Win();
            break;
            default:
                break;
        }
    },

    // Режимы игры ...............................................
    _LevelSelection(){
        levelMenuPanel.style.display = "block";
        game.currentState = GameStates.LEVEL_SELECTION;
    },
    _ReadyToPlay(){
        this.isPause = false;
        this.score = 0;
        scoreCounter.innerHTML = "" + game.score;
        pauseButton.style.display = "none";
        gameOverPanel.style.display = "none";
        finishLevel.style.display = "none";
        pressKeyToStart.style.display = "flex";
        if (mapManager.currentMapId < 0){
            openMapEditorInstructions.style.display = "flex";
            continueCustomMapButton.style.display = "block";
        }
        else{
            openMapEditorInstructions.style.display = "none";
        }
        instructionsRulesToMapeditor.style.display = "none";
        
        mapManager.turnOffMove();
        copter.isActive = false;

        mapManager.x = 0;               // Вынести в функции объекта
        copter.x = 120,
        copter.y = canvas.height/4;
        copter.currentJumpForce = 0;
        copter.time = 0;

        game.currentState = GameStates.READYTOPLAY;
    },
    _Play(){
        copter.isActive = true;
        mapManager.turnOnMove();
        pauseButton.style.display = "block";
        pressKeyToStart.style.display = "none";
        openMapEditorInstructions.style.display = "none";
        game.currentState = GameStates.PLAY;
    },
    _Pause(){
        if (game.currentState == GameStates.PAUSE) { // Если мы кликаем на паузу, когда игра уже в режиме паузы
            game._Play();
            return;
        }
        if (game.currentState != GameStates.PLAY) return;
        
        continueButton.style.display = "block";
        pauseButton.style.display = "none";

        game.currentState = GameStates.PAUSE;
    },
    _Gameover(){
        
        pauseButton.style.display = "none";
        gameOverPanel.style.display = "block";
        game.currentState = GameStates.GAMEOVER;
    },
    _Win()
    {
        // Если это не последняя карта 
        // и если последняя открытая карта равна пройденной
        if (mapManager.maps.length-1 > mapManager.currentMapId
            && localStorage.getItem('map') == mapManager.currentMapId){
            var saveMap = mapManager.currentMapId; // Открываем новую карту
            saveMap++;                             // 
            localStorage.setItem('map', saveMap);  // <--
        } 
        game.isPlay = false;
        pauseButton.style.display = "none";
        finishLevel.style.display = "block";
        game.currentState = GameStates.WIN;
    },
    //................................................................

    loadGame(level){
        if (levelManager.levels.length-1 < level) return; // Если уровня нет, то ничего не делаем
        game.changeState(GameStates.READYTOPLAY);
        levelManager.loadMap(level);
    },
    addScore(){
        game.score++;
        scoreCounter.innerHTML = "" + game.score;
    },
    customMapMenu(){
        game.isPlay = false;
        game.isReadyToStart = false;
        pauseButton.style.display = "none";
        finishLevel.style.display = "none";
        pressKeyToStart.style.display = "none";
        gameOverPanel.style.display = "none";
        instructionsRulesToMapeditor.style.display = "flex";
        if (localStorage.getItem("mapeditor") == null){
            continueCustomMapButton.style.display = "none";
        }
        else{
            continueCustomMapButton.style.display = "block";
        }
        openMapEditorInstructions.style.display = "none";
    }
}

var config = {
    grid: 48 // Размер сетки
}

var copter = {
    x: 120,                 // Отступ от края должен быть кратен половину размера сетки (блока) ??
    y: canvas.height/2,
    width: 40,
    height: 40,
    isActive: false,        // Активность. Если false отключаем update
    gravity: 190,           // Гравитация
    time: 0,                // Копим время полета и сбрасываем при прыжке
    jumpForce: 120,         // Сила прыжка
    currentJumpForce: 0,    // Текущая сила прыжка
    dampingJumpForce: 0.4,  // Демпфирование силы прыжка
    
    lastSecondPos: {x:this.x, y:this.y},
    timerTrail: 0,

    update() {
        if (!copter.isActive) return;
        copter.time += (glManager.lag/1000); // Получаем время между кадрами в миллесекундах (делим на 1000)
        copter.y += (((copter.gravity * copter.time) - copter.currentJumpForce)*(glManager.lag/1000)); // Ускорение свободного падения минус сила прыжка на время между кадром
        
        /*
        this.timerTrail -= (glManager.lag);
        if (this.timerTrail <= 0){
            this.timerTrail = 500;
            this.lastSecondPos.y = this.y;
        }
        */
        // Оставим это если надумаем смягчать силу прыжка
        //if (copter.currentJumpForce > 0) copter.currentJumpForce -= copter.dampingJumpForce;

        // Проверка на столкновения
        let centerX = copter.x + (copter.width/2);
        let centerY = copter.y + (copter.height/2);

        if (copter.y < 0 || copter.y + copter.height > canvas.height) game.gameOver();
        
        // Берем несколько блоков слева и справа от коптера и проверяем столкновения с блоками
        // в этой области
        let leftLimit = Math.floor((Math.abs(mapManager.x)+centerX)/config.grid)-1;
        let rightLimit = leftLimit + 3; //
        if (rightLimit >= mapManager.currentMapLength) rightLimit = mapManager.currentMapLength;
        for (let i = leftLimit; i < rightLimit; i++) {
            if (!mapManager.currentMap.has(i)) continue;
            for (let j = 0; j < mapManager.currentMap.get(i).length; j++) {
                let block = mapManager.currentMap.get(i)[j];
                
                let collision = detectCollision({x:copter.x, y:copter.y, side:copter.width}, // Проверяем пересечение квадратов
                                                {x:block.x*config.grid+mapManager.x, y:block.y*config.grid, side:config.grid});

                if (collision) game.gameOver();
            }
        }
        copter.checkEndLevel();
    },

    checkEndLevel(){
        if (Math.abs(mapManager.x) + copter.x >= mapManager.finish){
            game.finishLevel();
        }
    },

    draw(){
        drawRect(copter.x, copter.y, copter.width, copter.height, "#67ED31"); // Рисуем квадрат
    },

    jump(){
        copter.time = 0;                             // Обнуляем время полёта
        copter.currentJumpForce = copter.jumpForce; // Прибовляем силу прыжка
    }
}

var mapManager = {
    x: 0,                 // Положение карты
    speed: 80,            // 
    currentSpeed: 0,      // Текущая скорость
    currentMapId: 0,      // ID текущей карты
    currentMapLength: 0,  // Полная длина текущей карты
    currentMap: [],       // Текущая карта
    finish: 0,            // Финишная черта уровня
    OffsetFromTheEnd: 40, // Отступ от конца карты, пересекая который мы завершаем уровень (измеряется в блоках)
    maps: [],             // Храним распарсенные карты
    colorsBlock: {element1: "#10454F", // Цвета блоков
                  element2: "#506266",
                  element3: "#818274",
                  element4: "#A3AB78",
                  element5: "#BDE038"
                },
    customMap: [],

    turnOnMove(){
        mapManager.currentSpeed = mapManager.speed;
    },

    turnOffMove(){
        mapManager.currentSpeed = 0;
    },

    initialization(){
        if (localStorage.getItem('map') == null) localStorage.setItem('map', 0);
        mapManager.currentMapId = localStorage.getItem("map");
        mapManager.loadJsonDoc();
        mapManager.updateButtonsMap();
    },

    loadJsonDoc(){
        var url = 'assets/scene.json';
        fetch(url)
            .then(response => response.json())
            .then(json => {
                mapManager.initializationMaps(json);
            });
    },

    initializationMaps(objMaps){
        mapManager.maps = mapManager.parseObjectToMap(objMaps);
        mapManager.loadCurrentMap();
        if (localStorage.getItem("mapeditor") != null){
            var objCustomMap = JSON.parse(localStorage.getItem("mapeditor"));
            mapManager.customMap = mapManager.parseObjectToMap(objCustomMap)[0];
        }
        
    },

    parseObjectToMap(json){
        exportMaps = [];
        json.forEach(map => {
            var columnNum = map[0].x;       // Счетчик стобцов
            var columns = new Map();
            var blocks = [];

            // Перебираем блоки на карте
            map.forEach(block => {
                if (block.x == columnNum){  // Если столбец блока совпадает с текущим, то собираем массив
                    blocks.push(block);     // Так мы собираем все блоки расположенные в одном столбце
                }
                else {                      // Если предыдущий столбец закончился, переходим к следующему 
                                               // Даём понять, что-мы готовы считать следующий столбец
                    columns.set(columnNum,blocks);// Все собранные блоки добавляем в массив столбцов
                    columnNum = block.x;
                    blocks = [];            // обнуляем сборщик блоков
                    blocks.push(block);     // Добавляем блок нового столбца
                }
            });
            columns.set(blocks[0].x, blocks);           // (Для последнего столбца)
            var modifiedMap = columns;      // Пересобрали карту стобцами
            exportMaps.push(modifiedMap); // Добавляем собранную карту в массив карт
        });
        return exportMaps;
    },

    loadCurrentMap(){
        mapManager.currentMap = mapManager.maps[mapManager.currentMapId];

        // Вычисляем конец карты
        let array = Array.from(mapManager.currentMap.values());
        mapManager.currentMapLength = array[array.length-1][0].x+1;
        mapManager.finish = (mapManager.currentMapLength - mapManager.OffsetFromTheEnd) * config.grid;
        mapManager.updateButtonsMap();
    },

    loadCustomMap(){
        mapManager.currentMapId = -1;
        mapManager.currentMap = mapManager.customMap;
        if (localStorage.getItem("mapeditor") == null) return;
        // Вычисляем конец карты
        let array = Array.from(mapManager.currentMap.values());
        mapManager.currentMapLength = array[array.length-1][0].x+1;
        mapManager.finish = (mapManager.currentMapLength - mapManager.OffsetFromTheEnd) * config.grid;
    },


    updateButtonsMap(){
        // Перебираем меню карт
        for (let i = 0; i < mapsButtons.length; i++) {

            // Заблокированные кнопки (не пройденные карты)
            if (localStorage.getItem("map") < i ){
                mapsButtons[i].disabled = true;
            }
            else if (mapManager.currentMapId == i){
                mapsButtons[i].disabled = false;
                mapsButtons[i].style.width = "55px";
                mapsButtons[i].style.height = "55px";
            }
            else {
                mapsButtons[i].disabled = false;
                mapsButtons[i].style.width = "";
                mapsButtons[i].style.height = "";
            }
        }
    },

    update(){
        mapManager.x -= mapManager.currentSpeed * (glManager.lag/1000);
    },

    draw(){
        if (mapManager.currentMap.length === 0) return; // Надо сделать загрузку, так-как рисовка начинается раньше загрузки карты
        let leftLimit = Math.floor(Math.abs(mapManager.x/config.grid));
        let sizeMapToGrid = Math.round(canvas.width/config.grid);   // Количество блоков в кадре
        let rightLimit = sizeMapToGrid + leftLimit + 2;             //
        if (rightLimit >= mapManager.currentMapLength) rightLimit = mapManager.currentMapLength;
        for (let i = leftLimit; i < rightLimit; i++) {
            if (!mapManager.currentMap.has(i)) continue;    // Если стобца нет, то переходим к следующему
            for (let j = 0; j < mapManager.currentMap.get(i).length; j++) {
                let block = mapManager.currentMap.get(i)[j];
                let color = mapManager.colorsBlock[block.t];
                // + 1 к ширине, что-бы карта не полосила при движении
                drawRect(block.x * config.grid + mapManager.x, block.y * config.grid, config.grid+1, config.grid, color);
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

        // Сохраняем лаг, т.е время с предыдущего РАБОЧЕГО кадра (для подсчета ФПС)
        // Так-как потом мы изменяем glManager.lag
        var curLag = glManager.lag;

        update();
        glManager.lag -= glManager.elapsed;
        /*
        // При накоплении лагов, змейка начнёт отставать на несколько итераций т.е перемещений
        // с помощью этого цикла мы нагоняем змейку к её нужному положению
        */
        while (glManager.lag >= glManager.ms_per_update) {
            update();
            glManager.lag -= glManager.ms_per_update;
        }
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
    if (!game.isPlay || game.isPause) return;
    copter.update();
    mapManager.update();
}

function render (){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    copter.draw();
    mapManager.draw();
    // Create gradient
    var grd = ctx.createLinearGradient(canvas.width-config.grid*3,0,canvas.width,0);
    grd.addColorStop(0,"#16161800");
    grd.addColorStop(1,"#161618");
    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(canvas.width-config.grid*3,0,config.grid*3,canvas.height);
}