const { ipcRenderer } = require('electron');

const InputMenu = Menu.buildFromTemplate([
  {label: 'Cut', role: 'cut'},
  {label: 'Copy', role: 'copy'},
  {label: 'Paste', role: 'paste'}
]);

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  InputMenu.popup(remote.getCurrentWindow());
}, false);

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('mpw-form');
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    ipcRenderer.send('mp-input', document.getElementById('master-password').value);
  });
});
