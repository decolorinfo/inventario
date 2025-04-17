// script.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZfq6JbaPA8EI3cWFyPej9vM4hewr9RLk",
  authDomain: "inventario-vernici.firebaseapp.com",
  databaseURL: "https://inventario-vernici-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "inventario-vernici",
  storageBucket: "inventario-vernici.firebasestorage.app",
  messagingSenderId: "22844519849",
  appId: "1:22844519849:web:a43e7ccdd09b2ea5a4c0b8",
  measurementId: "G-GDKQE50RR1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const paintsRef = ref(database, 'paints');

// Get references to HTML elements
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const logoutButton = document.getElementById('logoutButton');
const authMessage = document.getElementById('authMessage');
const addPaintForm = document.getElementById('addPaintForm');
const addPaintButton = document.getElementById('addPaintButton');
const paintListDiv = document.getElementById('paintList');
const searchInput = document.getElementById('searchInput'); // Nuovo elemento
let allPaints = []; // Array per memorizzare tutte le vernici

let currentUser = null;

// Event listener for signup
signupButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        authMessage.textContent = 'Registrazione effettuata con successo! Ora puoi accedere.';
        console.log('Utente registrato:', user);
        // Potresti voler resettare i campi di input dopo la registrazione
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        let errorMessage = 'Errore durante la registrazione.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Questa email è già in uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email non valida.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La password deve essere lunga almeno 6 caratteri.';
        }
        authMessage.textContent = errorMessage;
    }
});

// Event listener for login
loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        authMessage.textContent = 'Login effettuato con successo!';
        console.log('Utente loggato:', user);
        // Dopo il login, nascondi il form di login e mostra altre sezioni
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'block';
        document.getElementById('addPaintForm').style.display = 'block';
        // Potresti anche voler ricaricare la lista delle vernici se necessario
        // displayPaints(allPaints);
    } catch (error) {
        console.error('Errore durante il login:', error);
        let errorMessage = 'Errore durante il login.';
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Password errata.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Utente non trovato.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email non valida.';
        }
        authMessage.textContent = errorMessage;
    }
});

// Event listener for logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        authMessage.textContent = 'Logout effettuato con successo.';
        console.log('Utente disconnesso.');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('addPaintForm').style.display = 'none';
    } catch (error) {
        console.error('Errore durante il logout:', error);
        authMessage.textContent = 'Errore durante il logout.';
    }
});

// Function to update the UI based on authentication state
function updateAuthState() {
    if (currentUser) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'block';
        document.getElementById('addPaintForm').style.display = 'block';
        addPaintButton.disabled = false;
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('addPaintForm').style.display = 'none';
        addPaintButton.disabled = true;
    }
}

// Listen for changes in authentication state
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateAuthState();
});

// Function to add a new paint to Firebase (only if authenticated)
addPaintButton.addEventListener('click', () => {
    if (currentUser) {
        const colorCode = document.getElementById('colorCodeInput').value;
        const description = document.getElementById('descriptionInput').value;
        const category = document.getElementById('categoryInput').value;
        const producer = document.getElementById('producerInput').value;
        const customer = document.getElementById('customerInput').value;
        const quantity = parseFloat(document.getElementById('quantityInput').value);
        const unit = document.getElementById('unitInput').value;

        if (colorCode && category && !isNaN(quantity) && unit) {
            push(paintsRef, {
                colorCode: colorCode.toUpperCase(), // Converti il codice colore in maiuscolo
                description: description,
                category: category,
                producer: producer,
                customer: customer,
                quantity: quantity,
                unit: unit
            }).then(() => {
                document.getElementById('colorCodeInput').value = '';
                document.getElementById('descriptionInput').value = '';
                document.getElementById('categoryInput').value = '';
                document.getElementById('producerInput').value = '';
                document.getElementById('customerInput').value = '';
                document.getElementById('quantityInput').value = '';
                document.getElementById('unitInput').value = 'L';
            }).catch((error) => {
                console.error("Errore durante l'aggiunta della vernice:", error);
            });
        } else {
            alert('Per favore, compila tutti i campi obbligatori.');
        }
    } else {
        alert('Devi essere loggato per aggiungere una vernice.');
    }
});

// Function to display the paint list
function displayPaints(paintsToDisplay) {
    paintListDiv.innerHTML = ''; // Clear the previous list

    if (paintsToDisplay.length > 0) {
        paintsToDisplay.forEach(paint => {
            const paintItem = document.createElement('div');
            paintItem.classList.add('paint-item');
            paintItem.innerHTML = `
                <div><strong>Codice:</strong> ${paint.colorCode}</div>
                <div><strong>Descrizione:</strong> ${paint.description || '-'}</div>
                <div><strong>Categoria:</strong> ${paint.category}</div>
                <div><strong>Produttore:</strong> ${paint.producer || '-'}</div>
                <div><strong>Cliente:</strong> ${paint.customer || '-'}</div>
                <div><strong>Quantità:</strong> ${paint.quantity} ${paint.unit}</div>
                <button class="delete-button" data-id="${paint.id}" ${currentUser ? '' : 'disabled'}>Elimina</button>
            `;
            paintListDiv.appendChild(paintItem);
        });

        // Add event listeners to the delete buttons (after rendering the list)
        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                if (currentUser) {
                    const paintId = event.target.dataset.id;
                    deletePaint(paintId);
                } else {
                    alert('Devi essere loggato per eliminare una vernice.');
                }
            });
        });

    } else {
        paintListDiv.innerHTML = '<p>Nessuna vernice trovata.</p>';
    }
}

// Event listener per la ricerca
searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredPaints = allPaints.filter(paint => {
        return Object.values(paint).some(value => {
            if (typeof value === 'string') {
                return value.toLowerCase().includes(searchTerm);
            } else if (typeof value === 'number') {
                return value.toString().includes(searchTerm);
            }
            return false;
        });
    });
    displayPaints(filteredPaints);
});

// Function to fetch and display the paint list from Firebase
onValue(paintsRef, (snapshot) => {
    paintListDiv.innerHTML = '<p class="loading">Caricamento...</p>';
    allPaints = []; // Reset the array

    if (snapshot.exists()) {
        const paintsData = snapshot.val();
        for (const key in paintsData) {
            allPaints.push({ id: key, ...paintsData[key] });
        }
        displayPaints(allPaints); // Mostra tutte le vernici all'inizio
    } else {
        paintListDiv.innerHTML = '<p>Nessuna vernice presente in magazzino.</p>';
    }
});

// Function to delete a paint from Firebase (only if authenticated)
function deletePaint(paintId) {
    if (currentUser) {
        remove(ref(database, `paints/${paintId}`))
            .then(() => {
                console.log(`Vernice con ID ${paintId} eliminata con successo.`);
            })
            .catch((error) => {
                console.error("Errore durante l'eliminazione della vernice:", error);
            });
    } else {
        alert('Devi essere loggato per eliminare una vernice.');
    }
}

// Initial loading message (moved inside onValue for better flow)
// paintListDiv.innerHTML = '<p class="loading">Caricamento...</p>';