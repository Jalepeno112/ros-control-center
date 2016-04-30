'use strict';
angular.module("roscc").requires.push('highcharts-ng');

var ctrl = angular.module('roscc').controller("speedChartController", function ($scope, $timeout, $parse){
    console.log("Scope: ", $scope);
      $scope.speedChartConfig = {
        options: {
            chart: {
                type: 'gauge',
            },
            // the value axis
            yAxis: {
                min: 0,
                max: 10,
                
                minorTickInterval: 'auto',
                minorTickWidth: 1,
                minorTickLength: 10,
                minorTickPosition: 'inside',
                minorTickColor: '#666',
        
                tickPixelInterval: 30,
                tickWidth: 2,
                tickPosition: 'inside',
                tickLength: 10,
                tickColor: '#666',
                labels: {
                    step: 2,
                    rotation: 'auto'
                },
                title: {
                    text: 'm/s'
                },
                plotBands: [{
                    from: 0,
                    to: 5,
                    color: '#55BF3B' // green
                }, {
                    from: 5,
                    to: 7,
                    color: '#DDDF0D' // yellow
                }, {
                    from: 7,
                    to: 10,
                    color: '#DF5353' // red
                }]        
            },
            pane: {
                startAngle: -150,
                endAngle: 150,
                background: [{
                    backgroundColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, '#FFF'],
                            [1, '#333']
                        ]
                    },
                    borderWidth: 0,
                    outerRadius: '109%'
                }, {
                    backgroundColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, '#333'],
                            [1, '#FFF']
                        ]
                    },
                    borderWidth: 1,
                    outerRadius: '107%'
                }, {
                    // default background
                }, {
                    backgroundColor: '#DDD',
                    borderWidth: 0,
                    outerRadius: '105%',
                    innerRadius: '103%'
                }]
            },
        },//end options
        title: {
            text: "Speed (m/s)"
        },
        series: [{
            name: 'speed',
            data: [0],
            tooltip: {
                valueSuffix: ' m/s',
            },
            dataLabels: {
                format: "{y:.1f}"
            }
        }],
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                }
            },
            dataLabels: {
                format: "{y:.2f}"
            }
        },
        func: function(chart) {
            $timeout(function() {
                chart.reflow();
            }, 10);
        },    
        useHighStock: true,

    };

    $scope.init = function(topic_name, chart_height) {
        $scope.topicName = topic_name;
        if (chart_height != undefined) {
            $scope.speedChartConfig.options.chart.height = chart_height;
        }
    }

    if ($scope.chart_height){
        $scope.speedChartConfig.options.chart.height = $scope.chart_height;
    }

    function deref(obj, s) {
      var i = 0;
      if (!s) {
        return undefined;
      }
      s = s.split('.');
      while (i < s.length) {
            obj = obj[s[i]];
            if (obj === undefined)
                return obj;
            i = i + 1;
        }
    return obj;
    }
    function getTopicName() {
        return $scope.topicName;
    }

    // watch the message and update the chart whenever the value updates
    var topicName = $scope.topicName;
    $scope.$watch(function($scope) {
        var val = deref($scope, $scope.topicName);
        return val;
    },function(val){
        if(val){
            $scope.speedChartConfig.series[0].data[0] = Math.abs(val);
        }
    }, false);
    /*var _scope = $scope;
    $scope.$watch(model, function(newValue, oldValue){
        console.log(newValue, oldValue, model);
        if (newValue){
            console.log('Updating value!')
            _scope.speedChartConfig.series[0].data[0] = Math.abs(newValue);
        }
    })*/
});
