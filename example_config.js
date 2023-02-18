{
    "layout": {
        "numcols": 8,
        "bgColour": "#191A1F",
        "tileColour": "#212227",
        "fgColour": "#23C48E",
        "offColour": "#BE4D61",
        "buttonStyle":"blynk",
    },
    "pages": [
      {
        "label": "main",
        "tabs": [
            {
                "label": "Home",
                "tiles": [
                    { "type": "Text", "pin": 10, "label": "TEMPERATURE", "unit": "°C", "size": [3, 1], "posn": [1, 1] },
                    { "type": "Text", "pin": 11, "label": "PRESSURE", "unit": "hPa", "size": [3, 1], "posn": [4, 1] },
                    { "type": "PushButton", "pin": 50, "label": "POND", "size": [2, 2], "posn": [7, 1], "state": 0 },
                    { "type": "Text", "pin": 12, "label": "GR TEMPERATURE", "unit": "°C", "size": [3, 1], "posn": [1, 2] },
                    { "type": "Text", "pin": 13, "label": "GR HUMIDITY", "unit": "%", "size": [3, 1], "posn": [4, 2] },
                    { 
                        "type": "Chart", 
                        "label": "enviro", 
                        "pin": 1051,
                        "size": [8, 5], 
                        "posn": [1, 3],
                        "plots": [
                            {
                                "pin": 52,
                                "type": 'line',
                                "case": [
                                    {"period":["1d", "1w", "2w"], "format":"average"},
                                    {"period":[], "format":"none"},
                                ],
                                "legend": "BAROGRAPH",
                                "color": "white" ,
                                "data":
                                {
                                    "database": "Barrows",
                                    "table": "pressure_hourly",

                                    "x":
                                    {
                                        "type": "time",
                                        "column": "timestamp",
                                    },
                                    "y":
                                    {
                                        "type": "number",
                                        "column": "avg",
                                        "round": 0,
                                    },
                                },
                                "yAxis": 
                                {
                                    "position": "right",
                                    "max": 1050, 
                                    "min": 950 
                                },
                            },
                            {
                                "pin": 51,
                                "type": 'line',
                                "case": [
                                    { "period": ["1d", "1w", "2w"], "format": "maximum", "fill":"start" },
                                    {"period":[], "format":"maximum", "fill":"+1"},
                                ],
                                "legend": "THERMOGRAPH",
                                //"fill": "start",
                                "backgroundColor": ["#02AC62", "#FD372D"],
                                "color": 'black',
                                "data":
                                {
                                    "database": "Barrows",
                                    "table": "temp_hourly",
                                    "x":
                                    {
                                        "type": "time",
                                        "column": "timestamp",
                                    },
                                    "y":
                                    {
                                        "type": "number",
                                        "column": "avg",
                                        "round": 1,
                                    }
                                },
                                "yAxis":
                                {
                                    "position": "left",
                                    "max": 40,
                                    "min": -10,
                                },
                            },
                            {
                                "pin": 951,
                                "type": 'line',
                                "case": [
                                    { "period": ["1m","3m","1y"], "format": "minimum" },
                                    { "period": [], "format": "none" },
                                ],
                                "legend": "",
                                //"fill": "up",
                                //"backgroundColor": ["#32AC00", "#FD3700"],
                                "color": 'black',
                                "data":
                                {
                                    "database": "Barrows",
                                    "table": "temp_hourly",
                                    "x":
                                    {
                                        "type": "time",
                                        "column": "timestamp",
                                    },
                                    "y":
                                    {
                                        "type": "number",
                                        "column": "avg",
                                        "round": 1,
                                    }
                                },
                                "yAxis":
                                {
                                    "position": "none",
                                    "max": 40,
                                    "min": -10,
                                },
                            },
                        ],
                        "xAxis": 
                        { 
                            "type": "timeseries",
                        },
                        "periods": ["1d", "1w", "2w", "1m", "3m","1y" ],
                    },        
                ]
            },
            {
                "label": "Lights",
                "tiles": [
                    { "type": "PushButton", "pin": 22, "label": "OUTSIDE HOUSE", "size": [2, 2], "posn": [1, 1], "state": 1 },
                    { "type": "PushButton", "pin": 23, "label": "OUTSIDE GR", "size": [2, 2], "posn": [3, 1], "state": 0 },
                    { "type": "PushButton", "pin": 30, "label": "FLOODLIGHT", "size": [2, 2], "posn": [5, 1], "state": 0, "onText":"AUTO" },
                    { "type": "PushButton", "pin": 31, "label": "PASSAGE", "size": [2, 2], "posn": [7, 1], "state": 0 },

                    { "type": "Slider", "pin": 24, "label": "GR TOP", "size": [6, 1], "posn": [1, 3], "range": [0, 31], "step": 1, "toggle": true, "state": 0 },
                    { "type": "Slider", "pin": 25, "label": "GR BOTTOM", "size": [6, 1], "posn": [1, 4], "range": [0, 31], "step": 1, "toggle": true, "state": 0 },
                    { "type": "PushButton", "pin": 26, "label": "GR LED", "size": [2, 2], "posn": [7, 3], "state": 0 },

                    { "type": "PushButton", "pin": 29, "label": "HALL", "size": [2, 2], "posn": [1, 5], "state": 0 },
                    { "type": "PushButton", "pin": 28, "label": "READING LIGHT", "size": [2, 2], "posn": [3, 5], "state": 1 },
                    { "type": "PushButton", "pin": 34, "label": "XMAS OUTHALL", "size": [2, 2], "posn": [5, 5], "state": 0 },
                    { "type": "PushButton", "pin": 98, "label": "XMAS FALL", "size": [2, 2], "posn": [7, 5], "state": 0 },

                    { "type": "PushButton", "pin": 32, "label": "XMAS IN", "size": [2, 2], "posn": [1, 7], "state": 0 },
                    { "type": "PushButton", "pin": 21, "label": "KITCHEN", "size": [2, 2], "posn": [3, 7], "state": 1 },
                    { "type": "PushButton", "pin": 53, "label": "TREE", "size": [2, 2], "posn": [5, 7], "state": 0 },
                    { "type": "PushButton", "pin": 33, "label": "DUAL L", "size": [2, 2], "posn": [7, 7], "state": 0 },

                    { "type": "PushButton", "pin": 27, "label": "PLUG", "size": [2, 2], "posn": [3, 9], "state": 1 },
                ]
            },
            {
                "label": "Cistern",
                "tiles": [
                    {
                        "type": "Gauge",
                        "pin": 40,
                        "label": "CISTERN LITRES",
                        "size": [7, 3],
                        "posn": [1, 1],
                        "range": [0, 2000]
                    },
                    { "type": "Led", "pin": 41, "label": "harvest", "size": [1, 1], "posn": [8, 1], "state": 0 },
                    { "type": "Led", "pin": 42, "label": "drain", "size": [1, 1], "posn": [8, 2], "state": 0 },
                    { "type": "Led", "pin": 46, "label": "rain", "size": [1, 1], "posn": [8, 3], "state": 0 },
                    {
                        "type": "Chart",
                        "label": "water",
                        "pin": 1055,
                        "size": [8,3],
                        "posn": [1, 4],
                        "plots": [
                            {
                                "pin": 56,
                                "type": 'line',
                                "case": [
                                    { "period": ["1d", "1w", "2w"], "format": "average" },
                                    { "period": [], "format": "none" },
                                ],
                                "legend": "",
                                "color": "white",
                                "data":
                                {
                                    "database": "Barrows",
                                    "table": "cistern_hourly",

                                    "x":
                                    {
                                        "type": "time",
                                        "column": "timestamp",
                                    },
                                    "y":
                                    {
                                        "type": "number",
                                        "column": "litres",
                                        "round": 0,
                                        "ticks": 
                                        {
                                            "stepSize": 18,
                                        }
                                    },
                                },
                                "yAxis":
                                {
                                    "position": "right",
                                },
                            },
                            {
                                "pin": 55,
                                "type": 'line',
                                "legend": "LITRES",
                                "fill": "start",
                                "backgroundColor": "#13AFFF",
                                "color": 'black',
                                "data":
                                {
                                    "database": "Barrows",
                                    "table": "cistern_hourly",
                                    "x":
                                    {
                                        "type": "time",
                                        "column": "timestamp",
                                    },
                                    "y":
                                    {
                                        "type": "number",
                                        "column": "litres",
                                        "round": 0,
                                        "ticks":
                                        {
                                            "stepSize": 18,
                                        }
                                    }
                                },
                                "yAxis":
                                {
                                    "position": "left",
                                    "max": 1800,
                                    "min": 0,
                                },
                            },
                        ],
                        "xAxis":
                        {
                            "type": "timeseries",
                        },
                        "periods": ["1d", "1w", "2w", "1m", "3m", "1y"],
                    },        
                    { "type": "Slider", "pin": 43, "label": "HARVEST", "size": [6, 1], "posn": [1, 7], "range": [100, 1800], "step": 16, "toggle": false, "onrelease": true, "state": 1, "locklist": [1] },
                    { "type": "Slider", "pin": 44, "label": "DRAIN", "size": [6, 1], "posn": [1, 8], "range": [100, 1800], "step": 16, "toggle": false, "onrelease": true, "state": 1, "locklist": [1] },
                    { "type": "Lock", "pin": -1, "label": "", "size": [2, 2], "posn": [7, 7], "lock":1, "timer":10  },

                ]
            },
            {
                "label": "Radio",
                "tiles": [
                    { "type": "Text", "pin": 60, "label": "Radio alarm", "size": [8, 1], "posn": [1, 1], "state": 1, "style": "outline", "text": "OFF", "locklist": [63] },
                    { "type": "PushButton", "pin": 61, "label": "PREV", "size": [4, 1], "posn": [1, 2], "state": 1, "style": "fill", "text": "PREV", "locklist": [63] },
                    { "type": "PushButton", "pin": 62, "label": "NEXT", "size": [4, 1], "posn": [5, 2], "state": 1, "style": "fill", "text": "NEXT", "locklist": [63] },
                    { "type": "Slider", "pin": 63, "label": "VOLUME", "size": [8, 1], "posn": [1, 3], "range": [0, 31], "step": 1, "toggle": true, "state": 1, "lock": 63 },

                    { "type": "Text", "pin": 65, "label": "OrbitSound", "size": [8, 1], "posn": [1, 5], "state": 1, "style": "outline", "text": "OFF", "locklist": [68] },
                    { "type": "PushButton", "pin": 66, "label": "PREV", "size": [4, 1], "posn": [1, 6], "state": 1, "style": "fill", "text": "PREV", "locklist": [68] },
                    { "type": "PushButton", "pin": 67, "label": "NEXT", "size": [4, 1], "posn": [5, 6], "state": 1, "style": "fill", "text": "NEXT", "locklist": [68] },
                    { "type": "Slider", "pin": 68, "label": "VOLUME", "size": [8, 1], "posn": [1, 7], "range": [0, 31], "step": 1, "toggle": true, "state": 1, "lock": 68 },
                ]
            }

        ],
      },
      {
          "label": "Schedule",
          "layout": {
                "aspect":1,
                "bgColour": "#191A1F",
                "tileColour": "#212227",
                //"fgColour": "#C4238E",
                "offColour": "#BE4D61",
                "buttonStyle": "",
            },
            "tabs": [
            {
                "label": "Times",
                "tiles": [
                    { "type": "Text", "pin": 210, "label": "Device", "size": [8, 1], "posn": [1, 1], "state": 1, "style": "outline", "locklist": [282],},


                    { "type": "PushButton", "pin": 220, "label": "T1", "size": [3, 1], "posn": [2, 2], "state": 1, "style": "outline", "radio": 201, "auto": 1, "text": "", "offColour": "#23C48E", "colour": "white", "locklist": [282], },
                    { "type": "PushButton", "pin": 221, "label": "T1", "size": [3, 1], "posn": [5, 2], "state": 0, "style": "outline", "radio": 201, "auto": 1, "text": "", "offColour": "#23C48E", "colour": "white", "locklist": [282], },
                    { "type": "PushButton", "pin": 222, "label": "T1", "size": [3, 1], "posn": [2, 3], "state": 0, "style": "outline", "radio": 201, "auto": 1, "text": "", "offColour": "#23C48E", "colour": "white", "locklist": [282], },
                    { "type": "PushButton", "pin": 223, "label": "T1", "size": [3, 1], "posn": [5, 3], "state": 0, "style": "outline", "radio": 201, "auto": 1, "text": "", "offColour": "#23C48E", "colour": "white", "locklist": [282], },                    
                    { "type": "PushButton", "pin": 224, "label": "T1", "size": [3, 1], "posn": [2, 4], "state": 0, "style": "outline", "radio": 201, "auto": 1, "text": "", "offColour": "#23C48E", "colour": "white", "locklist": [282], },
                    { "type": "PushButton", "pin": 225, "label": "T1", "size": [3, 1], "posn": [5, 4], "state": 0, "style": "outline", "radio": 201, "auto": 1, "text": "", "offColour": "#23C48E", "colour": "white", "locklist": [282], },                                        

                    { "type": "PushButton", "pin": 226, "label": "T1", "size": [2, 1], "posn": [2, 6], "state": 1, "style": "outline", "text": "Time", "radio": 202, "auto": 1, "colour": "white", "locklist": [282], },
                    { "type": "PushButton", "pin": 227, "label": "T1", "size": [2, 1], "posn": [4, 6], "state": 0, "style": "outline", "text": "Dawn", "radio": 202, "auto": 1, "colour": "white", "locklist": [282], },
                    { "type": "PushButton", "pin": 228, "label": "T1", "size": [2, 1], "posn": [6, 6], "state": 0, "style": "outline", "text": "Dusk", "radio": 202, "auto": 1, "colour": "white", "locklist": [282], },
                    { "type": "Pusher", "pin": 229, "label": "XYZZY", "size": [6, 2], "posn": [2, 8], "fast": 10, "power": 2, "locklist": [282], },

                    { "type": "PushButton", "pin": 280, "label": "CAN", "size": [2, 1], "posn": [1, 11], "state": 1, "style": "outline", "text": "Cancel" },
                    { "type": "PushButton", "pin": 282, "label": "PAU", "size": [2, 1], "posn": [4, 11], "state": 0, "style": "outline", "text": "Paused", "lock": -282 },
                    { "type": "PushButton", "pin": 281, "label": "SAV", "size": [2, 1], "posn": [7, 11], "state": 1, "style": "outline", "text": "Save", "locklist": [282], },
                ],
            },
            {
                "label": "Groups",
                "tiles": [
                    { "type": "PushButton", "pin": 280, "label": "DONE", "size": [3, 1], "posn": [3, 7], "state": 1, "style": "fill", "text": "Done" },
                ],
            }
          ],
      }
    ],
};
