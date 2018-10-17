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
