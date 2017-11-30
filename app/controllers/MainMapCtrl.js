app.controller('MainMapCtrl', [
    '$scope',
    '$websocket',
    '$filter',
    '$timeout',
    '$interval',
    'leafletData',
    function($scope, $websocket, $filter, $timeout, $interval, leafletData) {
        angular.extend($scope, {
            center: {
                lat: 31,
                lng: 85,
                zoom: 4
            },
            position: {
                lat: 51,
                lng: 0
            },
            layers: {
                baselayers: {
                    xyz: {
                        name: 'Cloudmade Tourist',
                        url: 'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png',
                        layerParams: {
                            key: '007b9471b4c74da4a6ec7ff43552b16f',
                            styleId: 7
                        },
                        type: 'xyz'
                    }
                },
                overlays: {
                    markersOverlay: {
                        name: 'Markers',
                        type: 'group',
                        visible: true
                    }
                }
            }
        });

        $scope.collection = [];
        $scope.settings = {
            pagination: {
                currentPage: 0,
                pageSize: 10
            },
            search: ''
        };

        $scope.isNextPageAvailable = function () {
            return $scope.settings.pagination.currentPage >= $scope.getDataLength() / $scope.settings.pagination.pageSize - 1;
        };

        $scope.numberOfPages = function(){
            return Math.ceil($scope.getDataLength() / $scope.settings.pagination.pageSize);
        };

        $scope.getDataLength = function () {
            return $filter('filter')($scope.collection, { mac: $scope.settings.search }).length;
        };

        $scope.moveMap = function (marker) {
            $scope.center = {
                lat: marker.location.lat,
                lng: marker.location.lon,
                zoom: 14
            };
        };

        var leafletView = new PruneClusterForLeaflet(60);
        var markers = {};
        var ws = $websocket('ws://localhost:8091/');

        function getPopup(marker) {
            var popup;

            popup = 'MAC: ' + marker.mac + '<br/>' +
                '-----------------------------' + '<br/>' +
                'LAT: ' + marker.location.lat + '<br/>' +
                'LON: ' + marker.location.lon + '<br/>' +
                '-----------------------------' + '<br/>' +
                'STATUS: ' + (marker.status && marker.status.isOnline ? 'ONLINE' : 'OFFLINE')
            ;

            return popup;
        }

        function prepareMessage(data) {
            var packageData = JSON.parse(data);
            // var markersPack = [];

            for (var i = 0; i < packageData.data.length; i++) {
                var tag = packageData.data[i];

                if (markers.hasOwnProperty(tag.mac)) {
                    tag = angular.extend({}, markers[tag.mac], tag);

                    if (packageData.name === 'location') {
                        tag.marker.Move(tag.location.lat, tag.location.lon);
                    }
                } else {
                    if (packageData.name === 'location') {
                        tag.marker = new PruneCluster.Marker(tag.location.lat, tag.location.lon);

                        // markersPack.push(tag.marker);
                        leafletView.RegisterMarker(tag.marker);
                    }
                }

                tag.marker.data.info = tag;
                markers[tag.mac] = tag;
            }

            // if (markersPack.length) {
            //     leafletView.RegisterMarkers(markersPack);
            // }
        }

        function startTracking(){
            leafletData.getMap().then(function(map) {
                map.addLayer(leafletView);

                leafletView.PrepareLeafletMarker = function(leafletMarker, data) {
                    var promise;

                    leafletMarker.on('popupopen', function (popup) {
                        promise = $interval(function () {
                            leafletMarker._popup._content = getPopup(data.info);
                            leafletMarker._popup.update();
                        }, 200);
                    });

                    leafletMarker.on('popupclose', function (popup) {
                        $interval.cancel(promise);
                    });

                    if (!leafletMarker.getPopup()) {
                        leafletMarker.bindPopup(getPopup(data.info));
                    }
                };

                ws.send(JSON.stringify({ name: 'start' }));

                ws.onMessage(function(message) {
                    $timeout(prepareMessage(message.data), 0);
                });

                $interval(function() {
                    leafletView.ProcessView();
                    $scope.collection = Object.values(markers);
                }, 500);
            });
        }
        startTracking();
    }
]);

app.filter('startFrom', function() {
    return function(input, start) {
        start = +start;

        return input.slice(start);
    }
});