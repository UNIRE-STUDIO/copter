/*
    - Реализовать плавный старт


*/

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................


// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.getElementById("fpsCounter");

document.getElementById("back-button").onclick = function() {
    if (game.currentState == GameStates.CMAPINSTRUCTIONS){
        game.changeState(GameStates.LEVEL_SELECTION);
    }
    if (game.currentState == GameStates.PLAY ||
        game.currentState == GameStates.READYTOPLAY ||
        game.currentState == GameStates.GAMEOVER ||
        game.currentState == GameStates.WIN ||
        game.currentState == GameStates.PAUSE)
    {
        game.changeState(GameStates.LEVEL_SELECTION);
    }
    
}

// Пауза
var pauseButton = document.getElementById("pause-button"); 
pauseButton.onclick = function() {
    game.changeState(GameStates.PAUSE);
}
var pausePanel = document.getElementById("pause-panel");
document.getElementById("continue-button").onclick = function () {
    game.changeState(GameStates.PAUSE);
}

var menuButtons = document.getElementsByClassName("menu-button");
for (let i = 0; i < menuButtons.length; i++) {
    menuButtons[i].onclick = function () {
        game.changeState(GameStates.LEVEL_SELECTION);
    }
}

var gameOverPanel = document.getElementById("game-over-panel");
document.getElementById("restart-button").onclick = function () {
    game.changeState(GameStates.READYTOPLAY);
}

var levelCounter = document.getElementById("level-counter");

var pressKeyToStart = document.getElementById("pressKeyToStart");

var finishLevel = document.getElementById("finish-level-panel");
document.getElementById("next-level-button").onclick = function () 
{
    if (levelManager.currentLevelId == -1) 
    {
        game.changeState(GameStates.LEVEL_SELECTION);
        return;
    }
    game.loadGame(levelManager.currentLevelId+1);
}

var levelMenuPanel = document.getElementById("level-menu-panel");

var levelbuttons = document.getElementsByClassName("level-buttons");
for (let i = 0; i < levelbuttons.length; i++) {
    levelbuttons[i].onclick = function () {
        game.loadGame(i);
    }
}

// При нажатии на кнопку CUSTOM MAP
document.getElementById("custom-map-button").onclick = function () {
    if (localStorage.getItem("mapeditor") == null ||
        localStorage.getItem("mapeditor") == "")
    {
        game.changeState(GameStates.CMAPINSTRUCTIONS);
        continueCustomMapButton.disabled = true;
    }
    else 
    {
        levelManager.loadCustomMap();
        game.changeState(GameStates.READYTOPLAY);
    }
}

var continueCustomMapButton = document.getElementById("continue-custom-button");
continueCustomMapButton.onclick = function () 
{
    game.changeState(GameStates.READYTOPLAY);
}

var openMapEditorInstructions = document.getElementById("open-mapeditor-instructions");
openMapEditorInstructions.addEventListener('click', function(evt) {
    game.changeState(GameStates.CMAPINSTRUCTIONS);
}, false);

var instructionsRulesToMapeditor = document.getElementById("instructions-rules-to-mapeditor");

var fullscreenButton =  document.getElementById("fullscreen-button");
fullscreenButton.onclick = () => {
    if (window.innerHeight === screen.height)
    {
        config.fullScreenCancel();
    }
    else
    {
        config.fullScreen();
    }
    

};

// ЗАГРУЗКА ДОКУМЕНТА ..........................................
document.addEventListener('DOMContentLoaded', function() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) 
    {
        config.updateConfigForSmartphone();         //  Меняем настройки под мобильный телефон
    }

    config.resizeGame();
    levelManager.initialization();
    game.changeState(GameStates.LEVEL_SELECTION);
    glManager.gameLoop();
});

// ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ..........................................

// Отлавливаев клики мышкой
pressKeyToStart.addEventListener('click', function(evt) {
    game.changeState(GameStates.PLAY);
}, false);

document.addEventListener('mousedown', function(evt) 
{
    if (game.currentState == GameStates.PLAY && !config.smartphoneMode){
        game.copter.jump();
    }
}, false);

document.addEventListener('touchstart', function (e) {
    if (game.currentState == GameStates.PLAY)
    {
        game.copter.jump();
    }
});

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', function() {
    if (event.which === 80){
        game.changeState(GameStates.PAUSE);
    }
    if (game.currentState == GameStates.PAUSE) return;

    if (event.which === 38 || event.which === 87 || event.which === 32){
        if (game.currentState == GameStates.READYTOPLAY){
            game.changeState(GameStates.PLAY);
        }else{
            game.copter.jump();
        }
    }
});

window.addEventListener('resize', function() {
    if (game.currentState == GameStates.PLAY) game.changeState(GameStates.PAUSE);
    config.resizeGame();
}, true);

