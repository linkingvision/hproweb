import store from '../../store/legacyStore';
import "ol/ol.css";
import { Cluster, OSM, Vector as VectorSource } from 'ol/source';
import VectorLayer from "ol/layer/Vector";
import { Map, View, Feature } from "ol";
import { Style, Icon } from "ol/style";
import { Circle, Text } from "ol/style";
import Fill from "ol/style/Fill";
import { Point } from "ol/geom";
import { fromLonLat, transform, toLonLat, get } from "ol/proj"; //弹窗
import Stroke from "ol/style/Stroke";
import Polygon from "ol/geom/Polygon";
import Pointer from "ol/interaction/Pointer";
import { getVectorContext } from 'ol/render';
import LineString from "ol/geom/LineString";
import { unByKey } from 'ol/Observable';
import { boundingExtent } from 'ol/extent';
class h5sMap {
    constructor(map) {
        this.map = map;
        this.layers = {};
        this.this_ = null;
        this.features = [];
        this.ClusterFeatures = [];
        this.feature_ = null;
        this.coordinate_ = null;
        this.clusterSource = null;
        this.flagLayercam = null;
        this.cluster = [];
        this.dragInteractionInstance = this.dragInteraction();
        this.map.addInteraction(this.dragInteractionInstance);
        this.styleCache = {};
        this.addCluster();
    };
    addCluster() {
        this.clusterSource = new Cluster({
            distance: 40,
            source: new VectorSource(),
        });
        const flagLayercam = new VectorLayer({
            source: this.clusterSource,
            className: "flagLayercam",
            style: this.clusterStyle.call(this)
        });
        this.flagLayercam = flagLayercam;
        this.map.addLayer(flagLayercam);
    };
    clusterStyle(feature) {
        return (feature) => {
            let style;
            const size = feature.get('features').length;
            if (size == 1) {
                style = feature.get('features')[0].get("cameraStyle")
            } else {
                style = new Style({
                    image: new Icon({
                        src: store.state.IPPORT + "/img/camera.png",
                        scale: 0.15,
                        rotation: Math.PI - 0 * Math.PI / 180,
                    }),
                    text: new Text({
                        text: size.toString(),
                        fill: new Fill({
                            color: '#fff',
                        }),
                        font: '13px Arial',
                        offsetX: 10,
                        offsetY: -8,
                        textAlign: "center",
                        backgroundFill: new Fill({
                            color: '#fa6400',  // 背景颜色，这里使用半透明黑色
                        }),
                        padding: [2, 3, 0, 5],  // 内边距
                    }),
                });
            }
            return style;
        }
    };
    addLayer(conf) {
        conf.map = this.map;
        this.cluster.push(conf);
        if (conf.type == "camera" && conf.cluster) {
            if (this.layers["flagLayercam"]) {
                this.layers["flagLayercam"].addClusterFeature(conf)
            } else {
                let layer = new h5sCluster(this.clusterSource);
                layer.addClusterFeature(conf)
                this.layers["flagLayercam"] = layer;
            }
        } else {
            let layer = new h5slayer(conf);
            layer.start(conf.coordinate)
            this.layers[layer.cameraToken] = layer;
        }

        // layer.start(conf.coordinate)
        // this.layers[layer.cameraToken] = layer;
    };
    removeLayer() {
        this.this_.remove();
    }
    // 修改icon
    updateCamera(color, data, accessDoorStatus) {
        this.this_.accessDoorStatus = accessDoorStatus ? accessDoorStatus : false;
        // 设置填充颜色
        let colorValue = this.this_.getCameraColorEnum(color);
        this.this_.cameraType = color;
        // 修改camera的图标
        this.this_.cameraIconUrl = colorValue.cameraIconUrl;
        const cameraStyle = new Style({
            image: new Icon({
                src: store.state.IPPORT + this.this_.cameraIconUrl,
                anchor: [0, 0.5],
                scale: 0.15,
                rotation: this.this_.type == 'view' || this.this_.type == 'accessDoor' ? 0 : Math.PI - this.this_.rotationAngle * Math.PI / 180,
            }),
        });
        this.coordinate_ = [data.longitude, data.latitude];
        const cameraFeature = new Feature({
            geometry: new Point(this.coordinate_)
        });
        cameraFeature.set('cameraToken', this.this_.cameraToken);
        cameraFeature.setId("cameraid" + this.this_.cameraToken);
        cameraFeature.setStyle(cameraStyle);
        this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("cameraid" + this.this_.cameraToken));
        this.this_.layer.getSource().addFeature(cameraFeature);

