const { ipcRenderer, remote } = require('electron');
const { Menu } = remote;
const firebase = require('./firebase/firebase-app');
require('./firebase/firebase-auth');
require('./firebase/firebase-firestore');
firebase.initializeApp(require('./config'));

const InputMenu = Menu.buildFromTemplate([
  {label: 'Cut', role: 'cut'},
  {label: 'Copy', role: 'copy'},
  {label: 'Paste', role: 'paste'}
]);

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  InputMenu.popup(remote.getCurrentWindow());
}, false);

const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);
db.enablePersistence().catch(console.log);

let uid = null;
let unsubscribe = null;

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    uid = user.uid;
    document.getElementById('content-div').className = '';
    document.getElementById('firebase-login').className = 'd-none';
    unsubscribe = db.collection(uid).onSnapshot((querySnapshot) => {
      const cats = document.getElementById('categories');
      const catPasswords = document.getElementById('catPasswords');
      querySnapshot.forEach(d => {
	const data = d.data();
	const catId = `cat-${data.category.toLowerCase()}`;
	const catListId = `ul-${data.category.toLowerCase()}`;
	const cat = document.getElementById(catId);
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
	  if (!cats.hasChildNodes()) {
	    cats.appendChild(b);
	  } else {
	    let inserted = false;
	    for (let idx = 0; idx < cats.childNodes.length; idx++) {
	      const elt = cats.childNodes[idx];
	      if (b.id < elt.id) {
		cats.insertBefore(b, elt);
		inserted = true;
		break;
	      }
	    }
	    if (inserted === false) {
	      cats.appendChild(b);
	    }
	  }

	  const ul = document.createElement('ul');
	  ul.className = 'd-none';
	  ul.id = catListId;
	  catPasswords.appendChild(ul);
	}

	let li = document.getElementById(d.id);
	if (li !== null) {
	  li.parentNode.removeChild(li);
	}
	const ul = document.getElementById(`ul-${data.category.toLowerCase()}`);
	li = document.createElement('li');
	li.id = d.id;
	li.onclick = (event) => ipcRenderer.send('async-msg', Object.assign({id: d.id}, data));
	li.appendChild(document.createTextNode(data.service));
	if (!ul.hasChildNodes()) {
	  ul.appendChild(li);
	} else {
	  let inserted = false;
	  for (let idx = 0; idx < ul.childNodes.length; idx++) {
	    const elt = ul.childNodes[idx];
	    if (li.innerHTML.toLowerCase() < elt.innerHTML.toLowerCase()) {
	      ul.insertBefore(li, elt);
	      inserted = true;
	      break;
	    }
	  }
	  if (inserted === false) {
	    ul.appendChild(li);
	  }
	}
      });
    });
  } else {
      document.getElementById('firebase-login').className = '';
  }
});
  
ipcRenderer.on('pw-dispatch', (event, arg) => {
  if (uid !== null) {
    const collection = db.collection(uid);
    if (arg.hasOwnProperty('id')) {
      const id = arg.id;
      delete arg.id;
      collection.doc(id).set(arg);
    } else {
      collection.add(arg);
    }
  }
});

ipcRenderer.on('delete-msg', (event, arg) => {
  db.collection(uid).doc(arg).delete().then(function(x) {
    const elt = document.getElementById(arg);
    elt.parentNode.removeChild(elt);
  });
});

function login() {
  const email = document.getElementById('fb-email');
  const password = document.getElementById('fb-password');
  firebase.auth().signInWithEmailAndPassword(email.value, password.value)
    .then(() => {
      email.value = '';
      password.value = '';
    })
    .catch(console.log);
}

function create() {
  const email = document.getElementById('new-email');
  const password = document.getElementById('new-password');
  const passwordVerify = document.getElementById('new-password-verify');
  if ( password.value !== passwordVerify.value ) {
    alert('Passwords do not match, please fix!');
  } else if ( password.value.length <= 6 ){
    alert('Password must be at least 6 characters, please fix!');
  } else {
    firebase.auth().createUserWithEmailAndPassword(email.value, password.value)
      .then(() => {
	email.value = '';
	password.value = '';
	passwordVerify.value = '';
      })
      .catch(console.log);
  }
}

function loginAnon() {
  firebase.auth().signInAnonymously().catch(console.log);
};

function logout() {
  firebase.auth().signOut().then(() => {
    unsubscribe();
    document.getElementById('categories').innerHTML = '';
    document.getElementById('catPasswords').innerHTML = '';
    document.getElementById('firebase-login').className = '';
    document.getElementById('content-div').className = 'd-none'
  }).catch(console.log)
}
