import { point } from '@turf/helpers';
import circle from '@turf/circle';
import distance from '@turf/distance';
import transformTranslate from '@turf/transform-translate';
import iconRuler from './icon-circle.svg';

const LAYER_CIRCLE = 'controls-layer-circle';
const LAYER_AREA = 'controls-layer-area';
const LAYER_RADIUS = 'controls-layer-radius';
const SOURCE_CIRCLE = 'controls-source-circle';
const SOURCE_AREA = 'controls-source-area';
const SOURCE_RADIUS = 'controls-source-radius';
const MAIN_COLOR = 'orange';
const HALO_COLOR = '#fff';
const TEXT_COLOR = '#263238';

function geoPolygon(coordinates = []) {
  console.log(coordinates)
  return {
    type: 'Feature',
    properties: {
      isCircle: true,
      center: [],
    },
    geometry: {
      type: 'Polygon',
      coordinates,
    },
  };
}

function geoPoint(coordinates = [], labels = []) {
  console.log(coordinates)
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

function calculateCircleArea(radius) {
  const radiusInMeters = radius * 1000;
  const area = Math.round(2 * Math.PI * radiusInMeters * radiusInMeters);
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

export default class CircleControl {
  constructor(options = {}) {
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

  indexOfCircles() {
    return this.circles.length - 1;
  }

  insertControls() {
    this.container = document.createElement('div');
    this.container.classList.add('mapboxgl-ctrl');
    this.container.classList.add('mapboxgl-ctrl-group');
    this.container.classList.add('mapboxgl-ctrl-circle');
    this.button = document.createElement('button');
    this.button.setAttribute('type', 'button');
    this.button.appendChild(iconRuler());
    this.container.appendChild(this.button);
  }

  measuringOn() {
    this.isMeasuring = true;
    this.map.getCanvas().style.cursor = 'crosshair';
    this.button.classList.add('-active');
    this.map.on('mousedown', this.mapMouseDownListener);
    this.map.on('style.load', this.styleLoadListener);
    this.map.fire('circle.on');
  }

  measuringOff() {
    this.isMeasuring = false;
    this.map.getCanvas().style.cursor = '';
    this.button.classList.remove('-active');

    // Remove layers, sources and event listeners for each circle
    for (let i = 0; i <= this.indexOfCircles(); i += 1) {
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
  }

  // Create the sources and layers for a circle
  addSourcesAndLayers(circleNumber) {
    // The circle itself
    console.log(geoPolygon())
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
    });

    // The area of the circle in the middle
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
    });

    // The radius of the circle at the top
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
  }

  // When a new style is loaded (e.g. Satellite), we need to draw again all the layers
  drawAllLayers() {
    for (let i = 0; i <= this.indexOfCircles(); i += 1) {
      this.addSourcesAndLayers(i);

      // #Fix. This is tricky, and maybe there is a simpler way, but the style.load event
      // is not enough for this case. Events in Mapbox are a bit messy, and we need to listen
      // also this styledata (when any style changes) to re-draw our layers, otherwise they
      // will be under the new Tiles loaded.
      this.map.on('styledata', () => {
        if (this.map.getSource(SOURCE_CIRCLE + i)) {
          const currentCircle = this.circles[i];
          const circleFeature = circle(currentCircle.center, currentCircle.radius);
          this.map.getSource(SOURCE_CIRCLE + i).setData(circleFeature);

          this.map.getSource(SOURCE_AREA + i)
            .setData(point(currentCircle.center,
              { area: calculateCircleArea(currentCircle.radius) }));

          // Display the radius at the top of the circle
          const distanceInMeters = Math.round(currentCircle.radius * 1000);
          const pointCenter = point(currentCircle.center, { radius: `${distanceInMeters} m` });
          const topCircle = transformTranslate(pointCenter, currentCircle.radius, 0);
          this.map.getSource(SOURCE_RADIUS + i).setData(topCircle);

          // When our layers, we can unsubscribe for this event.
          this.map.off('styledata');
        }
      });
    }
  }

  // When the moiuse is down, we start listening the drag to draw the circle
  mapMouseDownListener(event) {
    console.log(event)
    this.initCircle();
    this.addSourcesAndLayers(this.indexOfCircles());

    this.map.dragPan.disable();

    this.circles[this.indexOfCircles()].center = [event.lngLat.lng, event.lngLat.lat];
    this.map.on('mousemove', this.mapDragListener);

    this.map.on('mouseup', () => {
      this.map.off('mousemove', this.mapDragListener);
      this.map.dragPan.enable();
    });
  }

  // When there is drag: update the circle, the radius and the area.
  mapDragListener(event) {
    const { center } = this.circles[this.indexOfCircles()];
    if (center.length > 0) {
      const distanceInKilometers = distance(
        point(center),
        point([event.lngLat.lng, event.lngLat.lat]),
        { units: 'kilometers' },
      );
      const circleFeature = circle(center, distanceInKilometers);
      this.map.getSource(SOURCE_CIRCLE + this.indexOfCircles()).setData(circleFeature);
      this.circles[this.indexOfCircles()].radius = distanceInKilometers;

      this.map.getSource(SOURCE_AREA + this.indexOfCircles())
        .setData(point(center, { area: calculateCircleArea(distanceInKilometers) }));

      // Display the radius at the top of the circle
      const distanceInMeters = Math.round(distanceInKilometers * 1000);
      const pointCenter = point(center, { radius: `${distanceInMeters} m` });
      const topCircle = transformTranslate(pointCenter, distanceInKilometers, 0);
      this.map.getSource(SOURCE_RADIUS + this.indexOfCircles()).setData(topCircle);
    }
  }

  // Create a new circle
  initCircle() {
    this.circles.push({});
    this.circles[this.indexOfCircles()] = {};
    this.circles[this.indexOfCircles()].center = [];
    this.circles[this.indexOfCircles()].radius = 0;
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
    this.map.off('mousedown', this.mapMouseDownListener);
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}
