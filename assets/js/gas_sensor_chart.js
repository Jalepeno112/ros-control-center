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
    };
    $scope.init = function(gas_name, chart_height, chart_title) {
        /**
         * topic_names is a list of all the different gas sensor topics
         */
        $scope.gas_name = gas_name;
        $scope.chart_height = chart_height;
        $scope.chart_title = chart_title;
        if (chart_height != undefined) {
            $scope.gasChart.options.chart.height = chart_height;
        }
        if ($scope.chart_title) {
            $scope.gasChart.options.title.text = chart_title;
        }
        $scope.topicNames = $scope.vm.gasTopics[gas_name];
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
    };
    function getMessageName(topic) {
        var name_splice = topic.name.split("/");
        var type_splice = topic.type.split("/");
        return (name_splice[1] +"."+name_splice[2]+"."+type_splice[0]+"."+type_splice[1]+".");
    };

    $scope.$watch(function($scope) {
        var val;
        // for each of the sensor packs, there are certain sensors that are better than others for certain gases
        // these are listed under *sensors*
        // So we want to add and average these different sensor values for each sensor pack
        $.each($scope.topicNames.topics, function(e) {
            var sensor_pack = $scope.topicNames.topics[e];
            var sensor_average = 0;
            var count = 0;
            // iterate over each sensor
            $.each($scope.topicNames.sensors, function(s){
                var sensor = $scope.topicNames.sensors[s]
                sensor_average = sensor_average + deref($scope, getMessageName(sensor_pack)+"."+sensor);
                count++;
            });
            sensor_average = sensor_average/count;
            val += sensor_average;
        });
        return val/$scope.topicNames.topics.length;
    },function(val){
        if(val){
            $scope.gasChart.series[0].data[0] = Math.abs(val);
        }
    }, false);
});
console.log("Loaded controller: ", ctrl);