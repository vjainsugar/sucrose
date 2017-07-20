import d3 from 'd3';

/*-------------------
      UTILITIES
-------------------*/
var utility = {};

utility.identity = function(d) {
  return d;
};

utility.functor = function functor(v) {
  return typeof v === 'function' ? v : function() {
    return v;
  };
};

/*
Snippet of code you can insert into each utility.models.* to give you the ability to
do things like:
chart.options({
  showXAxis: true,
  tooltips: true
});
To enable in the chart:
chart.options = utility.optionsFunc.bind(chart);
*/
utility.optionsFunc = function(args) {
  if (args) {
    d3.map(args).each((function(value, key) {
      if (typeof this[key] === 'function') {
        this[key](value);
      }
    }).bind(this));
  }
  return this;
};

// Window functions
utility.windowSize = function () {
  // Sane defaults
  var size = {width: 640, height: 480};

  // Earlier IE uses Doc.body
  if (document.body && document.body.offsetWidth) {
      size.width = document.body.offsetWidth;
      size.height = document.body.offsetHeight;
  }

  // IE can use depending on mode it is in
  if (document.compatMode === 'CSS1Compat' &&
      document.documentElement &&
      document.documentElement.offsetWidth ) {
      size.width = document.documentElement.offsetWidth;
      size.height = document.documentElement.offsetHeight;
  }

  // Most recent browsers use
  if (window.innerWidth && window.innerHeight) {
      size.width = window.innerWidth;
      size.height = window.innerHeight;
  }
  return (size);
};

// Easy way to bind multiple functions to window.onresize
  // TODO: give a way to remove a function after its bound, other than removing alkl of them
  // utility.windowResize = function (fun)
  // {
  //   var oldresize = window.onresize;

  //   window.onresize = function (e) {
  //     if (typeof oldresize == 'function') oldresize(e);
  //     fun(e);
  //   }
// }

utility.windowResize = function (fun) {
  if (window.attachEvent) {
      window.attachEvent('onresize', fun);
  }
  else if (window.addEventListener) {
      window.addEventListener('resize', fun, true);
  }
  else {
      //The browser does not support Javascript event binding
  }
};

utility.windowUnResize = function (fun) {
  if (window.detachEvent) {
      window.detachEvent('onresize', fun);
  }
  else if (window.removeEventListener) {
      window.removeEventListener('resize', fun, true);
  }
  else {
      //The browser does not support Javascript event binding
  }
};

utility.resizeOnPrint = function (fn) {
  if (window.matchMedia) {
      var mediaQueryList = window.matchMedia('print');
      mediaQueryList.addListener(function (mql) {
          if (mql.matches) {
              fn();
          }
      });
  } else if (window.attachEvent) {
    window.attachEvent('onbeforeprint', fn);
  } else {
    window.onbeforeprint = fn;
  }
  //TODO: allow for a second call back to undo using
  //window.attachEvent('onafterprint', fn);
};

utility.unResizeOnPrint = function (fn) {
  if (window.matchMedia) {
      var mediaQueryList = window.matchMedia('print');
      mediaQueryList.removeListener(function (mql) {
          if (mql.matches) {
              fn();
          }
      });
  } else if (window.detachEvent) {
    window.detachEvent('onbeforeprint', fn);
  } else {
    window.onbeforeprint = null;
  }
};

// Color functions

// Backwards compatible way to implement more d3-like coloring of graphs.
// If passed an array, wrap it in a function which implements the old default
// behavior
utility.getColor = function (color) {
  if (!arguments.length) {
    //if you pass in nothing, get default colors back
    return utility.defaultColor();
  }

  if (Array.isArray(color)) {
    return function (d, i) {
      return d.color || color[i % color.length];
    };
  } else if (Object.prototype.toString.call(color) === '[object String]') {
    return function(d) {
      return d.color || '#' + color.replace('#', '');
    };
  } else {
    return color;
      // can't really help it if someone passes rubbish as color
      // or color is already a function
  }
};

// Default color chooser uses the index of an object as before.
utility.defaultColor = function () {
  var colors = d3.scaleOrdinal(d3.schemeCategory20).range();
  return function (d, i) {
    return d.color || colors[i % colors.length];
  };
};

