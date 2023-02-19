/* ===============================================================================================

	Wynk was conceived as a replacement for Blynk 1 as a front end for Node Red 
	following the removal of support and future availability together with the 
	loss of the local server option in v2.
	
	Author: Pete Shew
	Date:	March 2023
	Contact: peteshew@gmail.com

The Wynk class is the top level for the entire app. It creates the tabs. 

Possible ToDos

	-	Get config from website instead of from Node Red, including Node Red server and 
		web socket address
	-	Build all CSS so remove need for separate file

		These two could lead to absolute mininimum html file

/* =============================================================================================== */

class Wynk
{
	Pages = {} ;	// The pages	
	Pins = {} ;		// Map pins to tiles
	Locks = {} ;	// Collection of locks in force	
	config = null ;

	// Default values
	numcols = 8 ;
	aspect = 1.5 ;
	bgColour = "#191A1F" ;
	tileColour = "#212227" ;
	fgColour = "#23C48E" ;
	offColour = "#BE4D61" ;
	
	buttonStyle = "" ;
	currentPage = 0 ; ;

	constructor (Server)
	{
		this.Div = document.createElement('div') ;
		this.Div.id = 'WynkMain' ;
		document.body.appendChild(this.Div) ;
		
		this.Server = Server ;
		this.ws = new WS(this.Server, this) ;
		if (typeof WebSoc !== 'undefined') WebSoc = this.ws ;
	}

	// Handle all incoming websocket messages
	onMessage(msg)
	{
		if (typeof msg.topic !== 'string')
			{	return ; }
		
		switch (msg.topic)
		{
		// Distribute to individual tiles
		case 'set':	
			if (!isNaN(msg.pin))
			{
				var pin = parseInt(msg.pin)
				if ((typeof this.Pins[pin] !== 'undefined') && 
					(typeof this.Pins[pin].onSet !== 'undefined') && 
					(typeof this.Pins[pin].onSet == 'function'))
				{
					this.Pins[pin].onSet(msg) ;
				}
			}
			break ;
		
		// Page selection
		case 'page':
			if (!isNaN(msg.payload))
			{
				let newpage = parseInt(msg.payload) ;
				let max = Object.keys(this.Pages).length - 1;
				if ((newpage >=0) && (newpage <= max))
				{
					this.Pages[this.currentPage].Div.style.display = 'none' ;
					this.currentPage = newpage ;
					localStorage['currentPage'] = this.currentPage ;
					this.Pages[this.currentPage].Div.style.display = 'block' ;
					if (!isNaN(msg.tab))
					{
						this.Pages[this.currentPage].setTab(parseInt(msg.tab)) ;
					}
					this.Pages[this.currentPage].draw() ;
				}
			}
			break ;
			
		// Initial or changed config	
		case 'config':
			var newconf = JSON.parse(msg.payload) ;
			if ((localStorage.config) && (localStorage.config != msg.payload))
			{
				localStorage.config = msg.payload  ;
				this.setConfig( newconf ) ;
			} else if (Object.keys(this.Pages).length === 0)
			{
				this.setConfig(newconf) ;
			} else
			{
				this.doupdate() ;
			}
			break ;
		}			
	} ;
	
	// Here we build the page
	setConfig(config)
	{
		// Save the page layout configuration
		let layout = config.layout ;
		for (const [key, value] of Object.entries(layout)) 
		{
			this[key] = value ;
		}
		
		// = ======   ======================================================================
		// Calculate the metrics
		this.viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
		this.viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

		// = ======   ======================================================================
		// Create the menu and tabs
		
		// This will iterate pages if present
		this.currentPage = parseInt(localStorage.currentPage || 0) ;
		if (typeof config.pages !== 'undefined')
		{
			config.pages.forEach( function (p, i)
			{
				let P = new Page(this, p, i) ;
				if (P)
				{
					this.Pages[i] = P ;
				}
				
			}.bind(this));
		} else
		{
			let P = new Page(this, config, 0) ;
			this.Pages[0] = P ; 
		}
	}

	// The locking mechanism
	setLock(lid, state) 
	{
		if (typeof this.Pages === 'object')
		{
			Object.values(this.Pages).forEach((P) =>
			{
				if (lid>0)
				{
					P.setLock(lid, state) ;
				} else
				{
					P.setLock(-lid, !state) ;
				}
			}) ;
		}
	}
	
	doupdate()
	{
		if (typeof this.Tabs === 'object')
		{
			for ( const [num, T] of Object.entries(this.Tabs)) 
			{
				T.doupdate() ;
			}
		}
	}
	
	// This can be used to send a log message to the websocket server
	// to aid debugging
	log(msg, pin=0)
	{
		if ((this.ws.socket) && (this.ws.socket.readyState == WebSocket.OPEN))
		{
			var msg = '{"topic":"log","payload":"' + msg + '","pin":' + pin + '}' ;
			this.ws.socket.send(msg) ;
		}
	}
}

/* ===============================================================================================

	The Page class is the container for a set of tabs. It is only used of the config
	has pages, otherwise wynk class provides the nesessary methods and properties.
	
	Either wynk or a page will be passed to the tab constructor as it's parent.

/* =============================================================================================== */

class Page
{
	Tabs = [] ;
	currentTab = 0 ;
	data = {} ;
	
	// Layout data
	elWidth = 0 ;	// Tile element width
	mnWidth = 0 ;	// Menu element width
	gridTop = 0 ;	// Top of main grid

	constructor (wynk, page, id)
	{
		this.wynk = wynk  ;
		this.page = page ;
		this.id = id ;
		
		if (localStorage['layout_' + this.id])
		{
			let layout = JSON.parse(localStorage['layout_' + this.id]) ;
			for (const [key,value] of Object.entries(layout))
			{
				this[key] = value ;
			}
		}			
		
		this.numcols = wynk.numcols ;
		this.aspect = wynk.aspect ;
		this.bgColour = wynk.bgColour ;
		this.tileColour = wynk.tileColour ;
		this.fgColour = wynk.fgColour ;
		this.offColour = wynk.offColour ;
		this.buttonStyle = wynk.buttonStyle ;
		
		this.layout = {} ;
		if (typeof page.layout !== 'undefined')
		{
			this.layout = page.layout ;
			for (const [key, value] of Object.entries(this.layout)) 
			{
				this[key] = value ;
			}
		}
		
		// Calculate some metrics
		this.elWidth = this.wynk.viewportWidth / this.numcols ;
		this.layout.elWidth = this.elWidth ;
		this.mnWidth = this.wynk.viewportWidth / 5 ;
		this.layout.mnWidth = this.mnWidth ;
		localStorage['layout_' + this.id] = JSON.stringify(this.layout) ;

		var style = document.createElement('style');
		var columns = "repeat(" + this.numcols + ", " + this.elWidth + "px )" ;
		style.type = 'text/css';
		style.innerHTML = '.gridbox_' + this.id + ' { grid-template-columns: ' + columns + '; background-color: ' +  this.tileColour + ';}' ;
		document.head.appendChild(style);

		var mstyle = document.createElement('style');
		var mcolumns = "repeat(5, " + this.mnWidth + "px )" ;
		style.type = 'text/css';
		style.innerHTML = '.menubox_' + this.id + ' { grid-template-columns: ' + mcolumns + '; background-color: ' +  this.tileColour + ';}' ;
		document.head.appendChild(style);

		this.Div = document.createElement('div') ;
		this.Div.id = "wynkpage" + id ;
		this.Div.style.display = (id==wynk.currentPage)?'block':'none' ;
		this.wynk.Div.appendChild(this.Div) ;
		
		// = ======   ======================================================================
		// Create the menu and tabs

		let menuCount = this.page.tabs.length ;
		if (menuCount > 1)
		{
			this.menu = document.createElement('div') ;
			this.menu.id = 'wynkpagemenu' + id ;
			this.menu.classList.add('menubox', 'menubox+' + this.id) ;
			this.Div.appendChild(this.menu) ;
		}
		this.currentTab = parseInt(localStorage['currentTab-' + id] ||0) ; // PAGE SPECIFIC
		var itab = this.currentTab;
		this.page.tabs.forEach( function (m, i)
		{
			var B = new Tab(wynk, this, m, i, menuCount) ;
			if (B)
			{
				if (this.gridTop == 0)
				{
					this.gridTop = this.menu.offsetHeight ; 
				}
				B.grid.top = this.gridTop ;
				B.draw((i==this.currentTab)) ;
				this.Tabs[i] = B ;
			}
			
		}.bind(this));
		var G0 = document.getElementById('G-' + this.id + '-0') ;   // NEEDS PAGE SPECIFIC
		G0.style.display = 'grid' ;
	}
	
