/**
@license
Copyright (c) 2018 Martin Israelsen
This program is available under MIT license, available at 
  https://github.com/ez-webcomponents/ez-data-drilldown
*/

import {LitElement, html} from '@polymer/lit-element';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-button/paper-button.js';
import 'jquery/dist/jquery.min.js';
import 'chart.js/dist/Chart.bundle.js';
import './iframe-lightbox.js';
import { default as cloneDeep } from 'lodash-es/cloneDeep';
import {EzGroupbyTreeMixin} from '@ez-webcomponents/ez-groupby-tree-mixin/src/components/ez-groupby-tree-mixin.js'; 
import UriTemplate from 'es6-url-template';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';

/**
 * @file ez-data-drilldown.js
 * @author Martin Isaelsen <martin.israelsen@gmail.com>
 * @description
 * A drilldown charting component that drills down into the data based on the 'groupby' attribute.  
 * Uses chartjs for the base charting.
 */
export class EzDataDrilldown extends EzGroupbyTreeMixin(LitElement) {

/**
   * @function constructor()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    Sets default values for attributes and initializes chartjs.  Sends off 
   *    the ajax request to get the data calls groupBy() to group the data and brings up 
   *    the inital top-level chart.   Listens to back button clicks to go up the drilldown chart stack. 
   */
  constructor() {
    super();
    var me = this;
    me.data = [];

    me.importer = {
        url: (url) => {
          return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.addEventListener('load', () => resolve(script), false);
            script.addEventListener('error', () => reject(script), false);
            document.body.appendChild(script);
          });
        },
        urls: (urls) => {
          return Promise.all(urls.map(me.importer.url));
        }
      };

    this.addEventListener('rendered', async (e) => {

        // Load these chart modules here.  Could not load them via es6 imports
        me.importer.urls([
            "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.5.0", 
            "https://cdn.jsdelivr.net/npm/chartjs-chart-box-and-violin-plot@1.1.2/build/Chart.BoxPlot.min.js"
          ]).then(() => {

            try {
                //console.log("GROUP BY=",me.groupby);
                me.fullGroupBy = JSON.parse(me.groupby);
                me.fullGroupByOrig = cloneDeep(me.fullGroupBy);
            } catch (e) {
                alert("Sorry could not parse 'groupby' attribute -- Please check your JSON formatting.");
                return;
            }

            try {
                me.localFilter = JSON.parse(me.localfilter);
            } catch (e) {
                alert("Sorry could not parse 'localfilter' attribute -- Please check your JSON formatting.");
                return;
            }

            if (typeof me.maxcharts === 'undefined') {
                me.maxcharts = 1;
            }

            if (typeof me.height === 'undefined') {
                me.height= "100%";
            }

            if (typeof me.title == 'undefined') {
                me.title = "Please Add a Title";
            }

            if (typeof me.cardelevation == 'undefined') {
                me.cardelevation = "1";
            }
            

            var chartDiv = this.shadowRoot.querySelector('#chart-div1');
            var chartDiv2 = this.shadowRoot.querySelector('#chart-div2');
            me.menuDialog = this.shadowRoot.querySelector('#menudialog');

            //var chartDiv = document.createElement("div");
            me.chartDiv = chartDiv;
            me.chartDiv2 = chartDiv2;
            me.listenersAlreadySet = false;
            me.sendAjax();

            me.mainChartConfig = me.getMainChartConfig(me.title, "100%");

            me.globalDrilldownStack = [];
            var titleDiv = me.shadowRoot.querySelector("#title-div");

            if (me.maxcharts == 1) {
                me.backButton = me.shadowRoot.querySelector("#back-button1");
            } else {
                me.backButton = me.shadowRoot.querySelector("#back-button2");
            }

            if (typeof me.listener1 === 'undefined') {
                me.listener1 = function(e){
                    var options1 = me.globalDrilldownStack.pop();
                    var options = me.globalDrilldownStack.pop();
                    if (typeof options === 'undefined') {
                        me.backButton.hidden = true;
                        me.chartDiv2.hidden = true;
                        titleDiv.hidden = true;
                        me.chartData(me.fullGroupBy,me.chartDiv,0);
                    } else {
                        me.backButton.hidden = false;
                        me.chartDiv2.hidden = false;
                        titleDiv.hidden = false;
                        me.createDrillDownGraph(options);
                    }
                }
    
                me.backButton.addEventListener('click', me.listener1, true);
            }

        });
    });
  }

  firstUpdated(properties) {
    this.dispatchEvent(new CustomEvent('rendered'));  
  }