        if (this.this_.type == "camera") {
            // 修改扇形填充颜色扇形边框颜色，
            this.this_.circularFillColor = colorValue.circularFillColor;
            this.this_.circularstrokeColor = colorValue.circularstrokeColor;
            const newFeature = this.this_.getCircularFeature()
            const circularStyle = new Style({
                fill: new Fill({
                    color: this.this_.circularFillColor
                }),
                stroke: new Stroke({
                    color: this.this_.circularstrokeColor, width: 2
                }),
            });

            newFeature.set('cameraToken', this.this_.cameraToken);
            newFeature.setId("circularid" + this.this_.cameraToken);
            newFeature.setStyle(circularStyle);
            this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("circularid" + this.this_.cameraToken));
            this.this_.layer.getSource().addFeature(newFeature);

            // 修改半径控制点颜色
            this.this_.controRadiuslColor = colorValue.controRadiuslColor;
            var cameraStyle1 = new Style({
                image: new Circle({
                    radius: 5,
                    fill: new Fill({
                        color: this.this_.controRadiuslColor,
                    }),
                    rotation: 0,
                }),
            });
            let coordinateControl = [this.coordinate_[0] + data.radius * Math.cos((data.rotationAngle) * Math.PI / 180), this.coordinate_[1] + data.radius * Math.sin((data.rotationAngle) * Math.PI / 180)];
            var radiusFeature = new Feature({
                geometry: new Point(coordinateControl)
            });
            radiusFeature.set('cameraToken', this.this_.cameraToken);
            radiusFeature.setId("radiusid" + this.this_.cameraToken);
            radiusFeature.setStyle(cameraStyle1);
            this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("radiusid" + this.this_.cameraToken));
            this.this_.layer.getSource().addFeature(radiusFeature);
        }
        this.this_.map.render();
        if (accessDoorStatus == undefined) {
            this.this_.Callback('Update');
        }
    }
    // 删除icon
    deleteCamera() {
        this.this_.whetherDelete = false;
        if (this.this_.type == "camera") {
            // 删除扇形填充和边框
            this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("circularid" + this.this_.cameraToken));
            // 删除扇形角度控制点
            this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("angleid1" + this.this_.cameraToken));
            this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("angleid2" + this.this_.cameraToken));
            // 删除半径控制点
            this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("radiusid" + this.this_.cameraToken));
        }
        // 删除icon
        this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("cameraid" + this.this_.cameraToken));
        this.this_.Callback('Delete');
    }
    // clearLayer() {
    //     // 清空地图上的所有图层
    //     for (const key in this.layers) {
    //         this.map.removeLayer(this.layers[key].layer);  // 移除每一个图层
    //     }
    //     this.map.removeLayer(this.flagLayercam);
    //     this.layopers = {};
    // }
    dragInteraction() {
        return new Pointer({
            handleDownEvent: this.handleDownEvent.bind(this),
            handleDragEvent: this.handleDragEvent.bind(this),
            handleUpEvent: this.handleUpEvent.bind(this),
        })
    };
    handleDownEvent(event) {
        let h5sMap = this
        this.flagLayercam.getFeatures(event.pixel).then((clickedFeatures) => {
            if (clickedFeatures.length) {
                // Get clustered Coordinates
                const features = clickedFeatures[0].get('features');
                if (features.length > 1) {
                    const coordinates = features.map((r) => r.getGeometry().getCoordinates());
                    const uniqueCoordinates = new Set(coordinates.map(coord => coord.join(',')));
                    if (uniqueCoordinates.size === 1) {
                        // 所有特征都在同一位置
                        h5sMap.ClusterFeatures = features;
                    }
                    const extent = boundingExtent(
                        features.map((r) => r.getGeometry().getCoordinates()),
                    );
                    this.map.getView().fit(extent, { duration: 1000, padding: [20, 20, 20, 20] });
                } else {
                    h5sMap.feature_ = features[0]
                }
                h5sMap.this_ = h5sMap.layers["flagLayercam"]
            }
        });
        let feature = this.map.forEachFeatureAtPixel(event.pixel,
            function (feature) {
                return feature;
            });
        if (!feature) {
            return;
        }

        if (!feature.get("cameraToken")) {
            return true;
        }
        this.this_ = this.layers[feature.get("cameraToken")];
        // 是右键事件就删除当前图层
        if (event.originalEvent.button === 2) {
            if (!this.this_.RejectOperation) return;
            // this.deleteCamera();
            this.this_.Callback('Delete');
        } else {
            this.this_.unByKey();
            this.coordinate_ = event.coordinate;//当前鼠标位置
            if (feature) {
                this.feature_ = feature;
                this.features = this.this_.layer.getSource().getFeatures();
            } else {
                // 不允许拖动
                this.coordinate_ = null;
                this.feature_ = null;
            }
            return !!feature;
        }
    }
    handleDragEvent(event) {
        if (!this.this_.RejectOperation) return;
        let deltaX, deltaY, geometry, newFeature, circularStyle
        switch (this.feature_.getId()) {
            case "cameraid" + this.this_.cameraToken:
                deltaX = event.coordinate[0] - this.coordinate_[0];
                deltaY = event.coordinate[1] - this.coordinate_[1];
                this.features.forEach((item, i) => {
                    geometry = item.getGeometry();
                    geometry.translate(deltaX, deltaY);
                });
                // 拖动
                this.this_.coordinateControl[0] = deltaX + this.this_.coordinateControl[0]
                this.this_.center[0] = deltaX + this.this_.center[0]
                this.this_.coordinateControl[1] = deltaY + this.this_.coordinateControl[1]
                this.this_.center[1] = deltaY + this.this_.center[1]
                break;
            case "radiusid" + this.this_.cameraToken:
                this.handleRadiusEvent(event)
                break;
            case "angleid1" + this.this_.cameraToken:
                this.this_.endAngle = this.this_.handleEventAngle(event)
                this.this_.startAngle = -this.this_.endAngle
                // 生成「圆」要素
                newFeature = this.this_.getCircularFeature()

                circularStyle = new Style({
                    fill: new Fill({
                        color: this.this_.circularFillColor
                    }),
                    stroke: new Stroke({
                        color: this.this_.circularstrokeColor, width: 2
                    }),
                });

                newFeature.set('cameraToken', this.cameraToken);
                newFeature.setId("circularid" + this.this_.cameraToken)
                newFeature.setStyle(circularStyle);
                this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("circularid" + this.this_.cameraToken));
                this.this_.layer.getSource().addFeature(newFeature);
                this.this_.map.render();
                break;
            case "angleid2" + this.this_.cameraToken:
                this.this_.endAngle = this.this_.handleEventAngle(event)
                this.this_.startAngle = -this.this_.endAngle
                // 生成「圆」要素
                newFeature = this.this_.getCircularFeature()

                circularStyle = new Style({
                    fill: new Fill({
                        color: this.this_.circularFillColor
                    }),
                    stroke: new Stroke({
                        color: this.this_.circularstrokeColor, width: 2
                    }),
                });
                newFeature.set('cameraToken', this.cameraToken);
                newFeature.setId("circularid" + this.this_.cameraToken)
                newFeature.setStyle(circularStyle);
                this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("circularid" + this.this_.cameraToken));
                this.this_.layer.getSource().addFeature(newFeature);
                this.this_.map.render();
                break;
            default:
                break;
        }

        this.coordinate_[0] = event.coordinate[0];
        this.coordinate_[1] = event.coordinate[1];
    }
    handleUpEvent(event) {
        if (this.this_.enableScan) {
            this.this_.addscan();
        }
        if (this.feature_) {
            const cameraToken = this.feature_.get("cameraToken");
            const matchingItem = this.cluster.find(item => item.cameraToken === cameraToken);

            if (matchingItem) {
                const callbackArgs = matchingItem.cluster ? [this.feature_, 'Update'] : ['Update'];
                this.this_.Callback(...callbackArgs);
            }
        } else if (this.ClusterFeatures.length > 1) {
            this.this_.Callback(this.ClusterFeatures, 'Update', 'Cluster');
        }
        // 停止拖动
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    }
    handleRadiusEvent(event) {
        var deltaX = event.coordinate[0] - this.coordinate_[0];
        var deltaY = event.coordinate[1] - this.coordinate_[1];
        var centerdeltaX = event.coordinate[0] - this.this_.center[0];
        var centerdeltaY = event.coordinate[1] - this.this_.center[1];
        var radiusFeature = this.this_.layer.getSource().getFeatureById("radiusid" + this.this_.cameraToken)
        var radiusgeometry = radiusFeature.getGeometry();
        radiusgeometry.translate(deltaX, deltaY);
        // 旋转度数
        this.this_.rotationAngle = Math.atan2(centerdeltaY, centerdeltaX) * (180 / Math.PI);
        let circularFeature = this.this_.layer.getSource().getFeatureById("cameraid" + this.this_.cameraToken)
        var style = circularFeature.getStyle();
        style.getImage().setRotation(Math.PI - this.this_.rotationAngle * Math.PI / 180);
        // 更新要素的样式
        circularFeature.setStyle(style);
        // 更新圆的半径
        this.this_.radius = this.this_.calculateDistance(this.this_.center[0], this.this_.center[1], event.coordinate[0], event.coordinate[1]);
        // 生成「圆」要素
        const newFeature = this.this_.getCircularFeature()
        let circularStyle = new Style({
            fill: new Fill({
                color: this.this_.circularFillColor
            }),
            stroke: new Stroke({
                color: this.this_.circularstrokeColor, width: 2
            }),
        });
        newFeature.set('cameraToken', this.this_.cameraToken);
        newFeature.setId("circularid" + this.this_.cameraToken)
        newFeature.setStyle(circularStyle);
        this.this_.layer.getSource().removeFeature(this.this_.layer.getSource().getFeatureById("circularid" + this.this_.cameraToken));
        this.this_.layer.getSource().addFeature(newFeature);

        this.this_.map.render();

    }
    destroy() {
        // 2. 移除地图的交互操作
        this.map.removeInteraction(this.dragInteractionInstance); // 移除所有交互


        // 3. 清理与集群相关的内容
        if (this.flagLayercam) {
            this.map.removeLayer(this.flagLayercam); // 移除集群图层
            this.flagLayercam = null;
        }

        // 4. 清理图层缓存
        for (const key in this.layers) {
            if (this.layers[key] && this.layers[key].layer) {
                this.map.removeLayer(this.layers[key].layer); // 移除每个图层
            }
        }
        this.layers = {}; // 清空图层缓存

        // 5. 清除特性和交互
        this.features = []; // 清空特性数组
        this.feature_ = null; // 清空当前选中的特性
        this.coordinate_ = null; // 清空坐标

        // 6. 清除集群源
        if (this.clusterSource) {
            this.clusterSource.clear(); // 清空集群源中的特性
            this.clusterSource = null;
        }

        // 7. 清除自定义交互
        if (this.flagLayercam) {
            this.flagLayercam = null; // 清空标记图层
        }

        // 8. 清理集群数据
        this.cluster = [];

        // 9. 清理样式缓存
        this.styleCache = {};

        // 10. 清理地图实例
        this.map = null; // 将地图对象置为 null
    }
}
class h5slayer {
    constructor(conf) {
        this.map = conf.map;
        this.projection = conf.map.getView().getProjection();
        this.draw = true;
        this.layer = null;
        if (this.projection.code_ == "EPSG:4326") {
            this.radius = 0.007;
        } else {
            this.radius = 1000;
        }
        this.cameraName = conf.cameraName;
        this.cameraToken = conf.cameraToken;
        this.accessToken = conf.accessToken || ''; //accessToken
        this.accessDoorStatus = conf.accessDoorStatus || false; //是否开启门
        this.type = conf.type || 'camera'; //类型
        this.cameraIconUrl = this.getCameraColorEnum(conf.cameraType).cameraIconUrl;
        this.center = []; //摄像机点
        this.startAngle = -parseInt(conf.angle / 2) || -45;
        this.endAngle = parseInt(conf.angle / 2) || 45;
        this.rotationAngle = conf.rotationAngle || 0;//旋转角度
        // this.features = [];
        // this.feature_ = null;
        // this.coordinate_ = null;
        this.coordinateControl = [];
        this.cameraType = conf.cameraType; // 类型
        this.controlColor = this.getCameraColorEnum(conf.cameraType).controlColor || "#ff2d51"; //控制点颜色
        this.controRadiuslColor = this.getCameraColorEnum(conf.cameraType).controRadiuslColor || "#ff2d51"; //半径控制点颜色
        this.circularFillColor = this.getCameraColorEnum(conf.cameraType).circularFillColor || 'rgba(0, 0, 255, 0.2)'; //扇形填充颜色
        this.circularstrokeColor = this.getCameraColorEnum(conf.cameraType).circularstrokeColor || '#ffcc33'; //扇形边框颜色
        this.drawIcon = conf.drawIcon || false; //是否只绘制icon
        this.id = conf.id || ''; //camera id 或者视图id 或者maplink id
        this.whetherDelete = conf.whetherDelete || true; // 返回操作是更新(true)还是删除(false)
        this.RejectOperation = conf.RejectOperation == "false" || conf.RejectOperation == false ? false : true; //是否可以操作
        this.callback = conf.callback;
        //摄像机扫描
        this.enableScan = conf.enableScan || false;//是否开启扫描
        this.direction = 1;//扫描方向，1表示顺时针，-1表示逆时针
        this.totalRotation = 0;//总旋转角度
        this.flashGeom = null;//扫描的扇形
        this.listenerKey = null;//监听key

        if (conf.radius) {
            this.radius = conf.radius;
        }

    };
    start(e) {
        this.layer = new VectorLayer({
            className: "VectorLayerCam",
            source: new VectorSource(),
        });
        this.layer.set('id', this.cameraToken);
        this.layer.set('type', this.type);
        this.map.addLayer(this.layer);
        // this.map.on('singleclick', this.singleclick.bind(this));
        if (this.cameraToken != undefined && this.draw) {
            this.addcamera(e);
            if (!this.drawIcon) {
                this.addCircular(e);
                this.addRadiusControl(e);
                if (this.enableScan) {
                    this.addscan();
                }
            }
            this.draw = false;
        }
        this.Callback('Add');
    }
    remove() {
        if (this.layer) {
            this.map.removeLayer(this.layer);
            this.layer = null;
        }
    }
    singleclick(e) {
        console.log(this.cameraToken);
    }
    getCameraColorEnum(pream) {
        let color = {};
        if (!this.accessToken) {
            if (this.type == "camera") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/camera_green.png',
                        circularFillColor: "rgba(105, 226, 66, 0.2)",
                        circularstrokeColor: "rgba(105, 226, 66, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(105, 226, 66, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/camera_orange.png',
                        circularFillColor: "rgba(243, 179, 64, 0.2)",
                        circularstrokeColor: "rgba(243, 179, 64, 1",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(243, 179, 64, 1)",
                    },
                }
            } else if (this.type == "view") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/view_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/view_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            } else if (this.type == "link") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/link_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/link_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            }
        } else {
            if (!this.accessDoorStatus) {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_off_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_off_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            } else {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_on_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_on_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            }
        }
        return color[pream];
    }
    addcamera(e) {
        this.center = e;
        const coordinate = e;
        const cameraStyle = new Style({
            image: new Icon({
                src: store.state.IPPORT + this.cameraIconUrl,
                anchor: [0, 0.5],
                scale: 0.15,
                rotation: this.type == 'view' || this.type == 'accessDoor' ? 0 : Math.PI - this.rotationAngle * Math.PI / 180,
            }),
        });
        const cameraFeature = new Feature({
            geometry: new Point(coordinate)
        });
        cameraFeature.set('cameraToken', this.cameraToken);
        cameraFeature.setId("cameraid" + this.cameraToken);
        cameraFeature.setStyle(cameraStyle);
        this.layer.getSource().addFeature(cameraFeature);
    }
    addCircular(e) {
        // 生成「圆」要素
        const feature = this.getCircularFeature();
        let circularStyle = new Style({
            fill: new Fill({
                color: this.circularFillColor
            }),
            stroke: new Stroke({
                color: this.circularstrokeColor,
                width: 2,
            }),
        });
        feature.set('cameraToken', this.cameraToken);
        feature.setId("circularid" + this.cameraToken);
        feature.setStyle(circularStyle);
        // 将要素添加到地图中
        this.layer.getSource().addFeature(feature);
    }
    //添加半径控制点
    addRadiusControl(e) {
        var cameraStyle = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: this.controRadiuslColor,
                }),
                rotation: 0,
            }),
        });
        let coordinateControl = [this.center[0] + this.radius * Math.cos((this.rotationAngle) * Math.PI / 180), this.center[1] + this.radius * Math.sin((this.rotationAngle) * Math.PI / 180)];
        var radiusFeature = new Feature({
            geometry: new Point(coordinateControl)
        });
        radiusFeature.set('cameraToken', this.cameraToken);
        radiusFeature.setId("radiusid" + this.cameraToken);
        radiusFeature.setStyle(cameraStyle);
        this.layer.getSource().addFeature(radiusFeature);
    }
    //添加扇形角度控制点
    addAngle(coordinate, angleid) {
        var cameraStyle = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: this.controlColor,
                }),
                stroke: new Stroke({ // 边缘颜色
                    color: "rgba(151, 151, 151, 1)",
                    width: 2
                }),
                rotation: 0,
            }),
        });
        var radiusFeature = new Feature({
            geometry: new Point(coordinate)
        });
        radiusFeature.set('cameraToken', this.cameraToken);
        radiusFeature.setId(angleid);
        radiusFeature.setStyle(cameraStyle);
        this.layer.getSource().removeFeature(this.layer.getSource().getFeatureById(angleid));
        this.layer.getSource().addFeature(radiusFeature);
    }

    //
    getCircularFeature() {
        const coords = this.createCirclePointCoords(this.center, this.radius, this.startAngle, this.endAngle, 360);
        // 创建多边形
        const CreatePolygon = new Polygon([coords]);
        // 返回要素
        return new Feature({ geometry: CreatePolygon });
    }
    createCirclePointCoords(center, circleRadius, startAngle, endAngle, pointsToFind) {
        let angleToAdd = 360 / pointsToFind;
        let coords = [center];
        let angle = startAngle;

        // 经典圆形坐标生成算法
        for (let i = 0; i < pointsToFind; i++) {
            if (angle > endAngle) break;
            let coordX = center[0] + circleRadius * Math.cos((angle + this.rotationAngle) * Math.PI / 180);
            let coordY = center[1] + circleRadius * Math.sin((angle + this.rotationAngle) * Math.PI / 180);
            coords.push([coordX, coordY]);
            angle = angle + angleToAdd;
        }

        this.addAngle(coords[1], "angleid1" + this.cameraToken);
        this.addAngle(coords[coords.length - 1], "angleid2" + this.cameraToken);
        this.coordinateControl = coords[parseInt(coords.length / 2)];
        return coords;
    }
    //计算三点之间的角度
    handleEventAngle(e) {

        let vectorBA = { x: e.coordinate[0] - this.center[0], y: e.coordinate[1] - this.center[1] };
        let vectorBC = { x: this.coordinateControl[0] - this.center[0], y: this.coordinateControl[1] - this.center[1] };

        let dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;

        let lengthBA = Math.sqrt(vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y);
        let lengthBC = Math.sqrt(vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y);

        let angle = Math.acos(dotProduct / (lengthBA * lengthBC));
        let degree = angle * 180 / Math.PI;

        return degree;

    }
    calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance;
    }
    Callback(callbackType) {
        let back = {
            type: this.type,
            id: this.id,
            center: this.center,
            angle: Math.abs(this.endAngle) + Math.abs(this.startAngle),
            rotationAngle: this.rotationAngle,
            radius: this.radius,
            cameraToken: this.cameraToken,
            cameraName: this.cameraName,
            cameraType: this.cameraType,
            accessToken: this.accessToken,
            accessDoorStatus: this.accessDoorStatus,
            whetherDelete: this.whetherDelete,
            callbackType: callbackType ? callbackType : '',
        };
        this.callback(back);
    }

    //摄像机扫描
    animate(event) {
        if (Math.abs(this.totalRotation) >= (Math.abs(this.startAngle) + Math.abs(this.endAngle)) / 2 * Math.PI / 180) {
            //   unByKey(listenerKey);
            //   return;
            this.direction *= -1;
        }

        const vectorContext = getVectorContext(event);
        const rotation = Math.PI / 180 * this.direction; // 每次旋转一度

        const style = new Style({
            stroke: new Stroke({
                // color: 'rgba(255, 0, 0, ' + (1 - Math.abs(totalRotation) / angle) + ')', // 根据时间变化调整颜色和透明度
                color: this.createSpectrumColor(), // 根据时间变化调整颜色和透明度
                width: 2,
            }),
        });
        this.flashGeom.rotate(rotation, this.center); // 以起点为中心旋转
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(this.flashGeom);
        // tell OpenLayers to continue postrender animation
        this.map.render();

        this.totalRotation += rotation; // 累加总旋转角度
    }
    //添加扫描使用的线
    addscan() {
        var lineCoordinates = [this.center, this.coordinateControl];
        const lineGeometry = new LineString(lineCoordinates);
        const feature = new Feature(lineGeometry);
        feature.setId("scan" + this.cameraToken)
        const style = new Style({
            stroke: new Stroke({
                color: 'rgba(255, 0, 0, 0)',
                width: 2,
            }),
        });
        feature.setStyle(style);
        this.flashGeom = feature.getGeometry().clone();
        this.layer.getSource().removeFeature(this.layer.getSource().getFeatureById("scan" + this.cameraToken));
        this.layer.getSource().addFeature(feature);
        this.addPostrender()
    }
    createSpectrumColor() {
        // 使用HSL颜色空间创建渐变色
        const hue = (this.totalRotation * 180 / Math.PI) % 360; // 根据旋转角度计算色相
        const saturation = 100; // 饱和度设为100%
        const lightness = 50; // 亮度设为50%
        const alpha = 1 - Math.abs(this.totalRotation) / (Math.abs(this.startAngle) * Math.PI / 180); // 设置透明度
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }
    addPostrender() {
        this.listenerKey = this.layer.on('postrender', this.animate.bind(this));
    }
    unByKey() {
        this.totalRotation = 0;
        unByKey(this.listenerKey);
    }
}
class h5sCluster {
    constructor(clusterSource) {
        this.clusterSource = clusterSource;
        this.features = {};
    };
    addClusterFeature(conf) {
        let feature = new h5sFeature(conf, this.clusterSource);
        feature.addClusterFeature();
        this.features[feature.cameraToken] = feature;
    }
    Callback(feature, callbackType, Cluster) {
        if (!Cluster) {
            let cameraToken = feature.get("cameraToken");
            this.features[cameraToken].Callback(callbackType);
        } else {
            let cameraToken = feature[0].get("cameraToken");
            this.features[cameraToken].Callback(callbackType, feature);
        }
    }
}
class h5sFeature {
    constructor(conf, clusterSource) {
        this.clusterSource = clusterSource;
        this.map = conf.map;
        this.radius = conf.radius || 1000; // 默认半径为1000
        this.cameraName = conf.cameraName;
        this.cameraToken = conf.cameraToken;
        this.type = conf.type || 'camera'; //类型
        this.cameraIconUrl = this.getCameraColorEnum(conf.cameraType).cameraIconUrl;
        this.center = conf.coordinate; //摄像机点
        this.startAngle = -parseInt(conf.angle / 2) || -45;
        this.endAngle = parseInt(conf.angle / 2) || 45;
        this.rotationAngle = conf.rotationAngle || 0;//旋转角度

        this.coordinateControl = [];
        this.cameraType = conf.cameraType; // 类型
        this.drawIcon = conf.drawIcon || false; //是否只绘制icon
        this.id = conf.id || ''; //camera id 或者视图id 或者maplink id
        this.whetherDelete = conf.whetherDelete || true; // 返回操作是更新(true)还是删除(false)
        this.callback = conf.callback;
    };
    addClusterFeature() {
        if (this.cameraToken != undefined) {
            const coordinate = this.center;

            const cameraFeature = new Feature({
                geometry: new Point(coordinate)
            });
            cameraFeature.set('cameraToken', this.cameraToken);
            cameraFeature.setId("cameraid" + this.cameraToken);
            cameraFeature.set('cameraStyle', this.getCameraStyle());
            this.clusterSource.getSource().addFeature(cameraFeature);
        }
    }