// Прослушка события смены ориентации
window.addEventListener("orientationchange", function() {
    if (game.currentState == GameStates.PLAY) game.changeState(GameStates.PAUSE);
    config.resizeGame();
}, false);

// СУЩНОСТИ ....................................................................

var config = {
    grid: 48, // Размер сетки
    h: canvas.height / 100,
    w: canvas.width / 100,
    smartphoneMode: false,
    canvasWidth: 0.9,
    canvasHeight: 0.76,

    updateConfigForSmartphone() {
        config.smartphoneMode = true;
        config.canvasHeight = 0.8;
        config.canvasWidth = 1;
    },

    resizeGame(){
        if (config.smartphoneMode)
        {
            if (window.innerHeight > window.innerWidth) config.canvasHeight = 0.5;
            else config.canvasHeight = 0.8;
        }
        
        var newHeight = window.innerHeight * config.canvasHeight;
        var newWidth = window.innerWidth * config.canvasWidth;

        if (game.currentState != GameStates.LEVEL_SELECTION &&
            game.currentState != GameStates.CMAPINSTRUCTIONS)
        {
            // Стараемся сохранить относительное положение коптера
            var relativePosX = game.copter.x / canvas.width * newWidth;
            var relativePosY = game.copter.y / canvas.height * newHeight;
            game.copter.x = relativePosX;
            game.copter.y = relativePosY;

            relativePosX = levelManager.x / canvas.height * newHeight;
            levelManager.x = relativePosX;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        
        config.h = canvas.height / 100;
        config.w = canvas.width / 100;

        config.grid = canvas.height/10;
        
        game.copter?.updateFields();
        levelManager.updateFields();
    },
    fullScreen() {
        let elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
          } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
          }
        config.resizeGame();
    },
    fullScreenCancel() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        config.resizeGame();
    }
}

// Состояния в которых игра может находиться
const GameStates = 
{
    LEVEL_SELECTION: 0, 
    READYTOPLAY: 1, 
    PLAY: 2, 
    PAUSE: 3, 
    GAMEOVER: 4, 
    WIN: 5, 
    CMAPINSTRUCTIONS: 6,
}

var game = {
    score: 0,
    currentState: GameStates.LEVEL_SELECTION,
    copter: null,

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
            case GameStates.CMAPINSTRUCTIONS:
                game._CustomMapInstructions();
            break;
            
            default:
                break;
        }
    },

    // Режимы игры ...............................................
    _LevelSelection(){
        levelMenuPanel.style.display = "block";
        pauseButton.style.display = "none";
        pausePanel.style.display = "none";
        finishLevel.style.display = "none";
        gameOverPanel.style.display = "none";
        pressKeyToStart.style.display = "none";
        instructionsRulesToMapeditor.style.display = "none";
        fullscreenButton.style.display = "block";
        levelCounter.innerHTML = "";
        game.copter = null;
        clearCanvas();
        game.currentState = GameStates.LEVEL_SELECTION;
    },
    _ReadyToPlay(){
        pauseButton.style.display = "none";
        gameOverPanel.style.display = "none";
        finishLevel.style.display = "none";
        pressKeyToStart.style.display = "flex";
        instructionsRulesToMapeditor.style.display = "none";
        levelMenuPanel.style.display = "none";
        fullscreenButton.style.display = "none";
        if (levelManager.currentLevelId == -1)
        {
            openMapEditorInstructions.style.display = "block";
            levelCounter.innerHTML = "Пользовательский уровень";
        }
        else
        {
            openMapEditorInstructions.style.display = "none";
        }
        
        levelManager.turnOffMove();
        game.copter = new copter();
        game.copter.isActive = false;

        levelManager.x = 0;               // Вынести в функции объекта
        game.copter.y = canvas.height/4;
        game.copter.currentJumpForce = 0;
        game.copter.time = 0;

        game.currentState = GameStates.READYTOPLAY;
    },
    _Play(){
        game.copter.isActive = true;
        levelManager.turnOnMove();
        pauseButton.style.display = "block";
        pausePanel.style.display = "none";
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
        
        pausePanel.style.display = "block";
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
        if (levelManager.levels.length-1 > levelManager.currentLevelId
            && localStorage.getItem('map') == levelManager.currentLevelId){
            var saveMap = levelManager.currentLevelId; // Открываем новую карту
            saveMap++;                             // 
            localStorage.setItem('map', saveMap);  // <--
        } 
        game.isPlay = false;
        pauseButton.style.display = "none";
        finishLevel.style.display = "block";
        game.currentState = GameStates.WIN;
    },
    _CustomMapInstructions()
    {
        fullscreenButton.style.display = "none";
        pauseButton.style.display = "none";
        gameOverPanel.style.display = "none";
        finishLevel.style.display = "none";
        levelMenuPanel.style.display = "none";
        pressKeyToStart.style.display = "none";

        instructionsRulesToMapeditor.style.display = "block";
        game.currentState = GameStates.CMAPINSTRUCTIONS;
    },
    //................................................................

    loadGame(level){
        if (levelManager.levels.length-1 < level) return; // Если уровня нет, то ничего не делаем
        game.changeState(GameStates.READYTOPLAY);
        levelManager.currentLevelId = level;
        levelManager.loadCurrentMap();
        levelCounter.innerHTML = "Уровень: " + (level+1);
    },
    addScore(){
        game.score++;
    },
}

