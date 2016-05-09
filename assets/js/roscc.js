'use strict';

function ROSCCConfig($routeProvider, localStorageServiceProvider) {
  $routeProvider.when('/', {
    templateUrl: 'app/control/control.html',
    controller: 'ControlController',
    controllerAs: 'vm'
  }).when('/settings', {
    templateUrl: 'app/settings/settings.html',
    controller: 'SettingsController',
    controllerAs: 'vm'
  }).otherwise({ redirectTo: '/' });

  localStorageServiceProvider.setPrefix('roscc');
}

angular.module('roscc', ['ngRoute', 'ui.bootstrap', 'LocalStorageModule']).config(ROSCCConfig);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ros = undefined;
var isConnected = false;

var ControlController = function () {
  function ControlController($timeout, $interval, Settings, Domains) {
    var _this = this;

    _classCallCheck(this, ControlController);

    this.$timeout = $timeout;
    this.Domains = Domains;

    this.isConnected = isConnected;
    this.setting = Settings.get();
    this.maxConsoleEntries = 200;

    // Load ROS connection and keep trying if it fails
    this.newRosConnection();
    $interval(function () {
      _this.newRosConnection();
    }, 1000); // [ms]

    this.resetData();
    if (isConnected) {
      this.onConnected();
    }
  }

  // The active domain shows further information in the center view

  _createClass(ControlController, [{
    key: 'setActiveDomain',
    value: function setActiveDomain(domain) {
      this.activeDomain = domain;
    }
  }, {
    key: 'getDomains',
    value: function getDomains() {
      var allData = this.data.topics.concat(this.data.services, this.data.nodes);
      var domains = this.Domains.getDomains(allData);
      if (!this.activeDomain) {
        // if no other domains are found, use Dashboard as the default
        this.setActiveDomain('Dashboard');
      }
      return domains;
    }
  }, {
    key: 'getGlobalParameters',
    value: function getGlobalParameters() {
      return this.Domains.getGlobalParameters(this.data.parameters);
    }
  }, {
    key: 'resetData',
    value: function resetData() {
      this.data = {
        rosout: [],
        topics: [],
        nodes: [],
        parameters: [],
        services: []
      };
    }
  }, {
    key: 'newRosConnection',
    value: function newRosConnection() {
      var _this2 = this;

      if (isConnected || !this.setting) {
        return;
      }

      if (ros) {
        ros.close(); // Close old connection
        ros = false;
        return;
      }

      ros = new ROSLIB.Ros({ url: 'ws://' + this.setting.address + ':' + this.setting.port });

      ros.on('connection', function () {
        _this2.onConnected();
        isConnected = true;
        _this2.isConnected = isConnected;
      });

      ros.on('error', function () {
        isConnected = false;
        _this2.isConnected = isConnected;
      });

      ros.on('close', function () {
        isConnected = false;
        _this2.isConnected = isConnected;
      });
    }
  }, {
    key: 'onConnected',
    value: function onConnected() {
      var _this3 = this;

      console.log("Connected!");

      // wait a moment until ROS is loaded and initialized
      this.$timeout(function () {
        _this3.loadData();

        _this3.setConsole();
        if (_this3.setting.battery) {
          _this3.setBattery();
        }
      }, 1000); // [ms]
    }

    // Setup of console (in the right sidebar)

  }, {
    key: 'setConsole',
    value: function setConsole() {
      var _this4 = this;

      var consoleTopic = new ROSLIB.Topic({
        ros: ros,
        name: this.setting.log,
        messageType: 'rosgraph_msgs/Log'
      });
      consoleTopic.subscribe(function (message) {
        var nameArray = message.name.split('/');
        var d = new Date(message.header.stamp.secs * 1E3 + message.header.stamp.nsecs * 1E-6);

        message.abbr = nameArray.length > 1 ? nameArray[1] : message.name;

        // String formatting of message time and date
        function addZero(i) {
          return i < 10 ? '0' + i : i;
        }
        message.dateString = addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds()) + '.' + addZero(d.getMilliseconds());
        _this4.data.rosout.unshift(message);

        if (_this4.data.rosout.length > _this4.maxConsoleEntries) {
          _this4.data.rosout.pop();
        }
      });
    }

    // Setup battery status

  }, {
    key: 'setBattery',
    value: function setBattery() {
      var _this5 = this;

      var batteryTopic = new ROSLIB.Topic({
        ros: ros,
        name: this.setting.batteryTopic,
        messageType: 'std_msgs/Float32'
      });
      batteryTopic.subscribe(function (message) {
        _this5.batteryStatus = message.data;
      });
    }

    // Load structure, all data, parameters, topics, services, nodes...

  }, {
    key: 'loadData',
    value: function loadData() {
      var _this6 = this;

      this.resetData();

      ros.getTopics(function (topics) {
        angular.forEach(topics, function (name) {
          _this6.data.topics.push({ name: name });
          console.log("Getting topic: ", name);
          ros.getTopicType(name, function (type) {
            _.findWhere(_this6.data.topics, { name: name }).type = type;
          });
        });
      });

      ros.getServices(function (services) {
        angular.forEach(services, function (name) {
          _this6.data.services.push({ name: name });

          ros.getServiceType(name, function (type) {
            _.findWhere(_this6.data.services, { name: name }).type = type;
          });
        });
      });

      ros.getParams(function (params) {
        angular.forEach(params, function (name) {
          var param = new ROSLIB.Param({ ros: ros, name: name });
          _this6.data.parameters.push({ name: name });

          param.get(function (value) {
            _.findWhere(_this6.data.parameters, { name: name }).value = value;
          });
        });
      });

      ros.getNodes(function (nodes) {
        angular.forEach(nodes, function (name) {
          _this6.data.nodes.push({ name: name });
        });
      });
    }
  }]);

  return ControlController;
}();

