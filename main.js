function zeroPad (value, length) {
	value = String(value);
	while (value.length < length) {
		value = '0' + value;
	}
	return value;
}

function wfmtDateToDate (sDate) {
	var dateParts = sDate.match(/^\s*(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\s*$/);
	var dateObj;
	if (! dateParts) {
		return new Date;
	}
	return new Date(dateParts[3], parseInt(dateParts[1])-1, dateParts[2], dateParts[4], dateParts[5], dateParts[6]);
}

function Song () {
	this.time;
	this.artist;
	this.composer;
	this.conductor;
	this.name;
}

function wfmtToSong (playlistSong) {
	var song = new Song();
	song.time = wfmtDateToDate(playlistSong._start_time);
	song.artist = playlistSong.artistName.replace(/"/g,'');
	song.composer = playlistSong.composerName;
	song.conductor = playlistSong.conductor
	song.name = playlistSong.trackName.replace(/"/g,'');
	return song;
}

function extractHour (playlist, remoteHour, localHour) {
	var extract = [];
	for (var x = 0; x < playlist.length; x++) {
		if (playlist[x].time.getHours() == remoteHour) {
			playlist[x].time.setHours(localHour)
			extract.push(playlist[x]);
		}
	}
	return extract
}

function parseList (playlist, date) {
	var extract;
	var localList = [];
	switch (date.getDay()) {
		// Sunday - wfmt 5-8a = kmst 8-11p
		case 0:
			localList = localList.concat(extractHour(playlist, 5, 20));
			localList = localList.concat(extractHour(playlist, 6, 21));
			localList = localList.concat(extractHour(playlist, 7, 22));
			localList = localList.concat(extractHour(playlist, 8, 23));
			break;
		// Sunday - wfmt 7-9a = kmst 10-11p
		default:
			localList = localList.concat(extractHour(playlist, 7, 22));
			localList = localList.concat(extractHour(playlist, 8, 23));
	}
	return localList;
}

function getTimeStr (date) {
	return zeroPad(date.getHours(), 2) + ':'
		+ zeroPad(date.getMinutes(), 2) + ':'
		+ zeroPad(date.getSeconds(), 2);
}

function getDateStr (date) {
	return zeroPad(date.getMonth()+1, 2) + '/'
		+ zeroPad(date.getDate(), 2) + '/'
		+ date.getFullYear();
}

function printList (playlist) {
	var textarea = document.getElementById('playlist');
	var preStr = "Date\tTime\tTitle\n";
	for (var x = 0; x < playlist.length; x++) {
		preStr += getDateStr(playlist[x].time);
		preStr += '\t' + getTimeStr(playlist[x].time);
		preStr += '\t' + playlist[x].name;
		preStr += '\n';
	}
	textarea.innerText = preStr;
	textarea.style.height = "";
	textarea.style.height = textarea.scrollHeight + "px";
}

function fetchPlaylist(date, callback) {
	var importList;
	var playlist = [];
	var baseUrl="https://api.composer.nprstations.org/v1/widget/55913d0c8fa46b530f88384b/playlist"
	var datestamp = date.getFullYear() + '-' + zeroPad(date.getMonth()+1, 2) + '-' + zeroPad(date.getDate(), 2);
	$.get(baseUrl, {datestamp:datestamp}, function (res) {
		importList = res.playlist[0].playlist
		for (var x = 0; x < importList.length; x++) {
			playlist.push(wfmtToSong(importList[x]));
		}
		callback(playlist);
	});
}

function submit() {
	var pickerDate = $("#datepicker").val();
	var splitDate = pickerDate.split('/');
	var date;

	if (splitDate.length < 3) {
		alert("Please enter a valid date");
		return;
	}
	
	date = new Date(splitDate[2], parseInt(splitDate[0])-1, splitDate[1]);
	fetchPlaylist(date, function (playlist) {
		var localList = parseList(playlist, date);
		printList(localList);
	});
}
$(document).ready(function main () {
	var date = new Date();
	$("#datepicker").val((date.getMonth()+1) + '/' + zeroPad(date.getDate(), 2) + '/' + date.getFullYear());

	$("#datepicker").datepicker();
	$("input").button();
	$("button").button().click(submit);
	$("textarea").addClass("ui-corner-all");
});