	setTab(newtab)
	{
		if (newtab != this.currentTab)
		{
			this.Tabs[this.currentTab].show(false) ;
			this.currentTab = newtab ;
			localStorage['currentTab-' + this.id] = this.currentTab ;
			this.Tabs[this.currentTab].show(true) ;
		}
	}
	
	draw() 
	{
	}
	
	// The locking mechanism
	setLock(lid, state) 
	{
		if (typeof this.Tabs === 'object')
		{
			Object.values(this.Tabs).forEach((T) =>
			{
				T.setLock(lid, state) ;
			}) ;
		}
	}
}

/* ===============================================================================================

	The Tab class is the container for a set of tiles which are the actual displays and
	controls.

/* =============================================================================================== */
class Tab
{
	Tiles = [] ; // Collection of tiles
	Radios = {} ;
	canvas = null ;
	
	// Clicks to switch tabs
	onMenuClick(event)
	{
		var sid = event.srcElement.id; 
		for (const [i, B] of Object.entries(this.page.Tabs)) 
		{
			let id = '-' + this.page.id + '-' + i ;
			var mid = 'M' + id ;
			var gid = 'G' + id ;
			var tid = 'T' + id ;

			var td = document.getElementById(tid) ;
			if (td)
			{
				td.style.display = 'none' ;
			}
			B.draw(sid == mid) ;
		}	
		this.page.currentTab = parseInt(sid.split('-')[2]) ;
		localStorage['currentTab-' + this.page.id] = this.page.currentTab ;
	}

	constructor (wynk, page, tab, id, menuCount)
	{
		this.wynk = wynk  ;
		this.page = page ;
		this.tab = tab ;
		this.id = id ;
		this.tid = '' + page.id + '-' + id ;
		this.maxdepth = 0;
		
		var xpos = id + 1 ; 
		if (menuCount > 1)
		{
			this.canvas = document.createElement('canvas') ;
			this.canvas.width = this.page.mnWidth - 5 ;
			if (this.page.buttonStyle == 'blynk')
			{
				this.canvas.height = (this.page.mnWidth/2) - 5 ;
			} else
			{
				this.canvas.height = (this.page.mnWidth/2) - 5 ;
			}
			this.canvas.id = "M-" + this.tid ;
			this.canvas.style.cssText += "width:" + (page.mnWidth - 5) + "px;height:" + ((page.mnWidth/2) - 5) + "px" ;
			var area = '1 / ' + xpos + ' / 1 / ' +  xpos ;
			this.canvas.style.gridArea = area ;
			
			this.page.menu.appendChild(this.canvas) ;
			this.canvas.addEventListener('touchstart',  ev => this.onMenuClick(event)) ;
		}
		
		this.tdiv = document.createElement('div') ;
		this.tdiv.id = 'T-' + this.tid ;
		this.page.Div.appendChild(this.tdiv) ;
		
		var g = document.createElement('div') ;
		g.id = 'G-' + this.tid ;
		g.classList.add( 'gridbox','gridbox_' + this.id );
		
		this.tdiv.appendChild(g) ;
		this.grid = document.getElementById('G-' + this.tid) ;
		
		this.tab.tiles.forEach ( function (t)
		{
			var pin = t.pin ;
			var T = Tile.Create(this,t) ;
			if (T)
			{
				this.Tiles.push(T);
				if (pin)
				{
					this.wynk.Pins[pin] = T ;
				}
				
				var ht = t.size[1] + t.posn[1] - 1 ;
				if (ht > this.maxdepth) 
				{
					this.maxdepth = ht ;
				}
			}			
		}.bind(this));
		
		this.grid.style.height = "" + (this.maxdepth * page.elWidth * 1.5 ) + "px" ;
		this.grid.style.gridTemplateRows = "repeat(" + this.maxdepth + "," + (page.elWidth * this.page.aspect) + "px)" ;
		this.draw(false) ;
	}

	// Draw the menu, tab and tiles
	draw(selected)
	{
		this.tdiv.style.display = (selected)?'block':'none' ;
		var colour ; 
		if (this.canvas != null)
		{
			var ctx = this.canvas.getContext("2d") ;
			var w = this.canvas.width ;
			var h = this.canvas.height ;
			this.canvas.style.height = '' + h + 'px' ;
			ctx.font = "18px sans-serif" ;
			ctx.textBaseline = "middle" ;
			ctx.textAlign = "center" ;
			
			if (this.page.buttonStyle == 'blynk')
			{
				this.canvas.style.backgroundColor = this.page.bgColour ;
				colour = this.page.fgColour ;
				ctx.clearRect(0,0,w,h) ;

				if (selected)
				{
					ctx.beginPath() ;
					ctx.moveTo(w*0.2, h*0.9) ;
					ctx.lineTo(w*0.8, h*0.9)		
					ctx.strokeStyle = 'red' ;
					ctx.lineWidth = 1 ;
					ctx.stroke();
				}
			} else 
			{
				this.canvas.style.backgroundColor = this.page.fgColour ;
				colour = (selected)?"red":"black" ;
				ctx.clearRect(0,0,w,h) ;
			}
			ctx.strokeStyle = colour ;
			ctx.fillStyle = colour ;
			ctx.fillText(this.tab.label, w*0.5, h*0.5) ;
		}
	}
	
	show(yn)
	{
		let elId = "T-" + this.page.id + '-' + this.id ;
		let td = document.getElementById(elId) ;
		if (td)
		{
			td.style.display = (yn)?'block':'none' ;
		}
		this.draw(yn) ;
	}
	
	setLock(lid, state) 
	{
		this.Tiles.forEach( (t) => {
			t.setLock(lid,  state) ;
		}) ;
	}
	
	doupdate()
	{
		if (typeof this.Tiles == 'Array')
		{
			this.Tiles.foreach ( (t) =>
			{
				t.doupdate() ;
			});
		}

	}
}

/* ===============================================================================================

	The Tile class is the basis for all displays and controls. It is subclassed by
		the actual code for each type.

/* =============================================================================================== */

class Tile
{
	pin = 0 ;
	save = {} ;
	label = "" ;
	size = [1,1] ;
	posn = [1,1] ;
	locklist = null ;
	disabled = false ;
	
	constructor (tab, t, canvas = true)
	{
		this.tab = tab ;
		this.page = tab.page ;
		this.wynk = tab.wynk ;
		this.pin = t.pin || 0 ;
		this.label = (typeof t.label !== "undefined")?t.label:"" ;
		this.size = t.size ;
		this.posn = t.posn ;
		if (typeof t.locklist != 'undefined') 
		{
			this.locklist = t.locklist ;
			this.disabled = true ;
//			if (this.pin == 43)
//			{ let xyzzy = 1 ; }
		}
		this.text = "" ;
		this.auto = t.auto || 0 ;
		this.radio = t.radio || 0 ;
		
		this.width = parseInt(tab.page.elWidth*this.size[0]) - 5 ;
		this.relLeft = parseInt(tab.page.elWidth*(this.posn[0]-1)) ;
		this.height = parseInt(tab.page.elWidth*this.size[1]*this.tab.page.aspect) - 5;
		this.relTop = parseInt(tab.page.elWidth*(this.posn[1]-1)*this.tab.page.aspect) ;
		
		if (canvas)
		{
			this.canvas = document.createElement('canvas') ;
			this.canvas.width = this.width ;
			this.canvas.height = this.height ;
			this.canvas.style.cssText += "width:" + this.width + "px;height:" + this.height + "px" ;
			this.canvas.id = 'wknktile-' + this.pin ;
			var area = '' + this.posn[1] + ' / ' + this.posn[0] + ' / ' + (this.posn[1]+this.size[1]) + ' / ' +  (this.posn[0]+this.size[0]) ;
			this.canvas.style.gridArea = area ;
			this.canvas.style.backgroundColor = this.page.tileColour ;
			this.tab.grid.appendChild(this.canvas) ;
		}		
	}

	setLock(lid, state)
	{
		if ((Array.isArray(this.locklist)) && 
			(this.locklist.includes(lid)))
		{
//			if (this.pin == 43)
//			{ let xyzzy = 1 ; }
		
			this.disabled = (state != 0) ;
			this.draw() ;
		}		
	}

	checkLock()
	{
		let locked = false ;
		if ((Array.isArray(this.locklist)) && 
			(this.locklist.includes(this.id)))
		{
			locked = true ;
		}		
		return locked ;
	}