angular.module('roscc').controller('ControlController', ControlController);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DomainsService = function () {
  function DomainsService() {
    _classCallCheck(this, DomainsService);
  }

  _createClass(DomainsService, [{
    key: 'filterAdvanced',
    value: function filterAdvanced(entry, advanced) {
      var entryArray = entry.split('/');
      if (advanced) {
        return true;
      }
      if (!entry || _.isEmpty(entryArray)) {
        return false;
      }
      return _.last(entryArray)[0] === _.last(entryArray)[0].toUpperCase();
    }
  }, {
    key: 'getDomains',
    value: function getDomains(array) {
      var result = [];
      angular.forEach(array, function (entry) {
        var nameArray = entry.name.split('/');
        if (nameArray.length > 1) {
          result.push(nameArray[1]);
        }
      });
      return _.uniq(result).sort();
    }
  }, {
    key: 'getGlobalParameters',
    value: function getGlobalParameters(array) {
      var result = [];
      angular.forEach(array, function (entry) {
        var nameArray = entry.name.split('/');
        if (nameArray.length === 2) {
          entry.abbr = _.last(nameArray);
          result.push(entry);
        }
      });
      return result;
    }
  }, {
    key: 'getDataForDomain',
    value: function getDataForDomain(array, domainName, advanced) {
      var _this = this;

      var result = [];

      angular.forEach(array, function (entry) {
        var nameArray = entry.name.split('/');
        if (nameArray.length > 1 && nameArray[1] === domainName && _this.filterAdvanced(entry.name, advanced)) {
          entry.abbr = nameArray.slice(2).join(' ');
          result.push(entry);
        }
      });
      return result;
    }
  }]);

  return DomainsService;
}();

// Filter advanced topics, services, parameters by checking the beginning capital letter

angular.module('roscc').service('Domains', DomainsService);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QuaternionsService = function () {
  function QuaternionsService() {
    _classCallCheck(this, QuaternionsService);
  }

  _createClass(QuaternionsService, [{
    key: 'getRoll',
    value: function getRoll(q) {
      if (!q) {
        return '';
      }
      var rad = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
      return 180 / Math.PI * rad;
    }
  }, {
    key: 'getPitch',
    value: function getPitch(q) {
      if (!q) {
        return '';
      }
      var rad = Math.asin(2 * (q.w * q.y - q.z * q.x));
      return 180 / Math.PI * rad;
    }
  }, {
    key: 'getYaw',
    value: function getYaw(q) {
      if (!q) {
        return '';
      }
      var rad = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
      return 180 / Math.PI * rad;
    }
  }, {
    key: 'getInit',
    value: function getInit() {
      return { w: 1, x: 0, y: 0, z: 0 };
    }
  }]);

  return QuaternionsService;
}();

