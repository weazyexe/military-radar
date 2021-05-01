let radar = null;   // переменная с радаром
let stopped = false; // статус радара (остановлен, работает)
let paused = false; // статус радара (на паузе, работает)
let scale = 50; // масштаб радара

let currentCoords = 0;  // текущие координаты для точек

// дефолтные координаты точек
let defaultPoints = [
    { X: 100.73834818019053, Y: 80.133526305855796, id: 1, height: 4.2 },
    { X: 312.04449004559928, Y: 289.090547816002868, id: 2, height: 8 },
    { X: 145.450948245470364, Y: 312.23568471317653, id: 3, height: 2 },
    { X: 318.5435234425365, Y: 89.462374232534, id: 4, height: 5.55 }
];

let currentPoints = defaultPoints;

// остановка выполнения кода на заданное кол-во миллисекунд
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

// нормализация координат
function getNormalizedPoints(points) {
    return points.map(it => ({
        ...it,
        X: (scale * 2 * it.X) / $("#radar").width(),
        Y: (scale * 2 * it.Y) / $("#radar").height()
    }));
}

// денормализация координат
function getDenormalizedPoints(points) {
    return points.map(it => ({
        ...it,
        X: ($("#radar").width() * it.X) / (scale * 2),
        Y: ($("#radar").height() * it.Y) / (scale * 2)
    }));
}

// получить объект радара
// при первом запуске функции ищет радар на странице и возвращает его как результат функции
// при последующих просто возвращает найденный ранее объект
function findRadar() {
    if (radar == null) {
        radar = $("#radar").radar().data("radar");
    }

    return radar;
}

// установить скорость вращения радара
function setSpeed(speed) {
    // нашел все индикаторы
    let indicators = $(".indicator");

    // возвращаем текущую скорость. если новая 5с - значит старая 10с и наоборот
    const oldSpeed = speed === "5s" ? "10s" : "5s";

    // заменяем каждому индикатору css свойство animation, а точнее его скорость
    indicators.each(function () {
        const indicator = $(this);
        const oldCssProp = indicator.css("animation");
        const newCssProp = oldCssProp.replace(oldSpeed, speed);
        indicator.css("animation", newCssProp);
    });
};

// обновление инфы у точек
function setPointsInfo() {
    $(`.info`).remove();    // скрываем все старые параметры, чтобы отобразить новую

    // бежим по всем точкам
    let i = 0;
    $(".point").each(function () {
        const pointView = $(this);  // текущая точка на экране (html)
        const point = currentPoints[i++];   // текущая точка (данные в js)
        const deg = pointView.attr("data-angle");   // угол точки
        const distance = calculateDistance(point.X, point.Y); // расстояние от точки до центра

        // всевозможные параметры
        const infoItems = [
            { title: "N", checked: $("#aimNumbers").is(":checked"), value: point.id },
            { title: "B", checked: $("#azimuth").is(":checked"), value: deg },
            { title: "H", checked: $("#height").is(":checked"), value: point.height },
            { title: "D", checked: $("#distance").is(":checked"), value: distance }
        ].filter(it => it.checked); // если параметр отключен - фильтруем его и не отображаем в итоге

        // формируем из параметров блок html, который поместится рядом с точкой
        const after = infoItems
            .map(it => infoAsHtml(it))
            .join("");

        // если у нас включен хоть какой-то параметр, то отображаем параметры около точки
        if (after) {
            pointView.after(`<div class="info" style="position: absolute; left: ${point.X}px; top: ${point.Y}px">${after}</div>`);
        }
    });
}

// генерация строки с информацией
function infoAsHtml(info) {
    return `<p style="color: white; font-size: 0.4em; margin-bottom: 0">${info.title} = ${info.value}</p>`;
}

// подсчет расстояния от центра до точки
function calculateDistance(x, y) {
    const size = $("#radar").width();

    const normX = (scale * 2 * x) / size;
    const normY = (scale * 2 * y) / size;

    const centerX = scale;
    const centerY = scale;

    // расстояние от центра до точки
    const distance = Math.sqrt(
        Math.pow(centerY - normY, 2) + Math.pow(centerX - normX, 2)
    )

    return Math.round(distance);
}

// пересчет и перерисовка точек по новому масштабу
function calculateScale(shiftX, points) {
    scale = 50;
    let normalizedPoints = getNormalizedPoints(points)
        .map(it => ({ ...it, X: it.X + shiftX, Y: it.Y + shiftX }));

    scale = scale + shiftX;
    currentPoints = getDenormalizedPoints(normalizedPoints);
    findRadar().updatePoints(currentPoints);
}

// рендер таблицы формуляра
function renderFormular(checked) {
    $("#formular-table .point-formular").remove();
    if (checked) {
        $("#formular-table").show();

        let rows = [];
        let i = 0;
        $(".point").each(function () {
            const point = currentPoints[i++];   // текущая точка (данные в js)
            const deg = $(this).attr("data-angle");   // угол точки
            const distance = calculateDistance(point.X, point.Y); // расстояние от точки до центра

            const row = `<tr class="point-formular"><td>N = ${point.id}</td><td>B = ${deg}</td><td>H = ${point.height}</td><td>D = ${distance}</td></tr>`;
            rows.push(row);
        });

        rows.forEach(function (it) {
            $('#formular-table tr:last').after(it);
        });
    } else {
        $("#formular-table").hide();
    }
}

