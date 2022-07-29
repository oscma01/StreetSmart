function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function')}}define(['react','react-dom','./Components/sidePanel'],function(react,reactDom,SidePanel){return function(){function SidePanelManager(_ref){var sidePanel=_ref.sidePanel,panoramaViewerDiv=_ref.panoramaViewerDiv,widget=_ref.widget;_classCallCheck(this,SidePanelManager);this._sidePanelContainer=sidePanel;this._panoramaViewerDiv=panoramaViewerDiv;this._widget=widget;this.render();this.handleKeyPress=this.handleKeyPress.bind(this)}SidePanelManager.prototype.render=function render(){reactDom.render(react.createElement(SidePanel,{sidePanelContainer:this._sidePanelContainer,panoramaViewerDiv:this._panoramaViewerDiv,widget:this._widget,togglePanel:this.toggleMeasurementSidePanel.bind(this),selectLayer:this.selectLayer.bind(this),selectGeometryType:this.selectGeometryType.bind(this)}),this._sidePanelContainer)};SidePanelManager.prototype.bindEventListeners=function bindEventListeners(){window.document.addEventListener('keyup',this.handleKeyPress)};SidePanelManager.prototype.removeEventListeners=function removeEventListeners(){window.document.removeEventListener('keyup',this.handleKeyPress)};SidePanelManager.prototype.handleKeyPress=function handleKeyPress(e){if(document.activeElement.tagName==='INPUT')return;var _widget=this._widget,_lastSelectedLayer=this._lastSelectedLayer,_lastSelectedGeometryType=this._lastSelectedGeometryType;var _widget$config=_widget.config,saveMeasurements=_widget$config.saveMeasurements,buttonVisibility=_widget$config.buttonVisibility,_measurementDetails=_widget._measurementDetails,inMeasurement=_widget.inMeasurement;if(!buttonVisibility.MEASURE)return;if(e.key!=='n')return;if(inMeasurement&&saveMeasurements&&_measurementDetails){+_widget._saveMeasurement()}else if(!inMeasurement){if(_lastSelectedLayer&&_lastSelectedGeometryType){_widget._selectedLayerID=_lastSelectedLayer;_widget.startMeasurement(_lastSelectedGeometryType);this.toggleMeasurementSidePanel(false)}else if(saveMeasurements){this.toggleMeasurementSidePanel(true)}}};SidePanelManager.prototype.selectLayer=function selectLayer(v){this._lastSelectedLayer=v};SidePanelManager.prototype.selectGeometryType=function selectGeometryType(v){this._lastSelectedGeometryType=v};SidePanelManager.prototype.toggleMeasurementSidePanel=function toggleMeasurementSidePanel(stance){var newValue=this._sidePanelContainer&&this._sidePanelContainer.classList.contains('hidden');if(stance!==undefined){newValue=stance}if(newValue){this.showSidepanel()}else{this.hideSidePanel()}};SidePanelManager.prototype.showSidepanel=function showSidepanel(){this._sidePanelContainer.classList.remove('slide-out-panel')};SidePanelManager.prototype.hideSidePanel=function hideSidePanel(){this._sidePanelContainer.classList.add('slide-out-panel')};return SidePanelManager}()});