	// May delay an internal timed lock	
	imBusy()
	{
		if (Array.isArray(this.locklist))
		{
			this.locklist.forEach( (lid) => 
			{
				if (typeof this.wynk.Locks[lid] !== 'undefined')
				{
					this.wynk.Locks[lid].poke() ;
				}
			}) ;			
		}		
	}

	doupdate()
	{
		var msg = {"topic":"get","payload":""} ;
		this.sendMsg(msg) ;
	}
	
	
	draw()
	{
		var page = this.tab.page ;
		var colour = page.fgColour ;
		var ctx = this.canvas.getContext("2d") ;
		var w = this.canvas.width ;
		var h = this.canvas.height ;
		ctx.clearRect(0,0,w,h) ;
				
		ctx.font = "10px sans-serif" ;
		ctx.textBaseline = "top" ;
		ctx.textAlign = "left" ;
		ctx.strokeStyle = "white" ;
		ctx.fillStyle = "white" ;
		ctx.fillText(this.label, 2, 2) ;
		
		ctx.font = "20px sans-serif" ;
		ctx.textBaseline = "middle" ;
		ctx.textAlign = "center" ;
		ctx.fillStyle = colour ;
		ctx.fillText(this.text, w/2,h-h/2.4) ;
		
	}
	
	// This static method determines the exact subclass required and returns 
	//	a new instance.
	
	static Create(tab, t)
	{
		var T ;
		switch (t.type)
		{
			case "PushButton":		T = new PushButton(tab, t) ; 		break ;
			case "Gauge":			T = new Gauge(tab, t) ;				break ;
			case "Slider":			T = new Slider(tab,t) ; 			break ;
			case "Chart":			T = new ChartTile(tab, t) ;			break ;
			case "Text":			T = new Text(tab, t) ;				break ;
			case "Lock":			T = new Lock(tab, t) ;				break ;
			case "Led":				T = new Led(tab, t) ;				break ;
			case "Pusher":			T = new Pusher(tab, t) ;			break ;
			default:				T = new Text(tab, t) ; 				break ;
		}
		return T ;
	}
	
	sendMsg(msg)
	{
		msg.page = this.wynk.currentPage ;
		msg.tab = this.tab.page.currrentTab ;
		if (typeof msg.pin === 'undefined')
		{
			msg.pin	= this.pin ;
		}
		let smsg = JSON.stringify(msg) ;
		this.wynk.ws.socket.send(smsg) ;
	}
	
	checkRadio()
	{
		if ((!this.disabled) && (this.radio) && (this.state==1))
		{
			this.tab.Radios[this.radio].forEach( (r) =>
			{
				if (r.pin != this.pin)
				{
					r.state = 0 ;
				}
				r.draw() ;
			}) ;
		}
	}

	getTouch(event, off = 0 )
	{	
		if (!event.touches[0])
		{	
			return ; 
		}
		
		if (typeof this.top === 'undefined')
		{
			this.getTopLeft() ;
		}


		let point = [0,0] ;
		point[0] = (event.touches[0].clientX - this.left) - off ; 
		point[1] = (event.target.height - (event.touches[0].clientY - this.top))  - off ; 
		return point ;
	}
			
	getTopLeft()
	{
		this.left = 0 ;
		this.top = 0 ;
		let it = this.canvas ;
		while (it != null)
		{
			this.left = this.left + it.offsetLeft ;
			this.top = this.top + it.offsetTop ;
			it = it.offsetParent ;
		}
	}	
}

/* ==================================================================
 
	The TEXT tile
	
	This is a tile with no user interaction

/* ================================================================== */

class Text extends Tile
{
	constructor(tab, t ) 
	{
		super(tab, t) ; 
		this.unit = t.unit || "" ;
		this.text = t.text + this.unit;
		this.style = t.style ;
		this.doupdate() ;
	}
	
	draw()
	{
		var page = this.tab.page ;
		var colour = (this.disabled)?'grey':page.fgColour ;
		var text = this.text ;
		var ctx = this.canvas.getContext("2d") ;
		var w = this.canvas.width ;
		var h = this.canvas.height ;
		var off = 3 ;
		ctx.clearRect(0,0,w,h) ;

		ctx.font = "20px sans-serif" ;
		ctx.textBaseline = "middle" ;
		ctx.textAlign = "center" ;
		ctx.fillStyle = colour ;

		switch (this.style)
		{
		case "fill":
			ctx.beginPath() ;
			ctx.roundRect(0,0,w,h,8) ;
			ctx.fill() ;
			ctx.fillStyle = "black" ;
			break ;

		case "outline":
			off = 4 ;
			ctx.strokeStyle = colour ;
			ctx.lineWidth = 2 ;
			ctx.beginPath() ;
			ctx.roundRect(0,0,w,h,8) ;
			ctx.stroke() ;
			break ;
		}

		ctx.fillText(this.text, w/2,h-h/2.4) ;
		
		ctx.font = "10px sans-serif" ;
		ctx.textBaseline = "top" ;
		ctx.textAlign = "left" ;
		ctx.strokeStyle = "black" ;
		ctx.fillStyle = "white" ;
		ctx.fillText(this.label, off, off) ;
		
	}
	
	onSet(msg)
	{
		this.text = msg.payload + this.unit ;
		this.draw() ;
	}
	
	disable(y=true)
	{
		this.disabled = y ;
		this.draw() ;
	}
}

/* ==================================================================
 
	The PUSHBUTTON tile

	The push button subclass can be created with variations for
	momentary push, switch and local lock / unlock of other 
	controls.  
		
	Two styles are available, a filled rounded button or a Blynk 
	menu button,
	
/* ================================================================== */

class PushButton extends Tile
{
	onTouchStart(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		this.imBusy() ;
		this.ButtonDown = Date.now() ;
		return ;
	}
	
	onTouchEnd(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }

		if (this.pin > 0)
		{
			let topic = 'set' ;
			if (this.ButtonDown + 400 < Date.now()) // Long press
			{
				topic = 'long';
			}
			
			let state = (this.state==1)?0:1 ; 
			if (this.auto)
			{
				this.state = state ;
				this.checkRadio() ;
			}
			var msg = {"topic": topic,"payload":"toggle","state": state } ;
			this.sendMsg(msg) ;
		}
		else
		{
			this.state = (this.state==1)?0:1 ; 
			this.draw() ;
			if (typeof this.lock !== 'undefined')
			{
				this.wynk.setLock(this.lock, (this.state==1)?0:1) ;
			}
		}
		