function copter() {
    this.x = config.grid * 2.5,                 // Отступ от края должен быть кратен половину размера сетки (блока) ??
    this.y = canvas.height / 2,
    this.width = config.grid * 0.83,
    this.height = config.grid * 0.83,
    this.isActive = false,              // Активность. Если false отключаем update
    this.gravity = config.grid * 3.96,  // Гравитация
    this.time = 0,                      // Копим время полета и сбрасываем при прыжке
    this.jumpForce = config.grid * 2.5,        // Сила прыжка
    this.currentJumpForce = 0,          // Текущая сила прыжка
    this.dampingJumpForce = 0.4,        // Демпфирование силы прыжка
    
    this.lastSecondPos = {x:this.x, y:this.y},
    this.timerTrail = 0,

    this.update = function() {
        if (!this.isActive) return;
        this.time += (glManager.lag/1000); // Получаем время между кадрами в миллесекундах (делим на 1000)
        this.y += (((this.gravity * this.time) - this.currentJumpForce)*(glManager.lag/1000)); // Ускорение свободного падения минус сила прыжка на время между кадром
        
        /*
        this.timerTrail -= (glManager.lag);
        if (this.timerTrail <= 0){
            this.timerTrail = 500;
            this.lastSecondPos.y = this.y;
        }
        */
        // Оставим это если надумаем смягчать силу прыжка
        //if (this.currentJumpForce > 0) this.currentJumpForce -= this.dampingJumpForce;

        // Проверка на столкновения
        let centerX = this.x + (this.width/2);
        let centerY = this.y + (this.height/2);

        if (this.y < 0 || this.y + this.height > canvas.height) game.changeState(GameStates.GAMEOVER);
        
        // Берем несколько блоков слева и справа от коптера и проверяем столкновения с блоками
        // в этой области
        let leftLimit = Math.floor((Math.abs(levelManager.x)+centerX)/config.grid)-1;
        let rightLimit = leftLimit + 3; //
        if (rightLimit >= levelManager.currentLevelLength) rightLimit = levelManager.currentLevelLength;
        for (let i = leftLimit; i < rightLimit; i++) {
            if (!levelManager.currentLevel.has(i)) continue;
            for (let j = 0; j < levelManager.currentLevel.get(i).length; j++) {
                let block = levelManager.currentLevel.get(i)[j];
                
                let collision = detectCollision({x:this.x, y:this.y, side:this.width}, // Проверяем пересечение квадратов
                                                {x:block.x*config.grid+levelManager.x, y:block.y*config.grid, side:config.grid});

                if (collision) game.changeState(GameStates.GAMEOVER);
            }
        }
        this.checkEndLevel();
    },

    this.checkEndLevel = function(){
        if (Math.abs(levelManager.x) + this.x >= levelManager.finish){
            game.changeState(GameStates.WIN);
        }
    },

    this.updateFields = function()
    {
        this.x = config.grid * 2.5;           
        this.y = canvas.height * (this.y / canvas.height);
        this.width = config.grid * 0.83;
        this.height = config.grid * 0.83;
        this.gravity = config.grid * 3.96;
        this.jumpForce = config.grid * 2.5;
    },

    this.render = function(){
        drawRect({x:this.x, y: this.y}, {x: this.width, y: this.height}, "#67ED31"); // Рисуем квадрат
    },

    this.jump = function(){
        this.time = 0;                             // Обнуляем время полёта
        this.currentJumpForce = this.jumpForce; // Прибовляем силу прыжка
    }
}

