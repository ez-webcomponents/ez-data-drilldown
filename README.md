# ez-data-drilldown
A drilldown charting widget that drills down into the data based on the 'groupby' attribute.  Uses highcharts for the base charting.

Copyright (c) 2018 Martin Israelsen
@author Martin Israelsen <martin.israelsen@gmail.com>

## Download from npm using yarn into your node_modules directory.  STRONG WARNING:  the --flat option is very important!  Do not leave out the --flat option to yarn! :) 
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
        url='./data/srch-data.txt'
        title="Revenue By Company"
        cardelevation="0"
        height="400px"
        width="500px"
        maxcharts=1
        groupby='[{"field": "company", "aggregate": "sum(revenue)", "chart": "pie"},
                  {"field": "date_trunc(month,startdate)", "aggregate": "sum(revenue)", "chart": "line"},
                  {"field": "division", "aggregate": "sum(revenue)", "chart": "bar"},
                  {"field": "gender", "aggregate": "sum(revenue)", "chart": "pie"},
                  {"field": "eyeColor", "aggregate": "sum(revenue)", "chart": "bar"},
                  {"field": "age", "aggregate": "sum(revenue)", "chart": "pie"}]'>
    </ez-data-drilldown>
  </body>
</html>

```
