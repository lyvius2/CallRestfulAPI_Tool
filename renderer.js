const shell = require('electron').shell
const links = document.querySelectorAll('a[href]')

Array.prototype.forEach.call(links, function (link) {
	const url = link.getAttribute('href')
	if (url.indexOf('http') === 0) {
		link.addEventListener('click', function (e) {
			e.preventDefault()
			shell.openExternal(url)
		})
	}
})

const ipc = require('electron').ipcRenderer
const executeSqlBtn = document.getElementById('execute-sql')

executeSqlBtn.addEventListener('click', function () {
	const config = document.forms.sql
	ipc.send('execute-sql', new returnDbConfig(config))
})

function returnDbConfig (config) {
	this.host = config['host'].value
	this.database = config['database'].value
	this.username = config['username'].value
	this.password = config['password'].value
	this.dbms = config['dbms'].value
	this.query = document.getElementById('query').value
}

function init () {
	document.querySelector('.js-nav').classList.add('is-shown')
	document.querySelector('.js-content').classList.add('is-shown')
}

init()