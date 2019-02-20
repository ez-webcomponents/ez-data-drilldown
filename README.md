# ez-data-drilldown
A drilldown charting widget that drills down into the data based on the 'groupby' attribute.  Uses chartjs for the base charting.

Copyright (c) 2018 Martin Israelsen
@author Martin Israelsen <martin.israelsen@gmail.com>

## Download from npm using yarn into your node_modules directory.  STRONG WARNING:  the --flat option is very important! 
```
$ yarn upgrade --flat
$ yarn add @ez-webcomponents/ez-data-drilldown --flat
```

##  Run the es6 version of the Demo (Assuming you installed at SERVER_ROOT using npm)
```
{SERVER_ROOT}/node_modules/@ez-webcomponents/ez-data-drilldown/build-demo/es6-bundled/demo/index.html
```

##  Include ez-data-drilldown-loader.js to use as stand-alone bundled component 
or 
##  Import ez-data-drilldown.js directly if using in a build. 
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">

    <title>ez-data-drilldown demo</title>
    <!-- If using as a stand-alone-component:  use ez-data-drilldown-loader.js
    <script src="./node_modules/@ez-webcomponents/ez-data-drilldown/build-component/ez-data-drilldown-loader.js"></script> -->

    <!-- If using in an existing build project:  use ez-data-drilldown.js directly-->
    <!-- <script type="import" src="@ez-webcomponets/ez-data-drilldown/src/components/ez-data-drilldown.js"></script>  -->

    <!-- Now add ez-data-drilldown to html section -->

    <ez-data-drilldown
          url='./data/srch-data-30000.txt' 
          title="30,000 Records By Company Revenue" 
          height="400px"
          width="800px"
          maxcharts=2
          localfilter='[{"field": "company", "action": "multiple", "value": "Spillman2,Nucore2"},
                        {"field": "startdate", "action": "gt", "value": "2015-12-01"}]'
          groupby='[
                  {"field": "company", 
                      "datasets": [
                                {"label": "Revenue", "backgroundcolor": "#8e95cd", "bordercolor": "#8e95cd", "data": "sum(revenue)", "type": "bar"}
                              ],
                      "contextmenu": [{"name": "Wikipedia", "target": "modal", "url":"https://en.wikipedia.org/wiki/{company}"}, 
                                      {"name": "USU",       "target": "_blank", "url":"https://www.usu.edu/"}]},
                  {"field": "date_trunc(month,startdate)", 
                      "datasets": [
                                {"label": "Revenue", "backgroundcolor": "#8e95cd",  "bordercolor": "#8e95cd", "data": "sum(revenue)", "type": "pie"}
                              ],
                      "contextmenu": [{"name": "Wikipedia", "target": "modal", "url":"https://en.wikipedia.org/wiki/{company}"}, 
                                      {"name": "USU2",      "target": "modal", "url":"https://www.usu.edu/"}]},
                  {"field": "division", 
                      "datasets": [
                                {"label": "Revenue", "backgroundcolor": "#8e95cd", "bordercolor": "#8e95cd", "data": "sum(revenue)", "type": "bar"}
                              ]},
                  {"field": "age", 
                      "datasets": [
                                {"label": "Revenue", "backgroundcolor": "#8e95cd", "bordercolor": "#8e95cd", "data": "sum(revenue)", "type": "pie"}
                              ]},
                  {"field": "gender", 
                      "datasets": [
                                {"label": "Revenue", "backgroundcolor": "#8e95cd", "bordercolor": "#8e95cd", "data": "sum(revenue)", "type": "line"}
                              ]}
                  ]'>  
        </ez-data-drilldown>
  </body>
</html>

```
