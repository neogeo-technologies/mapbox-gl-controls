import mapboxgl from 'mapbox-gl';
import distance from '@turf/distance';
import area from '@turf/area';
import centroid from '@turf/centroid';
import { polygon } from '@turf/helpers';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function iconArea() {
  return (new DOMParser().parseFromString("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22px\" height=\"22px\" viewBox=\"0 0 124 104\">\r\n  <g stroke=\"#505050\" stroke-miterlimit=\"10\">\r\n    <path d=\"M21 2h80l20 50-20 50H21L1 52z\" fill=\"#fff\" stroke-width=\"9\" pointer-events=\"all\"/>\r\n    <path d=\"M1 52L51 2M13 82L98 1M71 102l50-50M29.96 102l79.52-76.3\" fill=\"none\" stroke-width=\"7\" pointer-events=\"stroke\"/>\r\n  </g>\r\n</svg>", 'image/svg+xml')).firstChild;
}

var LAYER_POLYGON = 'controls-layer-polygon';
var LAYER_AREA = 'controls-layer-area';
var LAYER_SYMBOL = 'controls-layer-symbol';
var SOURCE_POLYGON = 'controls-source-polygon';
var SOURCE_AREA = 'controls-source-area';
var SOURCE_SYMBOL = 'controls-source-symbol';
var MAIN_COLOR = 'orange';
var HALO_COLOR = '#fff';
var TEXT_COLOR = '#263238';

function geoPolygon() {
  var coordinates = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    }
  };
}

function geoPoint() {
  var coordinates = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var labels = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return {
    type: 'FeatureCollection',
    features: coordinates.map(function (c, i) {
      return {
        type: 'Feature',
        properties: {
          text: labels[i]
        },
        geometry: {
          type: 'Point',
          coordinates: c
        }
      };
    })
  };
}
/**
 * Humanize an area in m²
 * output in ha, a, ca
 */


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
    nbchar += "".concat(ha, " ha ");
  }

  if (a !== 0 || ha !== 0) {
    nbchar += "".concat(a, " a ");
  }

  if (ca !== 0) {
    nbchar += "".concat(ca, " ca");
  }

  return nbchar;
}
/**
 *
 * @param {*} number
 */


function defaultLabelFormat(number) {
  if (number < 1) {
    return "".concat((number * 1000).toFixed(), " m");
  }

  return "".concat(number.toFixed(2), " km");
}

function calculatePolygonSuperficy(coordinates) {
  var areaPolygon = area(coordinates);
  return formatArea(areaPolygon);
}
/**
 * @param {Object} options
 * @param {String} [options.units='square-kilometers']
 * @param {Function} [options.labelFormat] - Accepts number and returns label.
 * Can be used to convert value to hectare, are, centiare.
 * @param {Array} [options.font=['Roboto Medium']] - Array of fonts.
 * @param {String} [options.mainColor='#263238'] - Color of ruler lines.
 * @param {String} [options.secondaryColor='#fff'] - Color of halo and inner marker background.
 */


