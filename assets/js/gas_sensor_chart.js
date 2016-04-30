'use strict';
angular.module("roscc").requires.push('highcharts-ng');

var ctrl = angular.module('roscc').controller("gasChart", function ($scope, $timeout){
      $scope.gasChart = {
        options: {
            "chart": {
                "type": "gauge",
                "height":120,

            },
            exporting: { 
                enabled: false 
            },
            "pane": {
                "center": [
                    "50%",
                    "85%"
                ],
                "size": "140%",
                "startAngle": "-90",
                "endAngle": "90",
                "background": {
                    "backgroundColor": "#EEE",
                    "innerRadius": "60%",
                    "outerRadius": "100%",
                    "shape": "arc"
                }
            },
            "tooltip": {
                "enabled": false
            },
            "yAxis": {
                "stops": [
                    [
                        0.1,
                        "#55BF3B"
                    ],
                    [
                        0.5,
                        "#DDDF0D"
                    ],
                    [
                        0.9,
                        "#DF5353"
                    ]
                ],
                "min": 0,
                "max": 100,
                "lineWidth": 0,
                "minorTickInterval": null,
                "tickPixelInterval": 400,
                "tickWidth": 0,
                "title": {
                    margin:0
                },
                "labels": {
                    "y": 16
                }
            },
            "plotOptions": {
                "solidgauge": {
                    "dataLabels": {
                        "y": 10,
                        "borderWidth": 0,
                        "useHTML": true
                    }
                }
            },
            "series": [
                {
                    "dataLabels": {
                        "format": "<div style=\"text-align:center\"><span style=\"font-size:25px;color:#000000\">{y}</span></div>"
                    }
                }
            ],
            "title":{
                "text":"Gas",
                "margin": 0
            }
        }, //end options
        func: function(chart) {
            $timeout(function() {
                chart.reflow();
            }, 0);
        },    
        useHighStock: true
    }
    $scope.init = function(topic_name, chart_height, chart_title) {
        $scope.topicName = topic_name;
        $scope.chart_height = chart_height;
        $scope.chart_title = chart_title;
        if (chart_height != undefined) {
            $scope.gasChart.options.chart.height = chart_height;
        }
        if ($scope.chart_title) {
            $scope.gasChart.options.title.text = chart_title;
        }
    };
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
});
console.log("Loaded controller: ", ctrl);