/**
   * @function getMainChartConfig()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *    This function defines the default highchart configuration.
   *           
   * @param title        The title of the chart  
   * @param height       The height of the chart
   * 
   * @return returns the default highchart configuration object
   */
  getMainChartConfig(title, height) {
    var me = this;
    // This method is ment to be overridden.
    //
    // You must set this.mainChartConfig
    var mainChartConfig = {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '',
                data: [],
                meta1: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        //plugins: [ChartDataLabels],
        options: {
            plugins: {
                datalabels: {
                    formatter: function(value, context) {
                        // Only show labels on pie charts
                        if (context.chart.chart.config.type == "pie") {
                            return context.chart.data.labels[context.dataIndex];
                        } else {
                            return "";
                        }

                    }
                }
            },
            legend: {
                display: false,
                potision: 'bottom'
            },
            title: {
                display: true,
                text: title
            }
        }
    };

    return mainChartConfig;
}

uploadData() {
    alert("Upload Data")
}


/**
   * @function createDrillDownGraph()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Fills in the series and categories for the drilldown graph from the options.drilldown.  
   *   Then creates the drilldown graph. 
   *           
   * @param options       Options holds all of the information for this level of the drilldown
   */
createDrillDownGraph(options) {
    var me = this;
    var titleDiv = me.shadowRoot.querySelector("#title-div");
    if (me.maxcharts == 1) {
        var backButton = me.shadowRoot.querySelector("#back-button1");
        titleDiv.hidden = false;
    } else {
        var backButton = me.shadowRoot.querySelector("#back-button2");
        titleDiv.hidden = true;
    }
    backButton.hidden = false;

    // zero out the series and categories
    if (typeof options.group.chartConfig.data.datasets !== 'undefined') {
        for (var i=0; i < options.group.chartConfig.data.datasets.length; i++) {
            options.group.chartConfig.data.datasets[i].data.length = 0;
            options.group.chartConfig.data.datasets[i].meta1.length = 0;
            options.group.chartConfig.data.labels.length = 0;
        }
    }

    options.group.chartConfig = {};
    options.group.chartConfig = cloneDeep(me.getMainChartConfig());
    //console.log("CONFIG",options.group.chartConfig);
    options.group.chartConfig.type = options.drilldown[0].chart;
    if (options.drilldown[0].chart== 'pie') {
        options.group.chartConfig.plugins = [ChartDataLabels];
    }

    for (var k in options.drilldown) {
        if (typeof options.group.chartConfig.data.datasets[0].data !== 'undefined') {
            options.group.chartConfig.data.datasets[0].data.push(options.drilldown[k].y);
            options.group.chartConfig.data.datasets[0].meta1.push(options.drilldown[k]);
            options.group.chartConfig.data.labels.push(options.drilldown[k].name);
        }
    }
    // TODO: Need to figure out how to insert in alphabetical order for both labels, meta1, and data. 
    //options.group.chartConfig.data.labels.sort(); 
    //options.group.chartConfig.data.datasets[0].meta1.data.labels.sort();

    if (options.group != options.groups[options.groups.length-1]) {
        // Fill in chart type from 'groupby' attribute that was passed in.
        options.group.chartConfig.options.title.text = "("+options.path+")";

        if (me.maxcharts == 1) {
            var ctx = this.shadowRoot.querySelector("#chart-div1").getContext('2d');
            if (typeof me.chart1 !== 'undefined') {
                me.chart1.destroy();
            }
            me.chart1= new Chart(ctx, options.group.chartConfig);
        } else {
            backButton.hidden = false;
            me.chartDiv2.hidden = false;
            var ctx = this.shadowRoot.querySelector("#chart-div2").getContext('2d');
            if (typeof me.chart2 !== 'undefined') {
                me.chart2.destroy();
            }
            me.chart2= new Chart(ctx, options.group.chartConfig);
        }
        
        var lastOptions = me.globalDrilldownStack[me.globalDrilldownStack.length-1];

        // Don't push on the stack if it is the exact same thing.
        if (typeof lastOptions == 'undefined' || lastOptions.path != options.path) {
            me.globalDrilldownStack.push(options);
        }
    
        if (me.globalDrilldownStack.length > 0) {
            backButton.hidden = false;
        } else {
            backButton.hidden = true;
        }
    }
}

