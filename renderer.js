const shell = require('electron').shell
const storage = require('electron-json-storage')
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
const executeBackBtn = document.getElementById('execute-back')
let query_result;

executeSqlBtn.addEventListener('click', function () {
	const config = new returnDbConfig(document.forms.sql)
	if (document.getElementById('save_config').checked) {
		storage.set('dbConfig', config, function (err) { if (err) console.error(err) })
	} else {
		storage.remove('dbConfig', function (err) { if (err) console.error(err) })
	}
	if (!chkExistEmptyValue(config)) ipc.send('execute-sql', config)
	else ipc.send('show-message-box', {title: '입력값 체크', msg: '입력항목 중 빈 값이 있습니다. 빈 값은 허용하지 않습니다.'})
})

ipc.on('execute-sql-reply', function (event, arg) {
	if (arg.success) {
		query_result = arg.result
		viewQueryResult(query_result)
		document.querySelector('.js-nav').classList.remove('is-shown')
		document.querySelector('.js-content#sql').classList.remove('is-shown')
		document.querySelector('.js-content#result').classList.add('is-shown')
		storage.get('apiUrl', function (err, data) {
			if (err) {
				console.error(err)
			} else if (typeof data['url'] != 'undefined') {
				document.querySelector('input#url').value = data['url']
			}
		})
	}
})

executeApiBtn.addEventListener('click', function (event) {
	event.preventDefault()
	let idx_array = [], as_is_arg_name = [], to_be_arg_name = []
	let api_url = document.querySelector('input#url').value
	document.querySelectorAll('table input[type=checkbox]').forEach(function (item, index) {
		if (item.checked) idx_array.push(index)
	})
	let text_input_array = document.querySelectorAll('.params')
	idx_array.forEach(function (item) {
		as_is_arg_name.push(text_input_array[item].name)
		to_be_arg_name.push(text_input_array[item].value)
	})

	if (idx_array.length > 0 && !chkExistEmptyValue(to_be_arg_name) && validateUrlFormat(api_url)) {
		let params = query_result.reduce(function (prev, curr) {
			var param = {}
			as_is_arg_name.forEach(function (item, index) {
				param[to_be_arg_name[index]] = curr[item]
			})
			prev.push(param)
			return prev
		}, [])

		if (document.getElementById('save_url').checked) {
			storage.set('apiUrl', {url: api_url}, function (err) { if (err) console.error(err) })
		} else {
			storage.remove('apiUrl', function (err) { if (err) console.error(err) })
		}

		ipc.send('execute-api', {
			method: document.querySelector('select#method').value,
			url: api_url,
			params: params,
			args: to_be_arg_name
		})
	} else {
		let msg;
		if (api_url != '') msg = 'API URL을 다시 한번 확인하십시오.\nhttp(https):// 프로토콜 표시가 누락됐거나 올바른 주소가 아닙니다.'
		else msg = '입력항목 중 빈 값이 있거나 선택된 파라메터 항목이 없습니다.'
		ipc.send('show-message-box', {title: '입력값 체크', msg: msg})
	}
})

ipc.on('execute-api-reply', function (event, arg) {
	if (arg.success) {
		document.querySelector('tr:nth-child(' + (arg.index + 1) + ') td:last-child').classList.add('next')
		document.querySelector('tr:nth-child(' + (arg.index + 1) + ') td:last-child').textContent = arg.result
	} else {
		document.querySelector('tr:nth-child(' + (arg.index + 1) + ') td:last-child').classList.add('prev')
		document.querySelector('tr:nth-child(' + (arg.index + 1) + ') td:last-child').textContent = arg.err
	}
})

executeBackBtn.addEventListener('click', function () {
	document.querySelector('.js-content#result').classList.remove('is-shown')
	document.querySelector('.js-nav').classList.add('is-shown')
	document.querySelector('.js-content#sql').classList.add('is-shown')
	// 기존 결과 table DOM 삭제
	let query_result_view = document.getElementsByClassName('demo-wide-wrapper')
	query_result_view[0].removeChild(query_result_view[0].childNodes[1])
	let new_query_result_div = document.createElement('div')
	new_query_result_div.setAttribute('id', 'query-result')
	query_result_view[0].insertBefore(new_query_result_div, query_result_view[0].childNodes[1])
	// 수행 중 process 중지 요청
	ipc.send('stop-process')
})

function returnDbConfig (config) {
	this.host = config['host'].value
	this.database = config['database'].value
	this.username = config['username'].value
	this.password = config['password'].value
	this.dbms = config['dbms'].value
	this.query = document.getElementById('query').value
}

// 객체 요소 중 빈값 여부 체크
function chkExistEmptyValue (obj) {
	let is_exist_empty_value = false
	for (var arg_name in obj) {
		if (obj[arg_name] == '') {
			is_exist_empty_value = true
			break
		}
	}
	return is_exist_empty_value
}

// API URL 형식 체크
function validateUrlFormat (address) {
	let is_valid_url_format = false
	let api_url = address.toLowerCase()
	if (api_url.toLowerCase().indexOf('http://') == 0 || api_url.toLowerCase().indexOf('https://') == 0) {
		if (api_url.length > 0 && api_url.substring(8).length > 1) is_valid_url_format = true
	}
	return is_valid_url_format
}

function init () {
	document.querySelector('.js-nav').classList.add('is-shown')
	document.querySelector('.js-content#sql').classList.add('is-shown')
	storage.get('dbConfig', function (err, data) {
		if (err) {
			console.error(err)
		} else if (data != null) {
			for (var value in data) {
				if (value != 'query') document.getElementById(value).value = data[value]
			}
		}
	})
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
				return h('input', {attrs: {type: 'checkbox', name: 'chk', checked: true}})
			}
			var createInputText = function (item) {
				return h('input', {attrs: {type: 'text', name: item, class: 'params' ,value: item}})
			}
			var createRow = function (obj, idx, is_header) {
				let row = []
				for (var item in obj) {
					row.push(is_header?
						h('th', [createChk(), h('br'), createInputText(item)]) : h('td', obj[item])
					)
				}
				if (is_header) {
					row.unshift(h('th', 'No.'))
					row.push(h('th', {attrs: {style: 'width:30%'}}, 'Response'))
				} else {
					row.unshift(h('td', idx + 1))
					row.push(h('td'))
				}
				return row
			}
			return h('table', [
				h('thead', createRow(this.list[0], 0, true)),
				h('tbody', this.list.map(function (item, index) {
					return h('tr', createRow(item, index, false))
				}))
			])
		}
	})
}
