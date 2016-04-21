'use strict';
angular.module("roscc").requires.push('highcharts-ng');

var ctrl = angular.module('roscc').controller("wheelAngleChart", function ($scope){
    //$("#speed_chart").text("FUCK");
      $scope.wheelAngleConfig = {
        options: {
            chart: {
                polar:true
            },
            pane: {
                startAngle: -90,
                endAngle: 90
            },
            xAxis: {
                tickInterval: 45,
                min: -90,
                max: 90,
                labels: {
                    formatter: function () {
                        return this.value + '°';
                    }
                }
            },
            yAxis: {
                min: 0
            },
            "legend": {
                enabled:false
            }
        }, //end options


        title: {
            text: 'Actual Steering Angle'
        },
        plotOptions: {
            series: {
                pointStart: 32,
                pointInterval: 0
            },
            column: {
                pointPadding: 0,
                groupPadding: 0
            }
        },

        series: [ {
            type: 'column',
            name: 'column',
            data: [1]
        }],
        useHighStock: true
    };

    // watch the message and update the chart whenever the value updates
    $scope.$watch("vm.message.actual_steering", function() {
        $scope.wheelAngleConfig.plotOptions['series'].data = [$scope.vm.message.actual_steering];
    });
});
console.log("Loaded controller: ", ctrl);