		return ;
	}

	constructor(tab, t ) 
	{
		super(tab, t) ; 
		this.state = t.state || 0 ;
		this.style = t.style || "" ;
		//this.text = t.text || this.text  ;
		if (t.text) { this.onText = this.offText = t.text ; }
		this.onText = t.onText || "ON" ;
		this.offText = t.offText || "OFF" ;
		if (t.text) { this.onText = this.offText = t.text ; }
		this.onColour = t.onColour || this.tab.page.fgColour ;
		this.offColour = t.offColour || this.tab.page.offColour ;
		
		this.lock = t.lock || null ;
		this.nrid = '' ;
		this.canvas.addEventListener('touchstart',  ev => this.onTouchStart(event)) ;
		this.canvas.addEventListener('touchend',  ev => this.onTouchEnd(event)) ;
		this.disable(false) ;
		if (this.radio)
		{
			if (typeof this.tab.Radios[this.radio] === 'undefined')
			{
				this.tab.Radios[this.radio] = [] ;
			}
			this.tab.Radios[this.radio].push(this) ;
		}
		
		this.checkRadio() ;
		var msg = {"topic":"get","payload":""} ;
		this.sendMsg(msg) ;
	}
	
	draw()
	{
		var page = this.tab.page ;
		var colour = (this.disabled)?"grey":(this.state)? this.onColour : this.offColour ;
		var textColour = (this.disabled)?"grey":(this.state)? '#FFFFFF' : colour;
		var text = (this.state)?this.onText:this.offText ;
		var ctx = this.canvas.getContext("2d") ;
		var w = this.canvas.width ;
		var h = this.canvas.height ;
		ctx.clearRect(0,0,w,h) ;
				
		switch (this.style)
		{
		case "outline":
			ctx.fillStyle = colour ;
			ctx.strokeStyle = colour ;
			ctx.lineWidth = 2 ;
			ctx.beginPath() ;
			ctx.roundRect(0,0,w,h,8) ;
			ctx.stroke() ;
			ctx.font = "20px sans-serif" ;
			ctx.fillStyle = textColour ;
			ctx.textBaseline = "middle" ;
			ctx.textAlign = "center" ;
			ctx.fillText(text, w/2,h-h/2.4) ;
			break ;
			
		case "fill":
			ctx.fillStyle = colour ;
			ctx.beginPath() ;
			ctx.roundRect(0,0,w,h,8) ;
			ctx.fill() ;
			ctx.font = "20px sans-serif" ;
			ctx.textBaseline = "middle" ;
			ctx.textAlign = "center" ;
			ctx.fillStyle = "black" ;
			ctx.fillText(text, w/2,h-h/2.4) ;
			break ;
			
		default:	
			ctx.font = "10px sans-serif" ;
			ctx.textBaseline = "top" ;
			ctx.textAlign = "left" ;
			ctx.strokeStyle = "white" ;
			ctx.fillStyle = "white" ;
			ctx.fillText(this.label, 2, 2) ;
			
			ctx.beginPath() ;
			ctx.arc(w/2,h-h/2.4,w/2.3,0,Math.PI*2) ;
			ctx.strokeStyle = colour ;
			ctx.lineWidth = 1 ;
			ctx.stroke();

			ctx.font = "20px sans-serif" ;
			ctx.textBaseline = "middle" ;
			ctx.textAlign = "center" ;
			ctx.fillStyle = textColour ;
			ctx.fillText(text, w/2,h-h/2.4) ;
			break ;
		}
	}
	
	onSet(msg)
	{
				
		let state  = null ;
		if (!isNaN(msg.state))
			{	state = parseInt(msg.state) ; }
		else if (!isNaN(msg.payload))
			{	state = parseInt(msg.payload) ; }
				
		// Various ways of setting the text
		if (typeof msg.text != 'undefined')
			{	this.onText = this.offText = msg.text ; } 
		if (typeof msg.ontext != 'undefined') 
			{	this.onText = msg.ontext ;	}
		if (typeof msg.offtext != 'undefined')
			{	this.offText = msg.offtext ;	} 
			
		if (state != null)
		{
			if (state < 0)
			{
				this.state = 0 ;
				this.disable(true) ;
			}
			else
			{
				this.state = state ;
				this.disable(this.checkLock()) ;
			}
			this.checkRadio() ;
			this.draw() ;
			if (this.lock !== null)
			{
				this.wynk.setLock(this.lock, (!this.state)) ;
			}
		}
	}
	
	disable(y=true)
	{
		this.disabled = y ;
		this.draw() ;
	}
}

/* ==================================================================
 
	The LOCK tile

	This is a special puch button that dispalys an open or closed 
	padlock. It is intended to lock and  unlock of other 
	controls.  
	
	This control function can now be configured on a PushButton,
	but the lock image can only be displayed here, and there can be 
	no built in timeout.
		
/* ================================================================== */

class Lock extends Tile
{
	lock = null ;
	timer = null ;
	tim = null ;
	
	onTouchStart(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		
		this.imBusy() ;
		this.state = (this.state==1)?0:1 ; 
		this.draw() ;
		if (typeof this.lock !== 'undefined')
		{
			this.wynk.setLock(this.lock, (this.state)) ;
			if (this.timer)
			{
				if (this.state === 0)
				{
					this.tim = setTimeout ( this.timerfunc.bind(this), this.timer * 1000 );
				} else
				{
					if (this.tim)
					{
						clearTimeout (this.tim) ;
						this.tim = null ;
					}
				}
			}
		}
		return ;
	}
	
	constructor(tab, t )
	{
		super(tab, t) ; 
		this.state = t.state || 1 ;
		this.style = t.style || "" ;
		if (typeof t.lock !== 'undefined')
		{
			this.lock = t.lock  ;
			if (typeof t.timer !== 'undefined')
			{	
				this.timer = t.timer ;
				this.wynk.Locks[this.lock] = this ;
			}
		}
		
		this.canvas.addEventListener('touchstart',  ev => this.onTouchStart(event)) ;
		this.disable(false) ;
	}
	
	draw()
	{
		var page = this.tab.page ;
		var colour = (this.disabled)?"grey":(this.state)? page.fgColour : page.fgColour ;
		var ctx = this.canvas.getContext("2d") ;
		var w = this.canvas.width ;
		var h = this.canvas.height ;
		ctx.clearRect(0,0,w,h) ;

		// Draw a padlock, open or closed.
		ctx.fillStyle = colour ;
		ctx.beginPath() ;
		ctx.roundRect(w*0.25, h*0.5, w*0.5, h * 0.3, 8) ; 
		ctx.fill() ;
		
		ctx.fillStyle = page.bgColour ;
		ctx.strokeStyle = page.bgColour ;
		ctx.lineWidth = w* 0.05 ;
		ctx.beginPath() ;
		ctx.moveTo(w*0.5, h*0.6)
		ctx.lineTo(w*0.5, h*0.7)
		ctx.stroke() ;
		
		ctx.beginPath() ;
		ctx.lineWidth = w* 0.05 ;
		if (this.state)	// Draw the hoop open or closed
		{
			ctx.arc(w*0.5, h*0.5, w* 0.2,Math.PI*0,Math.PI*1, true) ;
		}
		else
		{
			ctx.arc(w*0.5, h*0.4, w* 0.24,Math.PI*1.2,Math.PI*2.2,false) ;
		}
		ctx.lineCap = "round" ;
		ctx.strokeStyle = colour ;
		ctx.stroke();
	}
	
	// Unlock may have timeout
	timerfunc()
	{
		this.state = 1 ;
		this.wynk.setLock(this.lock, (this.state)) ;
		this.draw() ;
	}
	
	// The imBusy call from another tile may reset the timeout
	poke()
	{
		if (this.tim)
		{
			clearTimeout (this.tim) ;
			this.tim = setTimeout(this.timerfunc.bind(this), this.timer*1000) ;
		}
	}
	
	// This control may be disabled
	disable(y=true)
	{
		this.disabled = y ;
		this.draw() ;
	}
}

/* ==================================================================
 
	The GAUGE tile

	The gauge is a display only class

/* ================================================================== */

class Gauge extends Tile
{
	constructor(tab, t )
	{
		super(tab, t) ; 
		this.range = t.range ;
		this.value = 1000
		this.doupdate() ;
	}
	
	draw()
	{
		var page = this.tab.page;
		var ctx = this.canvas.getContext("2d") ;
		var w = this.canvas.width ;
		var h = this.canvas.height ;
		var colour = (this.disabled)?"grey":page.fgColour ;
		ctx.clearRect(0,0,w,h) ;
				
		ctx.font = "10px sans-serif" ;
		ctx.textBaseline = "top" ;
		ctx.textAlign = "left" ;
		ctx.strokeStyle = "white" ;
		ctx.fillStyle = "white" ;
		ctx.fillText(this.label, 2, 2) ;
		
		var centre = [w/2,h/2] ;
		var radius = Math.min(w,h)/2.7 ;
		var high = this.value/2000*1.5 + 0.75 ; 
		if (high > 2) high -= 2 ;
		
		ctx.font = "12px sans-serif" ;
		ctx.textBaseline = "bottom" ;
		ctx.textAlign = "center" ;
		ctx.fillStyle = "white" ;
		ctx.fillText("0", centre[0] - radius, h-16) ;
		ctx.fillText("2000", centre[0] + radius, h-16) ;

		ctx.beginPath() ;
		ctx.arc(centre[0], centre[1],radius,Math.PI*0.75,Math.PI*0.25) ;
		ctx.lineWidth = 16;
		ctx.lineCap = "round" ;
		ctx.strokeStyle = "black" ;
		ctx.stroke();

		ctx.beginPath() ;
		ctx.arc(centre[0], centre[1],radius,Math.PI*0.75,Math.PI*high) ;
		ctx.strokeStyle = colour ;
		ctx.stroke();
		

		ctx.font = "30px sans-serif" ;
		ctx.textBaseline = "middle" ;
		ctx.textAlign = "center" ;
		ctx.fillStyle = page.colour ;
		ctx.fillText(this.value, centre[0], centre[1]) ;
		
	}
	
	onSet(msg)
	{
		if (msg.payload != "")
		{
			this.value = parseInt(msg.payload) ;
			this.draw() ;
		}
	}
	
	disable(y=true)
	{
		this.disabled = y ;
		this.draw() ;
	}		
}

