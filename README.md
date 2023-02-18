 # Wynk
## Introduction
Wynk was conceived as an alternative to the discontinued Blynk 1 as a front end to Node Red. In it's current form it can look very similar to Blynk, but of course could change quite significantly. In this document it is assumed that Wynk will be communicating with Node Red, but of course, that is up to the developer. Communication with Node Red, or other server, is achieved using web sockets.

Note that when using Node Red, messages received by Node Red modified and returned will only go to the instance of Wynk that originated the message, that is to the linked device indicated by the msg._session value. Newly created messages won't have the source information and will be sent to all connected Wynks. This can be managed by propagating or deleting the msg._session value.

Wynk uses a grid layout and selectable tabs in the same way as Blynk and can display charts using chart.js. Unlike Blynk, multiple pages can be created with their own grid. 

Unlike Blynk, there is no GUI layout editor and the configuration is controlled using a JSON file request to Node-Red upon page load.
Also missing is Blynk's persistence of values, so that historical data e.g. for charts, needs to be kept by Node Red, probably in a database.
## General description
Wynk supports one or more pages, where each page is laid out in a grid format. The grid has an integral number of columns across width of the display, and a number of rows as required to display the contents. The height of each row is a multiple of the column width known as the aspect. The default number of columns is eight and the default aspect is 1.5, but these values may be set for each page.  

A page may have one or more tabs, each containing a layout of tiles on the grid. If more than one tab is configured for a page, a selection menu is displayed above the content.

