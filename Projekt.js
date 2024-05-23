require([
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Search",
  "esri/widgets/BasemapToggle",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/geometry/Point",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/geometry/Polyline",
  "dojo/domReady!"
], function(
  Map, MapView, Search, BasemapToggle, Graphic, GraphicsLayer, Point, SimpleMarkerSymbol, SimpleLineSymbol, Polyline
) {
  var myMap = new Map({
    basemap: "topo-vector"
  });

  var view = new MapView({
    container: "mapDiv",
    map: myMap,
    center: [18.7226, 60.1282],
    zoom: 13
  });

  var canoeingTrailsLayer = new GraphicsLayer();
  var cyclingTrailsLayer = new GraphicsLayer();
  var hikingTrailsLayer = new GraphicsLayer();
  var poiLayer = new GraphicsLayer();
  var userPOILayer = new GraphicsLayer();
  var filteredPOILayer = new GraphicsLayer();

  myMap.addMany([canoeingTrailsLayer, cyclingTrailsLayer, hikingTrailsLayer, poiLayer, userPOILayer, filteredPOILayer]);

  var searchWidget = new Search({
    view: view
  });
  view.ui.add(searchWidget, {
    position: "top-left",
    index: 0
  });

  var basemapToggle = new BasemapToggle({
    view: view,
    nextBasemap: "satellite"
  });
  view.ui.add(basemapToggle, "bottom-right");

  var poiIconUrls = {
    info: "data.bilder/info_icon.png",
    food: "data.bilder/food_icon.png",
    rest: "data.bilder/rest_icon.png"
  };

  function addPOIMarker(point, type, title, description, imageUrl, layer) {
    var iconUrl = poiIconUrls[type] || "default_icon.png";
    var symbol = new SimpleMarkerSymbol({
      url: iconUrl,
      width: "32px",
      height: "32px"
    });
    var graphic = new Graphic({
      geometry: point,
      symbol: symbol,
      attributes: {
        type: type,
        title: title,
        description: description,
        imageUrl: imageUrl
      }
    });
    layer.add(graphic);

    graphic.popupTemplate = {
      title: "{title}",
      content: [
        {
          type: "text",
          text: "{description}"
        },
        {
          type: "media",
          mediaInfos: [
            {
              type: "image",
              value: {
                sourceURL: "{imageUrl}"
              }
            }
          ]
        }
      ]
    };
  }

  function processPOIData(poiData) {
    poiData.forEach(poi => {
      var point = new Point({
        longitude: poi.longitude,
        latitude: poi.latitude
      });
      addPOIMarker(point, poi.type, poi.title, poi.description, poi.imageUrl, poiLayer);
    });
  }

  function processTrailsData(trailsData) {
    trailsData.canoeing.forEach(trail => {
      addTrail(trail, canoeingTrailSymbol, canoeingTrailsLayer);
    });
    trailsData.cycling.forEach(trail => {
      addTrail(trail, cyclingTrailSymbol, cyclingTrailsLayer);
    });
    trailsData.hiking.forEach(trail => {
      addTrail(trail, hikingTrailSymbol, hikingTrailsLayer);
    });
  }

  var canoeingTrailSymbol = new SimpleLineSymbol({
    color: [0, 0, 255],
    width: 2
  });

  var cyclingTrailSymbol = new SimpleLineSymbol({
    color: [0, 255, 0],
    width: 2
  });

  var hikingTrailSymbol = new SimpleLineSymbol({
    color: [255, 0, 0],
    width: 2
  });

  function addTrail(trailData, symbol, layer) {
    var polyline = new Polyline({
      paths: trailData.geometry.paths
    });
    var trail = new Graphic({
      geometry: polyline,
      symbol: symbol,
      attributes: trailData.attributes
    });
    layer.add(trail);
  }

  function filterPOIByDistance() {
    var distance = parseInt(document.getElementById("distanceFilter").value);
    var query = {
      geometry: view.extent,
      distance: distance,
      units: "meters",
      spatialRelationship: "intersects"
    };

    filteredPOILayer.removeAll();

    [canoeingTrailsLayer, cyclingTrailsLayer, hikingTrailsLayer].forEach(trailLayer => {
      trailLayer.queryFeatures(query).then(response => {
        response.features.forEach(feature => {
          var poiPoint = feature.geometry;
          var poiType = feature.attributes.type;
          var poiTitle = feature.attributes.title;
          var poiDescription = feature.attributes.description;
          var imageUrl = feature.attributes.imageUrl;
          addPOIMarker(poiPoint, poiType, poiTitle, poiDescription, imageUrl, filteredPOILayer);
        });
      });
    });
  }

  view.on("click", function(event) {
    var point = new Point({
      longitude: event.mapPoint.longitude,
      latitude: event.mapPoint.latitude
    });
    var title = prompt("Titel för POI:");
    var description = prompt("Beskrivning för POI:");
    var imageUrl = prompt("Bild-URL för POI:");
    var type = prompt("Typ för POI (info, food, rest):");
    addPOIMarker(point, type, title, description, imageUrl, userPOILayer);
  });

  document.getElementById("addCategoryButton").addEventListener("click", function() {
    var categoryName = document.getElementById("categoryName").value;
    alert("Ny kategori: " + categoryName + " tillagd!");
  });

  document.getElementById("filterPOIButton").addEventListener("click", function() {
    filterPOIByDistance();
  });

  var poiData = [
    {
      longitude: 18.7226,
      latitude: 60.1282,
      type: "info",
      title: "Informationspunkt",
      description: "Här finns viktig information.",
      imageUrl: "data.bilder/info_icon.png"
    },
    {
      longitude: 18.7326,
      latitude: 60.1382,
      type: "food",
      title: "Matställe",
      description: "Här kan du äta mat.",
      imageUrl: "data.bilder/food_icon.png"
    }
  ];

  var trailsData = {
    canoeing: [
      {
        geometry: {
          type: "polyline",
          paths: [
            [18.7226, 60.1282],
            [18.7326, 60.1382]
          ]
        },
        attributes: {
          name: "Kanotled 1"
        }
      }
    ],
    cycling: [
      {
        geometry: {
          type: "polyline",
          paths: [
            [18.7426, 60.1482],
            [18.7526, 60.1582]
          ]
        },
        attributes: {
          name: "Cykelled 1"
        }
      }
    ],
    hiking: [
      {
        geometry: {
          type: "polyline",
          paths: [
            [18.7626, 60.1682],
            [18.7726, 60.1782]
          ]
        },
        attributes: {
          name: "Vandringsled 1"
        }
      }
    ]
  };

  processPOIData(poiData);
  processTrailsData(trailsData);
});