utility.getTextContrast = function(c, i, callback) {
  var back = c,
      backLab = d3.lab(back),
      backLumen = backLab.l,
      textLumen = backLumen > 60 ?
        backLab.darker(4 + (backLumen - 75) / 25).l : // (50..100)[1 to 3.5]
        backLab.brighter(4 + (18 - backLumen) / 25).l, // (0..50)[3.5..1]
      textLab = d3.lab(textLumen, 0, 0),
      text = textLab.toString();
  if (callback) {
    callback(backLab, textLab);
  }
  return text;
};

// Returns a color function that takes the result of 'getKey' for each series and
// looks for a corresponding color from the dictionary,
utility.customTheme = function (dictionary, getKey, defaultColors) {
  getKey = getKey || function (series) { return series.key; }; // use default series.key if getKey is undefined
  defaultColors = defaultColors || d3.scaleOrdinal(d3.schemeCategory20).range(); //default color function

  var defIndex = defaultColors.length; //current default color (going in reverse)

  return function (series, index) {
    var key = getKey(series);

    if (!defIndex) defIndex = defaultColors.length; //used all the default colors, start over

    if (typeof dictionary[key] !== 'undefined') {
      return (typeof dictionary[key] === 'function') ? dictionary[key]() : dictionary[key];
    } else {
      return defaultColors[--defIndex]; // no match in dictionary, use default color
    }
  };
};

// Gradient functions

utility.colorLinearGradient = function (d, i, p, c, defs) {
  var id = 'lg_gradient_' + i;
  var grad = defs.select('#' + id);
  if ( grad.empty() )
  {
    if (p.position === 'middle')
    {
      utility.createLinearGradient( id, p, defs, [
        { 'offset': '0%',  'stop-color': d3.rgb(c).darker().toString(),  'stop-opacity': 1 },
        { 'offset': '20%', 'stop-color': d3.rgb(c).toString(), 'stop-opacity': 1 },
        { 'offset': '50%', 'stop-color': d3.rgb(c).brighter().toString(), 'stop-opacity': 1 },
        { 'offset': '80%', 'stop-color': d3.rgb(c).toString(), 'stop-opacity': 1 },
        { 'offset': '100%','stop-color': d3.rgb(c).darker().toString(),  'stop-opacity': 1 }
      ]);
    }
    else
    {
      utility.createLinearGradient( id, p, defs, [
        { 'offset': '0%',  'stop-color': d3.rgb(c).darker().toString(),  'stop-opacity': 1 },
        { 'offset': '50%', 'stop-color': d3.rgb(c).toString(), 'stop-opacity': 1 },
        { 'offset': '100%','stop-color': d3.rgb(c).brighter().toString(), 'stop-opacity': 1 }
      ]);
    }
  }
  return 'url(#'+ id +')';
};

// defs:definition container
// id:dynamic id for arc
// radius:outer edge of gradient
// stops: an array of attribute objects
utility.createLinearGradient = function (id, params, defs, stops) {
  var x2 = params.orientation === 'horizontal' ? '0%' : '100%';
  var y2 = params.orientation === 'horizontal' ? '100%' : '0%';
  var attrs, stop;
  var grad = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', x2 )
        .attr('y2', y2 )
        //.attr('gradientUnits', 'userSpaceOnUse')objectBoundingBox
        .attr('spreadMethod', 'pad');
  for (var i=0; i<stops.length; i+=1) {
    attrs = stops[i];
    stop = grad.append('stop');
    for (var a in attrs) {
      if (attrs.hasOwnProperty(a)) {
        stop.attr(a, attrs[a]);
      }
    }
  }
};

utility.colorRadialGradient = function (d, i, p, c, defs) {
  var id = 'rg_gradient_' + i;
  var grad = defs.select('#' + id);
  if ( grad.empty() ) {
    utility.createRadialGradient( id, p, defs, [
      { 'offset': p.s, 'stop-color': d3.rgb(c).brighter().toString(), 'stop-opacity': 1 },
      { 'offset': '100%','stop-color': d3.rgb(c).darker().toString(), 'stop-opacity': 1 }
    ]);
  }
  return 'url(#' + id + ')';
};

