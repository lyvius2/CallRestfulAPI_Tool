const {app, Menu, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

let template = [
	{
		label: 'Edit',
		submenu: [
			{role: 'undo'},
			{role: 'redo'},
			{type: 'separator'},
			{role: 'cut'},
			{role: 'copy'},
			{role: 'paste'},
			{role: 'delete'}
		]
	},
	{
		label: 'View',
		submenu: [
			{role: 'reload'},
			{role: 'forcereload'},
			{type: 'separator'},
			{role: 'zoomin'},
			{role: 'zoomout'},
			{type: 'separator'},
			{role: 'togglefullscreen'}
		]
	},
	{
		role: 'window',
		submenu: [
			{role: 'minimize'},
			{role: 'close'}
		]
	},
	{
		role: 'help',
		submenu: [
			{label: 'Version 0.0.1'},
			{type: 'separator'},
			{label: 'GitHub',
				click () {
					require('electron').shell.openExternal('https://github.com/lyvius2/CallRestfulAPI_Tool')
				}
			}
		]
	}
]

template[3].submenu[0].enabled = false
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow () {
	// Create the browser window.
	win = new BrowserWindow({width: 1280, height: 720})

	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	// Open the DevTools.
	win.webContents.openDevTools()

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const querystring = require('querystring')
const async = require('async')
const exec = require('child_process').exec
var async_function_exec_break = false

function showInfoMessageBox (title, msg) {
	const options = {
		type: 'info',
		title: title,
		message: msg,
	}
	dialog.showMessageBox(options)
}

function validateQuery (query) {
	let select_word_idx = query.toUpperCase().indexOf('SELECT')
	let from_word_idx = query.toUpperCase().indexOf('FROM')
	if (select_word_idx > -1 && (from_word_idx > select_word_idx)) return true
	else return false
}

// 시스템 파이썬 버전 체크
ipc.on('confirm-python-version', function () {
	exec('python -V', function (err, stdout) {
		if (stdout.indexOf('Python ') != 0 || Number(stdout.substring(7, 8)) < 3) {
			dialog.showErrorBox('Python 설치 필요', 'Python 3 이상 버전이 설치되어 있어야 합니다.')
			app.quit()
		}
	})
})

ipc.on('stop-process', function () {
	async_function_exec_break = true
})

ipc.on('show-message-box', function (event, arg) {
	showInfoMessageBox(arg['title'], arg['msg'])
})

function createChkPipInstalled (lib_name) {
	return function (callback) {
		exec(`pip show ${lib_name}`, function (err, stdout) {
			let is_installed = false
			if (!err && stdout.indexOf(`Name: ${lib_name}`) > -1) is_installed = true
			return callback(null, is_installed)
		})
	}
}

function createInstallPipLib (lib_name) {
	return function (is_installed, callback) {
		if (!is_installed) {
			exec(`pip install ${lib_name}`, function (err, stdout) {
				let is_installed = false
				if (!err && stdout.indexOf(`Successfully installed ${lib_name}`) > -1) is_installed = true
				return callback(err, is_installed)
			})
		} else {
			return callback(null, true)
		}
	}
}

ipc.on('execute-sql', function (event, arg) {
	let module = arg['dbms']=='MsSql'?'pyodbc':'psycopg2'
	if (validateQuery(arg['query'])) {
		async.waterfall([createChkPipInstalled(module), createInstallPipLib(module)], function (errors, results) {
			if (!errors) {
				let argv = [arg['host'], arg['database'], arg['username'], arg['password'], arg['query'], 'Selector' + arg['dbms']]
				runPythonScript('selector.py', argv, function (data) {
					try {
						if (!data.success) throw data.err
						let parse_data = JSON.parse(data.result)
						event.sender.send('execute-sql-reply', {success: true, result: parse_data})
					} catch (e) {
						dialog.showErrorBox('SQL 문을 수행하는 도중 오류가 발생하였습니다.',
							e.toString() + '\nResponse Msg : ' + data['result'])
					}
				})
			} else {
				dialog.showErrorBox('라이브러리 에러', `${module} 모듈의 설치가 잘못되었거나 확인이 되지 않습니다.`)
			}
		})
	} else showInfoMessageBox('SQL 쿼리 체크', '조회 쿼리만 수행 가능합니다. 쿼리문에 SELECT와 FROM 키워드를 확인하세요.')
})

ipc.on('execute-api', function (event, arg) {
	async_function_exec_break = false
	let param_url, is_param_url = false
	let open_brace_index = arg['url'].indexOf('{')
	let close_brace_index = arg['url'].indexOf('}')
	if (open_brace_index > 0 && (close_brace_index > open_brace_index)) {
		param_url = arg['url'].substring(open_brace_index + 1, close_brace_index)
		for (var idx in arg['args']) {
			if (arg['args'][idx] == param_url) {
				is_param_url = true
				break
			}
		}
	}

	// Argument Array 생성
	function createArgv (item) {
		let url = arg['url']
		if (is_param_url) {
			url = arg['url'].replace('{' + param_url + '}', item[param_url])
			delete item[param_url]
		}
		return [arg['method'], url, arg['method'] == 'get'?querystring.stringify(item):JSON.stringify(item)]
	}

	const request = require('request')

	let work_list = []
	arg['params'].forEach(function (item, index) {
		let args = createArgv(item)
		work_list.push(function (callback) {
			if (arg['module'] == 'python') {
				// Usage Python script
				runPythonScript('requester.py', args, function (data) {
					if (async_function_exec_break) return callback(new Error())
					data['index'] = index
					event.sender.send('execute-api-reply', data)
					return callback(null, data)
				})
			} else {
				// Usage Node.js request Module
				request({method: 'GET', url: args[1] + '?' + args[2]}, function (error, response, body) {
					if (async_function_exec_break) return callback(new Error())
					let result = {success: true, result: body, index: index}
					event.sender.send('execute-api-reply', result)
					return callback(error, result)
				})
			}
		})
	})

	let final_act = function () {
		async.series(work_list, function (errors, results) {
			if (errors) console.error('errors', errors)
			console.log('results', results.length)
			async_function_exec_break = false
		})
	}

	if (arg['module'] == 'python') {
		async.waterfall([createChkPipInstalled('requests'), createInstallPipLib('requests')], function (errors) {
			if (!errors) final_act()
			else dialog.showErrorBox('라이브러리 에러', 'requests 모듈의 설치가 잘못되었거나 확인이 되지 않습니다.')
		})
	} else {
		final_act()
	}
})

const python = require('python-shell')

function runPythonScript (filename, argv, callback) {
	var options = {
		mode: 'text',
		pythonPath: '',
		pythonOptions: ['-u'],
		scriptPath: path.join(__dirname, 'py'),
		args: argv
	}
	python.run(filename, options, function (err, result_data) {
		try {
			if (err) throw err
			let decoded_result = eval(decodeURIComponent(result_data))
			return callback({success: true, result: decoded_result})
		} catch (e) {
			return callback({success: false, err: e})
		}
	})
}