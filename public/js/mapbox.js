/* eslint-disable */
// console.log('hello from mapbox');

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibXNhZnlhbjA4MCIsImEiOiJjazg0YzE0aGoxa3I0M2xsbm44aHdmMnpzIn0.ZFV2z77B9WcmHx3tqtT_-g';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/msafyan080/ck8k0crtb0s801ioczllbxcok'
    // center: [74.308801, 31.42813],
    // scrollZoom:false,
    // zoom: 8
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    const ele = document.createElement('div');
    ele.className = 'marker';

    new mapboxgl.Marker({
      element: ele,
      anchor: 'bottom'
    })
      .setLonLat(loc.coordinates)
      .addTo(map);
    //Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    paddings: {
      top: 200,
      bottom: 50,
      left: 200,
      right: 200
    }
  });
};