var AreaControl = /*#__PURE__*/function () {
  function AreaControl() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AreaControl);

    this.isPolygonClosed = true;
    this.isMeasuring = false;
    this.polygons = [];
    this.units = options.units || 'kilometers';
    this.font = options.font || ['Roboto Medium'];
    this.labelFormat = options.labelFormat || defaultLabelFormat;
    this.mainColor = options.mainColor || MAIN_COLOR;
    this.textColor = options.textColor || TEXT_COLOR;
    this.secondaryColor = options.secondaryColor || HALO_COLOR;
    this.mapClickListener = this.mapClickListener.bind(this);
    this.mapMouseMoveListener = this.mapMouseMoveListener.bind(this);
    this.styleLoadListener = this.styleLoadListener.bind(this);
  }

  _createClass(AreaControl, [{
    key: "indexOfPolygons",
    value: function indexOfPolygons() {
      return this.polygons.length - 1;
    }
  }, {
    key: "insertControls",
    value: function insertControls() {
      this.container = document.createElement('div');
      this.container.classList.add('mapboxgl-ctrl');
      this.container.classList.add('mapboxgl-ctrl-group');
      this.container.classList.add('mapboxgl-ctrl-area');
      this.button = document.createElement('button');
      this.button.setAttribute('type', 'button');
      this.button.appendChild(iconArea());
      this.container.appendChild(this.button);
    }
  }, {
    key: "measuringOn",
    value: function measuringOn() {
      this.isMeasuring = true;
      this.map.getCanvas().style.cursor = 'crosshair';
      this.button.classList.add('-active');
      this.initPolygon();
      this.addSourcesAndLayers(this.indexOfPolygons());
      this.map.on('click', this.mapClickListener);
      this.map.on('mousemove', this.mapMouseMoveListener);
      this.map.on('style.load', this.styleLoadListener);
      this.map.fire('area.on');
    }
  }, {
    key: "measuringOff",
    value: function measuringOff() {
      this.isMeasuring = false;
      this.map.getCanvas().style.cursor = '';
      this.button.classList.remove('-active'); // Remove layers, sources and event listeners for each polygon

      for (var i = 0; i <= this.indexOfPolygons(); i += 1) {
        this.map.removeLayer(LAYER_POLYGON + i);
        this.map.removeLayer(LAYER_SYMBOL + i);
        this.map.removeSource(SOURCE_POLYGON + i);
        this.map.removeSource(SOURCE_SYMBOL + i);

        if (this.map.getSource(SOURCE_AREA + i)) {
          this.map.removeLayer(LAYER_AREA + i);
          this.map.removeSource(SOURCE_AREA + i);
        }

        this.polygons[i].markers.forEach(function (m) {
          return m.remove();
        });
      }

      this.polygons = [];
      this.isPolygonClosed = true;
      this.map.off('click', this.mapClickListener);
      this.map.off('mousemove', this.mapMouseMoveListener);
      this.map.off('style.load', this.styleLoadListener);
      this.map.fire('area.off');
    } // Create a new polygon

  }, {
    key: "initPolygon",
    value: function initPolygon() {
      this.polygons.push({});
      this.polygons[this.indexOfPolygons()] = {};
      this.polygons[this.indexOfPolygons()].coordinates = [];
      this.polygons[this.indexOfPolygons()].markers = [];
      this.polygons[this.indexOfPolygons()].markerNodes = [];
      this.isPolygonClosed = false;
    } // When a new style is loaded (e.g. Satellite), we need to draw again all the layers

  }, {
    key: "drawAllLayers",
    value: function drawAllLayers() {
      var _this = this;

      var _loop = function _loop(i) {
        _this.addSourcesAndLayers(i); // #Fix. This is tricky, and maybe there is a simpler way, but the style.load event is not enough for this case.
        // Events in Mapbox are a bit messy, and we need to listen also this styledata (when any style changes)
        // to re-draw our layers, otherwise they will be under the new Tiles loaded.


        _this.map.on('styledata', function () {
          if (_this.map.getSource(SOURCE_POLYGON + i)) {
            _this.map.getSource(SOURCE_POLYGON + i).setData(geoPolygon([_this.polygons[i].coordinates]));

            _this.map.getSource(SOURCE_SYMBOL + i).setData(geoPoint(_this.polygons[i].coordinates, _this.polygons[i].labels));

            if (_this.polygons[i].coordinates.length > 3) {
              var centroidPoly = centroid(polygon([_this.polygons[i].coordinates]));
              var textArea = calculatePolygonSuperficy(polygon([_this.polygons[i].coordinates]));
              centroidPoly.properties.area = textArea;

              _this.map.getSource(SOURCE_AREA + i).setData(centroidPoly);
            } // When our layers, we can unsubscribe for this event.


            _this.map.off('styledata');
          }
        });
      };

      for (var i = 0; i <= this.indexOfPolygons(); i += 1) {
        _loop(i);
      }
    } // Create the sources and layers for a polygon

  }, {
    key: "addSourcesAndLayers",
    value: function addSourcesAndLayers(polygonNumber) {
      // The polygon itself
      this.map.addSource(SOURCE_POLYGON + polygonNumber, {
        type: 'geojson',
        data: geoPolygon(this.polygons[polygonNumber].coordinates)
      });
      this.map.addLayer({
        id: LAYER_POLYGON + polygonNumber,
        type: 'fill',
        source: SOURCE_POLYGON + polygonNumber,
        paint: {
          'fill-color': this.mainColor,
          'fill-opacity': 0.3,
          'fill-outline-color': 'blue'
        }
      }); // The distance points and symbols

      this.map.addSource(SOURCE_SYMBOL + polygonNumber, {
        type: 'geojson',
        data: geoPoint(this.polygons[polygonNumber].coordinates, this.polygons[polygonNumber].labels)
      });
      this.map.addLayer({
        id: LAYER_SYMBOL + polygonNumber,
        type: 'symbol',
        source: SOURCE_SYMBOL + polygonNumber,
        layout: {
          'text-field': '{text}',
          'text-font': this.font,
          'text-anchor': 'top',
          'text-size': 12,
          'text-offset': [0, 0.8]
        },
        paint: {
          'text-color': this.textColor,
          'text-halo-color': this.secondaryColor,
          'text-halo-width': 1
        }
      }); // The area of the polygon

      this.map.addSource(SOURCE_AREA + polygonNumber, {
        type: 'geojson',
        data: geoPoint()
      });
      this.map.addLayer({
        id: LAYER_AREA + polygonNumber,
        type: 'symbol',
        source: SOURCE_AREA + polygonNumber,
        layout: {
          'text-field': '{area}',
          'text-font': this.font,
          'text-anchor': 'center',
          'text-size': 14,
          'text-justify': 'auto'
        },
        paint: {
          'text-color': this.textColor,
          'text-halo-color': this.secondaryColor,
          'text-halo-width': 1
        }
      });
    } // On a click on the map:
    // * create a marker
    // * update the polygon and symbols (distance) sources
    // * calculate and display the area

  }, {
    key: "mapClickListener",
    value: function mapClickListener(event) {
      if (this.isPolygonClosed) {
        this.initPolygon();
        this.addSourcesAndLayers(this.indexOfPolygons());
      } else {
        var markerNode = this.createMarkerNode();
        var marker = new mapboxgl.Marker({
          element: markerNode,
          draggable: false
        }).setLngLat(event.lngLat).addTo(this.map); // Update the polygon and symbol sources with the new data

        this.polygons[this.indexOfPolygons()].coordinates.push([event.lngLat.lng, event.lngLat.lat]);
        this.polygons[this.indexOfPolygons()].labels = this.coordinatesToLabels(this.indexOfPolygons());
        this.map.getSource(SOURCE_POLYGON + this.indexOfPolygons()).setData(geoPolygon([this.polygons[this.indexOfPolygons()].coordinates]));
        this.map.getSource(SOURCE_SYMBOL + this.indexOfPolygons()).setData(geoPoint(this.polygons[this.indexOfPolygons()].coordinates, this.polygons[this.indexOfPolygons()].labels));
        this.polygons[this.indexOfPolygons()].markers.push(marker);
        this.polygons[this.indexOfPolygons()].markerNodes.push(markerNode); // Calculate and display the area

        if (this.polygons[this.indexOfPolygons()].coordinates.length > 2) {
          var temporaryCoordinates = _toConsumableArray(this.polygons[this.indexOfPolygons()].coordinates);

          temporaryCoordinates.push(temporaryCoordinates[0]); // Close artifially the polygon to draw it

          var centroidPoly = centroid(polygon([temporaryCoordinates]));
          var textArea = calculatePolygonSuperficy(polygon([temporaryCoordinates]));
          centroidPoly.properties.area = textArea;
          this.map.getSource(SOURCE_AREA + this.indexOfPolygons()).setData(centroidPoly);
        } // This event is used to know when to close the polygon. two points allow that:
        // * the first point
        // * the last point


        markerNode.addEventListener('click', this.closePolygon.bind(this)); // So to keep the logic above working, after each new point we unsubscribe the click event on previous marker,
        // to keep active only the first and last markers.

        if (this.polygons[this.indexOfPolygons()].coordinates.length > 2) {
          this.polygons[this.indexOfPolygons()].markerNodes[this.polygons[this.indexOfPolygons()].coordinates.length - 2].removeEventListener('click', this.closePolygon.bind(this));
        }
      }
    }
  }, {
    key: "createMarkerNode",
    value: function createMarkerNode() {
      var markerNode = document.createElement('div');
      markerNode.style.width = '7px';
      markerNode.style.height = '7px';
      markerNode.style.borderRadius = '50%';
      markerNode.style.background = this.secondaryColor;
      markerNode.style.boxSizing = 'border-box';
      markerNode.style.border = "2px solid ".concat(this.textColor);
      return markerNode;
    }
  }, {
    key: "closePolygon",
    value: function closePolygon() {
      var firstMarker = this.polygons[this.indexOfPolygons()].markers[0];
      this.polygons[this.indexOfPolygons()].coordinates.push([firstMarker.getLngLat().lng, firstMarker.getLngLat().lat]);
      this.isPolygonClosed = true;
    } // On mouse move, we update the polygon drawing

  }, {
    key: "mapMouseMoveListener",
    value: function mapMouseMoveListener(event) {
      if (this.polygons[this.indexOfPolygons()].coordinates.length > 1) {
        var lngLat = event.lngLat;

        var temporaryCoordinates = _toConsumableArray(this.polygons[this.indexOfPolygons()].coordinates);

        temporaryCoordinates.push([lngLat.lng, lngLat.lat]);
        temporaryCoordinates.push(temporaryCoordinates[0]); // Close artifially the polygon to draw it

        this.map.getSource(SOURCE_POLYGON + this.indexOfPolygons()).setData(geoPolygon([temporaryCoordinates]));
      }
    }
  }, {
    key: "coordinatesToLabels",
    value: function coordinatesToLabels(numberOfPolygons) {
      var _this2 = this;

      var coordinates = this.polygons[numberOfPolygons].coordinates;
      var units = this.units;
      var sum = 0;
      return coordinates.map(function (coordinate, index) {
        if (index === 0) return 0;
        sum += distance(coordinates[index - 1], coordinates[index], {
          units: units
        });
        return _this2.labelFormat(sum);
      });
    }
  }, {
    key: "styleLoadListener",
    value: function styleLoadListener() {
      this.drawAllLayers();
    }
  }, {
    key: "onAdd",
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
    }
  }, {
    key: "onRemove",
    value: function onRemove() {
      if (this.isMeasuring) {
        this.measuringOff();
      }

      this.map.off('click', this.mapClickListener);
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }]);

  return AreaControl;
}();

export default AreaControl;