// Quaternions to Euler angles converter

angular.module('roscc').service('Quaternions', QuaternionsService);
'use strict';

function NavbarDirective($location) {
  return {
    templateUrl: 'app/navbar/navbar.html',
    controllerAs: 'vm',
    controller: function controller() {
      this.isPath = isPath;

      function isPath(path) {
        return $location.path() === path;
      }
    }
  };
}

angular.module('roscc').directive('ccNavbar', NavbarDirective);
'use strict';

function ParamaterDirective() {
  return {
    scope: { parameter: '=' },
    templateUrl: 'app/parameters/parameters.html',
    controllerAs: 'vm',
    controller: function controller($scope) {
      var param = new ROSLIB.Param({ ros: ros, name: $scope.parameter.name });

      this.parameter = $scope.parameter;
      this.setValue = setValue;

      function setValue(value) {
        param.set(value);
      }
    }
  };
}

angular.module('roscc').directive('ccParameter', ParamaterDirective);
'use strict';

function serviceDirective() {
  return {
    scope: { service: '=' },
    template: '<ng-include src=\"vm.fileName\"></ng-include>',
    controllerAs: 'vm',
    controller: function controller($scope, $timeout, $http) {
      var _this = this;

      var path = 'app/services/';

      this.service = $scope.service;
      this.callService = callService;
      this.fileName = path + 'default.html';

      // Check if file exists
      $scope.$watch('service.type', function () {
        if (!$scope.service.type) {
          return;
        }
        var fileName = path + $scope.service.type + '.html';

        _this.service = $scope.service;
        $http.get(fileName).then(function (result) {
          if (result.data) {
            _this.fileName = fileName;
          }
        });
      });

      function callService(input, isJSON) {
        var _this2 = this;

        var data = isJSON ? angular.fromJSON(input) : input;
        var service = new ROSLIB.Service({
          ros: ros,
          name: this.service.name,
          serviceType: this.service.type
        });
        var request = new ROSLIB.ServiceRequest(data);
        service.callService(request, function (result) {
          $timeout(function () {
            _this2.result = result;
          });
        });
      }
    }
  };
}

angular.module('roscc').directive('ccService', serviceDirective);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SettingsController = function () {
  function SettingsController(localStorageService, Settings) {
    _classCallCheck(this, SettingsController);

    this.Settings = Settings;

    this.settings = Settings.getSettings() || [Settings.getDefaultSetting()];
    this.index = Settings.getIndex();

    if (!this.index || this.index > this.settings.length) {
      this.index = '0';
    }
  }

  _createClass(SettingsController, [{
    key: 'save',
    value: function save() {
      this.Settings.save(this.settings, this.index);
    }
  }, {
    key: 'add',
    value: function add() {
      this.settings.push(this.Settings.getDefaultSetting()); // Clone object
      this.index = String(this.settings.length - 1);
      this.save();
    }
  }, {
    key: 'remove',
    value: function remove() {
      this.settings.splice(this.index, 1);
      this.index = '0';

      if (!this.settings.length) {
        this.add();
      }
      this.save();
    }
  }]);

  return SettingsController;
}();

