import mapboxgl from 'mapbox-gl';
import distance from '@turf/distance';
import area from '@turf/area';
import centroid from '@turf/centroid';
import { polygon } from '@turf/helpers';
import iconArea from './area.svg';

const LAYER_POLYGON = 'controls-layer-polygon';
const LAYER_AREA = 'controls-layer-area';
const LAYER_SYMBOL = 'controls-layer-symbol';
const SOURCE_POLYGON = 'controls-source-polygon';
const SOURCE_AREA = 'controls-source-area';
const SOURCE_SYMBOL = 'controls-source-symbol';
const MAIN_COLOR = 'orange';
const HALO_COLOR = '#fff';
const TEXT_COLOR = '#263238';

function geoPolygon(coordinates = []) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates,
    },
  };
}

function geoPoint(coordinates = [], labels = []) {
  return {
    type: 'FeatureCollection',
    features: coordinates.map((c, i) => ({
      type: 'Feature',
      properties: {
        text: labels[i],
      },
      geometry: {
        type: 'Point',
        coordinates: c,
      },
    })),
  };
}

/**
 * Humanize an area in m²
 * output in ha, a, ca
 */
function formatArea(value) {
  let nbchar = '';
  let ha = 0;
  let a = 0;
  let ca = 0;

  if (value < 0) {
    nbchar += '-';
  }

  const num = Math.abs(value);
  ha = Math.floor(num / 10000);
  a = Math.floor(num / 100) - ha * 100;
  ca = Math.floor(num) - ha * 10000 - a * 100;

  if (ha !== 0) {
    nbchar += `${ha} ha `;
  }
  if (a !== 0 || ha !== 0) {
    nbchar += `${a} a `;
  }
  if (ca !== 0) {
    nbchar += `${ca} ca`;
  }
  return nbchar;
}

/**
 *
 * @param {*} number
 */
function defaultLabelFormat(number) {
  if (number < 1) {
    return `${(number * 1000).toFixed()} m`;
  }
  return `${number.toFixed(2)} km`;
}