/* ==================================================================
 
	The SLIDER tile

	The slider provides a variable value and can also act as a 
	switch when the thumb is clicked not dragged. 
	
	If disabled no action is permitted
	If the state is 0 no action is permittted unless that slider is a
		toggle slider in which canse only clicking the thumb is allowed.
	If the state is 1 then sliding, selecting and thumb clicking if
		a toggle is allowed.

	IF PROGRESS - a vertical slider
	Thinking of using canvas resize together with
	context transform and rotate to keep the code 
	mostly unchanged.

			let it = event.target ;
			let Left = 0 ;
			while (it != null)
			{
				Left = Left + it.offsetLeft ;
				it = it.offsetParent ;
			}

/* ================================================================== */

class Slider extends Tile
{
	onTouchStart(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		this.imBusy() ;
		
		// Chnage this to match the 'pusher' logic for touch location
		
		
		if (event.touches[0])
		{
			var w = this.slen ;

			let x ;
			if (!this.vertical)
				{ x = (event.touches[0].clientX   - this.relLeft) - this.off2 ; } 
			else
				{ x= this.slen - (event.touches[0].clientY - this.relTop) - this.off2 	}
			var xx = x/this.length ;	//Convert to value between 0 and 1

			// Check if in the slider
			if ((xx >= 0) && (xx <= 1))	// if in range
			{
				// Check if in the thumb
				if ((x >= (this.thumb - this.thumbwing)) && (x <= (this.thumb + this.thumbwing))) 
				{
					this.draggable = (this.state != 0) ; 
					this.onthumb = true ;
				} else
				{
					this.draggable = false ;
					this.onthumb = false ;
				}
				this.xBegin = x ;
				this.xEnd = x ;
			}
		}

		return ;
	}
	
	onTouchEnd(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		
		// draggable, moved - do nothing it will already be done
		// draggable, not moved - toggle state  
		// not draggable, moved - not possible
		// not draggable, not moved - set new level
		if ((this.onthumb) && (this.toggle) && (Math.abs(this.xBegin - this.xEnd) < 10))
		{
			let state = (this.state)?0:1 ;
			
			this.draw() ;
			let level = parseInt(this.level) ; 
			let msg = {"topic":"set","payload":"toggle","state":state,"level":level} ;
			this.sendMsg(msg) ;
		} 
		else if ((this.draggable) && (this.onrelease))
		{
			let level = parseInt(this.level) ; 
			var msg = {"topic":"set","payload":"move","state":this.state,"level":level} ;
			this.sendMsg(msg) ;
		}
		else if (this.state) // not draggable
		{
			if (Math.abs(this.xBegin - this.xEnd) < 10)
			{
				var x = this.xEnd ;
				x = x/this.length ;	//Convert to level between 0 and 1
				x = (x * (this.range[1]-this.range[0])) + this.range[0] ;			
				var level = parseInt(x / this.step) * this.step ;

				if (level != this.level)
				{				
					this.level = level ;
					this.draw() ;
					let level = parseInt(this.level) ; 
					var msg = {"topic":"set","payload":"change","state":this.state,"level":level} ;
					this.sendMsg(msg) ;
				}
			}
		}			
		return ;
	}
	
	onTouchMove(event)
	{
	
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		let x ;
		if (!this.vertical)
			{ x = (event.touches[0].clientX   - this.relLeft) - this.off2 ; } //(this.posn[0]-1) * this.page.elWidth ; }
		else
			{ x= this.slen - (event.touches[0].clientY - this.relTop) - this.off2 	}
		var xx = x/this.length ;	//Convert to level between 0 and 1
		xx = (xx * (this.range[1]-this.range[0])) + this.range[0]  ;
		if ((xx >= this.range[0]) && (xx <= this.range[1]))
		{
			this.xEnd = x ;
			if ((this.draggable) && (this.state) && (event.touches[0]))
			{
				var level = parseInt((xx / this.step)+0.5) * this.step ;
				if (level != this.level)
				{				
					this.level = level ;
					this.draw() ;
					var msg = {"topic":"set","payload":"move","state":this.state,"level":level} ;
					this.sendMsg(msg) ;
				}
			}
		}
		return ;
	}
	
	vo = 0 ;
	w = 0 ;
	constructor(tab, t ) 
	{
		super(tab, t) ; 
		this.state = t.state || (!t.toggle); //t.state ;
		this.range = t.range ;
		this.step = t.step ;
		this.toggle = t.toggle || false ;
		this.onrelease = t.onrelease || false ;
		this.lock = t.lock || null ;
		this.vertical = (this.size[0] < this.size[1]) ;
		this.slen = (this.vertical)?this.canvas.height:this.canvas.width ; 
		this.sthick = (this.vertical)?this.canvas.width:this.canvas.height ; 
		
		if (this.vertical)
		{
			let ctx = this.canvas.getContext("2d") ;
			ctx.translate(0, this.canvas.height) ;
			ctx.rotate(-90 * Math.PI/180) ;

		}

		this.thumbwing = 0.05 * this.slen ;
		this.off1 = 0.07 * this.slen ;
		this.off2 = this.off1 + this.thumbwing + this.slen/40 ;
		this.length = this.slen - this.off2 * 2 ;
		
		this.level = parseInt(this.range[0] + (this.range[1]-this.range[0])/2) ; // Testing at half way

		setTimeout(() =>
		{
			let canvas = document.getElementById("wknktile-" + this.pin) ;
			if (typeof canvas !== 'undefined')
			{
				canvas.addEventListener('touchstart',  ev => this.onTouchStart(event)) ;
				canvas.addEventListener('touchend',  ev => this.onTouchEnd(event)) ;
				canvas.addEventListener('touchmove',  ev => this.onTouchMove(event)) ;
				this.draw() ;
				this.doupdate() ;
			}
		} ,200);
	}
	
	/* ====================================================================================
		Anatomy of a slider. All based on a horizontal line at canvas.height / 2
		This took me some time to get right, si I have left this working in place
		
		canvas.width is w 

		A thin line from w/15 to w-w/15			0.006666 to 0.933333
		A thumb as a rounded wide line from its location -w/20 to +w/20   < 0.05 - T - 0.05 >
		a fatter line from w/15 to thumb		0.06666 - T
		level is scaled as between 0 and 1
		A thumb position from w/10 to w-w/5 + w/10   0.1 - 0.9
		
		Round line caps add half line width each end, so a thumb drawn with
		line width 0.05 and length 0.1 will actually take up 0.15 of the width.
		If the space from each end is 0.07 the zero and max positions of the thumb
		centre must be 0.0145 and 0.9855 
		
		
		Another way is to add the slider margins and the thumb overhang to get 
		the left and right dead areas. With the above figure of 0.145 of the 
		canvas width for the margin and overhang each end, we get the slideable 
		length as 0.855 of the canvas width.	
		
		Working with this, we can position the thumb, just adding the 0.0145 
		offset, and the lines 0.15 longer and with a reduced offset of 0.7.
		
		Line offsets are 0.7w and full length 1-0.14 = 0.86w
		Thumb offset is 0.145w and range is 1.0.290  = 0.71 
	
		
		
		| 0.07 |        ( 0.075 T 0,075 )                                   | 0.07 |
		       | <----------------------- 0.86 ---------------------------> |
		       | 0.145 | <------------- Thumb range 0.71 -------->  | 0.145 | 
		
	
	Convert displayed thumb to level
		1. subtract this.off2 from the clientX level
		2. divide by the slider length
		3. Multiply by range (end-start) and add start	
	
	Convert level to thumb
		1. Convert level to fraction of the range - between 0 and 1
		2.  Multiply by the slider length
		To display add this.off2
	
	
	   ====================================================================================*/
	draw()
	{
		if (this.vertical)
		{
			let f=0 ;
		}
		var page = this.tab.page ;
		var colour = (this.disabled)?"grey":(this.state)? page.fgColour : page.offColour ;
		var ctx = this.canvas.getContext("2d") ;
		this.thumb = (this.level - this.range[0]) / (this.range[1] - this.range[0]  ) * this.length ;

		let h = this.sthick ;
		let w = this.slen ;
		
		ctx.clearRect(0,0,w,h) ;
				
		// Legend
		ctx.font = "10px sans-serif" ;
		ctx.textBaseline = "top" ;
		ctx.textAlign = "left" ;
		ctx.strokeStyle = "white" ;
		ctx.fillStyle = "white" ;
		ctx.fillText(this.label, 4, 2) ;
		
		// Current level
		ctx.textAlign  = "right" ;
		ctx.fillText(this.level, w-4, 2) ;
		
		var thLeft = this.thumb + this.off2 - this.thumbwing ;
		var thRight = this.thumb + this.off2 + this.thumbwing ;

		// Horizontal line, thick to left / bottom
		if (thLeft - w/20 >= this.off1)
		{
			ctx.beginPath() ;
			ctx.moveTo(this.off1, h/2) ;
			ctx.lineTo(thLeft - w/20, h/2)		
			ctx.strokeStyle = colour ;
			ctx.lineCap = "round" ;
			ctx.lineWidth = w/40 ;
			ctx.stroke();
		}

		// Horizontal line, thin to right
		ctx.beginPath() ;
		ctx.moveTo(thRight + w/20, h/2) ;
		ctx.lineTo(w-this.off1 + w/40, h/2)		
		ctx.strokeStyle = colour ;
		ctx.lineWidth = 1 ;
		ctx.stroke();

		// Thumb left arc
		ctx.beginPath() ;
		ctx.arc(thLeft, h/2,  w/20,  0.5 * Math.PI, 1.5 * Math.PI) ;
		ctx.fillStyle = page.tileColour ;
		ctx.lineWidth = 1 ;
		ctx.fill();			// To covwr the tghick end cap
		
		ctx.beginPath() ;
		ctx.arc(thLeft, h/2,  w/20,  0.5 * Math.PI, 1.5 * Math.PI) ;
		ctx.strokeStyle = colour ;
		ctx.lineWidth = 1 ;
		ctx.stroke();

		// Thumb right arc
		ctx.beginPath() ;
		ctx.arc(thRight, h/2,  w/20,  0.5 * Math.PI, 1.5 * Math.PI, true) ;
		ctx.stroke();

		// Thumb top
		ctx.beginPath() ;
		ctx.moveTo(thLeft, h/2-w/20) ;
		ctx.lineTo(thRight, h/2-w/20);	
		ctx.stroke();
		
		// Thumb bottom
		ctx.beginPath() ;
		ctx.moveTo(thLeft, h/2+w/20) ;
		ctx.lineTo(thRight, h/2+w/20);	
		ctx.stroke();
	
		// Thumb marks
		for (var X = -8 ; X < 10; X += 6)
		{
			ctx.beginPath() ;
			ctx.moveTo(this.thumb + this.off2 + X, h/2 - w/50) ;
			ctx.lineTo(this.thumb + this.off2 + X, h/2 + w/50) ;
			ctx.strokeStyle = colour ;
			ctx.lineWidth = 4 ;
			ctx.stroke();
		}			
	}
	