utility.createRadialGradient = function (id, params, defs, stops) {
  var attrs, stop;
  var grad = defs.append('radialGradient')
        .attr('id', id)
        .attr('r', params.r)
        .attr('cx', params.x)
        .attr('cy', params.y)
        .attr('gradientUnits', params.u)
        .attr('spreadMethod', 'pad');
  for (var i=0; i<stops.length; i+=1) {
    attrs = stops[i];
    stop = grad.append('stop');
    for (var a in attrs) {
      if ( attrs.hasOwnProperty(a) ) {
        stop.attr(a, attrs[a]);
      }
    }
  }
};

// Creates a rectangle with rounded corners
utility.roundedRectangle = function (x, y, width, height, radius) {
  return 'M' + x + ',' + y +
       'h' + (width - radius * 2) +
       'a' + radius + ',' + radius + ' 0 0 1 ' + radius + ',' + radius +
       'v' + (height - 2 - radius * 2) +
       'a' + radius + ',' + radius + ' 0 0 1 ' + -radius + ',' + radius +
       'h' + (radius * 2 - width) +
       'a' + -radius + ',' + radius + ' 0 0 1 ' + -radius + ',' + -radius +
       'v' + ( -height + radius * 2 + 2 ) +
       'a' + radius + ',' + radius + ' 0 0 1 ' + radius + ',' + -radius +
       'z';
};

utility.dropShadow = function (id, defs, options) {
  var opt = options || {};
  var h = opt.height || '130%';
  var o = opt.offset || 2;
  var b = opt.blur || 1;
  var filter;
  var merge;

  if (defs.select('#' + id).empty()) {
    filter = defs.append('filter')
      .attr('id', id)
      .attr('height', h);
    filter.append('feOffset')
      .attr('in', 'SourceGraphic')
      .attr('result', 'offsetBlur')
      .attr('dx', o)
      .attr('dy', o); //how much to offset
    filter.append('feColorMatrix')
      .attr('in', 'offsetBlur')
      .attr('result', 'matrixOut')
      .attr('type', 'matrix')
      .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0');
    filter.append('feGaussianBlur')
      .attr('in', 'matrixOut')
      .attr('result', 'blurOut')
      .attr('stdDeviation', b); //stdDeviation is how much to blur

    merge = filter.append('feMerge');
    merge.append('feMergeNode'); //this contains the offset blurred image
    merge.append('feMergeNode')
      .attr('in', 'SourceGraphic'); //this contains the element that the filter is applied to
  }

  return 'url(#' + id + ')';
};
// <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  //   <defs>
  //     <filter id="f1" x="0" y="0" width="200%" height="200%">
  //       <feOffset result="offOut" in="SourceGraphic" dx="20" dy="20" />
  //       <feColorMatrix result="matrixOut" in="offOut" type="matrix"
  //       values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
  //       <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="10" />
  //       <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
  //     </filter>
  //   </defs>
  //   <rect width="90" height="90" stroke="green" stroke-width="3" fill="yellow" filter="url(#f1)" />
// </svg>

