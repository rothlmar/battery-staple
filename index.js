const { ipcRenderer } = require('electron');
const firebase = require('./firebase/firebase-app');
require('./firebase/firebase-auth');
require('./firebase/firebase-firestore');
firebase.initializeApp(require('./config'));

const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);
db.enablePersistence().catch(console.log);

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    db.collection('passwords').onSnapshot((querySnapshot) => {
      const cats = document.getElementById('categories');
      const catPasswords = document.getElementById('catPasswords');
      querySnapshot.forEach(d => {
	const data = d.data();
	const catId = `cat-${data.category.toLowerCase()}`;
	const catListId = `ul-${data.category.toLowerCase()}`;
	const cat = document.getElementById(catId);
	const li = document.getElementById(d.id);
	if (cat === null) {
	  const b = document.createElement('button');
	  b.type = 'button';
	  b.className = 'btn btn-secondary';
	  b.id = catId;
	  b.appendChild(document.createTextNode(data.category));
	  b.onclick = (event) => {
	    Array.from(cats.children).forEach(item => item.className = 'btn btn-secondary');
	    b.className = 'btn btn-primary';
	    Array.from(catPasswords.children).forEach(item => item.className = 'd-none');
	    document.getElementById(catListId).className = '';
	  }
	  cats.appendChild(b);
	  const ul = document.createElement('ul');
	  ul.className = 'd-none';
	  ul.id = catListId;
	  catPasswords.appendChild(ul);
	}

	if (li === null) {
	  const ul = document.getElementById(`ul-${data.category.toLowerCase()}`);
	  const li = document.createElement('li');
	  li.id = d.id;
	  li.onclick = (event) => ipcRenderer.send('async-msg', Object.assign({id: d.id}, data));
	  li.appendChild(document.createTextNode(data.service));
	  ul.appendChild(li);
	};
      });
    });
  } else {
      document.getElementById('firebase-login').className = '';
  }
});
  
ipcRenderer.on('pw-dispatch', (event, arg) => {
  db.collection('passwords').add(arg);
});

ipcRenderer.on('delete-msg', (event, arg) => {
  db.collection('passwords').doc(arg).delete().then(function(x) {
    console.log("WAS THERE AN ARG?", x);
    const elt = document.getElementById(arg);
    elt.parentNode.removeChild(elt);
  });
});

function login() {
  const email = document.getElementById('fb-email').value;
  const password = document.getElementById('fb-password').value;
  firebase.auth().signInWithEmailAndPassword(email, password).catch(console.log);
}
