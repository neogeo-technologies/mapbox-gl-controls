import { point } from '@turf/helpers';
import circle from '@turf/circle';
import distance from '@turf/distance';
import transformTranslate from '@turf/transform-translate';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function iconRuler() {
  return new DOMParser().parseFromString(
    '<svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 114 114">\n  <g stroke="#505050">\n    <circle cx="56" cy="56" fill="#fff" stroke-width="9" pointer-events="all" r="53"/>\n    <path d="M2 66L66.56 2.87M11 87l77-75M48 110l21.05-21.81Q76 81 82.93 73.79l25.64-26.69M23 101l80-76" fill="none" stroke-width="6" stroke-miterlimit="10" pointer-events="stroke"/>\n  </g>\n</svg>',
    'image/svg+xml'
  ).firstChild;
}

var LAYER_CIRCLE = 'controls-layer-circle';
var LAYER_AREA = 'controls-layer-area';
var LAYER_RADIUS = 'controls-layer-radius';
var SOURCE_CIRCLE = 'controls-source-circle';
var SOURCE_AREA = 'controls-source-area';
var SOURCE_RADIUS = 'controls-source-radius';
var MAIN_COLOR = 'orange';
var HALO_COLOR = '#fff';
var TEXT_COLOR = '#263238';

function geoPolygon() {
  var coordinates =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return {
    type: 'Feature',
    properties: {
      isCircle: true,
      center: [],
    },
    geometry: {
      type: 'Polygon',
      coordinates: coordinates,
    },
  };
}

function geoPoint() {
  var coordinates =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var labels =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return {
    type: 'FeatureCollection',
    features: coordinates.map(function (c, i) {
      return {
        type: 'Feature',
        properties: {
          text: labels[i],
        },
        geometry: {
          type: 'Point',
          coordinates: c,
        },
      };
    }),
  };
}

function formatArea(value) {
  var nbchar = '';
  var ha = 0;
  var a = 0;
  var ca = 0;

  if (value < 0) {
    nbchar += '-';
  }

  var num = Math.abs(value);
  ha = Math.floor(num / 10000);
  a = Math.floor(num / 100) - ha * 100;
  ca = Math.floor(num) - ha * 10000 - a * 100;

  if (ha !== 0) {
    nbchar += ''.concat(ha, ' ha ');
  }

  if (a !== 0 || ha !== 0) {
    nbchar += ''.concat(a, ' a ');
  }

  if (ca !== 0) {
    nbchar += ''.concat(ca, ' ca');
  }

  return nbchar;
}

function calculateCircleArea(radius) {
  var radiusInMeters = radius * 1000;
  var area = Math.round(2 * Math.PI * radiusInMeters * radiusInMeters);
  return formatArea(area);
}
/**
 * Fires map `circle.on` and `circle.off`events at the beginning and at the end of measuring.
 * @param {Object} options
 * @param {String} [options.units='kilometers'] -
 * Any units [@turf/distance](https://github.com/Turfjs/turf/tree/master/packages/turf-distance) supports
 * Can be used to convert value to any measuring units
 * @param {Array} [options.font=['Roboto Medium']] - Array of fonts.
 * @param {String} [options.mainColor='#263238'] - Color of ruler lines.
 * @param {String} [options.secondaryColor='#fff'] - Color of halo and inner marker background.
 */

