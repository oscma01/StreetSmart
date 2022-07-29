var _typeof=typeof Symbol==='function'&&typeof Symbol.iterator==='symbol'?function(obj){return typeof obj}:function(obj){return obj&&typeof Symbol==='function'&&obj.constructor===Symbol&&obj!==Symbol.prototype?'symbol':typeof obj};function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function')}}define(['esri/renderers/SimpleRenderer','esri/renderers/ClassBreaksRenderer','esri/renderers/UniqueValueRenderer','esri/symbols/SimpleMarkerSymbol'],function(SimpleRenderer,ClassBreaksRenderer,UniqueValueRenderer,SimpleMarkerSymbol){'use strict';return function(){function SLD(mapLayer,geojson){_classCallCheck(this,SLD);this.mapLayer=mapLayer;this.geojson=geojson;this.containsDefaultCase=false;this.cases=this.generateCases();this.rules=this.cases.map(this.createRuleForSymbolCase.bind(this));this.xml=this.createXml()}// A mapLayer can render multiple symbols.
// Each symbol represents a Rule in an SLD.
// Create a symbol and its correspondig filter per unique symbol.
SLD.prototype.generateCases=function generateCases(){var _this=this;var mapLayer=this.mapLayer;var renderer=mapLayer.renderer;if(renderer instanceof SimpleRenderer){var symbol=_.cloneDeep(renderer.getSymbol());this.applyLayerAlpha(symbol,mapLayer);return[{filter:null,// Every symbol is the same, so no filtering needed
symbol:symbol,geometryType:mapLayer.geometryType}]}if(renderer instanceof UniqueValueRenderer){var attribute=renderer.attributeField;var specialCases=renderer.infos.map(function(uniqueValue){var symbol=_.cloneDeep(uniqueValue.symbol);_this.applyLayerAlpha(symbol,mapLayer);return{filter:{value:uniqueValue.value,attribute:attribute},symbol:symbol,geometryType:mapLayer.geometryType}});// Add the "else" symbol (default case) to the list
if(renderer.defaultSymbol){this.containsDefaultCase=true;var defaultCase={filter:{value:1,attribute:'SLD_DEFAULT_CASE'},symbol:renderer.defaultSymbol,geometryType:mapLayer.geometryType};return[defaultCase].concat(specialCases)}return specialCases}if(renderer instanceof ClassBreaksRenderer){var _ret=function(){var baseSymbol=_.cloneDeep(renderer.infos[0].symbol);var cases=[];var features=_this.geojson.features;var _loop=function _loop(i){var feature=features[i];var result={};renderer.authoringInfo.visualVariables.forEach(function(meta){var info=renderer.visualVariables.find(function(item){return item.type===meta.type});var type=meta.type;if(renderer.valueExpression){console.warn('We cannot render this, it is too advanced');result[type]={filter:null,symbol:baseSymbol,geometryType:mapLayer.geometryType};return}if(type==='colorInfo'){var style=_this.colorInfoToCases(feature,baseSymbol,renderer.defaultSymbol,info,meta,mapLayer);// set colorInfo to null, so we know it hsa been processed but is not present.
result[type]=style?style:null}else if(type==='sizeInfo'){result[type]=_this.sizeInfoToCases(feature,baseSymbol,renderer.defaultSymbol,info,mapLayer)}else{console.warn('Unsupported ClassBreak Attributes')}});var resultSymbol=null;var colorInfo=result['colorInfo'];var sizeInfo=result['sizeInfo'];if(colorInfo){resultSymbol=colorInfo.symbol}if(sizeInfo){if(resultSymbol){resultSymbol.size=sizeInfo.symbol.size}else if(colorInfo!==null){resultSymbol=sizeInfo.symbol}}if(resultSymbol){feature.properties['CMT_UNIQUE_STYLING_ID']=i;cases.push({filter:{value:i,attribute:'CMT_UNIQUE_STYLING_ID'},symbol:resultSymbol,geometryType:mapLayer.geometryType})}};for(var i=0;i<features.length;i++){_loop(i)}return{v:cases}}();if((typeof _ret==='undefined'?'undefined':_typeof(_ret))==='object')return _ret.v}console.warn('Unsupported renderer found',mapLayer.name);return[{filter:null,symbol:renderer.defaultSymbol}]};SLD.prototype.applyLayerAlpha=function applyLayerAlpha(symbol,layer){if(symbol.color)symbol.color.a*=layer.opacity;if(symbol.outline&&symbol.outline.color)symbol.outline.color.a*=layer.opacity};SLD.prototype.sizeInfoToCases=function sizeInfoToCases(feature,base,defaultSymbol,info,layer){var maxDataValue=info.maxDataValue,minDataValue=info.minDataValue,maxSize=info.maxSize,minSize=info.minSize,valueExpression=info.valueExpression,field=info.field;if(valueExpression){console.warn('We cant do this yet');return}var value=feature.properties[field];var newsymbol=_.cloneDeep(base);this.applyLayerAlpha(newsymbol,layer);if(value||value===0){var percentage=(value-minDataValue)/(maxDataValue-minDataValue);var size=minSize+percentage*(maxSize-minSize);// clamp size
size=size<=minSize?minSize:size>=maxSize?maxSize:size;newsymbol.size=size;return{filter:{value:value,attribute:field},symbol:newsymbol,geometryType:layer.geometryType}}else{if(!defaultSymbol)return;this.containsDefaultCase=true;var defaultToUse=_.cloneDeep(defaultSymbol);this.applyLayerAlpha(defaultToUse,layer);return{filter:{value:1,attribute:'SLD_DEFAULT_CASE'},symbol:defaultSymbol,geometryType:layer.geometryType}}};SLD.prototype.colorInfoToCases=function colorInfoToCases(feature,base,defaultSymbol,info,meta,layer){var stops=info.stops,field=info.field;var maxSliderValue=meta.maxSliderValue,minSliderValue=meta.minSliderValue;var value=feature.properties[field];for(var i=0;i<stops.length;i++){var stop=stops[i];var nextStop=stops[i+1];var symbol=_.cloneDeep(base);var symbolChanged=false;if(!value&&value!==0){if(!defaultSymbol)return;this.containsDefaultCase=true;var defaultToUse=_.cloneDeep(defaultSymbol);this.applyLayerAlpha(defaultToUse,layer);return{filter:{value:1,attribute:'SLD_DEFAULT_CASE'},symbol:defaultToUse,geometryType:layer.geometryType}}if(!nextStop||value<=stop.value){symbol.color=_.cloneDeep(stop.color);this.applyLayerAlpha(symbol,layer);symbolChanged=true}if(!symbolChanged&&value>stop.value&&value<nextStop.value){// calculate linear transition between two stops
var percentage=(value-stop.value)/(nextStop.value-stop.value);var r=stop.color.r+percentage*(nextStop.color.r-stop.color.r);var g=stop.color.g+percentage*(nextStop.color.g-stop.color.g);var b=stop.color.b+percentage*(nextStop.color.b-stop.color.b);var a=stop.color.a+percentage*(nextStop.color.a-stop.color.a);symbol.color.r=Math.round(r);symbol.color.g=Math.round(g);symbol.color.b=Math.round(b);symbol.color.a=Math.round(a);this.applyLayerAlpha(symbol,layer);symbolChanged=true}if(symbolChanged){return{filter:{value:value,attribute:field},symbol:symbol,geometryType:layer.geometryType}}}throw'No style found, this shouldnt happen'};SLD.prototype.createRuleForSymbolCase=function createRuleForSymbolCase(_ref){var filter=_ref.filter,symbol=_ref.symbol,geometryType=_ref.geometryType;return'\n                <Rule>\n                    '+this.createSldFilter(filter)+'\n                    '+this.createSymbolizer(symbol,{geometryType:geometryType})+'\n                </Rule>\n            '};// Transform `infos` to filter
SLD.prototype.createSldFilter=function createSldFilter(filter){if(!filter){return''}var content='<PropertyName>'+filter.attribute+'</PropertyName><Literal>'+filter.value+'</Literal>';return'<Filter><PropertyIsEqualTo>'+content+'</PropertyIsEqualTo></Filter>'};SLD.prototype._createStrokeAndFill=function _createStrokeAndFill(symbol){var stroke='';var fill='';if(symbol.outline){stroke='<Stroke>\n                    <SvgParameter name="stroke">'+symbol.outline.color.toHex()+'</SvgParameter>\n                    <SvgParameter name="stroke-opacity">'+symbol.outline.color.a+'</SvgParameter>\n                    <SvgParameter name="stroke-width">'+symbol.outline.width+'</SvgParameter>\n                  </Stroke>'}if(symbol.color){fill='<Fill>\n                            <SvgParameter name="fill">'+symbol.color.toHex()+'</SvgParameter>\n                            <SvgParameter name="fill-opacity">'+symbol.color.a+'</SvgParameter>\n                        </Fill>'}else{fill='<Fill>\n                            <SvgParameter name="fill">#ffffff</SvgParameter>\n                            <SvgParameter name="fill-opacity">0.01</SvgParameter>\n                        </Fill>'}return{stroke:stroke,fill:fill}};// Transform arcGis symbol to SLD
SLD.prototype.createSymbolizer=function createSymbolizer(symbol,_ref2){var geometryType=_ref2.geometryType;switch(geometryType){case'esriGeometryPolygon':return this.createPolygonSymbolizer(symbol);case'esriGeometryPolyline':return this.createLineSymbolizer(symbol);case'esriGeometryPoint':default:return this.createPointSymbolizer(symbol);}};SLD.prototype.createPolygonSymbolizer=function createPolygonSymbolizer(symbol){var _createStrokeAndFill2=this._createStrokeAndFill(symbol),stroke=_createStrokeAndFill2.stroke,fill=_createStrokeAndFill2.fill;return'\n                <PolygonSymbolizer>\n                    '+fill+'\n                    '+stroke+'\n                </PolygonSymbolizer>\n            '};SLD.prototype.createLineSymbolizer=function createLineSymbolizer(symbol){return'\n                <LineSymbolizer>\n                    <Stroke>\n                        <SvgParameter name="stroke">'+symbol.color.toHex()+'</SvgParameter>\n                        <SvgParameter name="stroke-opacity">'+symbol.color.a+'</SvgParameter>\n                        <SvgParameter name="stroke-width">'+symbol.width+'</SvgParameter>\n                    </Stroke>\n                </LineSymbolizer>\n            '};SLD.prototype._createWellKnownName=function _createWellKnownName(symbol){// asdfsdfdsfasdfsaf
switch(symbol.style){case SimpleMarkerSymbol.STYLE_PATH:case SimpleMarkerSymbol.STYLE_SQUARE:case SimpleMarkerSymbol.STYLE_DIAMOND:return'square';case SimpleMarkerSymbol.STYLE_X:// return 'x'; // The StreetSmartAPI does not support 'x'
case SimpleMarkerSymbol.STYLE_CROSS:return'cross';case SimpleMarkerSymbol.STYLE_CIRCLE:default:return'circle';}};SLD.prototype.createPointSymbolizer=function createPointSymbolizer(symbol){var content='';if(symbol===undefined){return}if(symbol.type==='picturemarkersymbol'){var size=!symbol.size||symbol.size<12?12:symbol.size;content='\n                    <ExternalGraphic>\n                       <OnlineResource xlink:type="simple" xlink:href="'+symbol.url+'" />\n                       <Format>'+symbol.contentType+'</Format>\n                    </ExternalGraphic>\n                    <Size>'+size+'</Size>\n                '}else{var wellKnownName=this._createWellKnownName(symbol);var _createStrokeAndFill3=this._createStrokeAndFill(symbol),stroke=_createStrokeAndFill3.stroke,fill=_createStrokeAndFill3.fill;// According to the arcgis docs:
// The color property does not apply to marker symbols defined with the cross or x style.
// Since these styles are wholly comprised of outlines, you must set the color of symbols with those styles via the setOutline() method.
if(symbol.style===SimpleMarkerSymbol.STYLE_X||symbol.style===SimpleMarkerSymbol.STYLE_CROSS){fill=stroke;stroke=''}var _size=!symbol.size||symbol.size<12?12:symbol.size;content='\n                    <Mark>\n                        <WellKnownName>'+wellKnownName+'</WellKnownName>\n                        '+fill+'\n                        '+stroke+'\n                    </Mark>\n                    <Size>'+_size+'</Size>\n                '}return'\n            <PointSymbolizer>\n                <Graphic>\n                    '+content+'\n                </Graphic>\n            </PointSymbolizer>\n            '};SLD.prototype.createXml=function createXml(){var mapLayer=this.mapLayer,rules=this.rules;return'<?xml version="1.0" encoding="UTF-8"?>\n                    <sld:StyledLayerDescriptor version="1.1.0" \n                     xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" \n                     xmlns="http://www.opengis.net/se" \n                     xmlns:sld="http://www.opengis.net/sld" \n                     xmlns:ogc="http://www.opengis.net/ogc" \n                     xmlns:xlink="http://www.w3.org/1999/xlink" \n                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n                    <sld:NamedLayer>\n                        <Name>'+_.escape(mapLayer.name)+'</Name>\n                        <sld:UserStyle>\n                            <Title>'+_.escape(mapLayer.id)+'</Title>\n                            <FeatureTypeStyle>\n                                 '+rules.join('')+' \n                            </FeatureTypeStyle>\n                        </sld:UserStyle>\n                    </sld:NamedLayer>\n                </sld:StyledLayerDescriptor>'};return SLD}()});