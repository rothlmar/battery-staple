const crypto = require('crypto');
const { ipcRenderer, clipboard, remote } = require('electron');
const { Menu } = remote;

const elts = ['category', 'service', 'name', 'value', 'notes'];

const InputMenu = Menu.buildFromTemplate([
  {label: 'Cut', role: 'cut'},
  {label: 'Copy', role: 'copy'},
  {label: 'Paste', role: 'paste'}
]);

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  InputMenu.popup(remote.getCurrentWindow());
}, false);

function replace(eltId, val) {
  document.getElementById(eltId).innerHTML = val || '';
}

function replaceInput(eltId, val) {
  document.getElementById(eltId).value = val || '';
}

ipcRenderer.on('async-password', (event, arg) => {
  document.getElementById('details').className = '';
  document.getElementById('add-new').className = 'd-none';
  document.getElementById('edit').className = 'd-none';
  elts.concat('id').forEach(e => replace(e, arg[e]));
});

function addNew() {
  document.getElementById('add-new').className = '';
  document.getElementById('details').className = 'd-none';
  document.getElementById('edit').className = 'd-none';
};

function showEdit() {
  document.getElementById('edit').className = '';
  document.getElementById('details').className = 'd-none';
  document.getElementById('add-new').className = 'd-none';
  elts.forEach(e => replaceInput(`${e}-edit`, document.getElementById(e).innerHTML));
}

function deletePw() {
  ipcRenderer.send('pw-delete', document.getElementById('id').innerHTML);
  elts.concat('id').forEach(e => replace(e, '&nbsp;'));
};

function copyPw() {
  clipboard.writeText(document.getElementById('value').textContent);
};

function generatePw(eltId) {
  let pw = '';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = lower.toUpperCase();
  const number = '0123456789';
  const other = '!@#$%^&*()[],.?:"';
  const chars = [upper, lower, number, other];
  crypto.randomBytes(64, (err, buf) =>  {
    let groupStart = 0;
    let groupLength = 5;
    for (const b of buf) {
      const point = b % 32;
      const group = chars[groupStart + Math.floor(pw.length/groupLength)];
      if (point < group.length) {
	pw = pw.concat(group[point]);
      }
      if (pw.length == 10) {
	groupStart = -3;
	groupLength = 2;
      }
      if (pw.length == 14) {
	break;
      }
    }
    document.getElementById(eltId).value = pw;
  })
}

document.addEventListener('DOMContentLoaded', function() {
  const addForm = document.getElementById('add-new-form');
  addForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const data = {};
    const reducer = (a, e) => {
      const elt = document.getElementById(`${e}-new`);
      a[e] = elt.value;
      elt.value = '';
      return a
    };
    elts.reduce(reducer, data);
    ipcRenderer.send('pw-update', data);
  });

  const editForm = document.getElementById('edit-form');
  editForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const data = {};
    const reducer = (a, e) => {
      const elt = document.getElementById(`${e}-edit`);
      a[e] = elt.value;
      elt.value = '';
      return a
    };
    elts.reduce(reducer, data);
    elts.forEach(e => replace(e, data[e]));
    data.id = document.getElementById('id').innerHTML;
    document.getElementById('details').className = '';
    document.getElementById('edit').className = 'd-none';
    ipcRenderer.send('pw-update', data);
  });
});