var CircleControl = /*#__PURE__*/ (function () {
  function CircleControl() {
    var options =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, CircleControl);

    this.isMeasuring = false;
    this.circles = [];
    this.units = options.units || 'kilometers';
    this.font = options.font || ['Roboto Medium'];
    this.mainColor = options.mainColor || MAIN_COLOR;
    this.textColor = options.textColor || TEXT_COLOR;
    this.secondaryColor = options.secondaryColor || HALO_COLOR;
    this.mapMouseDownListener = this.mapMouseDownListener.bind(this);
    this.mapDragListener = this.mapDragListener.bind(this);
    this.styleLoadListener = this.styleLoadListener.bind(this);
  }

  _createClass(CircleControl, [
    {
      key: 'indexOfCircles',
      value: function indexOfCircles() {
        return this.circles.length - 1;
      },
    },
    {
      key: 'insertControls',
      value: function insertControls() {
        this.container = document.createElement('div');
        this.container.classList.add('mapboxgl-ctrl');
        this.container.classList.add('mapboxgl-ctrl-group');
        this.container.classList.add('mapboxgl-ctrl-circle');
        this.button = document.createElement('button');
        this.button.setAttribute('type', 'button');
        this.button.appendChild(iconRuler());
        this.container.appendChild(this.button);
      },
    },
    {
      key: 'measuringOn',
      value: function measuringOn() {
        this.isMeasuring = true;
        this.map.getCanvas().style.cursor = 'crosshair';
        this.button.classList.add('-active');
        this.map.on('mousedown', this.mapMouseDownListener);
        this.map.on('style.load', this.styleLoadListener);
        this.map.fire('circle.on');
      },
    },
    {
      key: 'measuringOff',
      value: function measuringOff() {
        this.isMeasuring = false;
        this.map.getCanvas().style.cursor = '';
        this.button.classList.remove('-active'); // Remove layers, sources and event listeners for each circle

        for (var i = 0; i <= this.indexOfCircles(); i += 1) {
          this.map.removeLayer(LAYER_CIRCLE + i);
          this.map.removeSource(SOURCE_CIRCLE + i);
          this.map.removeLayer(LAYER_AREA + i);
          this.map.removeSource(SOURCE_AREA + i);
          this.map.removeLayer(LAYER_RADIUS + i);
          this.map.removeSource(SOURCE_RADIUS + i);
        }

        this.circles = [];
        this.map.off('mousedown', this.mapMouseDownListener);
        this.map.off('style.load', this.styleLoadListener);
        this.map.fire('circle.off');
      }, // Create the sources and layers for a circle
    },
    {
      key: 'addSourcesAndLayers',
      value: function addSourcesAndLayers(circleNumber) {
        // The circle itself
        this.map.addSource(SOURCE_CIRCLE + circleNumber, {
          type: 'geojson',
          data: geoPolygon(),
        });
        this.map.addLayer({
          id: LAYER_CIRCLE + circleNumber,
          type: 'fill',
          source: SOURCE_CIRCLE + circleNumber,
          paint: {
            'fill-color': this.mainColor,
            'fill-opacity': 0.3,
            'fill-outline-color': 'blue',
          },
        }); // The area of the circle in the middle

        this.map.addSource(SOURCE_AREA + circleNumber, {
          type: 'geojson',
          data: geoPoint(),
        });
        this.map.addLayer({
          id: LAYER_AREA + circleNumber,
          type: 'symbol',
          source: SOURCE_AREA + circleNumber,
          layout: {
            'text-field': '{area}',
            'text-font': this.font,
            'text-anchor': 'center',
            'text-size': 14,
            'text-justify': 'auto',
          },
          paint: {
            'text-color': this.textColor,
            'text-halo-color': this.secondaryColor,
            'text-halo-width': 1,
          },
        }); // The radius of the circle at the top

        this.map.addSource(SOURCE_RADIUS + circleNumber, {
          type: 'geojson',
          data: geoPoint(),
        });
        this.map.addLayer({
          id: LAYER_RADIUS + circleNumber,
          type: 'symbol',
          source: SOURCE_RADIUS + circleNumber,
          layout: {
            'text-field': '{radius}',
            'text-font': this.font,
            'text-anchor': 'center',
            'text-size': 14,
            'text-offset': [0, -0.6],
          },
          paint: {
            'text-color': this.textColor,
            'text-halo-color': this.secondaryColor,
            'text-halo-width': 1,
          },
        });
      }, // When a new style is loaded (e.g. Satellite), we need to draw again all the layers
    },
    {
      key: 'drawAllLayers',
      value: function drawAllLayers() {
        var _this = this;

        var _loop = function _loop(i) {
          _this.addSourcesAndLayers(i); // #Fix. This is tricky, and maybe there is a simpler way, but the style.load event
          // is not enough for this case. Events in Mapbox are a bit messy, and we need to listen
          // also this styledata (when any style changes) to re-draw our layers, otherwise they
          // will be under the new Tiles loaded.

          _this.map.on('styledata', function () {
            if (_this.map.getSource(SOURCE_CIRCLE + i)) {
              var currentCircle = _this.circles[i];
              var circleFeature = circle(
                currentCircle.center,
                currentCircle.radius
              );

              _this.map.getSource(SOURCE_CIRCLE + i).setData(circleFeature);

              _this.map.getSource(SOURCE_AREA + i).setData(
                point(currentCircle.center, {
                  area: calculateCircleArea(currentCircle.radius),
                })
              ); // Display the radius at the top of the circle

              var distanceInMeters = Math.round(currentCircle.radius * 1000);
              var pointCenter = point(currentCircle.center, {
                radius: ''.concat(distanceInMeters, ' m'),
              });
              var topCircle = transformTranslate(
                pointCenter,
                currentCircle.radius,
                0
              );

              _this.map.getSource(SOURCE_RADIUS + i).setData(topCircle); // When our layers, we can unsubscribe for this event.

              _this.map.off('styledata');
            }
          });
        };

        for (var i = 0; i <= this.indexOfCircles(); i += 1) {
          _loop(i);
        }
      }, // When the moiuse is down, we start listening the drag to draw the circle
    },
    {
      key: 'mapMouseDownListener',
      value: function mapMouseDownListener(event) {
        var _this2 = this;

        this.initCircle();
        this.addSourcesAndLayers(this.indexOfCircles());
        this.map.dragPan.disable();
        this.circles[this.indexOfCircles()].center = [
          event.lngLat.lng,
          event.lngLat.lat,
        ];
        this.map.on('mousemove', this.mapDragListener);
        this.map.on('mouseup', function () {
          _this2.map.off('mousemove', _this2.mapDragListener);

          _this2.map.dragPan.enable();
        });
      }, // When there is drag: update the circle, the radius and the area.
    },
    {
      key: 'mapDragListener',
      value: function mapDragListener(event) {
        var center = this.circles[this.indexOfCircles()].center;

        if (center.length > 0) {
          var distanceInKilometers = distance(
            point(center),
            point([event.lngLat.lng, event.lngLat.lat]),
            {
              units: 'kilometers',
            }
          );
          var circleFeature = circle(center, distanceInKilometers);
          this.map
            .getSource(SOURCE_CIRCLE + this.indexOfCircles())
            .setData(circleFeature);
          this.circles[this.indexOfCircles()].radius = distanceInKilometers;
          this.map.getSource(SOURCE_AREA + this.indexOfCircles()).setData(
            point(center, {
              area: calculateCircleArea(distanceInKilometers),
            })
          ); // Display the radius at the top of the circle

          var distanceInMeters = Math.round(distanceInKilometers * 1000);
          var pointCenter = point(center, {
            radius: ''.concat(distanceInMeters, ' m'),
          });
          var topCircle = transformTranslate(
            pointCenter,
            distanceInKilometers,
            0
          );
          this.map
            .getSource(SOURCE_RADIUS + this.indexOfCircles())
            .setData(topCircle);
        }
      }, // Create a new circle
    },
    {
      key: 'initCircle',
      value: function initCircle() {
        this.circles.push({});
        this.circles[this.indexOfCircles()] = {};
        this.circles[this.indexOfCircles()].center = [];
        this.circles[this.indexOfCircles()].radius = 0;
      },
    },
    {
      key: 'styleLoadListener',
      value: function styleLoadListener() {
        this.drawAllLayers();
      },
    },
    {
      key: 'onAdd',
      value: function onAdd(map) {
        var _this3 = this;

        this.map = map;
        this.insertControls();
        this.button.addEventListener('click', function () {
          if (_this3.isMeasuring) {
            _this3.measuringOff();
          } else {
            _this3.measuringOn();
          }
        });
        return this.container;
      },
    },
    {
      key: 'onRemove',
      value: function onRemove() {
        if (this.isMeasuring) {
          this.measuringOff();
        }

        this.map.off('mousedown', this.mapMouseDownListener);
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
      },
    },
  ]);

  return CircleControl;
})();

export default CircleControl;