function calculatePolygonSuperficy(coordinates) {
  const areaPolygon = area(coordinates);

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

export default class AreaControl {
  constructor(options = {}) {
    this.numberOfPolygons = 0;
    this.isPolygonClosed = true;
    this.isMeasuring = false;
    this.markers = [];
    this.markerNodes = [];
    this.coordinates = [];
    this.labels = [];
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

  insertControls() {
    this.container = document.createElement('div');
    this.container.classList.add('mapboxgl-ctrl');
    this.container.classList.add('mapboxgl-ctrl-group');
    this.container.classList.add('mapboxgl-ctrl-area');
    this.button = document.createElement('button');
    this.button.setAttribute('type', 'button');
    this.button.appendChild(iconArea());
    this.container.appendChild(this.button);
  }

  measuringOn() {
    this.isMeasuring = true;
    this.markers = [];
    this.coordinates = [];
    this.labels = [];
    this.map.getCanvas().style.cursor = 'crosshair';
    this.button.classList.add('-active');
    this.draw();
    this.map.on('click', this.mapClickListener);
    this.map.on('mousemove', this.mapMouseMoveListener);
    this.map.on('style.load', this.styleLoadListener);
    this.map.fire('area.on');
  }

  measuringOff() {
    this.isMeasuring = false;
    this.map.getCanvas().style.cursor = '';
    this.button.classList.remove('-active');

    // Remove layers, sources and event listeners for each polygon
    for (let i = 1; i <= this.numberOfPolygons; i += 1) {
      this.map.removeLayer(LAYER_POLYGON + i);
      this.map.removeLayer(LAYER_SYMBOL + i);
      this.map.removeSource(SOURCE_POLYGON + i);
      this.map.removeSource(SOURCE_SYMBOL + i);
      if (this.map.getSource(SOURCE_AREA + i)) {
        this.map.removeLayer(LAYER_AREA + i);
        this.map.removeSource(SOURCE_AREA + i);
      }
      this.markers[i].forEach((m) => m.remove());
    }

    this.map.off('click', this.mapClickListener);
    this.map.off('mousemove', this.mapMouseMoveListener);
    this.map.off('style.load', this.styleLoadListener);
    this.numberOfPolygons = 0;
    this.map.fire('area.off');
  }

  draw() {
    this.numberOfPolygons += 1;

    this.coordinates = [];
    this.markers[this.numberOfPolygons] = [];
    this.isPolygonClosed = false;
    this.map.addSource(SOURCE_POLYGON + this.numberOfPolygons, {
      type: 'geojson',
      data: geoPolygon(this.coordinates),
    });

    this.map.addSource(SOURCE_SYMBOL + this.numberOfPolygons, {
      type: 'geojson',
      data: geoPoint(this.coordinates, this.labels),
    });

    this.map.addLayer({
      id: LAYER_POLYGON + this.numberOfPolygons,
      type: 'fill',
      source: SOURCE_POLYGON + this.numberOfPolygons,
      paint: {
        'fill-color': this.mainColor,
        'fill-opacity': 0.3,
        'fill-outline-color': 'blue',
      },
    });

    this.map.addLayer({
      id: LAYER_SYMBOL + this.numberOfPolygons,
      type: 'symbol',
      source: SOURCE_SYMBOL + this.numberOfPolygons,
      layout: {
        'text-field': '{text}',
        'text-font': this.font,
        'text-anchor': 'top',
        'text-size': 12,
        'text-offset': [0, 0.8],
      },
      paint: {
        'text-color': this.textColor,
        'text-halo-color': this.secondaryColor,
        'text-halo-width': 1,
      },
    });
  }

  mapClickListener(event) {
    if (this.isPolygonClosed) {
      this.draw();
    } else {
      const markerNode = this.createMarkerNode();
      const marker = new mapboxgl.Marker({
        element: markerNode,
        draggable: false,
      })
        .setLngLat(event.lngLat)
        .addTo(this.map);

      this.coordinates.push([event.lngLat.lng, event.lngLat.lat]);
      this.labels = this.coordinatesToLabels();
      this.map.getSource(SOURCE_POLYGON + this.numberOfPolygons)
        .setData(geoPolygon([this.coordinates]));
      this.map
        .getSource(SOURCE_SYMBOL + this.numberOfPolygons)
        .setData(geoPoint(this.coordinates, this.labels));

      this.markers[this.numberOfPolygons].push(marker);

      this.markerNodes.push(markerNode);

      // Add event click for the first point marker
      markerNode.addEventListener('click', this.closePolygon.bind(this));

      // Close if we click on the last node.
      if (this.coordinates.length > 2) {
        this.markerNodes[this.coordinates.length - 2].removeEventListener('click', this.closePolygon.bind(this));
      }
    }
  }

  createMarkerNode() {
    const markerNode = document.createElement('div');
    markerNode.style.width = '7px';
    markerNode.style.height = '7px';
    markerNode.style.borderRadius = '50%';
    markerNode.style.background = this.secondaryColor;
    markerNode.style.boxSizing = 'border-box';
    markerNode.style.border = `2px solid ${this.textColor}`;
    return markerNode;
  }

  closePolygon() {
    const firstMarker = this.markers[this.numberOfPolygons][0];
    this.coordinates.push([firstMarker.getLngLat().lng, firstMarker.getLngLat().lat]);

    // Display the area
    const centroidPoly = centroid(polygon([this.coordinates]));
    const textArea = calculatePolygonSuperficy(polygon([this.coordinates]));
    centroidPoly.properties.area = textArea;

    this.map.addSource(SOURCE_AREA + this.numberOfPolygons, {
      type: 'geojson',
      data: centroidPoly,
    });

    this.map.addLayer({
      id: LAYER_AREA + this.numberOfPolygons,
      type: 'symbol',
      source: SOURCE_AREA + this.numberOfPolygons,
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
    });

    this.map.getSource(SOURCE_AREA + this.numberOfPolygons).setData(centroidPoly);

    this.isPolygonClosed = true;
    this.coordinates = [];
    this.markerNodes = [];
    this.labels = [];
  }

  mapMouseMoveListener(event) {
    // Draw polygon only if more than two points
    if (this.coordinates.length > 1) {
      const { lngLat } = event;
      const temporaryCoordinates = [...this.coordinates];
      temporaryCoordinates.push([lngLat.lng, lngLat.lat]);
      temporaryCoordinates.push(temporaryCoordinates[0]); // Close artifially the polygon to draw it
      this.map
        .getSource(SOURCE_POLYGON + this.numberOfPolygons)
        .setData(geoPolygon([temporaryCoordinates]));
    }
  }

  coordinatesToLabels() {
    const { coordinates, units, labelFormat } = this;
    let sum = 0;
    return coordinates.map((coordinate, index) => {
      if (index === 0) return 0;
      sum += distance(coordinates[index - 1], coordinates[index], { units });
      return labelFormat(sum);
    });
  }

  styleLoadListener() {
    this.draw();
  }

  onAdd(map) {
    this.map = map;
    this.insertControls();
    this.button.addEventListener('click', () => {
      if (this.isMeasuring) {
        this.measuringOff();
      } else {
        this.measuringOn();
      }
    });
    return this.container;
  }

  onRemove() {
    if (this.isMeasuring) {
      this.measuringOff();
    }
    this.map.off('click', this.mapClickListener);
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}