utility.createTexture = function(defs, id, x, y) {
  var texture = '#sc-diagonalHatch-' + id,
      mask = '#sc-textureMask-' + id;

  defs
    .append('pattern')
      .attr('id', 'sc-diagonalHatch-' + id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('path')
        .attr('d', 'M-1,1 l2,-2 M0,8 l8,-8 M7,9 l1,-1')
        .attr('class', 'texture-line')
        // .attr('class', classes)
        // .attr('stroke', fill)
        .attr('stroke', '#fff')
        .attr('stroke-linecap', 'square');

  defs
    .append('mask')
      .attr('id', 'sc-textureMask-' + id)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .append('rect')
        .attr('x', x || 0)
        .attr('y', y || -1)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', 'url(' + texture + ')');

  return mask;
};

// String functions

utility.stringSetLengths = function(_data, _container, _format, classes, styles) {
  var lengths = [],
      txt = _container.select('.tmp-text-strings').select('text');
  if (txt.empty()) {
    txt = _container.append('g').attr('class', 'tmp-text-strings').append('text');
  }
  txt.classed(classes, true);
  txt.style('display', 'inline');
  _data.forEach(function(d, i) {
      txt.text(_format(d, i));
      lengths.push(txt.node().getBoundingClientRect().width);
    });
  txt.text('').attr('class', 'tmp-text-strings').style('display', 'none');
  return lengths;
};

utility.stringSetThickness = function(_data, _container, _format, classes, styles) {
  var thicknesses = [],
      txt = _container.select('.tmp-text-strings').select('text');
  if (txt.empty()) {
    txt = _container.append('g').attr('class', 'tmp-text-strings').append('text');
  }
  txt.classed(classes, true);
  txt.style('display', 'inline');
  _data.forEach(function(d, i) {
      txt.text(_format(d, i));
      thicknesses.push(txt.node().getBoundingClientRect().height);
    });
  txt.text('').attr('class', 'tmp-text-strings').style('display', 'none');
  return thicknesses;
};

utility.maxStringSetLength = function(_data, _container, _format, classes) {
  var lengths = utility.stringSetLengths(_data, _container, _format, classes);
  return d3.max(lengths);
};

utility.stringEllipsify = function(_string, _container, _length) {
  var txt = _container.select('.tmp-text-strings').select('text'),
      str = _string,
      len = 0,
      ell = 0,
      strLen = 0;
  if (txt.empty()) {
    txt = _container.append('g').attr('class', 'tmp-text-strings').append('text');
  }
  txt.style('display', 'inline');
  txt.text('...');
  ell = txt.node().getBoundingClientRect().width;
  txt.text(str);
  len = txt.node().getBoundingClientRect().width;
  strLen = len;
  while (len > _length && len > 30) {
    str = str.slice(0, -1);
    txt.text(str);
    len = txt.node().getBoundingClientRect().width + ell;
  }
  txt.text('');
  return str + (strLen > _length ? '...' : '');
};

utility.getTextBBox = function(text, floats) {
  var bbox = text.node().getBoundingClientRect(),
      size = {
        width: floats ? bbox.width : parseInt(bbox.width, 10),
        height: floats ? bbox.height : parseInt(bbox.height, 10),
        top: floats ? bbox.top : parseInt(bbox.top, 10),
        left: floats ? bbox.left : parseInt(bbox.left, 10)
      };
  return size;
};

utility.strip = function(s) {
  return s.replace(/(\s|&)/g,'');
};

utility.isRTLChar = function(c) {
  var rtlChars_ = '\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC',
      rtlCharReg_ = new RegExp('[' + rtlChars_ + ']');
  return rtlCharReg_.test(c);
};

// Numeric functions

// Numbers that are undefined, null or NaN, convert them to zeros.
utility.NaNtoZero = function(n) {
  if (typeof n !== 'number'
      || isNaN(n)
      || n === null
      || n === Infinity) return 0;

  return n;
};

utility.polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = utility.angleToRadians(angleInDegrees);
  var x = centerX + radius * Math.cos(angleInRadians);
  var y = centerY + radius * Math.sin(angleInRadians);
  return [x, y];
};

utility.angleToRadians = function(angleInDegrees) {
  return angleInDegrees * Math.PI / 180.0;
};

utility.angleToDegrees = function(angleInRadians) {
  return angleInRadians * 180.0 / Math.PI;
};

utility.getAbsoluteXY = function (element) {
  var viewportElement = document.documentElement;
  var box = element.getBoundingClientRect();
  var scrollLeft = viewportElement.scrollLeft + document.body.scrollLeft;
  var scrollTop = viewportElement.scrollTop + document.body.scrollTop;
  var x = box.left + scrollLeft;
  var y = box.top + scrollTop;

  return {'left': x, 'top': y};
};
utility.translation = function(x, y) {
  return 'translate(' + x + ',' + y + ')';
};
// utility.numberFormatSI = function(d, p, c, l) {
  //     var fmtr, spec, si;
  //     if (isNaN(d)) {
  //         return d;
  //     }
  //     p = typeof p === 'undefined' ? 2 : p;
  //     c = typeof c === 'undefined' ? false : !!c;
  //     fmtr = typeof l === 'undefined' ? d3.format : d3.formatLocale(l).format;
  //     d = Math.round(d * 10 * p) / 10 * p;
  //     spec = c ? '$,' : ',';
  //     if (c && d < 1000 && d !== parseInt(d, 10)) {
  //         spec += '.2f';
  //     }
  //     if (d < 1 && d > -1) {
  //         spec += '.2s';
  //     }
  //     return fmtr(spec)(d);
// };

