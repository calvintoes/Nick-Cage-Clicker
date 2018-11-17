import init from './main.js';
import {loadImages} from './helpers.js';

const imageSources = {
		cage1: 'images/cage-297x355.png',
		cage2: 'images/cage-55x80.png',
		cage3: 'images/cage-167x206.png',
		tommy1: 'images/tommy-60x45.png',
		franco1: 'images/franco-50x71.png',
		garofalo1: 'images/garofalo-50x70.png',
		aang: 'images/Aang-90x90.png'
};

// loadImages(imageSourcesObject,callback);
loadImages(imageSources,startGame);


function startGame(imageData){
	init(imageData);
}
