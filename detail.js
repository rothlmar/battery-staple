const crypto = require('crypto');
const { ipcRenderer } = require('electron');
const elts = ['category', 'service', 'name', 'value', 'notes'];

function replace(eltId, val) {
  document.getElementById(eltId).innerHTML = val || '';
}

ipcRenderer.on('async-password', (event, arg) => {
  document.getElementById('details').className = '';
  document.getElementById('add-new').className = 'd-none';
  elts.concat('id').forEach(e => replace(e, arg[e]));
});

function addNew() {
  document.getElementById('details').className = 'd-none';
  document.getElementById('add-new').className = '';
};

function deletePw() {
  ipcRenderer.send('pw-delete', document.getElementById('id').innerHTML);
  elts.concat('id').forEach(e => replace(e, '&nbsp;'));
};


function generatePw() {
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
    document.getElementById('value-new').value = pw;
  })
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('add-new-form');
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    const password = {};
    const reducer = (a, e) => {
      const elt = document.getElementById(`${e}-new`);
      a[e] = elt.value;
      elt.value = '';
      return a
    };
    elts.reduce(reducer, password);
    ipcRenderer.send('pw-update', password);
  });
});
