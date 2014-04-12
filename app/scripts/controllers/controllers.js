'use strict';

angular.module('TargetShootingApp')
  .controller('MainCtrl', function ($scope, $rootScope, $sce, $log, shotDataProvider) {

        $scope.processing = false;

        // An array of {?, filename: <str>}
        $scope.shoots = shotDataProvider.data;

        $scope.download = {show: false};

        function update(){
            $log.info("Updating display with new data...");
            $log.info(shotDataProvider.data);
            $scope.$apply(function(){
                $scope.shoots = shotDataProvider.data;
            });

        }
        shotDataProvider.registerObserver(update);

        $scope.processShotData = function(){
            $log.info("Ok processing all the data now...");
            $scope.processing = true;

            $scope.shots.forEach(function(shoot){
                $log.info("Processing: " + shoot.filename);


            });



            $scope.download.show = true;
        };
  });