// движение точек
async function movePoints() {
    // задаем координаты движения для всех точек

    // для первой
    const firstMoves = [
        { X: 100.73834818019053, Y: 80.133526305855796 },
        { X: 120.73834818019053, Y: 81.133526305855796 },
        { X: 110.73834818019053, Y: 110.133526305855796 },
        { X: 110.73834818019053, Y: 90.133526305855796 }
    ];

    // для второй и тд
    const secondMoves = [
        { X: 312.04449004559928, Y: 289.090547816002868 },
        { X: 330.73834818019053, Y: 270.133526305855796 },
        { X: 340.73834818019053, Y: 290.133526305855796 },
        { X: 320.73834818019053, Y: 300.133526305855796 }
    ];

    const thirdMoves = [
        { X: 145.450948245470364, Y: 312.23568471317653 },
        { X: 110.73834818019053, Y: 333.133526305855796 },
        { X: 150.73834818019053, Y: 350.133526305855796 },
        { X: 120.73834818019053, Y: 330.133526305855796 }
    ];

    const fourthMoves = [
        { X: 318.5435234425365, Y: 89.462374232534 },
        { X: 270.73834818019053, Y: 100.133526305855796 },
        { X: 290.73834818019053, Y: 120.133526305855796 },
        { X: 300.73834818019053, Y: 100.133526305855796 }
    ];

    // для удобства всё это кидаем в массив
    const coords = [firstMoves, secondMoves, thirdMoves, fourthMoves];

    // бесконечный цикл, движение будет всегда
    while (true) {
        // берем следующие координаты для каждой точки
        // index - номер точки в массиве
        currentPoints = currentPoints.map((it, index) => ({
            ...it,
            X: coords[index][currentCoords].X,
            Y: coords[index][currentCoords].Y
        }));
        
        // чтобы точки двигались не так быстро, спим одну секунду
        await sleep(1000);

        // для пауз и стопа не надо ниче отображать
        if (!stopped && !paused) {
            calculateScale(scale - 50, currentPoints)
            findRadar().updatePoints(currentPoints);
            setPointsInfo();
            renderFormular($("#formular").is(":checked"));
        }

        // если дошли до конца массива координат обнуляем и идем заново по кругу
        if (currentCoords++ === 3) {
            currentCoords = 0;
        }
    };
}

// эта функция сама вызывается при загрузке страницы
$(function () {
    const radar = findRadar();
    radar.updatePoints(defaultPoints);
    radar.createDistances(scale);
    movePoints();
});

$("#pause-btn").click(function () {
    paused = !paused;
    $(".indicator").each(function () {
        const anim = $(this).css("animation");

        // если паузу включили - выключаем анимацию вращения у индикатора, иначе включаем обратно
        if (paused) {
            $(this).css("animation", anim.replace("spin", ""));
        } else {
            $(this).css("animation", anim.replace("none", "spin"));
        }
    });
});

// клик на стоп
$("#stop-btn").click(function () {
    stopped = !stopped;

    // если кнопка стоп была нажата при паузе, то убрать паузу
    if (stopped && paused) {
        $("#pause-btn").click();
    }

    // выключить кнопку паузы и чек формуляра при стопе
    $("#pause-btn").prop('disabled', stopped);
    $("#formular").prop('disabled', stopped);

    if (stopped) {
        $("#formular").prop('checked', false);
        $("#formular").click();
    }

    if (stopped) {
        // скрываем все индикаторы
        $(".indicator").each(function () {
            $(this).hide();
        });

        // скрываем все точки
        $(".point").each(function () {
            $(this).hide();
        });

        $(".info").each(function () {
            $(this).hide();
        });
    } else {
        // показываем все индикаторы
        $(".indicator").each(function () {
            $(this).show();
        });

        // показываем все точки
        $(".point").each(function () {
            $(this).show();
        });

        $(".info").each(function () {
            $(this).show();
        });
    }
});

// клик на масштаб 50
$("#scale50").click(function () {
    calculateScale(0, currentPoints);
    setPointsInfo();
    renderFormular($("#formular").is(":checked"));
    findRadar().createDistances(scale);
});

// клик на масштаб 100
$("#scale100").click(function () {
    calculateScale(50, currentPoints);
    setPointsInfo();
    renderFormular($("#formular").is(":checked"));
    findRadar().createDistances(scale);
});

// клик на масштаб 150
$("#scale150").click(function () {
    calculateScale(100, currentPoints);
    setPointsInfo();
    renderFormular($("#formular").is(":checked"));
    findRadar().createDistances(scale);
});

// клик на скорость 6
$("#speed6").click(function () {
    setSpeed("10s");
});

// клик на скорость 12
$("#speed12").click(function () {
    setSpeed("5s");
});

// клик на один из индикаторов
$(".ind-btn").click(function () {
    if (!stopped) {
        setPointsInfo();
    }
});

$("#formular").click(function () {
    const checked = $("#formular").is(":checked");
    renderFormular(checked);
});