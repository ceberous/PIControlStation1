
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

var spawn = require('child_process').spawn;
var ButtonManager = spawn( 'python' , ["/home/pi/WORKSPACE/NODEJS/MopidyTest6/1.py"]);


var Mopidy = require("mopidy");
var mopidy = new Mopidy({webSocketUrl: "ws://localhost:6690/mopidy/ws/"});

//mopidy.on(console.log.bind(console));


var MopidyManager = {

	init: function() {
		//MopidyManager.playlistManager.updateCache();
		MopidyManager.playbackManager.getState();
		MopidyManager.tracklistManager.getCurrentList();
	},


	playbackManager: {

		currentState: "",
		currentTimePosition: "",

		getState: function() {

		    mopidy.playback.getState().then(function (state) {
		        console.log(state);
		        MopidyManager.playbackManager.currentState = state;
		    });

		},		
		
		togglePlayPause: function() {

			if ( MopidyManager.playbackManager.currentState === "paused" ) {
				MopidyManager.playbackManager.play();
			}
			else {
				MopidyManager.playbackManager.pause();
			}

		},

		play: function() {

		    mopidy.playback.play().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });

		},

		next: function() {
		    mopidy.playback.next().then(function (something) {
		        MopidyManager.playbackManager.getState();
		        setTimeout( function() {
		        	MopidyManager.tracklistManager.getCurrentPosition();
		        } , 1000 );
		    });
		},

		previous: function() {
		    mopidy.playback.previous().then(function (something) {
		        MopidyManager.playbackManager.getState();
		        setTImeout( function() {
		        	MopidyManager.tracklistManager.getCurrentPosition();
		        } , 1000 );
		    });
		},

		stop: function() {
		    mopidy.playback.stop().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });
		},

		pause: function() {
		    mopidy.playback.pause().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });
		},

		resume: function() {
		    mopidy.playback.resume().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });
		},

		getTimePosition: function() {
		    mopidy.playback.getTimePosition().then(function (timePosition) {
		    	console.log(timePosition);
		        MopidyManager.playbackManager.currentTimePosition = timePosition;
		    });
		},

		seek: function() {

		},

	},

	playlistManager: {

		cachedPlaylists: [],

		printCache: function() {

			for ( var i = 0; i < MopidyManager.playlistManager.cachedPlaylists.length; ++i ) {
				console.log( MopidyManager.playlistManager.cachedPlaylists[i].name + " = " + MopidyManager.playlistManager.cachedPlaylists[i].uri );
			}

		},

		updateCache: function() {
		
			mopidy.playlists.asList().then(function(list){
				for ( var i = 0; i < list.length; ++i ) {
					var j = {};
					j.name = list[i].name;
					j.uri = list[i].uri;
					MopidyManager.playlistManager.cachedPlaylists.push(j);
				}
				MopidyManager.playlistManager.printCache();
			});

		},

	},

	tracklistManager: {

		currentList: [],
		currentIndex: 0,
		currentListLength: 0,
		currentRandomMode: false,

		getCurrentList: function() {

		    mopidy.tracklist.getTracks().then( function(tracks) {
		        //console.log(tracks);
		        MopidyManager.tracklistManager.currentList = tracks;
		        MopidyManager.tracklistManager.currentListLength = tracks.length;
		        MopidyManager.tracklistManager.getCurrentPosition();
		    });

		},

		getCurrentPosition: function() {
		    mopidy.tracklist.index().then( function(index) {
		    	MopidyManager.tracklistManager.currentIndex = index;
		    	MopidyManager.tracklistManager.getRandomMode();
		    	setTimeout(function(){
					console.log( MopidyManager.tracklistManager.currentList[index].name + "\n[" + index + "] of " + MopidyManager.tracklistManager.currentListLength.toString() + " || SHUFFLE = " + MopidyManager.tracklistManager.currentRandomMode.toString() );
		    	} , 500 );
		    });
		},

		getRandomMode: function() {
			mopidy.tracklist.getRandom().then( function( result ){
				console.log(result);
				MopidyManager.tracklistManager.currentRandomMode = result;
			})
		},

		setRandomMode: function(value) {
			mopidy.tracklist.setRandom(value).then( function( result ){
				console.log(result);
				MopidyManager.tracklistManager.currentRandomMode = result;
			});
		},

		toggleShuffle: function() {
			if ( MopidyManager.tracklistManager.currentRandomMode === false ) {
				MopidyManager.tracklistManager.setRandomMode(true);
			}
			else {
				MopidyManager.tracklistManager.setRandomMode(false);
			}
		},

	}


};


var handleButtonInput = function(wInput) {

	switch(wInput) {

		case "1":
			console.log("toggle Play / Pause");
			MopidyManager.playbackManager.togglePlayPause();
			break;
		case "2":
			console.log("previous");
			MopidyManager.playbackManager.previous();
			break;
		case "3":
			console.log("next");
			MopidyManager.playbackManager.next();
			break;
        case "4":
        	console.log("we got a 4");
			break;
		case "5":
			console.log("we got a 5");
			break;
		case "6":
			console.log("toggle suffle");
			MopidyManager.tracklistManager.toggleShuffle();
			break;
		default:
			break;
	}

};


mopidy.on('state:online', function () {
    
    MopidyManager.init();

	ButtonManager.stdout.on( "data" , function(data) {
		var message = decoder.write(data);
		message = message.trim();
		handleButtonInput(message);
	});

});


process.on('SIGINT', function () {
	mopidy.close();
	mopidy.off();
	mopidy = null;
	ButtonManager.kill('SIGHUP');
	console.log("\nShutting Everything Down\n");
});



