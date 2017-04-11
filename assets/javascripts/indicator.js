window.$ = window.jQuery = require('jquery')
require('./jquery.loadingModal.min.js')

function view () {
	$('body').loadingModal({
		position: 'auto',
		text: 'Waiting for Query Result...',
		color: '#fff',
		opacity: '0.7',
		backgroundColor: 'rgb(0,0,0)',
		animation: 'foldingCube'
	})
}

function hide () {
	$('body').loadingModal('destroy');
}

var indicator = {
	view: view,
	hide: hide
}

module.exports = indicator