angular.module('roscc').controller('SettingsController', SettingsController);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SettingsService = function () {
  function SettingsService($location, localStorageService) {
    _classCallCheck(this, SettingsService);

    this.$location = $location;
    this.localStorageService = localStorageService;
  }

  _createClass(SettingsService, [{
    key: 'load',
    value: function load() {
      this.index = this.localStorageService.get('selectedSettingIndex');
      this.settings = this.localStorageService.get('settings');
      if (this.settings && this.index) {
        this.setting = this.settings[this.index];
      }

      // If there are no saved settings, redirect to /settings for first setting input
      if (!this.setting) {
        this.$location.path('/settings').replace();
      }
    }
  }, {
    key: 'save',
    value: function save(newSettings, newIndex) {
      this.settings = newSettings;
      this.index = newIndex;
      this.localStorageService.set('selectedSettingIndex', newIndex);
      this.localStorageService.set('settings', newSettings);
    }
  }, {
    key: 'get',
    value: function get() {
      if (!this.setting) {
        this.load();
      }

      return this.setting;
    }
  }, {
    key: 'getIndex',
    value: function getIndex() {
      if (!this.setting) {
        this.load();
      }

      return this.index;
    }
  }, {
    key: 'getSettings',
    value: function getSettings() {
      if (!this.setting) {
        this.load();
      }

      return this.settings;
    }
  }, {
    key: 'getDefaultSetting',
    value: function getDefaultSetting() {
      return {
        name: 'New Setting',
        address: location.hostname,
        port: 9090,
        log: '/rosout',
        imagePreview: { port: 0, quality: 70, width: 640, height: 480 },
        battery: true,
        batteryTopic: '',
        advanced: false
      };
    }
  }]);

  return SettingsService;
}();

angular.module('roscc').service('Settings', SettingsService);
'use strict';

function topicDirective() {
  return {
    scope: { topic: '=' },
    template: '<ng-include src=\"vm.fileName\"></ng-include>',
    controllerAs: 'vm',
    controller: function controller($scope, $timeout, $http, Settings, Quaternions) {

      var _this = this;
      console.log("Creating new topic for name: ", $scope.topic.name, "; type: ", $scope.topic.type);

      var roslibTopic = new ROSLIB.Topic({
        ros: ros,
        name: $scope.topic.name,
        messageType: $scope.topic.type,
        queue_size: 1
      });
      var path = 'app/topics/';

      this.topic = $scope.topic;
      this.toggleSubscription = toggleSubscription;
      this.publishMessage = publishMessage;
      this.isSubscribing = false;
      this.setting = Settings.get();
      this.Quaternions = Quaternions;
      this.fileName = path + 'default.html';

      // Check if file exists
      $scope.$watch('topic.type', function () {
        if (!$scope.topic.type) {
          return;
        }
        var fileName = path + $scope.topic.type + '.html';
        _this.topic = $scope.topic;
        $http.get(fileName).then(function (result) {
          if (result.data) {
            _this.fileName = fileName;
          }
        });
      });

      function toggleSubscription(data) {
        var _this2 = this;
        if (!data) {
          console.log("ROSLIBTOPIC: ", roslibTopic);
          roslibTopic.subscribe(function (message) {
            $timeout(function () {
              // get the incoming message for the given topic
//              console.log(message);
              _this2.message = message;
            });
          });
        } else {
          roslibTopic.unsubscribe();
        }
        this.isSubscribing = !data;
      }

      function publishMessage(input, isJSON) {
        var data = isJSON ? angular.fromJSON(input) : input;
        var message = new ROSLIB.Message(data);
        roslibTopic.publish(message);
      }
    }
  };
}

angular.module('roscc').directive('ccTopic', topicDirective);


/**
 * Controller for the main dashboard
 *
 * This controller is different than the default topic controller provided by the Ros Control Center
 * Here, we want to mix together data from multiple topics in one display.
 * In order to do this we need to subscribe to each topic and make their data available in a way that they don't overwrite eachother
 *
 * To make the data available, we create a dicitonary called *message*.
 * We then break each topics name and type into keys that are used to create a nested dicitonary structures.
 * For example, the topic that contains the vehicle state information is:
 *    - name:  /VehicleState
 *    - type:  /rsl_rover_msgs/vehicle_state
 *
 * The data for that topic will then live at:
 *    - messages.VehicleState.rsl_rover_msgs.vehicle_state
 *
 * The data itself comes through as a JSON object which is then converted into a dicitonary
 * So to get the wheel_speed of the rover we access:
 *    - messages.VehicleState.rsl_rover_msgs.vehicle_state.wheel_speed
 */
