const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

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

ipc.on('execute-sql', function (event, arg) {
	let argv = [arg['host'], arg['database'], arg['username'], arg['password'], arg['query']]
	runPythonScript('selector.py', argv, function (data) {
		event.sender.send('execute-sql-reply', data)
	})
})

ipc.on('execute-api', function (event, arg) {
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

	function createArgv (item) {
		if (!is_param_url) {
			return [arg['method'], arg['url'], JSON.stringify(item)];
		} else {
			let url = arg['url'].replace('{' + param_url + '}', item[param_url])
			delete item[param_url]
			return [arg['method'], url, JSON.stringify(item)]
		}
	}

	arg['params'].forEach(function (item, index) {
		runPythonScript('requester.py', createArgv(item), function (data) {
			event.sender.send('execute-api-reply', data)
		})
	})
})

const python = require('python-shell')

function runPythonScript (filename, argv, callback) {
	var options = {
		mode: 'text',
		pythonPath: '',
		pythonOptions: ['-u'],
		scriptPath: './py',
		args: argv
	}
	try {
		python.run(filename, options, function (err, data) {
			if (err) throw err
			return callback({success: true, result: eval(decodeURIComponent(data))})
		})
	} catch(e) {
		return callback({success: false, err: e})
	}
}