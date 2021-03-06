const { app, BrowserWindow, BrowserView, clipboard, ipcMain, Menu } = require('electron');
const nacl = require('./nacl/nacl-fast.min.js');
nacl.util = require('./nacl/nacl-util.min.js');

const webPreferences = { nodeIntegration: true };
let mpw = null;
let win = null;
let view = null;

function createWindow() {
  const opts = { width: 800, height: 700, webPreferences: webPreferences, resizable: false };
  win = new BrowserWindow(opts);
  view = new BrowserView({ webPreferences: webPreferences })
  win.setBrowserView(view);
  // view.webContents.openDevTools();
  win.loadFile('startup.html');
  view.setBounds({ x: 0, y: 300, width: 800, height: 400 });
  win.on('closed', () => { win = null; view = null });

  if (process.platform == 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
	label: 'Battery Staple',
	submenu: [
	  {role: 'about'},
	  {type: 'separator'},
	  {role: 'services', submenu: []},
	  {type: 'separator'},
	  {role: 'hide'},
	  {role: 'hideothers'},
	  {role: 'unhide'},
	  {type: 'separator'},
	  {role: 'quit'}
	]
      },
      {
	label: 'Edit',
	submenu: [
	  { role: 'cut' },
	  { role: 'copy' },
	  { role: 'paste' }
	]
      }
    ]));
  }
};

function decrypt(element) {
  try {
    const nonce = nacl.util.decodeBase64(element.nonce);
    const encrypted = nacl.util.decodeBase64(element.value);
    const decrypted = nacl.secretbox.open(encrypted, nonce, mpw);
    return nacl.util.encodeUTF8(decrypted);
  } catch(err) {
    return 'ERROR';
  }
}

function encrypt(val) {
  const nonce = nacl.randomBytes(24);
  const decoded = nacl.util.decodeUTF8(val);
  const encrypted = nacl.secretbox(decoded, nonce, mpw);
  return { value: nacl.util.encodeBase64(encrypted),
	   nonce: nacl.util.encodeBase64(nonce) };
}

ipcMain.on('async-msg', (event, arg) => {
  arg.name = decrypt(arg.name);
  arg.value = decrypt(arg.value);
  arg.notes = decrypt(arg.notes).replace('\n','<br>');
  win.webContents.send('async-password', arg);
});

ipcMain.on('pw-update', (event, arg) => {
  arg.name = encrypt(arg.name);
  arg.value = encrypt(arg.value);
  arg.notes = encrypt(arg.notes);
  view.webContents.send('pw-dispatch', arg);
});

ipcMain.on('pw-delete', (event, arg) => {
  view.webContents.send('delete-msg', arg);
});

ipcMain.on('mp-input', (event, arg) => {
  mpw = nacl.hash(nacl.util.decodeUTF8(arg)).slice(0,32);
  win.loadFile('detail.html');
  view.webContents.loadFile('index.html');
 });

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
