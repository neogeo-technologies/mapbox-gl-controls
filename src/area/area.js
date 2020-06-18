import mapboxgl from 'mapbox-gl';
import distance from '@turf/distance';
import area from '@turf/area';
import center from '@turf/center';
import centroid from '@turf/centroid';
import { polygon } from '@turf/helpers';
import iconArea from './area.svg';

const LAYER_POLYGON = 'controls-layer-polygon';
const LAYER_AREA = 'controls-layer-area';
const LAYER_SYMBOL = 'controls-layer-symbol';
const SOURCE_POLYGON = 'controls-source-polygon';
const SOURCE_AREA = 'controls-source-area';
const SOURCE_SYMBOL = 'controls-source-symbol';
const MAIN_COLOR = '#263238';
const HALO_COLOR = '#fff';

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

export default class AreaControl {
  constructor(options = {}) {
    this.isMeasuring = false;
    this.markers = [];
    this.coordinates = [];
    this.labels = [];
    this.units = options.units || 'kilometers';
    this.font = options.font || ['Roboto Medium'];
    this.labelFormat = options.labelFormat || defaultLabelFormat;
    this.mainColor = options.mainColor || MAIN_COLOR;
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
    // remove layers, sources and event listeners
    this.map.removeLayer(LAYER_POLYGON);
    this.map.removeLayer(LAYER_SYMBOL);
    this.map.removeSource(SOURCE_POLYGON);
    this.map.removeSource(SOURCE_SYMBOL);
    this.map.removeSource(SOURCE_AREA);
    this.map.removeSource(LAYER_AREA);
    this.markers.forEach((m) => m.remove());
    this.map.off('click', this.mapClickListener);
    this.map.off('mousemove', this.mapMouseMoveListener);
    this.map.off('style.load', this.styleLoadListener);
    this.map.fire('area.off');
  }

  draw() {
    this.map.addSource(SOURCE_POLYGON, {
      type: 'geojson',
      data: geoPolygon(this.coordinates),
    });

    this.map.addSource(SOURCE_SYMBOL, {
      type: 'geojson',
      data: geoPoint(this.coordinates, this.labels),
    });

    this.map.addLayer({
      id: LAYER_POLYGON,
      type: 'fill',
      source: SOURCE_POLYGON,
      paint: {
        'fill-color': this.mainColor,
        'fill-opacity': 0.5,
      },
    });

    this.map.addLayer({
      id: LAYER_SYMBOL,
      type: 'symbol',
      source: SOURCE_SYMBOL,
      layout: {
        'text-field': '{text}',
        'text-font': this.font,
        'text-anchor': 'top',
        'text-size': 12,
        'text-offset': [0, 0.8],
      },
      paint: {
        'text-color': this.mainColor,
        'text-halo-color': this.secondaryColor,
        'text-halo-width': 1,
      },
    });
  }

  mapClickListener(event) {
    const markerNode = document.createElement('div');
    markerNode.style.width = '12px';
    markerNode.style.height = '12px';
    markerNode.style.borderRadius = '50%';
    markerNode.style.background = this.secondaryColor;
    markerNode.style.boxSizing = 'border-box';
    markerNode.style.border = `2px solid ${this.mainColor}`;
    const marker = new mapboxgl.Marker({
      element: markerNode,
      draggable: true,
    })
      .setLngLat(event.lngLat)
      .addTo(this.map);
    this.coordinates.push([event.lngLat.lng, event.lngLat.lat]);
    this.labels = this.coordinatesToLabels();
    this.map.getSource(SOURCE_POLYGON).setData(geoPolygon([this.coordinates]));
    this.map
      .getSource(SOURCE_SYMBOL)
      .setData(geoPoint(this.coordinates, this.labels));
    this.markers.push(marker);

    marker.on('drag', () => {
      const index = this.markers.indexOf(marker);
      const lngLat = marker.getLngLat();
      this.coordinates[index] = [lngLat.lng, lngLat.lat];
      // If it is the first or last position, we need to have equivalent to keep the polygon valid.
      if (index === 0) {
        this.coordinates[this.coordinates.length - 1] = [
          lngLat.lng,
          lngLat.lat,
        ];
      } else if (index === this.coordinates.length - 1) {
        this.coordinates[0] = [lngLat.lng, lngLat.lat];
      }

      this.labels = this.coordinatesToLabels();
      this.map
        .getSource(SOURCE_POLYGON)
        .setData(geoPolygon([this.coordinates]));
      this.map
        .getSource(SOURCE_SYMBOL)
        .setData(geoPoint(this.coordinates, this.labels));

      // Update the area layer
      const centroidPoly = center(polygon([this.coordinates]));
      const textArea = calculatePolygonSuperficy(polygon([this.coordinates]));
      centroidPoly.properties.area = textArea;
      this.map.getSource(SOURCE_AREA).setData(centroidPoly);
    });

    marker.on('dragend', () => {
      console.log(this.coordinates);
    });

    // Add event click for the first point marker
    if (this.coordinates.length === 1) {
      markerNode.addEventListener('click', () => {
        this.coordinates.push([event.lngLat.lng, event.lngLat.lat]);

        this.map.off('click', this.mapClickListener);
        this.map.off('mousemove', this.mapMouseMoveListener);
        this.map.getCanvas().style.cursor = '';

        // Display the area

        const centroidPoly = center(polygon([this.coordinates]));
        const textArea = calculatePolygonSuperficy(polygon([this.coordinates]));
        centroidPoly.properties.area = textArea;

        this.map.addSource(SOURCE_AREA, {
          type: 'geojson',
          data: centroidPoly,
        });

        this.map.addLayer({
          id: LAYER_AREA,
          type: 'symbol',
          source: SOURCE_AREA,
          layout: {
            'text-field': '{area}',
            'text-font': this.font,
            'text-anchor': 'center',
            'text-size': 12,
          },
          paint: {
            'text-color': this.mainColor,
            'text-halo-color': this.secondaryColor,
            'text-halo-width': 1,
          },
        });
      });
    }
  }

  mapMouseMoveListener(event) {
    // Draw polygon only if more than two points

    if (this.coordinates.length > 1) {
      const { lngLat } = event;
      const temporaryCoordinates = [...this.coordinates];
      temporaryCoordinates.push([lngLat.lng, lngLat.lat]);
      this.map
        .getSource(SOURCE_POLYGON)
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
