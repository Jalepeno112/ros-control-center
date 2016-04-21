'use strict';
angular.module("roscc").requires.push('highcharts-ng');

var ctrl = angular.module('roscc').controller("carbonDioxideChart", function ($scope){
    console.log("Scope: ", $scope);
      $scope.carbonDioxideConfig = {
        options: {
            "chart": {
                "type": "gauge",
                "height":120,
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
        useHighStock: true
    }
});
console.log("Loaded controller: ", ctrl);