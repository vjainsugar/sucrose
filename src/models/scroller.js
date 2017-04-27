import d3 from 'd3v4';
import utility from '../utility.js';

export default function scroller() {

  //============================================================
  // Public Variables
  //------------------------------------------------------------

  var id,
      margin = {},
      vertical,
      width,
      height,
      minDimension,
      panHandler,
      overflowHandler,
      enable;

  //============================================================

  function scroll(g, g_entr, scroll_wrap, axis) {

    var defs = g.select('defs');
    var defs_entr = g_entr.select('defs');
    var axis_wrap = scroll_wrap.select('.sc-axis-wrap.sc-axis-x');
    var bars_wrap = scroll_wrap.select('.sc-bars-wrap');

    var scrollMask,
        scrollTarget,
        backShadows,
        foreShadows;

    var scrollOffset = 0;

    gradients_create();
    scrollMask_create();
    scrollTarget_create();
    backShadows_create();
    foreShadows_create();

    //------------------------------------------------------------
    // Privileged Methods

    // typically called by chart model
    scroll.render = function() {
      assignEvents();
      gradients_render();
      scrollMask_apply();
      backShadows_render();
      foreShadows_render();
    };

    // typically called by container resize
    scroll.resize = function(offset, overflow) {
      var labelOffset;
      var x, y;
      var scrollWidth, scrollHeight;
      var length, val;

      scrollOffset = offset;
      overflowHandler = overflow;

      // toggle enable dependent
      scroll.render();

      if (!enable) {
        return;
      }

      labelOffset = axis.labelThickness() + axis.tickPadding() / 2;
      x = vertical ? margin.left : labelOffset;
      y = margin.top;
      scrollWidth = width + (vertical ? 0 : margin[axis.orient()] - labelOffset);
      scrollHeight = height + (vertical ? margin[axis.orient()] - labelOffset : 0);
      length = vertical ? 'height' : 'width';
      val = vertical ? scrollHeight : scrollWidth;

      scrollMask_resize(width, height);
      scrollTarget_resize(x, y, scrollWidth, scrollHeight);
      backShadows_resize(x, y, width, height, length, val);
      foreShadows_resize(x, y, length, val);
    };

    // typically called by panHandler
    // returns scrollOffset
    scroll.pan = function(diff) {
      var distance = 0,
          overflowDistance = 0,
          translate = '',
          x = 0,
          y = 0;

      // don't fire on events other than zoom and drag
      // we need click for handling legend toggle
      if (d3.event) {
        if (d3.event.type === 'zoom' && d3.event.sourceEvent) {
          x = d3.event.sourceEvent.deltaX || 0;
          y = d3.event.sourceEvent.deltaY || 0;
          distance = (Math.abs(x) > Math.abs(y) ? x : y) * -1;
        } else if (d3.event.type === 'drag') {
          x = d3.event.dx || 0;
          y = d3.event.dy || 0;
          distance = vertical ? x : y;
        } else if (d3.event.type !== 'click') {
          return 0;
        }
        overflowDistance = (Math.abs(y) > Math.abs(x) ? y : 0);
      }

      // reset value defined in panMultibar();
      scrollOffset = Math.min(Math.max(scrollOffset + distance, diff), -1);
      translate = 'translate(' + (vertical ? scrollOffset + ',0' : '0,' + scrollOffset) + ')';

      if (scrollOffset + distance > 0 || scrollOffset + distance < diff) {
        overflowHandler(overflowDistance);
      }

      foreShadows
        .attr('transform', translate);
      bars_wrap
        .attr('transform', translate);
      axis_wrap.select('.sc-wrap.sc-axis')
        .attr('transform', translate);

      return scrollOffset;
    };

    //------------------------------------------------------------
    // Private Methods

    function assignEvents() {
      if (enable) {

        var zoom = d3.zoom()
              .on('zoom', panHandler);
        var drag = d3.drag()
              .subject(function(d) { return d; })
              .on('drag', panHandler);

        scroll_wrap
          .call(zoom);
        scrollTarget
          .call(zoom);

        scroll_wrap
          .call(drag);
        scrollTarget
          .call(drag);

      } else {

        scroll_wrap.on('.zoom', null);
        scrollTarget.on('.zoom', null);

        scroll_wrap.on('.drag', null);
        scrollTarget.on('.drag', null);

        // scroll_wrap
        //     .on('mousedown.zoom', null)
        //     .on('mousewheel.zoom', null)
        //     .on('mousemove.zoom', null)
        //     .on('DOMMouseScroll.zoom', null)
        //     .on('dblclick.zoom', null)
        //     .on('touchstart.zoom', null)
        //     .on('touchmove.zoom', null)
        //     .on('touchend.zoom', null)
        //     .on('wheel.zoom', null);
        // scrollTarget
        //     .on('mousedown.zoom', null)
        //     .on('mousewheel.zoom', null)
        //     .on('mousemove.zoom', null)
        //     .on('DOMMouseScroll.zoom', null)
        //     .on('dblclick.zoom', null)
        //     .on('touchstart.zoom', null)
        //     .on('touchmove.zoom', null)
        //     .on('touchend.zoom', null)
        //     .on('wheel.zoom', null);

        // scroll_wrap
        //     .on('mousedown.drag', null)
        //     .on('mousewheel.drag', null)
        //     .on('mousemove.drag', null)
        //     .on('DOMMouseScroll.drag', null)
        //     .on('dblclick.drag', null)
        //     .on('touchstart.drag', null)
        //     .on('touchmove.drag', null)
        //     .on('touchend.drag', null)
        //     .on('wheel.drag', null);
        // scrollTarget
        //     .on('mousedown.drag', null)
        //     .on('mousewheel.drag', null)
        //     .on('mousemove.drag', null)
        //     .on('DOMMouseScroll.drag', null)
        //     .on('dblclick.drag', null)
        //     .on('touchstart.drag', null)
        //     .on('touchmove.drag', null)
        //     .on('touchend.drag', null)
        //     .on('wheel.drag', null);
      }
    }

    /* Background gradients */
    function gradients_create() {
      defs_entr
        .append('linearGradient')
        .attr('class', 'sc-scroll-gradient')
        .attr('id', 'sc-back-gradient-prev-' + id);
      var bgpEnter = defs_entr.select('#sc-back-gradient-prev-' + id);

      defs_entr
        .append('linearGradient')
        .attr('class', 'sc-scroll-gradient')
        .attr('id', 'sc-back-gradient-more-' + id);
      var bgmEnter = defs_entr.select('#sc-back-gradient-more-' + id);

      bgpEnter
        .append('stop')
        .attr('stop-color', '#000')
        .attr('stop-opacity', '0.3')
        .attr('offset', 0);
      bgpEnter
        .append('stop')
        .attr('stop-color', '#FFF')
        .attr('stop-opacity', '0')
        .attr('offset', 1);
      bgmEnter
        .append('stop')
        .attr('stop-color', '#FFF')
        .attr('stop-opacity', '0')
        .attr('offset', 0);
      bgmEnter
        .append('stop')
        .attr('stop-color', '#000')
        .attr('stop-opacity', '0.3')
        .attr('offset', 1);

      /* Foreground gradients */
      defs_entr
        .append('linearGradient')
        .attr('class', 'sc-scroll-gradient')
        .attr('id', 'sc-fore-gradient-prev-' + id);
      var fgpEnter = defs_entr.select('#sc-fore-gradient-prev-' + id);

      defs_entr
        .append('linearGradient')
        .attr('class', 'sc-scroll-gradient')
        .attr('gradientUnits', 'objectBoundingBox')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('id', 'sc-fore-gradient-more-' + id);
      var fgmEnter = defs_entr.select('#sc-fore-gradient-more-' + id);

      fgpEnter
        .append('stop')
        .attr('stop-color', '#FFF')
        .attr('stop-opacity', '1')
        .attr('offset', 0);
      fgpEnter
        .append('stop')
        .attr('stop-color', '#FFF')
        .attr('stop-opacity', '0')
        .attr('offset', 1);
      fgmEnter
        .append('stop')
        .attr('stop-color', '#FFF')
        .attr('stop-opacity', '0')
        .attr('offset', 0);
      fgmEnter
        .append('stop')
        .attr('stop-color', '#FFF')
        .attr('stop-opacity', '1')
        .attr('offset', 1);

      defs.selectAll('.sc-scroll-gradient')
        .attr('gradientUnits', 'objectBoundingBox')
        .attr('x1', 0)
        .attr('y1', 0);
    }
    function gradients_render() {
      defs.selectAll('.sc-scroll-gradient')
        .attr('x2', vertical ? 1 : 0)
        .attr('y2', vertical ? 0 : 1);
    }

    /* Clipping mask for scroll window */
    function scrollMask_create() {
      defs_entr.append('clipPath')
        .attr('class', 'sc-scroll-mask')
        .attr('id', 'sc-edge-clip-' + id)
        .append('rect');
      scrollMask = defs.select('.sc-scroll-mask rect');
    }
    function scrollMask_apply() {
      scroll_wrap.attr('clip-path', enable ? 'url(#sc-edge-clip-' + id + ')' : '');
    }
    function scrollMask_resize(width, height) {
      scrollMask
        .attr('x', vertical ? 2 : -margin.left)
        .attr('y', vertical ? 0 : 2)
        .attr('width', width + (vertical ? -2 : margin.left))
        .attr('height', height + (vertical ? margin.bottom : -2));
    }

    /* Background rectangle for mouse events */
    function scrollTarget_create() {
      g_entr.select('.sc-scroll-background')
        .append('rect')
        .attr('class', 'sc-scroll-target')
        //.attr('fill', '#FFF');
        .attr('fill', 'transparent');
      scrollTarget = g.select('.sc-scroll-target');
    }
    function scrollTarget_resize(x, y, scrollWidth, scrollHeight) {
      scrollTarget
        .attr('x', x)
        .attr('y', y)
        .attr('width', scrollWidth)
        .attr('height', scrollHeight);
    }

    /* Background shadow rectangles */
    function backShadows_create() {
      var backShadows_entr = g_entr.select('.sc-scroll-background')
            .append('g')
            .attr('class', 'sc-back-shadow-wrap');
      backShadows_entr
        .append('rect')
        .attr('class', 'sc-back-shadow-prev');
      backShadows_entr
        .append('rect')
        .attr('class', 'sc-back-shadow-more');
      backShadows = g.select('.sc-back-shadow-wrap');
    }
    function backShadows_render() {
      var thickness = vertical ? 'width' : 'height';
      backShadows.select('rect.sc-back-shadow-prev')
        .attr('fill', enable ? 'url(#sc-back-gradient-prev-' + id + ')' : 'transparent')
        .attr(thickness, 7);
      backShadows.select('rect.sc-back-shadow-more')
        .attr('fill', enable ? 'url(#sc-back-gradient-more-' + id + ')' : 'transparent')
        .attr(thickness, 7);
    }
    function backShadows_resize(x, y, width, height, length, val) {
      backShadows.select('.sc-back-shadow-prev')
        .attr('x', x)
        .attr('y', y)
        .attr(length, val);
      backShadows.select('.sc-back-shadow-more')
        .attr('x', x + (vertical ? width - 5 : 1))
        .attr('y', y + (vertical ? 0 : height - 6))
        .attr(length, val);
    }

    /* Foreground shadow rectangles */
    function foreShadows_create() {
      var foreShadows_entr = g_entr.select('.sc-scroll-background')
            .insert('g')
            .attr('class', 'sc-fore-shadow-wrap');
      foreShadows_entr
        .append('rect')
        .attr('class', 'sc-fore-shadow-prev');
      foreShadows_entr
        .append('rect')
        .attr('class', 'sc-fore-shadow-more');
      foreShadows = g.select('.sc-fore-shadow-wrap');
    }
    function foreShadows_render() {
      var thickness = vertical ? 'width' : 'height';
      foreShadows.select('.sc-fore-shadow-prev')
        .attr('fill', enable ? 'url(#sc-fore-gradient-prev-' + id + ')' : 'transparent')
        .attr(thickness, 20);
      foreShadows.select('.sc-fore-shadow-more')
        .attr('fill', enable ? 'url(#sc-fore-gradient-more-' + id + ')' : 'transparent')
        .attr(thickness, 20);
    }
    function foreShadows_resize(x, y, length, val) {
      foreShadows.select('.sc-fore-shadow-prev')
        .attr('x', x + (vertical ? 1 : 0))
        .attr('y', y + (vertical ? 0 : 1))
        .attr(length, val);
      foreShadows.select('.sc-fore-shadow-more')
        .attr('x', x + (vertical ? minDimension - 17 : 0))
        .attr('y', y + (vertical ? 0 : minDimension - 19))
        .attr(length, val);
    }

    // return instance for method chaining
    return scroll;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  scroll.id = function(_) {
    if (!arguments.length) {
      return id;
    }
    id = _;
    return scroll;
  };

  scroll.margin = function(_) {
    if (!arguments.length) {
      return margin;
    }
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return scroll;
  };

  scroll.width = function(_) {
    if (!arguments.length) {
      return width;
    }
    width = _;
    return scroll;
  };

  scroll.height = function(_) {
    if (!arguments.length) {
      return height;
    }
    height = _;
    return scroll;
  };

  scroll.vertical = function(_) {
    if (!arguments.length) {
      return vertical;
    }
    vertical = _;
    return scroll;
  };

  scroll.minDimension = function(_) {
    if (!arguments.length) {
      return minDimension;
    }
    minDimension = _;
    return scroll;
  };

  scroll.panHandler = function(_) {
    if (!arguments.length) {
      return panHandler;
    }
    panHandler = utility.functor(_);
    return scroll;
  };

  scroll.enable = function(_) {
    if (!arguments.length) {
      return enable;
    }
    enable = _;
    return scroll;
  };

  //============================================================

  return scroll;
}
