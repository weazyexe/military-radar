/* BASE RADAR CLASS */
Radar = function (container) {
  this.container = container;
  this.radius = ((container.width() + container.height()) / 4);

  // init radar
  this.createRadiusIndicator();
  this.createAxisIndicator();
  this.createSweepIndicator();
};

let lastIndex;
let updateCallback;

function random(max) {
  return Math.round(Math.random() * max);
}

// creates the sweep indicators
Radar.prototype.createSweepIndicator = function () {
  var that = this;

  // iterate incrementing by x
  var indDivs = [];
  for (var i = 0; i < 100; i += 10) {
    // create a new indicator div
    indDivs.push($("<div>")
      .addClass("indicator")
      .css({
        "border-right-color": "rgba(0, 204, 0, " + parseFloat("0." + (i > 0 ? (100 - i) : 0)) + ")",
        "animation": "spin 5s " + parseFloat("0." + i) + "s linear infinite" // 
      }));
  }
  // append the new divs/indicators to the radar
  that.container.append(indDivs);
};

// creates the range circles
Radar.prototype.createRadiusIndicator = function () {
  var that = this;

  that.container.append([
    $("<div>").attr("id", "circle-big").addClass("circle"),
    $("<div>").attr("id", "circle-small").addClass("circle"),
    $("<div>").attr("id", "dot").addClass("circle")
  ]);


};

Radar.prototype.createDistances = function (max) {
  var that = this;

  $(".dist").remove();
  
  let part = Math.round(max / 3);
  let percentPart = 100 / 6;

  for (var i = 0; i <= 6; i++) {
    if (i < 4) {
      let value = max - part * i;
      if (value <= 1 && value >= -1) value = 0;
      that.container.append([
        $(`<div>${value}</div>`).attr("style", `top: ${percentPart * i + 1}%`)
          .addClass("dist")
          .addClass("dist-vertical")
      ]);
    } else {
      that.container.append([
        $(`<div>${max - part * (6 - i)}</div>`)
          .attr("style", `top: ${percentPart * i - 3}%`)
          .addClass("dist")
          .addClass("dist-vertical")
      ]);
    }
  }

  for (var i = 0; i <= 6; i++) {
    if (i < 3) {
      let value = max - part * i;
      that.container.append([
        $(`<div>${value}</div>`).attr("style", `left: ${percentPart * i + 1}%`)
          .addClass("dist")
          .addClass("dist-horizontal")
      ]);
    } else if (i > 3) {
      that.container.append([
        $(`<div>${max - part * (6 - i)}</div>`)
          .attr("style", `left: ${percentPart * i - 3}%`)
          .addClass("dist")
          .addClass("dist-horizontal")
      ]);
    }
  }

  that.drawBorder(max);
}

// creates the x/y axis lines
Radar.prototype.createAxisIndicator = function () {
  var that = this;

  that.container.append([
    $("<div>").attr("id", "axis-x"),
    $("<div>").attr("id", "axis-y")
  ]);
};

// returns the angle of the object passed
Radar.prototype.getIndicatorAngle = function (obj) {
  var angle = 0;
  var matrix = _.chain(obj.css([
    "-webkit-transform", "-moz-transform", "-ms-transform", "-o-transform", "transform"
  ])).filter(function (matrix) {
    return !_.isUndefined(matrix);
  }).first().value();

  if (matrix !== "none") {
    var values = matrix.split("(")[1].split(")")[0].split(",");
    var arctan = Math.atan2(values[0], values[1]);
    angle = ~~(-arctan / (Math.PI / 180) + 180);
  }
  return (angle < 0) ? angle += 360 : angle;
};

Radar.prototype.drawBorder = function(coord) {
  var that = this;
  $("#borderCanvas").remove();
  that.container.append("<canvas id=\"borderCanvas\" style=\"width: 100%; height: 100%\"></canvas>")
  const canvas = $("#borderCanvas")[0];
  const ctx = canvas.getContext("2d");

  if (coord === 150) {
    coord = 120;
  }

  let curY = 0;
  let maxSpread = 10;
  ctx.moveTo(coord, 0);
  for (let i = 0; i < 5; i++) {
    const multiplier = i % 2 ? 1 : -1;
    curY += 30;
    const x = coord + multiplier * random(maxSpread);
    const y = curY;
    ctx.lineTo(x, y);
    ctx.moveTo(x, y);
  }

  ctx.strokeStyle = '#ff0000';
  ctx.stroke();
};

// starts the radar
Radar.prototype.start = function () {
  var that = this;
  var indicators = that.container.find(".indicator");

  var points = that.container.find(".point");
  var minDeg = that.getIndicatorAngle(indicators.last());
  var maxDeg = that.getIndicatorAngle(indicators.first());

  // find points that are within the sweep range
  _.each(points, function (point, index) {
    var deg = $(point).attr("data-angle");

    if ((deg > minDeg && deg < maxDeg)) {
      if (index != lastIndex && deg > maxDeg - 30) {
        lastIndex = index;
        updateCallback(index);
      }
      $(point).stop().fadeTo(0, 1).fadeTo(1700, 0.4);
    }
  });

  // loop   
  setTimeout(function () {
    that.start();
  }, 25);
};

// updates the radar with new data points
Radar.prototype.updatePoints = function (points) {
  var that = this;

  that.container.find(".point").remove();

  // iterate the points and create new divs
  var pointDivs = [];
  _.each(points, function (point) {
    // calculate the degree/angle/position for the point
    var arctan = Math.atan2((point.X - that.radius), (point.Y - that.radius));
    var angle = ~~(-arctan / (Math.PI / 180) + 180);

    // create a new point div
    pointDivs.push($("<div>")
      .addClass("point")
      .css({ left: (point.X), top: (point.Y) })
      .attr("data-angle", angle));
  });

  // append the new divs/points to the radar
  that.container.append(pointDivs);
};

/* jQuery PLUGIN */
(function ($) {
  $.radar = function (el, options) {
    var base = this;

    base.$el = $(el);
    base.el = el;
    base.radar = new Radar(base.$el);

    base.start = function () {
      this.radar.start();
    };
    base.updatePoints = function (points) {
      this.radar.updatePoints(points);
    };
    base.createDistances = function(max) {
      this.radar.createDistances(max);
    };
    base.setupPointUpdateCallback = function(callback) {
      updateCallback = callback;
    };

    return base;
  };

  $.fn.radar = function (options) {
    return this.each(function () {
      var plugin = new $.radar(this, options);

      plugin.start();

      $(this).data('radar', plugin);

      return plugin;
    });
  };

}(jQuery));