/**
   * @function clearChartData()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Clears ths series and categories for the graph groupings. 
   *           
   * @param me          A refrence to self
   * @param series      The level of the tree we want to clear
   * @param obj         The tree object that holds all of the groupings
   * @param color       The color to start with.
   */
  clearChartData(me, series, obj, color) {
    for (var k in obj) {
        if (typeof obj[k].drilldown !== 'undefined') {
            if (obj[k].drilldown.length > 0) {
                var brightness = 0.1 - (k) / 5;
                //obj[k].color = Highcharts.Color(me.colors[color]).brighten(brightness).get();
                obj[k].group.chartConfig = {};
                obj[k].group.chartConfig = Object.assign({},me.mainChartConfig);
                obj[k].group.chartConfig.type = obj[k].group.chart;

                if (typeof obj[k].group.chartConfig.data.datasets[series] !== 'undefined') {
                    obj[k].group.chartConfig.data.datasets[series].data.length = 0;
                    obj[k].group.chartConfig.data.datasets[series].meta1.length = 0;
                    obj[k].group.chartConfig.data.labels.length = 0;
                } 
                color++;                
                me.clearChartData(me,series+1,obj[k].drilldown, color);

            } else {
                var brightness = 0.1 - (k) / 5;
                obj[k].group.chartConfig = {};
                obj[k].group.chartConfig = Object.assign({},me.mainChartConfig);
                obj[k].group.chartConfig.type = obj[k].group.chart;
                if (typeof obj[k].group.chartConfig.data.datasets[series] !== 'undefined') {
                    obj[k].group.chartConfig.data.datasets[series].data.length = 0;
                    obj[k].group.chartConfig.data.datasets[series].meta1.length = 0;
                    obj[k].group.chartConfig.data.labels.length = 0;
                } 
            }
        }
    }
}


/**
   * @function populateChartData()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Fills in the series and categories for the graph groupings. 
   *           
   * @param me          A refrence to self
   * @param series      The level of the tree we want to fill
   * @param obj         The tree object that holds all of the groupings
   * @param color       The color to start with.
   */