function dashboardDirective() {
  return {
    scope: { topic: '=' },
    template: '<ng-include src=\"vm.fileName\"></ng-include>',
    controllerAs: 'vm',
    controller: function controller($scope, $timeout, $http, Settings, Quaternions) {
      var _this = this;

      // given a topic name and type, we create a nested dicitonary structure
      // each string before or after a '/' becomes a new key to an empty dictionary
      this.MessageToDict = function(name, type) {
        console.log(name, type);
        var messages = {};
        var sub_message = messages;
        var name_splice = name.split("/");
        for (var i = 1; i < name_splice.length; i++) {
          sub_message[name_splice[i]] = {};
          sub_message = sub_message[name_splice[i]];
        }
        var type_splice = type.split("/");
        for (var i = 0; i < type_splice.length; i++) {
          sub_message[type_splice[i]] = {};
          sub_message = sub_message[type_splice[i]];
        }
        return messages;
      }

      // general topics that we want to visualize
      this.topics = [
        {"name": "/EnvData/curly", "type":"rsl_rover_msgs/env_data", "throttle":200},     // sensor box 1
        {"name": "/EnvData/moe", "type":"rsl_rover_msgs/env_data", "throttle":200},       // sensor box 2
        {"name": "/EnvData/larry", "type":"rsl_rover_msgs/env_data", "throttle":200},     // sensor box 3
        {"name": "/VehicleState", "type":"rsl_rover_msgs/vehicle_state", "throttle":100}, // vehicle state information
      ];
     
      // the gas sensor topics are special, so we need to deal with them seperately
      // we want to monitor them as a group and aggregate their values
      // but we only want to use certain sensors for certain gases
      this.gasTopics = {
        C0:       {topics:[this.topics[0], this.topics[1], this.topics[2]], sensors:["MQ7", "MQ9"]},
        C02:      {topics:[this.topics[0], this.topics[1], this.topics[2]], sensors:["MQ7", "MQ9"]},
        Propane:  {topics:[this.topics[0], this.topics[1], this.topics[2]], sensors:["MQ2", "MQ5", "MQ6", "MQ9"]},
        Methane:  {topics:[this.topics[0], this.topics[1], this.topics[2]], sensors:["MQ4"]}
      }
      this.roslibTopics = {}
      this.messages = {};

      // build a ROSLIB Topic for each topic in the list
      // and construct the holder for all the different message types
      for (var topic in this.topics) {
        this.roslibTopics[_this.topics[topic].name] = new ROSLIB.Topic({
          ros: ros,
          name: _this.topics[topic].name,
          messageType: _this.topics[topic].type,
          throttle: _this.topics[topic].throttle,
          queue_size: 0
        });

        angular.merge(this.messages, this.MessageToDict(this.topics[topic].name, this.topics[topic].type));
      }
      console.log(this.messages);
      var path = 'app/topics/';

      this.topic = $scope.topic;
      this.isSubscribing = false;
      this.setting = Settings.get();
      this.Quaternions = Quaternions;
      this.fileName = path + 'default.html';

      // Check if file exists
      $scope.$watch('topic.type', function () {
        var fileName = path + "dashboard/dashboard2.html";
        _this.topic = $scope.topic;
        $http.get(fileName).then(function (result) {
          if (result.data) {
            _this.fileName = fileName;
          }
        });
      });

      this.roslibTopics['/EnvData/curly'].subscribe(function(message) {
        $timeout(function() {
          _this.messages['EnvData']['curly']['rsl_rover_msgs']['env_data'] = message;
        }, 1000);
      });

      this.roslibTopics['/EnvData/moe'].subscribe(function(message) {
        $timeout(function() {
          _this.messages['EnvData']['moe']['rsl_rover_msgs']['env_data'] = message;
        }, 1000);
      });

      this.roslibTopics['/EnvData/larry'].subscribe(function(message) {
        $timeout(function() {
          _this.messages['EnvData']['larry']['rsl_rover_msgs']['env_data'] = message;
        }, 1000);
      });

      this.roslibTopics['/VehicleState'].subscribe(function(message) {
        $timeout(function() {
          _this.messages['VehicleState']['rsl_rover_msgs']['vehicle_state'] = message;
        }, 1000);
      });

      /*for (topic in this.roslibTopics) {
        var t = this.roslibTopics[topic];

        console.log("Subscribing to ", t.name);
        //subscribe to topic and store messages in appropriate place
        t.subscribe(function(message) {
          $timeout(function () {
             var name_splice = t.name.split("/");
             var accessor;
             accessor = _this.messages[name_splice[1]];
             if(name_splice.length > 2) {
                console.log("CHECKING NAME SPLICE: ", name_splice[2]);
                accessor = accessor[name_splice[2]];
              }
            var type_splice = t.messageType.split("/");
            //console.log(name_splice, type_splice);
            //console.log(message);
            accessor[type_splice[0]][type_splice[1]]=message;
            console.log(accessor);
          }, 1000);
        });
      }*/
    }
  };
}
angular.module('roscc').directive('dashTopic', dashboardDirective);


