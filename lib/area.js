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
  return (new DOMParser().parseFromString("<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"25\" height=\"25\" viewBox=\"0 0 25 25\" fill=\"#505050\">\r\n<path id=\"Draw\" d=\"M22.399,4.251 C21.560,4.076 20.878,3.369 20.744,2.535 C20.551,1.336 21.271,0.291 22.462,0.043 C22.504,0.034 22.543,0.012 22.584,-0.004 C22.763,-0.004 22.943,-0.004 23.123,-0.004 C23.701,0.137 24.213,0.380 24.583,0.877 C25.096,1.567 25.139,2.551 24.666,3.309 C24.204,4.052 23.280,4.436 22.399,4.251 zM22.862,0.860 C22.140,0.859 21.562,1.434 21.561,2.156 C21.560,2.858 22.140,3.441 22.844,3.446 C23.557,3.451 24.150,2.860 24.147,2.148 C24.145,1.444 23.564,0.862 22.862,0.860 zM23.278,18.378 C23.278,18.499 23.272,18.652 23.203,18.734 C23.117,18.837 22.955,18.949 22.839,18.936 C22.708,18.922 22.572,18.790 22.479,18.675 C22.422,18.604 22.428,18.471 22.428,18.365 C22.425,14.484 22.424,10.603 22.426,6.722 C22.426,6.582 22.415,6.408 22.488,6.309 C22.575,6.191 22.754,6.064 22.883,6.074 C23.011,6.084 23.148,6.244 23.239,6.368 C23.294,6.443 23.279,6.575 23.280,6.681 C23.281,8.631 23.281,10.580 23.281,12.530 C23.281,14.480 23.282,16.429 23.278,18.378 zM22.864,20.702 C24.038,20.712 25.002,21.679 25.004,22.850 C25.006,24.030 24.020,25.013 22.843,25.004 C21.669,24.995 20.705,24.028 20.702,22.856 C20.699,21.678 21.688,20.693 22.864,20.702 zM22.864,24.147 C23.561,24.141 24.147,23.552 24.147,22.855 C24.148,22.155 23.565,21.565 22.869,21.559 C22.153,21.553 21.565,22.134 21.559,22.851 C21.553,23.558 22.153,24.154 22.864,24.147 zM18.378,2.579 C16.590,2.580 14.803,2.579 13.015,2.579 C12.844,2.579 12.674,2.579 12.503,2.579 C10.536,2.579 8.569,2.580 6.601,2.579 C6.230,2.579 6.017,2.392 6.056,2.109 C6.090,1.862 6.268,1.727 6.587,1.726 C7.422,1.722 8.257,1.722 9.093,1.723 C12.156,1.723 15.219,1.724 18.282,1.724 C18.318,1.724 18.354,1.724 18.390,1.725 C18.739,1.727 18.948,1.876 18.958,2.129 C18.968,2.402 18.746,2.579 18.378,2.579 zM2.508,24.966 C1.322,25.148 0.289,24.427 0.043,23.245 C0.034,23.203 0.012,23.163 -0.004,23.123 C-0.004,22.943 -0.004,22.763 -0.004,22.584 C0.135,22.015 0.371,21.509 0.856,21.140 C1.556,20.608 2.533,20.561 3.308,21.042 C4.053,21.505 4.433,22.418 4.251,23.308 C4.078,24.157 3.366,24.834 2.508,24.966 zM2.156,21.561 C1.434,21.563 0.859,22.140 0.860,22.863 C0.862,23.564 1.444,24.145 2.149,24.147 C2.861,24.150 3.452,23.556 3.446,22.844 C3.440,22.139 2.858,21.560 2.156,21.561 zM2.581,7.058 C2.582,8.954 2.582,10.849 2.582,12.745 C2.581,12.745 2.580,12.745 2.579,12.745 C2.579,14.613 2.581,16.482 2.576,18.350 C2.576,18.480 2.573,18.645 2.499,18.732 C2.408,18.838 2.234,18.944 2.109,18.930 C1.984,18.916 1.857,18.767 1.767,18.650 C1.716,18.583 1.726,18.461 1.726,18.364 C1.724,14.582 1.723,10.799 1.723,7.017 C1.723,6.705 1.890,6.485 2.129,6.477 C2.400,6.467 2.581,6.694 2.581,7.058 zM2.508,4.696 C1.319,4.877 0.288,4.157 0.043,2.975 C0.034,2.933 0.012,2.893 -0.004,2.853 C-0.004,2.673 -0.004,2.493 -0.004,2.313 C0.135,1.745 0.371,1.239 0.856,0.870 C1.556,0.337 2.521,0.291 3.308,0.772 C4.049,1.226 4.430,2.140 4.251,3.038 C4.085,3.875 3.358,4.567 2.508,4.696 zM2.182,1.289 C1.467,1.274 0.873,1.848 0.858,2.567 C0.843,3.260 1.422,3.859 2.122,3.877 C2.828,3.895 3.437,3.307 3.446,2.599 C3.455,1.899 2.880,1.304 2.182,1.289 zM6.317,22.486 C6.430,22.419 6.594,22.426 6.735,22.426 C8.675,22.423 10.616,22.424 12.556,22.424 C12.556,22.424 12.556,22.425 12.556,22.425 C14.515,22.425 16.473,22.426 18.432,22.424 C18.659,22.424 18.869,22.486 18.913,22.718 C18.940,22.859 18.884,23.062 18.788,23.164 C18.703,23.255 18.511,23.274 18.365,23.276 C17.449,23.285 16.533,23.282 15.617,23.282 C12.616,23.281 9.615,23.282 6.615,23.276 C6.487,23.276 6.331,23.254 6.240,23.178 C6.145,23.100 6.054,22.936 6.070,22.825 C6.087,22.700 6.203,22.554 6.317,22.486 z\" />\r\n</svg>\r\n", 'image/svg+xml')).firstChild;
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
      console.log(event);

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