utility.numberFormatSI = function(d, p, c, l) {
  var fmtr, spec;
  if (isNaN(d) || d === 0) {
      return d;
  }
  p = typeof p === 'undefined' ? 2 : p;
  c = typeof c === 'undefined' ? false : !!c;
  fmtr = typeof l === 'undefined' ? d3.format : d3.formatLocale(l).format;
  spec = c ? '$,' : ',';
  // spec += '.' + 2 + 'r';
  if (c && d < 1000 && d !== parseInt(d, 10)) {
    spec += '.2f';
  } else if (Math.abs(d) > 1 && Math.abs(d) <= 1000) {
    d = p === 0 ? Math.round(d) : Math.round(d * 10 * p) / (10 * p);
  } else {
    spec += '.' + p + 's';
  }
  if (d > -1 && d < 1) {
    return fmtr(spec)(d);
  }
  return fmtr(spec)(d);
};

utility.round = function(x, n) {
  // Sigh...
  var ten_n = Math.pow(10, n);
  return Math.round(x * ten_n) / ten_n;
};

utility.numberFormatRound = function(d, p, c, l) {
  var fmtr, spec;
  if (isNaN(d)) {
    return d;
  }
  c = typeof c === 'boolean' ? c : false;
  p = Number.isFinite(p) ? p : c ? 2 : 0;
  fmtr = typeof l === 'undefined' ? d3.format : d3.formatLocale(l).format;
  spec = (c ? '$' : '') + ',.' + p + 'f';
  return fmtr(spec)(d);
};

// Date functions
utility.daysInMonth = function(month, year) {
  return (new Date(year, month+1, 0)).getDate();
};

utility.isValidDate = function(d) {
  var testDate;
  if (!d) {
    return false;
  }
  testDate = new Date(d);
  return testDate instanceof Date && !isNaN(testDate.valueOf());
};

utility.getDateFormat = function(values) {
  var dateFormats = ['multi', '.%L', ':%S', '%I:%M', '%I %p', '%x', '%b %d', '%B', '%Y']; //TODO: use locality format strings mmmmY, etc.
  var formatIndex = 0;

  formatIndex = values.length ? d3.min(values, function(date) {
    var format;

    // if round to second is less than date
    if (d3.timeSecond(date) < date) {
      // use millisecond format - .%L
      format = 1;
    }
    else
    // if round to minute is less than date
    if (d3.timeMinute(date) < date) {
      // use second format - :%S
      format = 2;
    }
    else
    // if round to hour is less than date
    if (d3.timeHour(date) < date) {
      // use minute format - %I:%M
      format = 3;
    }
    else
    // if round to day is less than date
    if (d3.timeDay(date) < date) {
      // use hour format - %I %p
      format = 4;
    }
    else
    // if round to month is less than date
    if (d3.timeMonth(date) < date) {
      // use day format - %x
      format = 5; // format = (d3.timeWeek(date) < date ? 4 : 5);
    }
    else
    // if round to year is less than date
    if (d3.timeYear(date) < date) {
      // use month format - %B
      format = 7;
    }
    else
    // as last resort
    {
      // use year format - %Y
      format = 8;
    }
    return format;
  }) : 0;

  return dateFormats[formatIndex];
};

utility.getUTCDateFormat = function(values) {
  var dateFormats = ['multi', '.%L', ':%S', '%I:%M', '%I %p', '%x', '%b %d', '%B', '%Y']; //TODO: use locality format strings mmmmY, etc.
  var formatIndex = 0;

  formatIndex = values.length ? d3.min(values, function(date) {
    var format;
    date.setUTCMilliseconds(date.getUTCMilliseconds() - date.getTimezoneOffset() * 60000);

    // if round to second is less than date
    if (d3.utcSecond(date) < date) {
      // use millisecond format - .%L
      format = 1;
    }
    else
    // if round to minute is less than date
    if (d3.utcMinute(date) < date) {
      // use second format - :%S
      format = 2;
    }
    else
    // if round to hour is less than date
    if (d3.utcHour(date) < date) {
      // use minute format - %I:%M
      format = 3;
    }
    else
    // if round to day is less than date
    if (d3.utcDay(date) < date) {
      // use hour format - %I %p
      format = 4;
    }
    else
    // if round to month is less than date
    if (d3.utcMonth(date) < date) {
      // use day format - %x
      format = 5; // format = (d3.utcWeek(date) < date ? 4 : 5);
    }
    else
    // if round to year is less than date
    if (d3.utcYear(date) < date) {
      // use month format - %B
      format = 7;
    }
    else
    // as last resort
    {
      // use year format - %Y
      format = 8;
    }
    return format;
  }) : 0;

  return dateFormats[formatIndex];
};