/**
 * Controller to initialize the a LIDAR view
 *
 * This function will use the ROSLIB and ROS3DJS libraries to render a live point cloud on a page.
 * It requires four different parts:
 *  - ROS connection
 *  - TF Client
 *  - URDF model
 *  - PointCloud
 *
 * The TF client is what makes everything come together.  It does all of the translations to make sure that the URDF model and the PointCloud are rendered in the same scene.
 * We also use a SceneNode to have a little more control over the initialization.
 * The default viewer object makes some assumptions that we did not want to abide by.
 */
function angularLidarViz(){
  return {
    controller: function controller($scope, $timeout, $http, Settings, Quaternions) {
      $scope.init = function(height, divID) {
        /**
        * Setup all visualization elements when the page is loaded.
        */
        // Connect to ROS.
        this.settings = Settings.get();
        var _this = this;
        var ros = new ROSLIB.Ros({
          url : "ws://"+_this.settings.address + ":"+_this.settings.port
        });

        // Create the main viewer.
        var width = $("#lidar_viz").width();
        var viewer = new ROS3D.Viewer({
          divID : divID,
          width : width,
          height : height,
          antialias : false
        });

        // Add a grid.
        viewer.addObject(
          new ROS3D.Grid({
            cellSize: 0.5,
            num_cells: 100
          })
        );

        // Setup a client to listen to TFs.
        // Base_link will redner everything in relation to the base of the rover
        var tf_base = new ROSLIB.TFClient({
          ros : ros,
          angularThres : 0.01,
          transThres : 0.01,
          rate : 5.0,
          fixedFrame : '/base_link'
        });

        // setup a TF client for the world
        // this will render something with relation to the general WORLD that the rover is in
        var tf_cloud = new ROSLIB.TFClient({
          ros : ros,
          angularThres : 0.01,
          transThres : 0.01,
          rate : 5.0,
          fixedFrame : '/map'
        });

        // we want our scene to be focused around the WORLD in which the rover is in
        // for our purposes we want the tfClient and the frameId to reference the same topic
        var urdfScene = new ROS3D.SceneNode({
           tfClient : tf_cloud,
           frameID  : '/map',
        });

        // add the scene to the viewer object
        viewer.scene.add(urdfScene);


        // create a new pointcloud object
        // our pointcloud is rendered via the /ass_cloud topic (short for /assembled_cloud)
        // we use the tf_bae TF client in order to render the point cloud in relation to the rover
        var pointcloud = new ROS3D.PointCloud2({
          ros: ros,
          topic: "/ass_cloud",
          tfClient: tf_base,
          rootObject: urdfScene,
          size: 0.7,
          max_pts: 75000      //save up to 75000 points in the scene at any given time
        });


        // Setup the URDF client.
        // we use the TF Base client here too in order to render the vehicles position relative to itself
        // NOTE:  the URDF model is stored locally at /urdf
        //        if the model ever updates, we need to update it here too
        var urdfClient = new ROS3D.UrdfClient({
          ros : ros,
          tfClient : tf_base,
          path : 'http://localhost:8000/urdf/',
          rootObject : urdfScene,
          loader : ROS3D.COLLADA_LOADER_2
         });
      };
    }
  }
}
angular.module('roscc').directive('lidarViz', angularLidarViz);