	onSet(msg) 
	{
		let state  = null ;

		// If not toggle then always 'on'
		if (this.toggle)
		{
			if (!isNaN(msg.state))
				{	state = parseInt(msg.state) ; }
			else if (!isNaN(msg.payload))
				{	state = parseInt(msg.payload) ; }
			
			if (state !== null)
			{			
				if (state < 0)
				{
					this.state = 0 ;
					this.disable(true) ;
				}
				else
				{
					this.state = state ;
					this.disable(this.checkLock()) ;
				}
				this.draw() ;
				if (this.lock !== null)
				{
					this.wynk.setLock(this.lock, (!this.state)) ;
				}
			}
		}

		if (!isNaN(msg.level))
			{	this.level = parseInt(msg.level) ;	}
		
		this.draw() ;
	}
	
	disable(y=true)
	{
		if (this.pin == 43)
		{ let xyzzy = 1 ; }
		
		this.disabled = y ;
		this.draw() ;
			
	}
}

/* ==================================================================
 
	The CHART tile

	Chart:
		These are created using chart.js and it isa worth looking at
		the documentation for that.
	
		The actual plot or plots on the chart are instantiated as plot
		classes with separate pins. They share common x axis properties
		
		Subcharts have request that both identify the selection, but 
			also specify the database table and columns required. 
			precision also perhaps ROUND(xxx, prec)	
			 e.g. pressure 0 and temperature 1
			 
		 Currently only line charts with DateTime x axis are
			supported. the datetime values are transmitted as
			Unix epoch milliseconds.
			
		properties of a subchart are:
			data as {x: y:}
			dataset properties some standard but with 
				extras and overrides
			grad as required
			scale properties
			Simple logic to determine changes of format for
				different time periods.
	
	Currently data is requested on demand
	
	It has been necessary to use a bit of a fiddle due to iOS not honouring
	grids within grids. Instead of creating a div with both grid and gridarea 
	settings in the base tab grid, I had to create div with the same parent 
	as the base tab grid with a higher z-index, positioned where it is 
	meant to be and displayed as a grid for the chart and period selection :-(
	
	Later, maybe:
		horizontal scrolling using finger drag		
			prograssive data requests - do we cache data? 
	
*/

class ChartTile extends Tile
{
	plots = [] ;
	chart = null ;
	selCanvas = [] ;
	periodId = 0 ;

	onSelClick(event)
	{
		var sid = event.srcElement.id; 
		this.periodId = parseInt(sid.split('.')[1]) ;
		this.setperiod(true) ;
	}

	constructor(tab,t)
	{
		super(tab, t, false) ;

		this.xAxis = t.xAxis ;
		this.periods = t.periods || null ;
		
		var h = this.height ;
		this.ph = 0;
		var w = this.width ;
		var parent = this.tab.grid ;

		if (this.periods)
		{
			if (this.tab.page.buttonStyle == 'blynk')
			{
				this.ph = this.page.mnWidth / 3 ;
			} else
			{
				this.ph = this.page.mnWidth / 2 ;
			}
			
			var cols = this.periods.length ;
			
			this.chartdiv = document.createElement('div') ;
			this.chartdiv.classList.add('chartbox') ;
			this.chartdiv.width = this.width ;
			this.chartdiv.height = this.height ;
			this.chartdiv.style.cssText += "width:" + this.width + "px;height:" + this.height + "px;" ;
			this.chartdiv.style.gridTemplateColumns = "repeat( " + this.periods.length + ", calc(100% / 6))" ;
			var rows = "" + (this.height - this.ph) + "px " +  this.ph +"px" ;
			this.chartdiv.style.gridTemplateRows = rows ;
			this.chartdiv.style.top = '' + this.relTop + 'px' ;
			this.chartdiv.style.position = 'relative' ;
			this.chartdiv.style.display = 'grid';
			this.chartdiv.style.zIndex = 20;
			this.chartdiv.id = 'TIG' + this.pin ;;
			this.tab.tdiv.appendChild(this.chartdiv) ;
	
			area = '1 / 1 / ' + this.periods.length + ' / 2' ;
			parent = this.chartdiv ;
		}

		this.canvas = document.createElement('canvas') ;
		this.canvas.width = this.width ;
		this.canvas.height = this.height - this.ph ;
		this.canvas.style.cssText += "width:" + this.width + "px;height:" + (this.height-this.ph) + "px" ;
		this.canvas.id = 'TC' + this.pin;
		this.canvas.style.gridArea = area ;
		parent.appendChild(this.canvas) ;
		
		if (this.periods)
		{
			for (var i = 0; i < this.periods.length; i++)
			{				
				var xpos = i + 1 ; 
				var c = document.createElement('canvas') ;
				c.width = this.width / this.periods.length ;
				c.height = this.ph ;
				c.id = "MS" + this.pin + "." + i ;

				var area = '2 / ' + xpos + ' / 3 / ' +  (xpos+1) ;
				c.style.gridArea = area ;
				c.mytext = this.periods[i] ;
				c.myId = i ;
				this.selCanvas[i] = c ;
				this.chartdiv.appendChild(c) ;
				c.addEventListener('touchstart',  ev => this.onSelClick(event)) ;
			}
			this.periodId = 0 ;
			
			let data = parseInt(localStorage.getItem('pin' + this.pin)) ; 
			if (Number.isInteger(data))
			{
					this.periodId = parseInt(data) ;
			}
			this.setperiod(false) ;
			this.buildthecharts(t) ;
		}
		else
		{		
			this.draw() ;
			
		}
	}	
	
