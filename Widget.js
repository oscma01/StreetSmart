function _asyncToGenerator(fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value
                } catch (error) {
                    reject(error);
                    return
                }
                if (info.done) {
                    resolve(value)
                } else {
                    return Promise.resolve(value).then(function (value) {
                        step('next', value)
                    }, function (err) {
                        step('throw', err)
                    })
                }
            }
            return step('next')
        })
    }
}
var REQUIRE_CONFIG = {
    async: true,
    locale: 'en',
    paths: { //use the first set of paths for ESRI portal/AGOL, use the second set of paths for Developer's Edition of WAB
        // 'react': 'https://www.arcgis.com/sharing/rest/content/items/0ef1ada896e844d49c2ee99626780f6b/resources/wabwidget/StreetSmart/packages/react.production.min',
        // 'react-dom': 'https://www.arcgis.com/sharing/rest/content/items/0ef1ada896e844d49c2ee99626780f6b/resources/wabwidget/StreetSmart/packages/react-dom.production.min',
        // 'openlayers': 'https://www.arcgis.com/sharing/rest/content/items/0ef1ada896e844d49c2ee99626780f6b/resources/wabwidget/StreetSmart/packages/ol.min',
        // 'lodash': 'https://www.arcgis.com/sharing/rest/content/items/0ef1ada896e844d49c2ee99626780f6b/resources/wabwidget/StreetSmart/packages/lodash.min'
        // 'react': '/widgets/StreetSmart/packages/react.production.min',
        // 'react-dom': '/widgets/StreetSmart/packages/react-dom.production.min',
        // 'openlayers': '/widgets/StreetSmart/packages/ol.min',
        // 'lodash': '/widgets/StreetSmart/packages/lodash.min'
        // 'react': 'https://unpkg.com/react@16.12.0/umd/react.production.min',
        // 'react-dom': 'https://unpkg.com/react-dom@16.12.0/umd/react-dom.production.min',
        // 'openlayers': 'https://cdnjs.cloudflare.com/ajax/libs/openlayers/4.6.5/ol',
        // 'lodash': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min'
        'react': 'https://sld.cyclomedia.com/react/react.production.min',
        'react-dom': 'https://sld.cyclomedia.com/react/react-dom.production.min',
        'openlayers': 'https://sld.cyclomedia.com/react/ol.min',
        'lodash': 'https://sld.cyclomedia.com/react/lodash.min'
    }
};
require(REQUIRE_CONFIG, [], function () {
    return define(['dojo/_base/declare', 'dojo/on', 'dojo/dom', 'dijit/Tooltip', 'jimu/BaseWidget', 'jimu/WidgetManager', 'jimu/PanelManager', 'esri/request', 'esri/SpatialReference', 'esri/geometry/Point', 'esri/geometry/ScreenPoint', 'esri/tasks/locator', 'esri/tasks/query', 'esri/geometry/webMercatorUtils', // 'http://localhost:8081/StreetSmartApi.js',
            'https://streetsmart.cyclomedia.com/api/v22.6/StreetSmartApi.js', './utils', './RecordingClient', './LayerManager', './MeasurementHandler', './SidePanelManager', './OverlayManager', './FeatureLayerManager', './AttributeManager', './arcgisToGeojson', 'esri/layers/WebTiledLayer'], function (declare, on, dom, Tooltip, BaseWidget, WidgetManager, PanelManager, esriRequest, SpatialReference, Point, ScreenPoint, Locator, Query, webMercatorUtils, StreetSmartApi, utils, RecordingClient, LayerManager, MeasurementHandler, SidePanelManager, OverlayManager, FeatureLayerManager, Attributemanager, geojsonUtils, WebTiledLayer) { //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], { // Custom widget code goes here
            baseClass: 'jimu-widget-streetsmartwidget', // This property is `set by the framework when widget is loaded.
            name: 'Street Smart by CycloMedia',
            _zoomThreshold: null,
            _viewerType: StreetSmartApi.ViewerType.PANORAMA,
            _listeners: [],
            _disableLinkToMap: false, // CM properties
            _cmtTitleColor: '#98C23C',
            _apiKey: 'C3oda7I1S_49-rgV63wtWbgtOXcVe3gJWPAVWnAZK3whi7UxCjMNWzIJyv4Fmrcp',
            _mapIdLayerId: {},
            _visibleLayers: {}, // Initial construction, might not be added to DOM yet.
            postCreate: function postCreate() {
                this.inherited(arguments);
                this.wkid = parseInt(this.config.srs.split(':')[1]);
                this.streetIndicatorShouldBeVisible = true;
                utils.setProj4(CM.Proj4.getProj4());
                this._locator = new Locator('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer');
                if (!this.config.showStreetName) {
                    this.streetIndicatorContainer.classList.add('hidden')
                }
                this._recordingClient = new RecordingClient({
                    config: this.config,
                    apiKey: this._apiKey,
                    map: this.map
                });
                this._layerManager = new LayerManager({
                    wkid: this.wkid,
                    map: this.map,
                    onRecordingLayerClick: this._handleRecordingClick.bind(this),
                    setPanoramaViewerOrientation: this.setPanoramaViewerOrientation.bind(this),
                    addEventListener: this.addEventListener.bind(this),
                    config: this.config,
                    nls: this.nls,
                    removeEventListener: this.removeEventListener.bind(this)
                });
                this._measurementHandler = new MeasurementHandler({
                    wkid: this.wkid,
                    map: this.map,
                    layer: this._layerManager.measureLayer,
                    StreetSmartApi: StreetSmartApi
                });
                this._sidePanelManager = new SidePanelManager({
                    sidePanel: this.sidePanel,
                    panoramaViewerDiv: this.panoramaViewerDiv,
                    widget: this
                });
                this._overlayManager = new OverlayManager({
                    widget: this,
                    wkid: this.wkid,
                    map: this.map,
                    config: this.config,
                    StreetSmartApi: StreetSmartApi
                });
                this._featureLayerManager = new FeatureLayerManager({
                    widget: this,
                    map: this.map,
                    wkid: this.wkid,
                    StreetSmartApi: StreetSmartApi
                });
                this._attributeManager = new Attributemanager({
                    widget: this,
                    map: this.map,
                    wkid: this.wkid,
                    config: this.config,
                    nls: this.nls,
                    api: StreetSmartApi
                });
                this._applyWidgetStyle();
                this._determineZoomThreshold()
            },
            startup: function startup() {
                this.inherited(arguments)
            },
            _handleRecordingClick: function _handleRecordingClick(event) {
                var recordingId = event.graphic.attributes.recordingId;
                this.query(recordingId)
            },
            _initApi: function () {
                var _ref = _asyncToGenerator(/*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
                            var _this = this;
                            var decodedToken,
                            CONFIG;
                            return regeneratorRuntime.wrap(function _callee$(_context) {
                                while (1) {
                                    switch (_context.prev = _context.next) {
                                    case 0:
                                        if (!(this.config.agreement !== true)) {
                                            _context.next = 3;
                                            break
                                        }
                                        alert(this.nls.agreementWarning);
                                        return _context.abrupt('return');
                                    case 3:
                                        decodedToken = atob(this.config.token).split(':');
                                        CONFIG = {
                                            targetElement: this.panoramaViewerDiv, // I have no idea where this comes from
                                            username: decodedToken[0],
                                            password: decodedToken[1],
                                            apiKey: this._apiKey,
                                            srs: this.config.srs,
                                            locale: this.config.locale,
                                            configurationUrl: this.config.atlasHost + '/configuration',
                                            addressSettings: {
                                                locale: this.config.locale,
                                                database: 'Nokia'
                                            }
                                        };
                                        return _context.abrupt('return', StreetSmartApi.init(CONFIG).then(function () {
                                                _this.loadingIndicator.classList.add('hidden');
                                                _this._bindInitialMapHandlers();
                                                _this._loadRecordings();
                                                _this._centerViewerToMap();
                                                _this.streetNameLayerID = _this._overlayManager.addStreetNameLayer();
                                                var unitPrefs = _.get(StreetSmartApi, 'Settings.UNIT_PREFERENCE');
                                                if (unitPrefs) {
                                                    var units = _this.config.units || unitPrefs.DEFAULT;
                                                    if (Object.values(unitPrefs).includes(units)) {
                                                        StreetSmartApi.Settings.setUnitPreference(units)
                                                    }
                                                }
                                            }));
                                    case 6:
                                    case 'end':
                                        return _context.stop();
                                    }
                                }
                            }, _callee, this)
                        }));
                function _initApi() {
                    return _ref.apply(this, arguments)
                }
                return _initApi
            }
            (),
            _bindInitialMapHandlers: function _bindInitialMapHandlers() {
                var measurementChanged = StreetSmartApi.Events.measurement.MEASUREMENT_CHANGED;
                this.addEventListener(StreetSmartApi, measurementChanged, this._handleMeasurementChanged.bind(this));
                this.addEventListener(this.map, 'extent-change', this._handleExtentChange.bind(this));
                this.addEventListener(this.map, 'pan-end', this._handleMapMovement.bind(this));
                this.addEventListener(this.map, 'click', this._handleMapClick.bind(this));
                this._sidePanelManager.bindEventListeners()
            },
            _handleMapClick: function _handleMapClick(e) {
                var mapFeature = e.graphic;
                if (!mapFeature) {
                    return
                }
                var layer = mapFeature.getLayer();
                if (layer.type !== 'Feature Layer')
                    return;
                var wm = WidgetManager.getInstance();
                var editWidgets = wm.getWidgetsByName('Edit');
                if (editWidgets.length === 0) {
                    this._attributeManager.showInfoOfFeature(mapFeature)
                }
                if (!layer.getEditCapabilities().canUpdate)
                    return; // rotate towards clicked feature
                var extent = mapFeature.geometry.getExtent && mapFeature.geometry.getExtent();
                var centroid = extent && extent.getCenter() || mapFeature.geometry;
                var featureWkid = centroid.spatialReference.latestWkid || centroid.spatialReference.wkid;
                this._panoramaViewer.lookAtCoordinate([centroid.x, centroid.y], 'EPSG:' + featureWkid);
                var idField = layer.objectIdField;
                var wkid = layer.spatialReference.latestWkid || layer.spatialReference.wkid;
                var meaurementType = geojsonUtils.EsriGeomTypes[layer.geometryType];
                var typeToUse = meaurementType && meaurementType[0];
                if (typeToUse && this.config.allowEditing) {
                    this._selectedLayerID = layer.id;
                    this._get3DFeatures(layer, [mapFeature.attributes[idField]], wkid).then(this._create3DRequestToStartMeasurementHandler(mapFeature, idField, wkid, typeToUse))
                }
            },
            _handleMapMovement: function _handleMapMovement(e) {
                var diff = e.delta.x + e.delta.y;
                if (!this._disableLinkToMap && this.config.linkMapMove === true && !this._panoramaViewer.props.activeMeasurement) {
                    if (diff) {
                        this._centerViewerToMap(e.extent.getCenter())
                    }
                } else if (this._disableLinkToMap) {
                    this._disableLinkToMap = false
                }
            },
            _handleMeasurementChanged: function _handleMeasurementChanged(e) {
                var _e$detail = e.detail,
                panoramaViewer = _e$detail.panoramaViewer,
                activeMeasurement = _e$detail.activeMeasurement;
                var newViewer = panoramaViewer;
                this._handleViewerChanged(newViewer);
                this._measurementHandler.draw(e);
                this.inMeasurement = !!activeMeasurement;
                if (this.config.saveMeasurements) {
                    this._measurementDetails = activeMeasurement;
                    if (!activeMeasurement) {
                        this._selectedFeatureID = null
                    }
                }
                this._measurementHandler.draw(e);
                if (!activeMeasurement && this.config.allowEditing) {
                    this.map.infoWindow.hide()
                }
                if (this.config.showStreetName) {
                    if (activeMeasurement) {
                        this.streetIndicatorContainer.classList.add('hidden');
                        this.streetIndicatorHiddenDuringMeasurement = true
                    } else {
                        if (this.streetIndicatorShouldBeVisible) {
                            this.streetIndicatorContainer.classList.remove('hidden')
                        }
                        this.streetIndicatorHiddenDuringMeasurement = false
                    }
                }
            },
            /**
             * Handles the viewer change and event handler rebinding,
             * starting measurement mode changes the viewer.
             */
            _handleViewerChanged: function _handleViewerChanged(newViewer) { // Handle initial viewer creation
                if (!this._panoramaViewer && newViewer) {
                    this._panoramaViewer = newViewer;
                    this._layerManager.addLayers();
                    this._bindViewerDependantEventHandlers();
                    this._setButtonVisibilityInApi();
                    this._handleImageChange(); // this._drawDraggableMarker();
                    if (this.config.navigation === false) {
                        this._hideNavigation()
                    }
                    return
                } // Update the event handlers and everything else once the viewer changed
                // Always make sure newViewer is set as newViewer can be undefined
                // while this._panoramaViewer can be null
                if (newViewer && newViewer !== this._panoramaViewer) {
                    this.removeEventListener(this._timeTravelListener);
                    this.removeEventListener(this._viewChangeListener);
                    this.removeEventListener(this._imageChangeListener);
                    this.removeEventListener(this._featureClickListener);
                    this.removeEventListener(this._layerTogleListener);
                    this._panoramaViewer = newViewer;
                    this._bindViewerDependantEventHandlers({
                        viewerOnly: true
                    })
                }
            },
            _create3DRequestToStartMeasurementHandler: function _create3DRequestToStartMeasurementHandler(mapFeature, idField, wkid, typeToUse) {
                var _this2 = this;
                return function (res) {
                    var feature = !!res && res.features && wkid == _this2.config.srs.split(':')[1] ? geojsonUtils.arcgisToGeoJSON(res.features[0], idField) : geojsonUtils.arcgisToGeoJSON(mapFeature, idField);
                    if (!feature)
                        return;
                    var newWkid = wkid == _this2.config.srs.split(':')[1] ? wkid : mapFeature.geometry.spatialReference.latestWkid || mapFeature.geometry.spatialReference.wkid;
                    if (newWkid != _this2.config.srs.split(':')[1])
                        return;
                    _this2._selectedFeatureID = feature.properties[idField];
                    if (feature && feature.geometry && feature.geometry.type === 'Point' && wkid != _this2.config.srs.split(':')[1]) {
                        feature.geometry.coordinates = [feature.geometry.coordinates[0], feature.geometry.coordinates[1], res.features[0].geometry.z]
                    }
                    var measurementInfo = geojsonUtils.createFeatureCollection([feature], newWkid);
                    _this2.startMeasurement(typeToUse, measurementInfo)
                }
            },
            _get3DFeatures: function _get3DFeatures(layer, featureIds, wkid) {
                if (layer.type !== 'Feature Layer')
                    return Promise.resolve();
                if (!layer.hasZ)
                    return Promise.resolve();
                var token = layer.credential && layer.credential.token;
                var options = {
                    url: layer.url + '/query?',
                    content: {
                        f: 'json',
                        returnGeometry: true,
                        returnZ: true,
                        outFields: '*',
                        objectIds: [].concat(featureIds),
                        outSpatialReference: wkid
                    }
                };
                if (token)
                    options.content.token = token;
                return esriRequest(options)
            },
            _setButtonVisibilityInApi: function _setButtonVisibilityInApi() {
                var _this3 = this;
                var bv = this.config.buttonVisibility;
                var helperFunction = function helperFunction(key) {
                    if (bv[key] !== undefined) {
                        var button = StreetSmartApi.PanoramaViewerUi.buttons[key];
                        _this3._panoramaViewer.toggleButtonEnabled(button, !!bv[key])
                    } else {
                        console.warn('undefined key found, ' + key)
                    }
                };
                if (bv) {
                    helperFunction('OVERLAYS');
                    helperFunction('ELEVATION');
                    helperFunction('REPORT_BLURRING');
                    helperFunction('OPEN_OBLIQUE');
                    helperFunction('OPEN_POINTCLOUD');
                    helperFunction('MEASURE');
                    helperFunction('SAVE_IMAGE');
                    helperFunction('IMAGE_INFORMATION');
                    helperFunction('ZOOM_IN');
                    helperFunction('ZOOM_OUT')
                }
            }, // Adds event listeners which are automatically
            // cleared onClose
            addEventListener: function addEventListener(target, eventName, callback) {
                var listener = on(target, eventName, callback); // Using dojo on doesn't always return a listener.
                // For the panoramaViewer events it returns the panoramaViewer itself.
                if (!listener.remove) {
                    listener = {
                        remove: function remove() {
                            target.off(eventName, callback)
                        }
                    }
                }
                this._listeners.push(listener);
                return listener
            },
            removeEventListener: function removeEventListener(listener) {
                listener.remove();
                var index = this._listeners.indexOf(listener);
                this._listeners.splice(index, 1)
            },
            _openApiWhenZoomedIn: function _openApiWhenZoomedIn() {
                var _this4 = this;
                this.zoomWarning.classList.remove('hidden'); //GC: show coverage map when widget first opens, even if zoomed out too far
                var coverLayer = new WebTiledLayer('https://atlas.cyclomedia.com/webmercator/cycloramas/{z}/{x}/{y}.png', {
                    'id': 'CycloramaCoverage',
                    'maxScale': 5,
                    'opacity': 0.75
                });
                this.map.addLayer(coverLayer);
                var listener = this.addEventListener(this.map, 'zoom-end', function (zoomEvent) {
                    if (_this4.map.getScale() < _this4._zoomThreshold) {
                        _this4.map.removeLayer(coverLayer);
                        _this4.zoomWarning.classList.add('hidden');
                        _this4._initApi();
                        _this4.removeEventListener(listener)
                    }
                })
            },
            _handleFeatureClick: function _handleFeatureClick(event) {
                var detail = event.detail;
                var mapLayers = _.values(this.map._layers);
                var featureLayers = _.filter(mapLayers, function (l) {
                    return l.type === 'Feature Layer'
                });
                var clickedLayer = featureLayers.find(function (l) {
                    return l.name === detail.layerName
                });
                if (clickedLayer) {
                    var field = clickedLayer.objectIdField;
                    var clickedFeatureID = detail.featureProperties[field];
                    var feature = clickedLayer.graphics.find(function (g) {
                        return g.attributes[field] === clickedFeatureID
                    });
                    var wkid = clickedLayer.spatialReference.latestWkid || clickedLayer.spatialReference.wkid;
                    this._attributeManager.showInfoById(clickedLayer, clickedFeatureID);
                    if (!feature)
                        return;
                    if (clickedLayer.type !== 'Feature Layer' || !clickedLayer.getEditCapabilities().canUpdate)
                        return;
                    var meaurementType = geojsonUtils.EsriGeomTypes[clickedLayer.geometryType];
                    var typeToUse = meaurementType && meaurementType[0];
                    if (typeToUse && this.config.allowEditing) {
                        this._selectedLayerID = clickedLayer.id;
                        this._get3DFeatures(clickedLayer, [clickedFeatureID], wkid).then(this._create3DRequestToStartMeasurementHandler(feature, field, wkid, typeToUse))
                    }
                }
            },
            _handleLayerVisibilityChange: function _handleLayerVisibilityChange(info) {
                var _info$detail = info.detail,
                layerId = _info$detail.layerId,
                visibility = _info$detail.visibility;
                if (layerId === this.streetNameLayerID && this.config.showStreetName && !this.streetIndicatorHiddenDuringMeasurement) {
                    this.streetIndicatorShouldBeVisible = visibility;
                    if (visibility) {
                        this.streetIndicatorContainer.classList.remove('hidden')
                    } else {
                        this.streetIndicatorContainer.classList.add('hidden')
                    }
                } else {
                    this._visibleLayers[layerId] = visibility
                }
            }, //GC: additional function catch time travel change
            _handleTimeChange: function _handleTimeChange(info) {
                this._timeTravel = info.detail.date;
                this._loadRecordings()
            },
            _bindViewerDependantEventHandlers: function _bindViewerDependantEventHandlers(options) {
                var opts = Object.assign({}, options, {
                    viewerOnly: false
                });
                var panoramaEvents = StreetSmartApi.Events.panoramaViewer;
                var viewerEvents = StreetSmartApi.Events.viewer;
                this._timeTravelListener = this.addEventListener(this._panoramaViewer, panoramaEvents.TIME_TRAVEL_CHANGE, this._handleTimeChange.bind(this));
                this._viewChangeListener = this.addEventListener(this._panoramaViewer, panoramaEvents.VIEW_CHANGE, this._handleConeChange.bind(this));
                this._imageChangeListener = this.addEventListener(this._panoramaViewer, panoramaEvents.IMAGE_CHANGE, this._handleImageChange.bind(this));
                this._featureClickListener = this.addEventListener(this._panoramaViewer, panoramaEvents.FEATURE_CLICK, this._handleFeatureClick.bind(this));
                this._layerTogleListener = this.addEventListener(this._panoramaViewer, viewerEvents.LAYER_VISIBILITY_CHANGE, this._handleLayerVisibilityChange.bind(this));
                this._panoramaViewer.showAttributePanelOnFeatureClick(false);
                if (!opts.viewerOnly) {
                    this.addEventListener(this.map, 'zoom-end', this._handleConeChange.bind(this))
                } // if we need to save measurements overwrite the default click behaviour.
                if (this.config.saveMeasurements && !this._measurementButtonOverwrideTimer) {
                    var clickHandler = this._handleMeasurementPanelToggle.bind(this); // only supports one viewer, having multiple viewers will break this.
                    var replaceMeasurementButton = function replaceMeasurementButton() {
                        var measurementButton = document.getElementsByClassName('glyphicon novaicon-ruler-1')[0];
                        if (measurementButton && measurementButton.parentNode.onclick !== clickHandler) {
                            var button = measurementButton.parentNode;
                            var new_element = button.cloneNode(true);
                            new_element.onclick = clickHandler;
                            button.parentNode.replaceChild(new_element, button)
                        }
                    };
                    this._measurementButtonOverwrideTimer = setInterval(replaceMeasurementButton, 50)
                }
            },
            _handleMeasurementPanelToggle: function _handleMeasurementPanelToggle(e) {
                this._sidePanelManager.toggleMeasurementSidePanel(true)
            }, // We do not use removeEventListener for this,
            // as removing stuff in an array is a bad idea.
            _removeEventListeners: function _removeEventListeners() {
                this._listeners.forEach(function (listener) {
                    listener.remove()
                });
                this._listeners = []
            },
            _handleConeChange: function _handleConeChange() { //GC: Checks if cycloramas are found in the area and creates an alert message while closing the widget if no recordings were found
                if (this._panoramaViewer) {
                    this._layerManager.updateViewingCone(this._panoramaViewer)
                } else {
                    alert(this.nls.recordingAlert);
                    PanelManager.getInstance().closePanel(this.id + '_panel')
                }
            },
            _handleImageChange: function _handleImageChange() {
                var _this5 = this;
                this._handleConeChange();
                this._overlayManager.addOverlaysToViewer();
                if (!this._disableLinkToMap && this.config.linkMapMove === true && !this._panoramaViewer.props.activeMeasurement) {
                    var recording = this._panoramaViewer.getRecording();
                    if (!recording || !recording.xyz) {
                        return
                    }
                    var x = recording.xyz[0];
                    var y = recording.xyz[1];
                    if (!x || !y) {
                        return
                    }
                    var coord = new Point(x, y, this._layerManager.srs); // Transform local SRS to Web Mercator:
                    var coordLocal = utils.transformProj4js(coord, this.map.spatialReference.wkid);
                    this.map.centerAt(coordLocal);
                    this._disableLinkToMap = true
                }
                var rec = this._panoramaViewer.getRecording();
                var xyz = rec.xyz;
                var srs = rec.srs;
                var point = new Point(xyz[0], xyz[1], new SpatialReference(Number(srs.split(':')[1])));
                var location = utils.transformProj4js(point, 102100);
                this._locator.locationToAddress(location, 0, function (result) {
                    var el = _this5.streetIndicator;
                    if (el) {
                        el.innerHTML = result.address.Address
                    }
                })
            },
            _handleExtentChange: function _handleExtentChange() {
                this._loadRecordings()
            },
            _loadRecordings: function _loadRecordings() {
                var _this6 = this;
                if (!this.config.navigation) {
                    return
                }
                if (this.map.getScale() < this._zoomThreshold) { //GC: include the time travel variable if it was activated
                    this._recordingClient.load(this._timeTravel).then(function (response) {
                        _this6._layerManager.updateRecordings(response)
                    })
                } else {
                    this._layerManager.updateRecordings([])
                }
            },
            _applyWidgetStyle: function _applyWidgetStyle() {
                var panel = this.getPanel(); // Set title color for Widget.
                if (panel.titleNode) {
                    panel.titleNode.style.backgroundColor = this._cmtTitleColor;
                    if (panel.titleLabelNode)
                        panel.titleLabelNode.style.color = 'white'
                } // Remove padding (white 'border') around viewer.
                var container = panel.containerNode.children[0];
                if (container) {
                    container.style.padding = '0px'
                }
            }, //GC: Added a new function to get the dateRange of the current time travel
            _getDateRange: function _getDateRange(timeTravel) {
                var now = timeTravel;
                var date2 = '31'; //Makes the end date 28 if the end month is February
                if (now.getMonth() + 1 === 1) {
                    date2 = '28'
                } //Makes the end date 30 if the end month is April, June, September, or November
                if (now.getMonth() + 1 === 3 || now.getMonth() + 1 === 5 || now.getMonth() + 1 === 8 || now.getMonth() + 1 === 10) {
                    date2 = '30'
                } //separate start and end dates by three months
                var month1 = now.getMonth();
                var month2 = now.getMonth() + 2;
                var year1 = now.getFullYear();
                var year2 = now.getFullYear();
                if (month1 === 0) {
                    month1 = '12';
                    year1 = now.getFullYear() - 1
                } else if (month1 < 10) {
                    month1 = '0' + month1
                }
                if (month2 === 13) {
                    month2 = '01';
                    year2 = now.getFullYear() + 1
                } else if (month2 < 10) {
                    month2 = '0' + month2
                }
                return {
                    from: year1 + '-' + month1 + '-01',
                    to: year2 + '-' + month2 + '-' + date2
                }
            },
            _centerViewerToMap: function _centerViewerToMap(center) {
                var mapCenter = center || this.map.extent.getCenter();
                var mapSRS = this.config.srs.split(':')[1];
                var localCenter = utils.transformProj4js(mapCenter, mapSRS); //GC: Create coordinate and date range variables used to keep the panorama in the current time setting instead of resetting it to the default
                var coord = [localCenter.x, localCenter.y+5000];
                var dateRange = null;
                if (this._timeTravel) {
                    dateRange = this._getDateRange(this._timeTravel)
                } // Manually fire these events as they are fired too early by the API,
                // we can't listen to them yet.
                this.query(localCenter.x + ',' + localCenter.y, coord, dateRange)
            },
            query: function query(_query, coord, range) {
                var _this7 = this;
                var timeTravelVisible = this.config.timetravel !== undefined ? this.config.timetravel : false; //GC: opens the API with current time settings if the time travel variable is active
                if (range) {
                    return StreetSmartApi.open({
                        coordinate: coord,
                        dateRange: range
                    }, {
                        viewerType: [this._viewerType],
                        srs: this.config.srs,
                        panoramaViewer: {
                            closable: false,
                            maximizable: true,
                            timeTravelVisible: timeTravelVisible,
                            measureTypeButtonVisible: !this.config.saveMeasurements,
                            measureTypeButtonStart: !this.config.saveMeasurements,
                            measureTypeButtonToggle: !this.config.saveMeasurements
                        }
                    }).then(function (result) {
                        var viewer = result.length ? result[0] : null;
                        _this7._handleViewerChanged(viewer);
                        _this7._handleConeChange()
                    })
                } else {
                    return StreetSmartApi.open(_query, {
                        viewerType: [this._viewerType],
                        srs: this.config.srs,
                        panoramaViewer: {
                            closable: false,
                            maximizable: true,
                            timeTravelVisible: timeTravelVisible,
                            measureTypeButtonVisible: !this.config.saveMeasurements,
                            measureTypeButtonStart: !this.config.saveMeasurements,
                            measureTypeButtonToggle: !this.config.saveMeasurements
                        }
                    }).then(function (result) {
                        var viewer = result.length ? result[0] : null;
                        _this7._handleViewerChanged(viewer);
                        _this7._handleConeChange()
                    })
                }
            },
            setPanoramaViewerOrientation: function setPanoramaViewerOrientation(orientation) {
                var currentOrientation = this._panoramaViewer.getOrientation();
                this._panoramaViewer.setOrientation(Object.assign({}, currentOrientation, orientation))
            },
            _determineZoomThreshold: function _determineZoomThreshold() { // Explicit zoom level replaced for zoom scale values for consistency.
                var zoomThreshold = 1200;
                this._zoomThreshold = zoomThreshold;
                return zoomThreshold
            },
            _hideNavigation: function _hideNavigation() {
                var _this8 = this;
                setTimeout(function () {
                    _this8._panoramaViewer.toggleRecordingsVisible(false)
                })
            },
            onOpen: function onOpen() {
				var panel = this.getPanel();
				panel.position.width = window.innerWidth/2; 
				//panel.position.height = 900;
				panel.setPosition(panel.position);        
				panel.panelManager.normalizePanel(panel);  
                var zoomLevel = this.map.getScale(); // Only open when the current zoom scale is close enough to the ground.
                if (zoomLevel < this._zoomThreshold) {
                    this._initApi()
                } else {
                    this._openApiWhenZoomedIn()
                }
            },
            onClose: function onClose() { //GC: Removes the coverage layer in case it was not removed before zooming in first
                if (this.map.getLayer('CycloramaCoverage')) {
                    this.map.removeLayer(this.map.getLayer('CycloramaCoverage'))
                }
                StreetSmartApi.destroy({
                    targetElement: this.panoramaViewerDiv
                });
                this.loadingIndicator.classList.remove('hidden');
                this.streetIndicator.innerHTML = '';
                this._overlayManager.reset();
                this._removeEventListeners();
                this._layerManager.removeLayers();
                this._panoramaViewer = null;
                this._selectedFeatureID = null;
                this._measurementButtonOverwrideTimer = clearInterval(this._measurementButtonOverwrideTimer);
                this._saveButtonOverwrideTimer = clearInterval(this._saveButtonOverwrideTimer);
                this._timeTravel = null;
                this._mapIdLayerId = {};
                this._visibleLayers = {};
                if (this._sidePanelManager && this._sidePanelManager.removeEventListener) {
                    this._sidePanelManager.removeEventListener()
                }
                this._sidePanelManager.toggleMeasurementSidePanel(false)
            },
            _drawDraggableMarker: function _drawDraggableMarker() {
                var nav = this.panoramaViewerDiv.querySelector('.navbar .navbar-right .nav');
                if (!nav)
                    return;
                var exampleButton = nav.querySelector('.btn'); // Draw the actual button in the same style as the other buttons.
                var markerButton = dojo.create('button', {
                    id: 'addMapDropBtn',
                    class: exampleButton.className,
                    draggable: true,
                    ondragend: this._handleMarkerDrop.bind(this)
                });
                nav.appendChild(markerButton);
                var toolTipMsg = this.nls.tipDragDrop;
                new Tooltip({
                    connectId: markerButton,
                    label: toolTipMsg,
                    position: ['above']
                })
            },
            _handleMarkerDrop: function _handleMarkerDrop(e) {
                e.preventDefault(); // Figure out on what pixels (relative to the map) the marker was dropped.
                var containerOffset = this.map.container.getBoundingClientRect();
                var mapRelativePixels = {
                    x: e.clientX - containerOffset.x,
                    y: e.clientY - containerOffset.y
                };
                var sPoint = new ScreenPoint(mapRelativePixels.x, mapRelativePixels.y);
                var mPoint = this.map.toMap(sPoint);
                var vPoint = utils.transformProj4js(mPoint, this.wkid);
                this.query(vPoint.x + ',' + vPoint.y)
            }, //GC: Added additional measurement options
            startMeasurement: function startMeasurement(type, geojson) {
                var _this9 = this;
                var geometry = void 0;
                switch (type) {
                case 'POINT':
                    geometry = StreetSmartApi.MeasurementGeometryType.POINT;
                    StreetSmartApi.startMeasurementMode(this._panoramaViewer, {
                        geometry: geometry
                    });
                    break;
                case 'LINE':
                    geometry = StreetSmartApi.MeasurementGeometryType.LINESTRING;
                    StreetSmartApi.startMeasurementMode(this._panoramaViewer, {
                        geometry: geometry
                    });
                    break;
                case 'POLYGON':
                    geometry = StreetSmartApi.MeasurementGeometryType.POLYGON;
                    StreetSmartApi.startMeasurementMode(this._panoramaViewer, {
                        geometry: geometry
                    });
                    break;
                case 'ORTHOGONAL':
                    geometry = StreetSmartApi.MeasurementGeometryType.ORTHOGONAL;
                    StreetSmartApi.startMeasurementMode(this._panoramaViewer, {
                        geometry: geometry
                    });
                    break;
                case 'HEIGHT':
                    geometry = StreetSmartApi.MeasurementGeometryType.HEIGHT;
                    StreetSmartApi.startMeasurementMode(this._panoramaViewer, {
                        geometry: geometry
                    });
                    break;
                default:
                    console.error('API ERROR: unknown measurement geometry type. Could be undefined');
                    break;
                } // collapse the sidebar after a 10 frame delay,
                // doing it directly throws an exception as the measurement mode hasn't started yet.
                window.setTimeout(function () {
                    _this9._panoramaViewer.toggleSidebarExpanded(false);
                    if (geojson) {
                        StreetSmartApi.setActiveMeasurement(geojson)
                    }
                }, 160); // if we need to save measurements overwrite the default click behaviour.
                if (this.config.saveMeasurements && !this._saveButtonOverwrideTimer && this._selectedLayerID) {
                    var clickHandler = this._handleMeasurementPanelToggle.bind(this); // only supports one viewer, having multiple viewers will break this.
                    var placeSaveButton = function placeSaveButton() {
                        var panel = document.getElementsByClassName('floating-panel-controls')[0];
                        if (panel && panel.children.length !== 2) {
                            var button = panel.childNodes[0];
                            var clone = button.cloneNode(true);
                            clone.childNodes[0].classList.remove('novaicon-navigation-down-3');
                            clone.childNodes[0].classList.add('novaicon-data-download-2');
                            panel.insertBefore(clone, button);
                            clone.onclick = _this9._saveMeasurement.bind(_this9)
                        }
                    };
                    this._saveButtonOverwrideTimer = setInterval(placeSaveButton, 50)
                } else if (this._saveButtonOverwrideTimer && !this._selectedLayerID) {
                    this._saveButtonOverwrideTimer = clearInterval(this._saveButtonOverwrideTimer)
                }
            },
            _rerender: function _rerender() {
                this._overlayManager.addOverlaysToViewer()
            },
            _saveMeasurement: function _saveMeasurement() {
                var _this10 = this;
                var layer = this.map.getLayer(this._selectedLayerID);
                if (layer) {
                    var editID = this._selectedFeatureID;
                    this._featureLayerManager._saveMeasurementsToLayer(layer, this._measurementDetails, editID).then(function (r) {
                        var changes = _.get(r, 'addResults[0]') || _.get(r, 'updateResults[0]');
                        if (changes) {
                            var featureId = changes.objectId;
                            if (_this10._layerUpdateListener)
                                _this10._layerUpdateListener.remove();
                            _this10._layerUpdateListener = _this10.addEventListener(layer, 'update-end', function () {
                                _this10._rerender.bind(_this10)();
                                _this10._attributeManager.showInfoById(layer, featureId);
                                if (_this10._layerUpdateListener)
                                    _this10._layerUpdateListener.remove()
                            })
                        }
                    });
                    StreetSmartApi.stopMeasurementMode()
                }
            }, // communication method between widgets
            onReceiveData: function onReceiveData(name, widgetId, data) {
                if (name !== 'Search') {
                    return
                }
                if (data.selectResult) {
                    var searchedPoint = data.selectResult.result.feature.geometry;
                    var searchedPtLocal = utils.transformProj4js(searchedPoint, this.wkid);
                    this.query(searchedPtLocal.x + ',' + searchedPtLocal.y)
                }
            }
        })
    })
});
