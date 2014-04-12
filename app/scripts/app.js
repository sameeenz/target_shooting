'use strict';

angular.module('TargetShootingApp', [
  'ngCookies', 'ngResource', 'ngSanitize', 'ngRoute'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })


    .factory("shotDataProvider", function($log, $q){
        $log.info("Data service ready");
        var observerCallbacks = [];
        var shotData = [];


        var notifyObservers = function(){
            angular.forEach(observerCallbacks, function(cb){cb();});
        };

        return {

            add: function(data){
                $log.info("Got new data!");
                $log.info(data);

                var filename = data.name;
                $log.info("filename: " + filename);

                var lines = data.text.split('\n');
                var processedData = [];
                lines.forEach(function(line){
                    var line = line.split(';');

                    if(line.length > 7) {
                        // #    date?         time?      ?    ?      ?    ?      x?         y?         ?      ?     ?
                        //["1", "07.04.2024", "22.16", "11", "*.7", "10", "7", "-1.975", "-0.012", "2093154", "0", "0"]
                        processedData.push({
                            id: parseInt(line[0]),
                            x: parseFloat(line[7]),
                            y: parseFloat(line[8]),
                            raw: line

                        });
                    }
                });

                shotData.push({text: data, data: processedData, filename: filename});

                notifyObservers();

            },
            data: shotData,
            registerObserver: function(callback){
                observerCallbacks.push(callback);
            }
        }

    })
    .directive('shotplot', function($log, $window){
        return {
            restrict: "E",
            template: "<div></div>",
            replace: true,
            scope: {
                // attributes
                size: "=",
                color: "=",
                data: "="

            },

            link: function(scope, iElement, iAttrs, controller) {
                // Browser onresize event
                window.onresize = function() {
                    scope.$apply();
                };

                var size = iAttrs.size;

                var color = iAttrs.color;

                // Get the div width
                var width = d3.select(iElement[0]).node().offsetWidth;

                var g = d3.select(iElement[0])
                    .append("svg")
                    .attr("width", '100%')
                    .attr("height", width);

                var scale = d3.scale.linear()
                    .domain([-20, 20])
                    .range([0, width]);

                var lscale = d3.scale.linear()
                    .domain([0, 20])
                    .range([0, width]);

                scope.render = function(data){
                    // if 'val' is undefined, exit
                    if (!data) {
                        return;
                    }

                    $log.info("Making a plot!");
                    $log.debug(data);

                    // Draw the target circles first
                    g.selectAll('circle.target')
                        .data([5, 10, 20])
                        .enter()
                        .append('circle')
                        .attr('class', 'target')
                        .attr('r', function(d){return lscale(d/2)})
                        .attr('cx', scale(0))
                        .attr('cy', scale(0))
                        .attr('fill', 'whitesmoke' )
                        .style("fill-opacity", 0.2)
                        .attr('stroke', 'red');


                    var updateGraph = function(data, oldData){
                        $log.info("updating plot...");
                        $log.info(data);

                        g.selectAll("circle.shot")
                            .data(data)
                            .enter()
                            .append("circle")
                            .attr('class', 'shot')
                            .attr('fill', color)
                            .attr("r", size)
                            .attr('cx', function(d){return scale(d.x)})
                            .attr('cy', function(d){return scale(d.y)});

                    };

                    updateGraph(data);
                };


                scope.$watch('data', scope.render);
                // Watch for resize event
                scope.$watch(function() {
                    return angular.element($window)[0].innerWidth;
                }, function() {
                    scope.render(scope.data);
                });

            }
        };
    })
.directive('droppable', function($compile, $rootScope, $log, shotDataProvider){
        return {
            restrict: "A",
            link: function(scope, element, attrs){

                element.context.ondragover = function(event){
                    element.addClass("indicate-drop");
                    return false;
                };

                element.context.ondragleave = function(event){
                    element.removeClass("indicate-drop");
                };

                element.context.ondrop = function(event){
                    $log.info("Something has been dropped!");

                    var files = event.dataTransfer.files;

                    $log.info("Files received:");
                    $log.info(files);

                    for(var i=0; i<files.length; i++){
                        var f = files[i];

                        var reader = new FileReader();
                        reader.onload = (function(f){return function(e){
                            $log.info("File loaded");
                            $log.info(f.name);
                            $log.info(e);

                            // e.target.result now has the image as a data uri
                            $log.info("Now we try share...");
                            shotDataProvider.add({name: f.name, text: e.target.result});


                        };})(f);
                        reader.readAsText(f);
                    }


                    element.removeClass("indicate-drop");
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                };
            }
        };
    });
