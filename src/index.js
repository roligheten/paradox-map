import {GeoJSON} from 'leaflet/src/layer/GeoJSON';
import BigPolygonLabel from './BigPolygonLabel'
import {Polyline} from 'leaflet/src/layer/vector/Polyline'

fetch(
    'iceland.50b46662.geojson',//'/testsm.2ce4d34f.geojson'
    {
        mode: 'cors'
    }
)
.then(
    function(response) {
        // Examine the text in the response
        response.json().then(function(data) {
            var map = L.map('mapid').setView([56,80], 4);

            const geoJsonLayer = L.geoJSON(data, {
                onEachFeature: function(geojson, layer) {
                    const [a,b] = BigPolygonLabel(layer)
                    console.log(layer.feature.properties, a)
                    if (a) {
                        const p = L.polyline(a, {color: 'red'})
                        p.addTo(map)
                    }
                    if (b) {
                        const p = L.polyline(b, {color: 'blue'})
                        p.addTo(map)
                    }


                },
                style: function (feature) {
                    return {
                        color: '#616161',
                        weight: 1,
                    };
                }
            })

            geoJsonLayer.addTo(map);
        });
    }
)
.catch(function(err) {
    console.log('Fetch Error :-S', err);
});