    getCameraColorEnum(pream) {
        let color = {};
        if (!this.accessToken) {
            if (this.type == "camera") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/camera_green.png',
                        circularFillColor: "rgba(105, 226, 66, 0.2)",
                        circularstrokeColor: "rgba(105, 226, 66, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(105, 226, 66, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/camera_orange.png',
                        circularFillColor: "rgba(243, 179, 64, 0.2)",
                        circularstrokeColor: "rgba(243, 179, 64, 1",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(243, 179, 64, 1)",
                    },
                }
            } else if (this.type == "view") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/view_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/view_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            } else if (this.type == "link") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/link_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/link_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            }
        } else {
            if (!this.accessDoorStatus) {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_off_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_off_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            } else {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_on_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_on_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                }
            }
        }
        return color[pream];
    }
    getCameraStyle(size) {
        let cameraStyle = new Style({
            image: new Icon({
                src: store.state.IPPORT + this.cameraIconUrl,
                anchor: [0, 0.5],
                scale: 0.15,
                rotation: this.type == 'view' || this.type == 'accessDoor' ? 0 : Math.PI - this.rotationAngle * Math.PI / 180,
            }),
        });
        return cameraStyle;
    };

    Callback(callbackType, feature) {
        let back = {
            type: this.type,
            id: this.id,
            center: this.center,
            cameraToken: this.cameraToken,
            cameraName: this.cameraName,
            callbackType: callbackType ? callbackType : '',
            feature: feature ? feature : [],
        };
        this.callback(back);
    }
}
export default h5sMap;