utility.multiFormat = function(d) {
  var date = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
  var format;
  if (d3.timeSecond(date) < d) {
    format = '.%L'; //millisecond
  } else if (d3.timeMinute(date) < d) {
    format = ':%S'; //second
  } else if (d3.timeHour(date) < d) {
    format = '%I:%M'; //minute
  } else if (d3.timeDay(date) < d) {
    format = '%I %p'; //hour
  } else if (d3.timeMonth(date) < d) {
    format = '%x'; //day
    // format = (d3.timeWeek(date) < date ? formatDay : formatWeek);
  } else if (d3.timeYear(date) < d) {
    format = '%B'; //month
  } else {
    format = '%Y'; //year
  }
  return format;
};

utility.dateFormat = function(d, p, l) {
  var dateString, date, locale, spec, fmtr;

  // if the date value provided is a year
  dateString = d.toString();
  if (!isNaN(parseInt(dateString, 10)) && dateString.length === 4) {
    // append day and month parts to get correct UTC offset
    date = new Date(dateString + '-1-1'); // '1/1/' + dateString;
  } else {
    date = new Date(d);
  }
  date.setMilliseconds(date.getMilliseconds() - date.getTimezoneOffset() * 60000);

  if (!(date instanceof Date) || isNaN(date.valueOf())) {
    return d;
  }

  if (l && l.hasOwnProperty('utcFormat')) {
    // Use rebuilt locale formatter
    fmtr = l.utcFormat;
    spec = p && p.indexOf('%') !== -1 ? p : utility.multiFormat(date);
  } else {
    // Ensure locality object has all needed properties
    // TODO: this is expensive so consider removing
    locale = utility.buildLocality(l);
    fmtr = d3.timeFormatDefaultLocale(locale).utcFormat;
    spec = p && p.indexOf('%') !== -1 ? p : locale[p] || utility.multiFormat(date);
    // TODO: if not explicit pattern provided, we should use .multi()
  }

  return fmtr(spec)(date);
};

utility.buildLocality = function(l, d) {
  var locale = l || {};
  var deep = !!d;
  var unfer = function(a) {
        return a.join('|').split('|').map(function(b) {
          return !(b) ? '' : isNaN(b) ? b : +b;
        });
      };
  var definition = {
        'decimal': '.',
        'thousands': ',',
        'grouping': [3],
        'currency': ['$', ''],
        'periods': ['AM', 'PM'],
        'days': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'shortDays': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'shortMonths': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'date': '%b %-d, %Y', //%x
        'time': '%-I:%M:%S %p', //%X
        'dateTime': '%B %-d, %Y at %X GMT%Z', //%c
        // Custom patterns
        'full': '%A, %c',
        'long': '%c',
        'medium': '%x, %X',
        'short': '%-m/%-d/%y, %-I:%M %p',
        'yMMMEd': '%a, %x',
        'yMEd': '%a, %-m/%-d/%Y',
        'yMMMMd': '%B %-d, %Y',
        'yMMMd': '%x',
        'yMd': '%-m/%-d/%Y',
        'yMMMM': '%B %Y',
        'yMMM': '%b %Y',
        'MMMd': '%b %-d',
        'MMMM': '%B',
        'MMM': '%b',
        'y': '%Y'
      };
  var def;

  for (var key in locale) {
    if (l.hasOwnProperty(key)) {
      def = locale[key];
      definition[key] = !deep || !Array.isArray(def) ? def : unfer(def);
    }
  }

  return definition;
};

utility.displayNoData = function (hasData, container, label, x, y) {
  var data = hasData ? [] : [label];
  var noData_bind = container.selectAll('.sc-no-data').data(data);
  var noData_entr = noData_bind.enter().append('text')
        .attr('class', 'sc-no-data')
        .attr('dy', '-.7em')
        .style('text-anchor', 'middle');
  var noData = container.selectAll('.sc-no-data').merge(noData_entr);
  noData_bind.exit().remove();
  if (!!data.length) {
    noData
      .attr('x', x)
      .attr('y', y)
      .text(utility.identity);
    container.selectAll('.sc-chart-wrap').remove();
    return true;
  } else {
    return false;
  }
};


export default utility;
