function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function')}}define(['esri/dijit/AttributeInspector','esri/geometry/Point','esri/dijit/InfoWindow','dojo/dom-construct','dijit/form/Button','esri/request'],function(AttributeInspector,Point,InfoWindow,domConstruct,Button,esriRequest){return function(){function AttributeManager(_ref){var map=_ref.map,widget=_ref.widget,wkid=_ref.wkid,config=_ref.config,nls=_ref.nls,api=_ref.api;_classCallCheck(this,AttributeManager);this.map=map;this.wkid=wkid;this.widget=widget;this.config=config;this.nls=nls;this.api=api}AttributeManager.prototype._constructLayerInfo=function _constructLayerInfo(layer){var layerInfos=[{'featureLayer':layer,'showAttachments':false,'isEditable':layer.isEditable&&layer.isEditable()&&layer.getEditCapabilities().canUpdate,'fieldInfos':layer.infoTemplate.info.fieldInfos}];return layerInfos};AttributeManager.prototype._constructInspectorSettings=function _constructInspectorSettings(layer){return{layerInfos:this._constructLayerInfo(layer)}};AttributeManager.prototype._applyUpdatesToLayer=function _applyUpdatesToLayer(layer,feature){var token=layer.credential&&layer.credential.token;var options={url:layer.url+'/applyEdits',content:{f:'json'},handleAs:'json'};options.content.updates=JSON.stringify({attributes:feature.attributes});if(token)options.content.token=token;return esriRequest(options,{usePost:true})};AttributeManager.prototype._constructNewInspector=function _constructNewInspector(layer){var _this=this;this.inspector&&this.inspector.destroy();this.inspector=new AttributeInspector(this._constructInspectorSettings(layer),domConstruct.create('div',{'class':'cmt-attribute-inspector'}));this.inspector.on('delete',function(evt){evt.feature.getLayer().applyEdits(null,null,[evt.feature]);_this.map.infoWindow.hide();_this.widget._overlayManager.addOverlaysToViewer();_this.api.stopMeasurementMode()});var saveButton=new Button({label:this.nls.save,'class':'saveButton'},domConstruct.create('div'));this.inspector.deleteBtn.label=this.nls.delete;domConstruct.place(saveButton.domNode,this.inspector.deleteBtn.domNode,'after');saveButton.on('click',function(){_this.map.infoWindow.hide();_this._applyUpdatesToLayer(layer,_this.selectedFeature).then(function(){_this.widget._overlayManager.addOverlaysToViewer()})});this.inspector.on('attribute-change',function(evt){//store the updates to apply when the save button is clicked
_this.selectedFeature.attributes[evt.fieldName]=evt.fieldValue});this.inspector.on('next',function(evt){_this.selectedFeature=evt.feature});return this.inspector};AttributeManager.prototype._showInfoWindowWithFeature=function _showInfoWindowWithFeature(feature){this._showInfoWindow(feature);this.map.infoWindow.setFeatures([feature])};AttributeManager.prototype._showInfoWindow=function _showInfoWindow(feature){var extent=feature.geometry.getExtent&&feature.geometry.getExtent();var centroid=extent&&extent.getCenter()||feature.geometry;//GC: checks if the clicked feature is a line and moves to the center of the path depending how long it is
if(feature.geometry&&feature.geometry.paths){var half=feature.geometry.paths[0].length/2;half=Math.floor(half);var halfPoint=feature.geometry.paths[0][half];centroid.x=halfPoint[0];centroid.y=halfPoint[1]}this.map.infoWindow.resize(350,240);this.map.infoWindow.show(new Point(centroid));this.map.infoWindow.setTitle('');//GC: stop the map from centering on the clicked feature because it's disorienting
//this.map.centerAt(centroid)
};AttributeManager.prototype.showInfoOfFeature=function showInfoOfFeature(feature){if(!this.config.allowEditing)return this._showInfoWindowWithFeature(feature);var insp=this._constructNewInspector(feature.getLayer());this.map.infoWindow.clearFeatures();this.map.infoWindow.setContent(insp.domNode);this._showInfoWindow(feature);this.inspector.showFeature(feature);this.selectedFeature=feature};AttributeManager.prototype.showInfoById=function showInfoById(layer,featureID){var field=layer.objectIdField;var feature=layer.graphics.find(function(g){return g.attributes[field]===featureID});if(!feature)return;this.showInfoOfFeature(feature)};return AttributeManager}()});