populateChartData(me, series, obj, color) {
    for (var k in obj) {
        if (typeof obj[k].drilldown !== 'undefined') {
            if (obj[k].drilldown.length > 0) {
                var brightness = 0.1 - (k) / 5;
                //obj[k].color = Highcharts.Color(me.colors[color]).brighten(brightness).get();
                obj[k].group.chartConfig = {};
                obj[k].group.chartConfig = Object.assign({},me.mainChartConfig);
                obj[k].group.chartConfig.type = obj[k].group.chart;
                if (obj[k].group.chart == 'pie') {
                    obj[k].group.chartConfig.plugins = [ChartDataLabels];
                }

                if (typeof obj[k].group.chartConfig.data.datasets[series] !== 'undefined') {
                    obj[k].group.chartConfig.data.datasets[series].data.push(obj[k].y);
                    obj[k].group.chartConfig.data.datasets[series].meta1.push(obj[k]);
                    obj[k].group.chartConfig.data.datasets[series].allData = me.data;
                    obj[k].group.chartConfig.data.datasets[series].downloadObj = me.downloadFields;
                    obj[k].group.chartConfig.data.datasets[series].label = obj[k].name;
                    obj[k].group.chartConfig.data.labels.push(obj[k].name);
                } 
                color++;                
                me.populateChartData(me,series+1,obj[k].drilldown, color);

            } else {
                var brightness = 0.1 - (k) / 5;
                obj[k].group.chartConfig = {};
                obj[k].group.chartConfig = Object.assign({},me.mainChartConfig);
                obj[k].group.chartConfig.type = obj[k].group.chart;
                if (obj[k].group.chart == 'pie') {
                    obj[k].group.chartConfig.plugins = [ChartDataLabels];
                }
                if (typeof obj[k].group.chartConfig.data.datasets[series] !== 'undefined') {
                    obj[k].group.chartConfig.data.datasets[series].meta1.push(obj[k]);
                    obj[k].group.chartConfig.data.datasets[series].data.push(obj[k].y);
                    obj[k].group.chartConfig.data.datasets[series].label = obj[k].name;
                    obj[k].group.chartConfig.data.labels.push(obj[k].name);
                } 
            }
        }
    }
}

/**
   * @function chartData()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Entry Point for creating a drilldown graph.  Initializes the series and calls "groupBy"
   *    on "this.data" to group up the data based on the "groups" array definition.  Also, calls "populateChartData"
   *    to populate the initial chart and calculate the color for each group.
   */
chartData(groups,div,regroup) { 
    var me = this;

    if (typeof me.chart1 !== 'undefined') {
        me.chart1.destroy();
    }

    if (typeof me.chart2 !== 'undefined') {
        me.chart2.destroy();
        me.chart1.destroy();
        me.globalDrilldownStack.length = 0;
    }

    groups[0].chartConfig = {};
    groups[0].chartConfig = Object.assign({},this.mainChartConfig);
    
 
    // Group up the data using the group array into a tree object - (recursive)
    if (regroup) {
        this.treeObj = this.groupBy(this.data, groups, groups);
    }

    this.clearChartData(this,0,this.treeObj, 0);

    // fill in the category/series data using the treeObj we just built - (recursive)
    this.populateChartData(this, 0, this.treeObj, 0);

    // Now create the first (top level) chart using the mainChartConfig.
    if (typeof groups[0].chart != 'undefined') {
        groups[0].chartConfig.type = groups[0].chart;
        groups[0].chartConfig.options.title.text = this.title;
    } 

    var chartDiv = this.shadowRoot.querySelector("#chart-div1");
    var ctx = chartDiv.getContext('2d');
    this.chart1 = new Chart(ctx, groups[0].chartConfig);

    this.addChartListeners();
}

chart1Listener(evt) {
    var me = this;
    var activePoints = this.chart1.getElementsAtEvent(evt);
    if (activePoints[0]) {
       var chartData = activePoints[0]['_chart'].config.data;
       var idx = activePoints[0]['_index'];
       var meta = activePoints[0]['_meta'];

       var label = chartData.labels[idx];
       var value = chartData.datasets[0].data[idx];

       // Note:  When maxcharts=2 this clone is important so chart1 can keep it's state 
       //        while we create the second graph.  In the second graph we do re-use the chartData each 
       //        time for subsequent drilldowns and it is ok since we detroy and re-create the chart 
       //        each time for the second graph.
       var meta1 = cloneDeep(chartData.datasets[0].meta1[idx]);
       
       var color = chartData.datasets[0].backgroundColor[idx];

       if (typeof meta1 !== 'undefined') {
            var titleDiv = me.shadowRoot.querySelector("#title-div");
            if (me.maxcharts == 1) {
                var backButton = me.shadowRoot.querySelector("#back-button1");
                titleDiv.hidden = false;
            } else {
                var backButton = me.shadowRoot.querySelector("#back-button2");
                titleDiv.hidden = true;
            }
            backButton.hidden = false;
            me.createDrillDownGraph(meta1);
        }
     }
};