Tiles may be sized as integral number of columns and rows they occupy and are positioned on the grid by specifying the number of the grid location of the top left corner of the tile starting from column one and row one.
There are different tile types for display and user interaction that are describe below.
## Web socket Messages
### From Node Red
Messages from Node Red are in the form of JSON strings and have the structure of Node Red messages with 'topic', 'payload' and potentially other values. The folloing topics are supported:
#### config
A message with the topic of 'config' will contain the Wynk configuration JSON string in the payload. This is described below.
#### page
A message with the topic of 'page' will use the number in the payload to select and display the page if it exists.
#### set
A message with the topic of 'set' must also contain a 'pin' number which indicates the tile to receive the message. The remainder of the message is tile specific.
### To Node Red
Messages to Node Red may contain information to perform an action such as changing states of managed devices, requests for managed device status and requests for database data. The different message type are indicated by the topic:  
#### set  
A 'set' message will have information in the payload or in state and level values to control the state of Node Red managed devices. it must have a 'pin' value to identify the source of the message.
#### long
A 'long' message is similar to a 'set' message but is a result of holding a PushButton for more than 400mS. It is usually not used to change the state. 
#### get
A 'get' message is requesting the current status of a resource. Like the set it has a 'pin' to identify the requesting tile.
#### getdata
The 'getdata' message is only used by a chart plot to request a set of data from a database query. In this case the 'pin' identifies the plot within a chart tile rather than the tile itself.
to Blynk.
## Pages
There can be more than one page set up, each with a different layout. Each page can contain a number of tabs with a menu at the top of the page to select them.
Unlike tabs, there are no means to select a page directly, rather this would be done as the result of another interaction such as a long press on a PushButton causing Node Red to send a page change request.
## Tabs
Tabs are the container for a set of tiles, usually with related functions. They are selected by touching the selection menu at the top,
## Tiles overview
The displays and interactive elements are known as tiles. Tiles can generally fall into the categories if interactive or passive depending on whether they accept user input or not.
### Passive tiles
* **Text** is a display only tile that shows the required text. 
* **Gauge** is used for a graphical view of a current value. 
* **Chart** tiles are displayed using chart.js. Currently only charts with times as the x-axis are supported, and several time periods may be specified, e.g. 1d or 3w.  
Multiple plots may be specified so that different independent values or value ranges  can be displayed on the same chart.
* **Led** is a, usually small, indicator with two values
### Interactive tiles
* **Pushbutton** has a state shown by a change of display colour and text. It sends a change message to Node-Red but optionally won't change it's state until acknowledged.
* **Lock** is similar to a pushbutton, but is entirely local and may be used to lock and unlock other tiles. For example a slider may be locked to avoid accidental change.
* **Slider** is used to input a value from a range of values. The slider 'thumb' may be dragged, or a touch may be used to move the 'thumb'. If the slider has the 'toggle' attribute, then touching the 'thumb' can switch the state like a pushbutton.
The slider may be horizontal or vertical according to it's shape.
* **Pusher** is a tile that can be touched to send a series of values that vary according to the distance of the touch from the centre of the tile. moving the touch backwards and forwards modifies the rate of change. Different step sizes and power laws can be set to give the best control. A pusher would typically be used to increase or decrease the value with the current value being displayed on on a Text tile.
## Files
### index.html
The web page is displayed as a result of addressing an HTML file on a server which contains a bunch of meta and links as well as a script link to wknk.js and, optionally, script links to chart.js files.  
The only script values required are a NodeRedWebSock constant value with the name of the Node Red websocket to be used.  
### wynk.js
This is the code that does all the work. Play with it and change things as necessary.
### wynk.css
Has some basic css. wynk.js adds css as required by the configuration file, and could possibly be used to replace this file altogether.
## Configuration
The configuration file is a JSON encoded string that has some common layout configuration values followed by an array of one or more pages, each with a label, an optional layout override and a number of tabs in an array  
Each tab has a label and an array of tiles.
The layout section is an object with the following properties with defaults in parentheses. 
* numcols (8) - the number of grid columns across the screen.
* aspect (1.5) - the ratio between the tile height and the tile width.
* bgColour (#191A1F) - the screen background colour.
* tileColour (#212227) - the background colour of each tile.
* fgColour (#23C48E) - the forground colour of any drawn display or text on a tile.
* offColour (#BE4D61) - colour to use for a button like tile when off.
* onColour (fgColour) - colour to use for a button like tile when on.
* offtext (OFF) - text to use on a button like tile when off.
* ontext (ON) - text to use on a button like tile when on.
* buttonstyle (blynk) - style of buttons, currently only 'blynk' or 'fill'.
NOTE: onColour, onText and offText are probably limited to values on the specific tile at the time of writing.
## Tile configuration and messages
The tiles have some common configuration requirements and some common attributes added to messages to Node Red.
Configuration values that apply to all tile types are:
* type - the class of tile, e.g. Text or PushButton.
* pin - the number which uniquely identifies the tile. A value of 0 will mean that the tile cannot receive or send messages, which is pretty useless, except for Lock tiles.
* label - this may appear on the tile at the top left. Although mandatory, it's value is not used in all tile types.
* size - this is an array of the width and height of the tile in the array. 
* posn - this is an array of the x and y position of the tile in the array with the top left location being [1,1].
* text - the text to display on a static tile, or the on Text for an interactive tile.
* locklist - if provided is an array of lock numbers that can cause this tile to be disabled.
* lock - is a lock number that can be provided for an interactive tile to cause tiles with the number in the locklist to be disabled. The lock is effected when the tile's state is 0 unless the lock number is negative when the (positive) lock number is enabled when the state is 1. If a tile with a lock is disabled, then the lock is also brought into effect,
* auto - the change of state of an interactive tile is independent of the message exchange, otherwise thee tile doesn't change state until acknowledged by Node Red.
* Radio - a radio button number to link a set of interactive tiles, so that only one may be on at a time. 
Messages sent for an activity on a tile will contain the page id, the tab id and the pin in addition the data provided by the tile, and will be formatted as a JSON string.
### The Text tile
The configuration can contain a value for 'text' and a 'unit' to be appended to the value, as well as a 'style' value of 'fill' or 'outline'.

The text tile responds to a 'set' message and changes the displayed text according top the value in 'payload'. It does not send any messages. 

### The Gauge tile
The configuration should contain an array of the minimum and maximum values to be displayed by the tile. 

The gauge tile responds to a 'set' message and changes the displayed value according top the numerical value in 'payload'. It does not send any messages. 

### The Chart tile
The configuration contains an array of 'plots' that have their own pin. At he time of writing, the only plot 'type' is 'line'. 

Much of the configuration is identical to that required by chart.js. Common to all plots is the 'xAxis' and 'type':'timeseries' has been tested. Also common is an optional 'periods' array which is used to display a period selection below the chart. The values are passed back to Node Red when selected and are of the form number followed by one of d,w,m,y. e.g. 4w means an x axis of four weeks prior to the current date and time.

Each plot can  have a 'color' (Note the spelling as this will be passed directly to chart.js) and a backgroundColor. The latter may be an array of two colours to provide a gradient fill, or a single  colour for a solid fill.

The 'data' section will contain 'database' and 'table' information to be processed by Node Red and the x and y coordinate values indicated by 'type', 'column' and for the y column an optional 'round' value to specify the number of decimal places. Tested at this time for the x value is only the timestamp type.

The y-axis section for each plot can contain the location of the axis, left, right or none and the max and min values if required.

A special option for the plots is a 'case' array containing one or more objects with a period array and optional format and fill values to be applied to the chart. Commonly this is used to disable plots for certain periods and to set fill values for certain periods including between maximum and minimum plots.

The plots each send a message with the topic 'getdata' and additional information  for Node Red to respond with the data for the graph.
* topic: 'getdata'
* payload: the data object from the configuration file with the addition of the timescale range from the period selected in epoch milliseconds and the current time as the end value.
* method: currently 'newget'
* aggregate: the format value from a case or blank.
* pin: the plots own pin.

The data response should be a  'set' message with a payload of the JSON string of an array of x and y arrays.
### The Led tile
The configuration can have a state value. The Led is drawn with an outline or filled according to the 'state'. 

The received message will have a of 'set' and a 'state' of 0 or 1.

### The PushButton tile
The Pushbutton tile may have an initial 'state' value of 0 or 1. It may also have the following attributes:
* 'style' - fill or outline which create a rounded corner button, not the blynk default.
* 'text' - the text on the button
* 'ontext' - the text when the button is on.
* 'offtext' - the text when the button is off.
* 'onColour' - the foreground colour when the button is on.
* 'offColour' - the foreground colour when the button is off.
* 'radio' - an id linking buttons in a group so that only one may be on at a given time.
* 'auto' - the state will change without reference to Node Red although the message will be sent. Otherwise, the new state will not be displayed until a 'set' message is received from Node Red. If the pin is 0 then 'auto' is assumed and no message is sent.

The button responds to long presses - over 400mS - or short touches and sends a message with either topic 'set' or 'long' with the new state.

Received 'set' messages can set the 'state', the 'text' for both on and off, the 'onText' or the 'offText'.

If the state is less then zero, then the button is disabled.

### The Slider tile
There are a number of configuration settings:
* 'range' - an array of the lowest and highest values of the slider.
* 'step' (1) - the minimum amount of change to report.
* 'toggle' (false) - whether of not a touch on the thumb will toggle the state of the slider from on to off and vice versa. If this is true then the slider will not respond to attempts to change the value when off.
* 'onrelease' (false) - if false, there will be continual stream of messages while the slider is adjusted, If true, the only message will be when the slider is released.

The slider will send messages with the topic 'set', and with the payload as 'toggle', 'move' or 'change' according to whether the thumb was touched in toggle mode, the thumb was moved, or a touch away from the thumb was performed.
The other values in the message are 'state' and 'value'.

Messages to the slider may have the 'state' and/or 'value' settings.

### The Pusher tile

This is a bit of an experiment to provide a tile that allows rapid large changes together with fine control when near the desired value. It can send either negative or positive values and the values become larger the further from the centre the touch. The two properties are:
* 'fast' - a value to control the size of the change messages values - use trial end error find a good value.
* 'power' - a power value. again trial and error, although 2 for square law is a good start.

Once touched, a 300mS timer is set running until the pusher is released. The initial touch and subsequent moves are used to calculate a position between -1 and 1 according to position of the touch relative the centre of the pusher. The actual value that will be sent is found by raising the position value to the configured 'power' and then multiplying by the configured 'fast'.

The code in Node Red should apply the values as they arrive to a modify a stored value and usually send the resultant value to a test tile as feedback on the resultant setting.
## Debugging
Debugging of problems within wynk.js can be usually done with a standard browser in developer mode, however problems which are specific to a particular phone or device are more problematic.  
There are tools available to debug on the actual device which are out of the scope of this document, but there are two ways of problem analysis that can be used.
### Event logging
There is a method of the wynk class that can be invoked at any time that there is a web socket connection with the arguments of a message and an optional pin. invoking this method will cause a message to be sent to Node Ref with the topic of 'log' and these can be directed to a debug node for display.
### Catching an error 
In the HTML file a variable called WebSoc can be defined with a null value that will be changed by wynk on connection to the current web socket.  
Adding a window.onerror function as below will send a log message to Node Red with the error message, the source script and line number whenever an error occurs.

```
var WebSoc = null ;
window.onerror = function(msg, url, linenumber)
{
	if (WebSoc)
	{
		let bits = url.split('/') ;
		let source = bits[bits.length -1] ;
		let omsg = '{"topic":"log","payload":"' + msg + 
			'","source":"' + source + 
			'","linenumber":' + linenumber + '}' ;
		WebSoc.socket.send(omsg) ;
	} 
}
```
