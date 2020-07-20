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

  indexOfPolygons() {
    return this.polygons.length - 1;
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
    this.map.getCanvas().style.cursor = 'crosshair';
    this.button.classList.add('-active');
    this.initPolygon();
    this.addSourcesAndLayers(this.indexOfPolygons());
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
    for (let i = 0; i <= this.indexOfPolygons(); i += 1) {
      this.map.removeLayer(LAYER_POLYGON + i);
      this.map.removeLayer(LAYER_SYMBOL + i);
      this.map.removeSource(SOURCE_POLYGON + i);
      this.map.removeSource(SOURCE_SYMBOL + i);
      if (this.map.getSource(SOURCE_AREA + i)) {
        this.map.removeLayer(LAYER_AREA + i);
        this.map.removeSource(SOURCE_AREA + i);
      }
      this.polygons[i].markers.forEach((m) => m.remove());
    }
    this.polygons = [];
    this.isPolygonClosed = true;
    this.map.off('click', this.mapClickListener);
    this.map.off('mousemove', this.mapMouseMoveListener);
    this.map.off('style.load', this.styleLoadListener);
    this.map.fire('area.off');
  }

  // Create a new polygon
  initPolygon() {
    this.polygons.push({});
    this.polygons[this.indexOfPolygons()] = {};
    this.polygons[this.indexOfPolygons()].coordinates = [];
    this.polygons[this.indexOfPolygons()].markers = [];
    this.polygons[this.indexOfPolygons()].markerNodes = [];
    this.isPolygonClosed = false;
  }

  // When a new style is loaded (e.g. Satellite), we need to draw again all the layers
  drawAllLayers() {
    for (let i = 0; i <= this.indexOfPolygons(); i += 1) {
      this.addSourcesAndLayers(i);

      // #Fix. This is tricky, and maybe there is a simpler way, but the style.load event is not enough for this case.
      // Events in Mapbox are a bit messy, and we need to listen also this styledata (when any style changes)
      // to re-draw our layers, otherwise they will be under the new Tiles loaded.
      this.map.on('styledata', () => {
        if (this.map.getSource(SOURCE_POLYGON + i)) {
          this.map.getSource(SOURCE_POLYGON + i)
            .setData(geoPolygon([this.polygons[i].coordinates]));
          this.map
            .getSource(SOURCE_SYMBOL + i)
            .setData(geoPoint(this.polygons[i].coordinates,
              this.polygons[i].labels));

          if (this.polygons[i].coordinates.length > 3) {
            const centroidPoly = centroid(polygon([this.polygons[i].coordinates]));
            const textArea = calculatePolygonSuperficy(polygon([this.polygons[i].coordinates]));
            centroidPoly.properties.area = textArea;
            this.map.getSource(SOURCE_AREA + i).setData(centroidPoly);
          }
          // When our layers, we can unsubscribe for this event.
          this.map.off('styledata');
        }
      });
    }
  }

  // Create the sources and layers for a polygon
  addSourcesAndLayers(polygonNumber) {
    // The polygon itself
    this.map.addSource(SOURCE_POLYGON + polygonNumber, {
      type: 'geojson',
      data: geoPolygon(this.polygons[polygonNumber].coordinates),
    });

    this.map.addLayer({
      id: LAYER_POLYGON + polygonNumber,
      type: 'fill',
      source: SOURCE_POLYGON + polygonNumber,
      paint: {
        'fill-color': this.mainColor,
        'fill-opacity': 0.3,
        'fill-outline-color': 'blue',
      },
    });

    // The distance points and symbols
    this.map.addSource(SOURCE_SYMBOL + polygonNumber, {
      type: 'geojson',
      data: geoPoint(this.polygons[polygonNumber].coordinates,
        this.polygons[polygonNumber].labels),
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
        'text-offset': [0, 0.8],
      },
      paint: {
        'text-color': this.textColor,
        'text-halo-color': this.secondaryColor,
        'text-halo-width': 1,
      },
    });

    // The area of the polygon
    this.map.addSource(SOURCE_AREA + polygonNumber, {
      type: 'geojson',
      data: geoPoint(),
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
        'text-justify': 'auto',
      },
      paint: {
        'text-color': this.textColor,
        'text-halo-color': this.secondaryColor,
        'text-halo-width': 1,
      },
    });
  }

  // On a click on the map:
  // * create a marker
  // * update the polygon and symbols (distance) sources
  // * calculate and display the area
  mapClickListener(event) {
    console.log(event)
    if (this.isPolygonClosed) {
      this.initPolygon();
      this.addSourcesAndLayers(this.indexOfPolygons());
    } else {
      const markerNode = this.createMarkerNode();
      const marker = new mapboxgl.Marker({
        element: markerNode,
        draggable: false,
      })
        .setLngLat(event.lngLat)
        .addTo(this.map);

      // Update the polygon and symbol sources with the new data
      this.polygons[this.indexOfPolygons()].coordinates.push([event.lngLat.lng, event.lngLat.lat]);
      this.polygons[this.indexOfPolygons()].labels = this.coordinatesToLabels(this.indexOfPolygons());
      this.map.getSource(SOURCE_POLYGON + this.indexOfPolygons())
        .setData(geoPolygon([this.polygons[this.indexOfPolygons()].coordinates]));
      this.map
        .getSource(SOURCE_SYMBOL + this.indexOfPolygons())
        .setData(geoPoint(this.polygons[this.indexOfPolygons()].coordinates,
          this.polygons[this.indexOfPolygons()].labels));

      this.polygons[this.indexOfPolygons()].markers.push(marker);
      this.polygons[this.indexOfPolygons()].markerNodes.push(markerNode);

      // Calculate and display the area
      if (this.polygons[this.indexOfPolygons()].coordinates.length > 2) {
        const temporaryCoordinates = [...this.polygons[this.indexOfPolygons()].coordinates];
        temporaryCoordinates.push(temporaryCoordinates[0]); // Close artifially the polygon to draw it
        const centroidPoly = centroid(polygon([temporaryCoordinates]));
        const textArea = calculatePolygonSuperficy(polygon([temporaryCoordinates]));
        centroidPoly.properties.area = textArea;
        this.map.getSource(SOURCE_AREA + this.indexOfPolygons()).setData(centroidPoly);
      }

      // This event is used to know when to close the polygon. two points allow that:
      // * the first point
      // * the last point
      markerNode.addEventListener('click', this.closePolygon.bind(this));

      // So to keep the logic above working, after each new point we unsubscribe the click event on previous marker,
      // to keep active only the first and last markers.
      if (this.polygons[this.indexOfPolygons()].coordinates.length > 2) {
        this.polygons[this.indexOfPolygons()].markerNodes[this.polygons[this.indexOfPolygons()].coordinates.length - 2]
          .removeEventListener('click', this.closePolygon.bind(this));
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
    const firstMarker = this.polygons[this.indexOfPolygons()].markers[0];
    this.polygons[this.indexOfPolygons()].coordinates.push(
      [firstMarker.getLngLat().lng, firstMarker.getLngLat().lat],
    );

    this.isPolygonClosed = true;
  }

  // On mouse move, we update the polygon drawing
  mapMouseMoveListener(event) {
    if (this.polygons[this.indexOfPolygons()].coordinates.length > 1) {
      const { lngLat } = event;
      const temporaryCoordinates = [...this.polygons[this.indexOfPolygons()].coordinates];
      temporaryCoordinates.push([lngLat.lng, lngLat.lat]);
      temporaryCoordinates.push(temporaryCoordinates[0]); // Close artifially the polygon to draw it
      this.map
        .getSource(SOURCE_POLYGON + this.indexOfPolygons())
        .setData(geoPolygon([temporaryCoordinates]));
    }
  }

  coordinatesToLabels(numberOfPolygons) {
    const { coordinates } = this.polygons[numberOfPolygons];
    const { units } = this;
    let sum = 0;
    return coordinates.map((coordinate, index) => {
      if (index === 0) return 0;
      sum += distance(coordinates[index - 1], coordinates[index], { units });
      return this.labelFormat(sum);
    });
  }

  styleLoadListener() {
    this.drawAllLayers();
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