rightclick1Listener(evt) {
    var me = this;
    var activePoints = this.chart1.getElementsAtEvent(evt);
    
    if (activePoints[0]) {
       evt.preventDefault();
       var chartData = activePoints[0]['_chart'].config.data;
       var idx = activePoints[0]['_index'];
       var meta = activePoints[0]['_meta'];

       var label = chartData.labels[idx];
       var value = chartData.datasets[0].data[idx];
       var meta1 = chartData.datasets[0].meta1[idx];
       var color = chartData.datasets[0].backgroundColor[idx];

       me.metaDownload = meta1;

       evt.stopPropagation();

       // Throw right click event here with meta data.
        me.dispatchEvent(new CustomEvent('ez-right-click', {
            bubbles: true,
            composed: true,
            detail: {
                target: this,
                meta: meta1
            }
        })); 

        me.removeMenu();
        me.addMenu(meta1,{"name":"Download to CSV", "url":"csv"});

        if (typeof meta1.group.contextmenu != 'undefined' && meta1.group.contextmenu.length > 0) {
            for(var i=0; i<meta1.group.contextmenu.length; i++) {
                me.addMenu(meta1,meta1.group.contextmenu[i]);
            }        
        }
        me.menuDialog.open();

       return false;
     }
};

removeMenu() {
    while (this.menuDialog.hasChildNodes()) {
        this.menuDialog.removeChild(this.menuDialog.lastChild);
    }
}


addMenu(meta,menuItem) {
    var me = this;
    me.selectedMenuMeta = meta;
    me.selectedMenuItem = menuItem;
    var item = document.createElement('paper-item');
    item.style="min-height: unset; margin-bottom: unset; margin-top: unset; padding: 2px;";

    const UrlTemplate = new UriTemplate(menuItem.url);
    menuItem.url = UrlTemplate.expand(meta.data[0]);

    if (/^csv$/.test(menuItem.url)) {
        //var a = $("<paper-button><iron-icon icon='cloud-download'></iron-icon>&nbsp;"+menuItem.name+"</paper-button>");
        var a = $("<a href='javascript:;'><iron-icon icon='cloud-download'></iron-icon>"+menuItem.name+"</a>");
        a[0].addEventListener('click', function() {
            me.downloadDataToCsv(meta,meta.downloadObj,meta.data);
        });
    } else {
        if (menuItem.target === "modal") {
            //var a = $("<paper-button><iron-icon icon='flip-to-front'></iron-icon>&nbsp;"+menuItem.name+"</paper-button>");
            var a = $("<a href='"+menuItem.url+"' class='iframe-lightbox-link' data-scrolling='true'><iron-icon icon='flip-to-front'></iron-icon>"+menuItem.name+"</a>");
            a[0].lightbox = new IframeLightbox(a[0]);
        } else if (menuItem.target === "event") {
            var a = $("<a href='javascript:;'>"+menuItem.name+"</a>");

            a[0].addEventListener('click', function() {
                me.dispatchEvent(new CustomEvent('ez-contextmenu-click', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        target: this,
                        menuItem: menuItem,
                        meta: meta
                    }
                })); 
            });
        } else {
            //var a = $("<paper-button><iron-icon icon='content-copy'></iron-icon>&nbsp;"+menuItem.name+"</paper-button>");
            var a = $("<a target='"+menuItem.target+"' href='"+menuItem.url+"'><iron-icon icon='content-copy'></iron-icon>"+menuItem.name+"</a>");
        }

    }
    
    item.appendChild(a[0]);
    this.menuDialog.appendChild(item);
};