var levelManager = {
    x: 0,                 // Положение карты
    speed: config.grid * 1.7,            // 
    currentSpeed: 0,      // Текущая скорость
    currentLevelId: 0,      // ID текущей карты
    currentLevelLength: 0,  // Полная длина текущей карты
    currentLevel: [],       // Текущая карта
    finish: 0,            // Финишная черта уровня
    OffsetFromTheEnd: 40, // Отступ от конца карты, пересекая который мы завершаем уровень (измеряется в блоках)
    levels: [],             // Храним распарсенные карты
    colorsBlock: {element1: "#10454F", // Цвета блоков
                  element2: "#506266",
                  element3: "#818274",
                  element4: "#A3AB78",
                  element5: "#BDE038"
                },
    customMap: [],

    turnOnMove(){
        levelManager.currentSpeed = levelManager.speed;
    },

    turnOffMove(){
        levelManager.currentSpeed = 0;
    },

    initialization(){
        if (localStorage.getItem('map') == null) localStorage.setItem('map', 0);
        levelManager.currentLevelId = localStorage.getItem("map");
        levelManager.loadJsonDoc();
        levelManager.updateButtonsMap();
    },

    loadJsonDoc(){
        var url = 'assets/scene.json';
        fetch(url)
            .then(response => response.json())
            .then(json => {
                levelManager.initializationMaps(json);
            });
    },

    initializationMaps(objMaps){
        levelManager.levels = levelManager.parseObjectToMap(objMaps);
        levelManager.loadCurrentMap();
        if (localStorage.getItem("mapeditor") != null && 
        localStorage.getItem("mapeditor") != ""){
            var objCustomMap = JSON.parse(localStorage.getItem("mapeditor"));
            levelManager.customMap = levelManager.parseObjectToMap(objCustomMap)[0];
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
        levelManager.currentLevel = levelManager.levels[levelManager.currentLevelId];

        // Вычисляем конец карты
        let array = Array.from(levelManager.currentLevel.values());
        levelManager.currentLevelLength = array[array.length-1][0].x+1;
        levelManager.finish = (levelManager.currentLevelLength - levelManager.OffsetFromTheEnd) * config.grid;
        levelManager.updateButtonsMap();
    },

    loadCustomMap(){
        levelManager.currentLevelId = -1;
        levelManager.currentLevel = levelManager.customMap;
        if (localStorage.getItem("mapeditor") == null) return;

        // Вычисляем конец карты
        let array = Array.from(levelManager.currentLevel.values());
        levelManager.currentLevelLength = array[array.length-1][0].x+1;
        levelManager.finish = (levelManager.currentLevelLength - levelManager.OffsetFromTheEnd) * config.grid;
    },


    updateButtonsMap(){
        // Перебираем меню карт
        for (let i = 0; i < levelbuttons.length; i++) {

            // Заблокированные кнопки (не пройденные карты)
            if (localStorage.getItem("map") < i ){
                levelbuttons[i].disabled = true;
            }
            else if (levelManager.currentLevelId == i){
                levelbuttons[i].disabled = false;
            }
        }
    },

    update(){
        levelManager.x -= levelManager.currentSpeed * (glManager.lag/1000);
    },

    render(){
        if (levelManager.currentLevel.length === 0) return; // Надо сделать загрузку, так-как рисовка начинается раньше загрузки карты
        let leftLimit = Math.floor(Math.abs(levelManager.x/config.grid));
        let sizeMapToGrid = Math.round(canvas.width/config.grid);   // Количество блоков в кадре
        let rightLimit = sizeMapToGrid + leftLimit + 2;             //
        if (rightLimit >= levelManager.currentLevelLength) rightLimit = levelManager.currentLevelLength;
        for (let i = leftLimit; i < rightLimit; i++) {
            if (!levelManager.currentLevel.has(i)) continue;    // Если стобца нет, то переходим к следующему
            for (let j = 0; j < levelManager.currentLevel.get(i).length; j++) {
                let block = levelManager.currentLevel.get(i)[j];
                let color = levelManager.colorsBlock[block.t];
                // + 1 к ширине, что-бы карта не полосила при движении
                drawRect({x: block.x * config.grid + levelManager.x, y: block.y * config.grid}, {x: config.grid+1, y: config.grid+1}, color);
            }
        }
        canvas.style.backgroundPosition = levelManager.x.toString();

    },

    updateFields(){
        levelManager.speed = config.grid * 1.7;
        levelManager.finish = (levelManager.currentLevelLength - levelManager.OffsetFromTheEnd) * config.grid;
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
    if (game.currentState != GameStates.PLAY) return;
    game.copter.update();
    levelManager.update();
}

function render (){
    if (game.currentState == GameStates.LEVEL_SELECTION ||
        game.currentState == GameStates.CMAPINSTRUCTIONS) return;
    clearCanvas();
    
    game.copter.render();
    levelManager.render();
    // Create gradient
    var grd = ctx.createLinearGradient(canvas.width-config.grid*3,0,canvas.width,0);
    grd.addColorStop(0,"#16161800");
    grd.addColorStop(1,"#161618");
    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(canvas.width-config.grid*3,0,config.grid*3,canvas.height);
}