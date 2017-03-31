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
const executeApiBtn = document.getElementById('execute-api')
let query_result;

executeSqlBtn.addEventListener('click', function () {
	const config = document.forms.sql
	ipc.send('execute-sql', new returnDbConfig(config))
})

ipc.on('execute-sql-reply', function (event, arg) {
	if (arg.success) {
		query_result = JSON.parse(arg.result)
		viewQueryResult(query_result)
		document.querySelector('.js-nav').classList.remove('is-shown')
		document.querySelector('.js-content#sql').classList.remove('is-shown')
		document.querySelector('.js-content#result').classList.add('is-shown')
	}
})

executeApiBtn.addEventListener('click', function () {
	let idx_array = [], as_is_arg_name = [], to_be_arg_name = []
	document.querySelectorAll('input[type=checkbox]').forEach(function (item, index) {
		if (item.checked) idx_array.push(index)
	})
	let text_input_array = document.querySelectorAll('.params')
	idx_array.forEach(function (item) {
		as_is_arg_name.push(text_input_array[item].name)
		to_be_arg_name.push(text_input_array[item].value)
	})
	let params = query_result.reduce(function (prev, curr) {
		var param = {}
		as_is_arg_name.forEach(function (item, index) {
			param[to_be_arg_name[index]] = curr[item]
		})
		prev.push(param)
		return prev
	}, [])

	ipc.send('execute-api', {
		method: document.querySelector('select#method').value,
		url: document.querySelector('input#url').value,
		params: params})
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
	document.querySelector('.js-content#sql').classList.add('is-shown')
}

init()

const Vue = require('vue')

function viewQueryResult (query_result) {
	new Vue({
		el: '#query-result',
		data: {
			list: query_result
		},
		render: function (h) {
			var createChk = function () {
				return h('input', {attrs: {type: 'checkbox', name: 'chk'}})
			}
			var createInputText = function (item) {
				return h('input', {attrs: {type: 'text', name: item, class: 'params' ,value: item}})
			}
			var createRow = function (obj, is_header) {
				let row = []
				for (var item in obj) {
					row.push(is_header?
						h('th', [createChk(), h('br'), createInputText(item), h('br'), item]) : h('td', obj[item])
					)
				}
				return row
			}
			return h('table', [
				h('thead', createRow(this.list[0], true)),
				h('tbody', this.list.map(function (item) {
					return h('tr', createRow(item, false))
				}))
			])
		}
	})
}