chart2Listener(evt) {
    var me = this;
    var activePoints = this.chart2.getElementsAtEvent(evt);
    if (activePoints[0]) {
       var chartData = activePoints[0]['_chart'].config.data;
       var idx = activePoints[0]['_index'];
       var meta = activePoints[0]['_meta'];

       var label = chartData.labels[idx];
       var value = chartData.datasets[0].data[idx];
       var meta1 = chartData.datasets[0].meta1[idx];
       var color = chartData.datasets[0].backgroundColor[idx];

       if (typeof meta1 !== 'undefined') {
            var titleDiv = me.shadowRoot.querySelector("#title-div");
            if (me.maxcharts == 1) {
                var backButton = me.shadowRoot.querySelector("#back-button1");
                titleDiv.hidden = false;
            } else {
                var backButton = me.shadowRoot.querySelector("#back-button2");
                titleDiv.hidden = true;
            }
            backButton.hidden = false;
            me.createDrillDownGraph(meta1);
            
        }
     }
};

rightclick2Listener(evt) {
    var me = this;
    var activePoints = this.chart2.getElementsAtEvent(evt);
    if (activePoints[0]) {
       evt.preventDefault();
       var chartData = activePoints[0]['_chart'].config.data;
       var idx = activePoints[0]['_index'];
       var meta = activePoints[0]['_meta'];

       var label = chartData.labels[idx];
       var value = chartData.datasets[0].data[idx];
       var meta1 = chartData.datasets[0].meta1[idx];
       var color = chartData.datasets[0].backgroundColor[idx];

       evt.stopPropagation();

        // Throw right click event here with meta data.
        me.dispatchEvent(new CustomEvent('ez-right-click', {
            bubbles: true,
            composed: true,
            detail: {
                target: this,
                meta: meta1
            }
        })); 
        me.removeMenu();
        me.addMenu(meta1,{"name":"Download to CSV", "url":"csv"});
        if (typeof meta1.group.contextmenu != 'undefined' && meta1.group.contextmenu.length > 0) {
            for(var i=0; i<meta1.group.contextmenu.length; i++) {
                me.addMenu(meta1,meta1.group.contextmenu[i]);
            }
        }
        me.menuDialog.open();
     }
};

addChartListeners() {
    var me = this;
    var chartDiv = this.shadowRoot.querySelector("#chart-div1");
    var chartDiv2 = this.shadowRoot.querySelector("#chart-div2");

    if (me.listenersAlreadySet == false) {
        chartDiv.addEventListener('click', me.chart1Listener.bind(this));
        chartDiv.addEventListener('contextmenu', me.rightclick1Listener.bind(this));
        chartDiv2.addEventListener('click', me.chart2Listener.bind(this));
        chartDiv2.addEventListener('contextmenu', me.rightclick2Listener.bind(this));
        me.listenersAlreadySet = true;
    }

}

/**
   * @function sendAjax()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Send off ajax for "this.url" to get the data for this object.  Once we have received it back initialize 
   *   "this.data" and the "downloadFields" and finally call "chartData()"
   */
  sendAjax() {
    var me = this;

    $.ajax({
       type: "GET",
       url: me.url,
       success: function(response){
 
        if (typeof response.payload == 'undefined') {
          var resp = JSON.parse(response);
        } else {
          var resp = response;
        }
        //me.fullData = resp.payload;
        //me.data = me.fullData;
        me.data = me.applyFilter(resp.payload);
        if (typeof me.data[0] != 'undefined') {
            me.downloadFields = Object.keys(me.data[0]);
        }

        Chart.plugins.unregister(ChartDataLabels);
        me.chartData(me.fullGroupBy,me.chartDiv,1);

     }
    });
 }