	buildthecharts(t)	
	{
		var ctx = this.canvas.getContext("2d") ;

		this.chart = new Chart(ctx,
			{
				data: 
				{
					datasets: [],
				},
				options: 
				{
					plugins: 
					{
						legend: { display: false },
					},
					animation: false,
					scales: 
					{		
						xAxes: 
						{
							type: 'timeseries',
							time: 
							{
								minUnit: 'hour', // smallest time format

								displayFormats: {
									hour: "HH",
									day: "dd/MM",
									week: "dd/MM",
									month: "MMMM yyyy",
									quarter: 'MMMM yyyy',
									year: "yyyy",
								},
							},
							ticks: {
								autoSkip: true,
								maxTicksLimit: 3,
								maxRotation: 0,
								minRotation: 0,
								color:'white',
								z:10,
								
							},
						},								
					},
				}
			});
		
		
		this.chart.data.datasets= [] ;
		for (var i=0; i<t.plots.length; i++)
		{
			this.chart.data.datasets[i] = null ;
			this.plots.push(new ChartPlot(this, t.plots[i], i)) ;
		}
		this.doupdate() ;
		
	}
	
	doupdate()
	{
		this.plots.forEach( (p) => 
		{
			p.doupdate() ;
		});
	}
	
	setperiod (update)
	{	
if (this.periodId > 10) {
		let x = 1;
}
		localStorage.setItem('pin' + this.pin, this.periodId) ;
		var pertext = this.periods[this.periodId] ;
		var num = parseInt(pertext.substr(0,1)) ;
		var pertype = pertext.substr(1) ;
		var mSecs = 0 ;86400000 
		switch (pertype)
		{
		case 'd': mSecs = 86400000 ; break ;
		case 'w': mSecs = 604800000; break ;
		case 'm': mSecs = 2678400000; break ;
		case 'y': mSecs = 32140800000; break ;
		}
		this.period = mSecs * num ;
		this.draw() ;
		if (update)
		{
			this.plots.forEach(x => {x.doupdate();}) ;
		}
	}

	draw()
	{
		var colour ;
		var w = this.width / this.periods.length ;
		var h = this.ph ;
		
		this.selCanvas.forEach( function(c) 
		{
			c.style.height = '' + h + 'px' ;
			var ctx = c.getContext("2d") ;
			ctx.font = "18px sans-serif" ;
			ctx.textBaseline = "middle" ;
			ctx.textAlign = "center" ;

			if (this.page.buttonStyle == 'blynk')
			{
				c.style.backgroundColor = this.page.bgColour ;
				colour = this.page.fgColour ;
				ctx.clearRect(0,0,w,h) ;
					
				if (c.myId == this.periodId)
				{
					ctx.beginPath() ;
					ctx.moveTo(w*0.2, h*0.9) ;
					ctx.lineTo(w*0.8, h*0.9)		
					ctx.strokeStyle = 'red' ;
					ctx.lineWidth = 1 ;
					ctx.stroke();
				}
			} else 
			{
				c.style.backgroundColor = this.page.fgColour ;
				colour = (c.myId == this.periodId)?"red":"black" ;
				ctx.clearRect(0,0,w,h) ;
			}

			ctx.strokeStyle = colour ;
			ctx.fillStyle = colour ;
			ctx.fillText(c.mytext, w/2, h/2) ;

		}.bind(this) ) ;

	}
}

/* ==================================================================
 
	The CHART PLOT
	
	Required by a CHART to describe a single plot

/* ================================================================== */

class ChartPlot
{
	page = null ;
	chartTile = null ;
	chart = null ;
	plot = null ;
	pin = 0 ;
	
	constructor (chartTile, plot, seq)
	{

		this.chartTile = chartTile ;
		this.wynk = chartTile.wynk ;
		this.chart = chartTile.chart ;
		this.plot = plot ;
		this.seq = seq ;
		if (plot.pin)
		{
			this.pin = plot.pin ;
			this.wynk.Pins[this.pin] = this ;
		}

		this.dataset = 	{
			type: this.plot.type || 'line' ,
			label: this.plot.legend || '', 
			color: this.plot.color || 'white',
			yAxisID: 'y-axis-' + this.seq,
			borderColor: this.plot.color || 'white',
			fill: this.plot.fill || null,
			steppedLine: false,
			lineTension: 0.4 ,
			pointRadius: 0,
		} ;	
				
		if (typeof this.plot.backgroundColor !== 'undefined') 
		{
			if (Array.isArray(this.plot.backgroundColor))
			{
				var h = this.chartTile.height ;
				var ctx = this.chartTile.canvas.getContext("2d") ;

				this.grad = ctx.createLinearGradient(0,h,0,0) ;
				this.grad.addColorStop(0, this.plot.backgroundColor[0]) ;
				this.grad.addColorStop(1, this.plot.backgroundColor[1]) ;
				this.dataset.backgroundColor = this.grad ;
			}
			else
			{
				this.dataset.backgroundColor = this.plot.backgroundColor ;
			}
		}
		
		this.chart.data.datasets[this.seq] = this.dataset ;

		this.yAxis = 
		{
			type: 'linear',
			position: this.plot.yAxis.position,
			suggestedMin: this.plot.yAxis.min,
			suggestedMax: this.plot.yAxis.max,
			ticks: 
			{
				mirror: true,
				color: 'white',
				z:10,
			}
		} ;
			
		if (this.plot.yAxis.position == 'none') 
		{
			this.yAxis.position = 'right' ;
			this.yAxis.ticks.display = false ;
		}
		this.chart.options.scales['y-axis-' + this.seq] = this.yAxis ; //options?

			
		this.doupdate() ;
	}

	doupdate()
	{
		var action = '' ;
		if (Array.isArray(this.plot.case))
		{
			let pid = this.chartTile.periods[this.chartTile.periodId] ;
			for (var i=0; i< this.plot.case.length; i++)
			{
				let c = this.plot.case[i] ;
				if (Array.isArray(c.period))
				{
					if ((c.period.length==0) || (c.period.includes(pid)))
					{
						if (typeof c.format !== 'undefined')
						{
							action = c.format ;
							this.chart.options.scales['y-axis-' + this.seq].display = (action != 'none') ; //options?
							if (typeof c.fill != 'undefined')
							{
								this.chart.data.datasets[this.seq].fill = c.fill ;
							}
							break  ;
						}
					}
				}
				if (action != '')
				{
					break ;
				}
			}
		}

		if (action != 'none')
		{
			var end = Date.now()  ;	
			var payload = this.plot.data ;
			payload.range = [this.chartTile.period,end] ;
			var msg = {"topic":"getdata","payload":payload,"method":"newget","aggregate":action,"pin":this.pin} ;
			this.chartTile.sendMsg(msg) ;
		}
		else
		{
			this.chart.data.datasets[this.seq].data = [] ;
			this.chart.update() ;
		}
	}
		
	onSet(msg) 
	{
		if (msg.payload)
		{
			var data = JSON.parse(msg.payload) ; // Array of arrays of x value, y value
			this.chart.data.datasets[this.seq].data = data ;
			this.chart.update() ;
		}
		
	}
		
}

/* ==================================================================
 
	The LED tile
	
	This is a tile with no user interaction

/* ================================================================== */

class Led extends Tile
{
	constructor(tab, t )
	{
		super(tab, t) ; 
		this.state = 0 ;
		this.doupdate() ;
	}
	
	draw()
	{
		let page = this.tab.page ;
		let colour = (this.disabled)?'grey':page.fgColour ;
		let ctx = this.canvas.getContext("2d") ;
		let w = this.canvas.width ;
		let h = this.canvas.height ;
		let radius = Math.min(w,h) * 0.3 ;
		ctx.clearRect(0,0,w,h) ;

		ctx.font = "10px sans-serif" ;
		ctx.textBaseline = "top" ;
		ctx.textAlign = "left" ;
		ctx.strokeStyle = "white" ;
		ctx.fillStyle = "white" ;
		ctx.fillText(this.label.toUpperCase(), 2, 2) ;


		ctx.beginPath() ;
		ctx.arc(w * 0.5, h * 0.5, radius, Math.PI*0,Math.PI*2) ;
		ctx.lineWidth = 1;
		ctx.strokeStyle = colour ;
		if (this.state)
		{
			ctx.fillStyle = colour ;
			ctx.fill();
		}
		else
		{
			ctx.stroke();
		}
	}
	
	onSet(msg)
	{
		let state = null ;
		if (!isNaN(msg.state))
			{	state = parseInt(msg.state) ; }
		if (!isNaN(msg.payload))
			{	state = parseInt(msg.payload) ; }
		
		if (state !== null)
		{
				this.state = msg.state ;
		}
		this.draw() ;
	}
	
	disable(y=true)
	{
		this.disabled = y ;
		this.draw() ;
	}
}

/* ==================================================================
 
	The PUSHER tile
	
	This is a touch tile that retrun repeated message with a 
	payload dependant on the ditance from the centre.

/* ================================================================== */

