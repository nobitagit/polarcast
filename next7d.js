 /* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
 * http://benalman.com/
 * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */

(function(){

(function(a){var b=a({});a.subscribe=function(){b.on.apply(b,arguments)},a.unsubscribe=function(){b.off.apply(b,arguments)},a.publish=function(){b.trigger.apply(b,arguments)}})(jQuery)

	var bd = $('body');

	var Utils = (function(){
		var encodeGeodata = function(data){
			// chop the data string and remove commas and space after commas
			var ent = data.split(', '),
				ret = [],
				i, len;
			// replace whitespaces with + inside each el of array and assign it
			// to the array that will be returned
			for( i = 0, len = ent.length; i < len; i++){
				ret.push( ent[i].split(' ').join('+') );
			}
			// convert Geobytes "united states" to Open Map's "USA"
			if (ret[2] === "United+States") {
				ret[2] = "USA";
			} else {
			// outside USA no need for specifying counties so we ditch the 2nd el in array
				ret.splice(1,1);
			}
			// return a new string readable from Open Map
			// ex. New+York,NY,USA
			return ret.join(',');
		},
		resolveDate = function( dt ){
			var date = new Date(1000*dt);
			return JSON.stringify(date);;
		},
		getWeekDay = function(num) {
		  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

		  return days[ num ];
		};
		return {
			encodeGeodata : encodeGeodata,
			resolveDate: resolveDate,
			getWeekDay : getWeekDay
		};
	})();

	App = {
		encodedRequest : null,
		cityData: null,
		initialised: false,
		registerHandlers: function(){
			Handlebars.registerHelper('getDay', function(dt) {
				var date = new Date(1000*dt);
				return Utils.getWeekDay( date.getDay() ) + ' ' + date.getDate();
			});

			Handlebars.registerHelper('getMo', function(dt) {
				var month = new Date(1000*dt);
				return month;
			});		
		},
		initAutocomplete: function(){
			$('#main_search-1').typeahead({
			 	name: 'chooseCity',
			 	limit: 10,
			 	remote: 'http://gd.geobytes.com/AutoCompleteCity?callback=?&q=%QUERY',
			 	//prefetch: 'short.json',
			 	template: Handlebars.compile( $('#templ-search').html() ),
			 	engine: Handlebars
			});		
		},
		start: function(){
			this.initialised = true;
			this.offFormClick();
			this.searchedCity = $('#main_search-1').val();

			this.encodedRequest = Utils.encodeGeodata( this.searchedCity );

			this.requestData();
		},
		requestData: function(){
			var self = this;

			$.ajax({
				url: 'http://api.openweathermap.org/data/2.5/forecast/daily?',
				data: 'q=' + this.encodedRequest + '&units=metric&cnt=7&mode=json&callback=?',
				dataType: "jsonp"
			}).done(function(data){
				self.cityData = data;
				//console.log('q=' + this.encodedRequest + '&units=metric&cnt=7&mode=json&APPID=5d7eb6940df94d231178502bdaf4769b&callback=?');
				$.publish('cityForecast:dataStored');
			}).fail(function(){
				//alert('something went wrong');
			});
		},
		render: function(){
			// clear any previous search
			this.clearResults();
			var temp = Handlebars.compile( $('#templ-forecast_multi').html() ),
				target = $('<div id="progress_result">');
				console.log('render');
				//console.log(this.cityData);
				target.html( temp( this.cityData ) );
				target.hide().appendTo('#progress_display').fadeIn();
				//console.log('q=' + this.encodedRequest + '&units=metric&cnt=7&mode=json&callback=?');

			var tempSingle = Handlebars.compile( $('#templ-forecast_single').html() ),
					targetS = $('<div id="today_cast">');
					targetS.html( tempSingle( this.cityData ) );
					targetS.hide().appendTo('#today_display').fadeIn();

			this.showAll();
		},
		showForm: function(){
			bd.removeClass('forecast_result');
		},
		showAll: function(){
			bd.addClass('forecast_result');		
		},
		clearResults: function(){
			$('#progress_result').css({opacity: 0}).remove();
			$('#today_cast').css({opacity: 0}).remove();
		},
		offFormClick: function(){
			bd.on('click', this.showAll);

			$('#main_widget').on('click', function(e){
				e.stopPropagation();
			});
		},
		setSubscribers: function(){
			var self = this;
			$.subscribe('cityForecast:dataStored', function(){
				self.render();
			});
			$.subscribe('cityForecast:start', function(){
				self.start();
			});
			$.subscribe('cityForecast:focused', function(){
				self.showForm();
			});
		},
		setPublishers: function(){
			$('#choose_city-1').on('submit', function(e){
				$.publish('cityForecast:start');
				e.preventDefault();
			});
			$('input.tt-query').on('focus', function(){
				$.publish('cityForecast:focused');			
			})
		},
		init: function(){
			this.initAutocomplete();
			this.registerHandlers();
			this.setPublishers();
			this.setSubscribers();
		}

	};

	window.App = App;

})();


App.init();

