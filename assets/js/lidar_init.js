/*
 * Setup all visualization elements when the page is loaded.
 */
function LidarInit(hostname) {
  // Connect to ROS.
  var ros = new ROSLIB.Ros({
    url : 'ws://'+hostname+':9090'
  });
  // Create the main viewer.
  var viewer = new ROS3D.Viewer({
    divID : 'lidar_viewer',
    width : 600,
    height : 450,
    antialias : true
  });
  // Setup a client to listen to TFs.
  var tfClient = new ROSLIB.TFClient({
    ros : ros,
    angularThres : 0.01,
    transThres : 0.01,
    rate : 10.0,
  });
  // Setup Kinect DepthCloud stream
  depthCloud = new ROS3D.DepthCloud({
    url : 'http://'+hostname+':60390',
  });
  depthCloud.startStream();

  // Create Kinect scene node
  var kinectNode = new ROS3D.SceneNode({
    frameID : '/laser',
    tfClient : tfClient,
    object : depthCloud
  });
  viewer.scene.add(kinectNode);
}