class Pusher extends Tile
{

	onTouchStart(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		this.imBusy() ;
		
		this.doTouch(event) ;
		this.doSend() ;
		this.timer = setInterval( () =>
		{
			this.doSend() ;
		},300) ;
		return ;
	}
	
	onTouchEnd(event)
	{
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }
		clearTimeout(this.timer) ;

		return ;
	}
	
	onTouchMove(event)
	{
	
		if (this.disabled) { return ; }
		if (event.target == this.canvas) { event.preventDefault(); }

		this.doTouch(event) ;
		return ;
	}

	doTouch(event)
	{	
		if (event.touches[0])
		{	
			let point = this.getTouch(event, this.off1); 
			let x = (this.vertical)?point[1]:point[0] ;
			let xx = ((x/(this.slen - (this.off1 * 2))) * 2) - 1 ;	//Convert to value between -1 and 1
			this.step = ((Math.abs(xx)) ** this.power) * Math.sign(xx) ;
		}
	}
	
	doSend()
	{
		if (this.step !== 0)
		{
			let payload = this.step * this.fast ;
			var msg = {"topic":"change","payload":payload,"state":1} ;
			this.sendMsg(msg) ;
		}
	}

	constructor(tab, t )
	{
		super(tab, t) ; 
		this.state = 1 ;
		this.fast = t.fast || 1 ;
		this.power = t.power || 2 ;
		this.vertical = (this.size[0] < this.size[1]) ;
		this.slen = (this.vertical)?this.canvas.height:this.canvas.width ; 
		this.sthick = (this.vertical)?this.canvas.width:this.canvas.height ; 
		this.off1 = 0.07 * this.slen ;
		
		if (this.vertical)
		{
			let ctx = this.canvas.getContext("2d") ;
			ctx.translate(0, this.canvas.height) ;
			ctx.rotate(-90 * Math.PI/180) ;

		}
		
		setTimeout(() =>
		{
			let canvas = document.getElementById("wknktile-" + this.pin) ;
			if (typeof canvas !== 'undefined')
			{
				canvas.addEventListener('touchstart',  ev => this.onTouchStart(event)) ;
				canvas.addEventListener('touchend',  ev => this.onTouchEnd(event)) ;
				canvas.addEventListener('touchmove',  ev => this.onTouchMove(event)) ;
				this.draw() ;
			}
		} ,200);

	}
	
	draw()
	{
		let page = this.tab.page ;
		let colour = (this.disabled)?'grey':page.fgColour ;
		let ctx = this.canvas.getContext("2d") ;
		let w = this.slen ;
		let h = this.sthick ;
		let radius = Math.min(w,h) * 0.3 ;
		ctx.clearRect(0,0,w,h) ;

		ctx.font = "10px sans-serif" ;
		ctx.textBaseline = "top" ;
		ctx.textAlign = "left" ;
		ctx.strokeStyle = "white" ;
		ctx.fillStyle = "white" ;
		ctx.fillText(this.label.toUpperCase(), 2, 2) ;
		
		// Horizontal line, thick to left / bottom
		ctx.beginPath() ;
		ctx.moveTo(this.off1, h * 0.65) ;
		ctx.lineTo(this.slen-this.off1, h * 0.65)		
		ctx.strokeStyle = colour ;
		ctx.lineCap = "round" ;
		ctx.lineWidth = h * 0.6 ;
		ctx.stroke();
		
		let space = (this.slen - (this.off1 * 2)) / 10 ;
		ctx.strokeStyle = page.tileColour ;
		ctx.lineCap = "flat" ;
		ctx.lineWidth = 2 ;
		ctx.beginPath() ;

		ctx.moveTo(this.off1 + (space * 5), h * 0.4) ;
		ctx.lineTo(this.off1 + (space * 5), h * 0.9) ;		
		for ( let i = 2; i < 6 ; i+=2)
		{
			ctx.moveTo(this.off1 + (space * (5+i)), h * 0.4) ;
			ctx.lineTo(this.off1 + (space * (5+i) + h * 0.2), h * 0.65)		
			ctx.lineTo(this.off1 + (space * (5+i)), h * 0.9)		

			ctx.moveTo(this.off1 + (space * (5-i)), h * 0.4) ;
			ctx.lineTo(this.off1 + (space * (5-i) - h * 0.2), h * 0.65)		
			ctx.lineTo(this.off1 + (space * (5-i)), h * 0.9)		
		}
		
		ctx.moveTo(this.off1 + (space * (9.3)), h * 0.4) ;
		ctx.lineTo(this.off1 + (space * (9.3) + h * 0.2), h * 0.65)		
		ctx.lineTo(this.off1 + (space * (9.3)), h * 0.9)		
		
		ctx.moveTo(this.off1 + (space * (-9.3)), h * 0.4) ;
		ctx.lineTo(this.off1 + (space * (-9.3) - h * 0.2), h * 0.65)		
		ctx.lineTo(this.off1 + (space * (-9.3)), h * 0.9)		
		ctx.stroke();
		
	}

	disable(y=true)
	{
		this.disabled = y ;
		this.draw() ;
	}
}

/* ==================================================================
	The following two classes encapsulate a recovering WebSockets
	connection that passes received messages to Wynk.
/* =================================================================*/

class WS
{
	constructor(server, wynk)
	{
		this.socket = null ;
		this.server = server ;
		this.wynk = wynk ;
		this.reconnectTimer = new Timer(() => 
		{
            this.disconnect()
            this.connect()
        }, this.reconnectAfterMs)
		
		this.connect() ;
    }
		
	connect()
	{
		this.socket = new WebSocket(this.server);
		
		this.socket.onopen = function(e)
		{
			var msg = '{"topic":"init","payload":"init"}' ;
			this.socket.send(msg) ;

		}.bind(this) ;

		this.socket.onmessage = function(e)
		{
			var msg = JSON.parse(e.data) ;
			this.wynk.onMessage(msg) ;
		}.bind(this) ;

		this.socket.onclose = function(e)
		{
			// On connection close try again to connect
            this.reconnectTimer.scheduleTimeout() ;
		}.bind(this) ;

		this.socket.onerror = function(e)
		{
			this.socket = null ;
		}.bind(this) ; 
	}
	
    // close socket connection 
    disconnect() 
	{
        // resetting in close method to stop timer on disconnect
        this.socket.onclose = function(){}
        // Closing socket
        this.socket.close()
    }
 
	// Reconnect time intervals based on tries
    reconnectAfterMs(tries)
	{
        return [1000, 2000, 5000, 10000][tries - 1] || 10000
    }
}

class Timer 
{
	constructor(callback, timerCalc)
	{
		this.callback  = callback;
		this.timerCalc = timerCalc;
		this.timer     = null;
		this.tries     = 0;
	}
  
    reset()
	{
      this.tries = 0
      clearTimeout(this.timer)
    }

    scheduleTimeout()
	{
		clearTimeout(this.timer)
		this.timer = setTimeout(() => 
		{
			this.tries = this.tries + 1
			this.callback()
		}, this.timerCalc(this.tries + 1)) ;
	}
}

/* ==================================================================
 
 Here is where the action all starts

/* ================================================================== */

var WYNK ; 
var Server ;

// Early iOS Safari doesn't have a canvas roundRect method, so add one if required
if (!CanvasRenderingContext2D.prototype.roundRect)
{
	CanvasRenderingContext2D.prototype.roundRect = function( x, y, width, height, radius=5, fill=false, stroke = true)
	{
		if (typeof radius === 'number') 
		{
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius}; 
		}
		
		this.beginPath();
		this.moveTo(x + radius.tl, y);
		this.lineTo(x + width - radius.tr, y);
		this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		this.lineTo(x + width, y + height - radius.br);
		this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		this.lineTo(x + radius.bl, y + height);
		this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		this.lineTo(x, y + radius.tl);
		this.quadraticCurveTo(x, y, x + radius.tl, y);
		this.closePath();
		if (fill) 
		{
			this.fill();
		}
		if (stroke) 
		{
			this.stroke();
		}
	}
}

window.addEventListener('load', async () => 
{
	let l = window.location ;
    Server = ((l.protocol == 'https:')?'wss:':'ws:')  + "//" + 
		l.hostname + ":" + ((l.port == "")?'1880':l.port) + "/" + NodeRedWebSock ;
		
	if (typeof(Storage) !== 'undefined')
	{
		WYNK = new Wynk(Server) ;		
			
	} else
	{
		document.body.innerHTML = "<h1>No storage</h1>" ;
	}
}) ;