/**
   * @function applyFilter()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Applies the local filter to this.data.
   */
  applyFilter(data) {
    var returnData = [];
    for(var i=0; i<data.length; i++) {
        for(var x=0; x<this.localFilter.length; x++) {
            var field = this.localFilter[x].field;
            var action = this.localFilter[x].action;
            var value = this.localFilter[x].value;
// Note:  Use moment.js for dates..
// TODO:  Finish creating localfilters.
            if (action == 'gt') {
                if (data[i][field] > value) {
                    returnData.push(data[i]);
                }                
            } else if (action == 'lt') {
                if (data[i][field] < value) {
                    returnData.push(data[i]);
                }                  
            }
        }
    }

    return returnData;
 } 


 /**
   * @function properties
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Define attributes that can be passed into the <ez-data-drilldown> 
   */
  static get properties() { 
    return { 
      url: {
        type: String
      },
      data: {
        type: Object
      },
      groupby: {
        type: String
      },
      localfilter: {
        type: String
      },
      maxcharts: {
        type: Number
      },
      type: {
          type: String
      },
      height: {
          type: String
      },
      width: {
        type: String
      },
      title: {
          type: String
      },
      cardelevation: {
          type: String
      }
    }
  }

/**
   * @function update
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   This lit-element life-cycle method is called when any properties are changed.
   *    We check to see if certain properties have changed and then throw the event to 
   *    re-initialize the graph they have changed.  
   *    Note:  those properties that are in render template (i.e. height, width, etc) automatically get re-stamped 
   *            into the DOM so do not need to be checked here.
   */
  update(changedProperties) {
    var me = this;

    // Must call super.update() or nothing will render.
    super.update(changedProperties);
    if (changedProperties.get('groupby') || changedProperties.get('url') || changedProperties.get('title')
        || changedProperties.get('maxcharts') || changedProperties.get('localfilter')) {
            this.dispatchEvent(new CustomEvent('rendered')); 
        return true;
    }
    return false;
  }

   /**
   * @function render()
   * @author Martin Israelsen <martin.israelsen@gmail.com>
   *   Define the html tagged temple literal that will be put on the DOM.
   */
  render() {

    if (this.maxcharts === 1) {
        var cssClass1 = "col-sm-12";
        var cssClass2 = "col-sm-0";
    } else {
        var cssClass1 = "col-sm-6";
        var cssClass2 = "col-sm-6";
    }

    return html`
    <style>
        .row {
            margin-right: -15px;
            margin-left: -15px;
        }

        @media (min-width: 768px) {
            .col-sm-6, .col-sm-12 {
                float: left;
            }
            .col-sm-12 {width: 100%;}
            .col-sm-6 {width: 50%;}
            .col-sm-0 {width: 0%;}
            }

        </style>
        <div>
        <paper-dialog id="menudialog">
        <paper-item><a class="iframe-lightbox-link" href="google.com">test</a></paper-item>
        </paper-dialog>
        <paper-card  elevation=${this.cardelevation} style="width: ${this.width}; height: ${this.height}" class="row">
            <div id="div1" class=${cssClass1}>
                <div style="position:relative">
                    <button hidden style="position: absolute; right: 10px; top: 10px; z-index: 999" id="back-button1">Back</button>
                </div>
                <div hidden id="title-div" style="font-size: 18px; font-family: : 'Lucida Grande', 'Lucida Sans Unicode', Arial, Helvetica, sans-serif;"><center>${this.title}<center></div>
                <canvas width="100%" height="90%" id="chart-div1"></canvas>
            </div>
            <div id="div2" class=${cssClass2}>
                <div style="position:relative">
                    <button hidden style="position: absolute; right: 5px; top: 25px; z-index: 999" id="back-button2">Back</button>
                </div>
                <canvas width="100%" height="90%" id="chart-div2"></canvas>
            </div>
        </paper-card>
        </div>
        `;
    }

}


window.customElements.define('ez-data-drilldown', EzDataDrilldown);
