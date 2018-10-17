const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('mpw-form');
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    ipcRenderer.send('mp-input', document.getElementById('master-password').value);
  });
});
