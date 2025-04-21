// script.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, push, onValue, remove, get, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
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
const archivedPaintsRef = ref(database, 'archived_paints'); // Reference to the archive node

// Riferimenti agli elementi specifici della pagina Archivio (archivio.html)
const archivedPaintListDiv = document.getElementById('archivedPaintList');
const archiveSearchInput = document.getElementById('archiveSearchInput');

let allPaints = []; // Array per memorizzare tutte le vernici sulla pagina principale (index.html)
let allArchivedPaints = []; // New: Array per memorizzare tutte le vernici archiviate (archivio.html)
let currentUser = null;

// UID degli utenti autorizzati alla modifica (Sostituisci con gli UID reali)
// Assicurati che questi UID corrispondano alle tue Security Rules di Firebase
const authorizedUser1 = '1twJRLWzqYMLhQXxR4afGUYkXoF2'; // <<<<<<<<<<<<<<<< SOSTITUISCI QUESTO CON GLI UID REALI
const authorizedUser2 = 'xt3XhnoIfbZYQ5Uxa0xA7mN4xai2'; // <<<<<<<<<<<<<<<< SOSTITUISCI QUESTO CON GLI UID REALI


// Funzione per verificare se l'utente corrente è autorizzato alla modifica (e quindi anche a eliminare dall'archivio)
function isUserAuthorized() {
    // Ritorna true se l'utente è loggato E il suo UID corrisponde a uno degli autorizzati
    return currentUser && (currentUser.uid === authorizedUser1 || currentUser.uid === authorizedUser2);
}

// Listen for changes in authentication state (Questo listener deve essere globale)
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    // Chiamiamo updateAuthState solo se siamo sulla pagina principale (index.html)
    // Usiamo un controllo più robusto per verificare se la funzione è definita
    // e se gli elementi necessari esistono sulla pagina corrente
    if (document.getElementById('paintList') && typeof updateAuthState === 'function') {
         updateAuthState();
    }
    // Aggiorna lo stato dei pulsanti di eliminazione permanente nell'archivio (se l'elemento esiste)
    if (archivedPaintListDiv) { // Solo sulla pagina archivio
         const permanentDeleteButtons = document.querySelectorAll('.permanent-delete-button');
          permanentDeleteButtons.forEach(button => {
              button.disabled = !isUserAuthorized(); // Usiamo isUserAuthorized qui
          });
    }
});


// --- Logica specifica per la pagina principale (index.html) ---
// Riferimenti agli elementi specifici della pagina principale
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const logoutButton = document.getElementById('logoutButton');
const authMessage = document.getElementById('authMessage');
const addPaintForm = document.getElementById('addPaintForm');
const addPaintButton = document.getElementById('addPaintButton');
const paintListDiv = document.getElementById('paintList'); // Questo esiste solo su index.html
const searchInput = document.getElementById('searchInput');

// *** AGGIUNTA: Riferimenti agli elementi della sezione autenticazione in index.html ***
// Li dichiariamo qui fuori dal blocco if per poterli usare nel blocco if stesso
const authSection = document.getElementById('authSection');
const authTitle = document.getElementById('authTitle');
// *** FINE AGGIUNTA ***


// Esegui la logica della pagina principale SOLO se l'elemento paintListDiv esiste
if (paintListDiv) {

    // Function to update the UI based on authentication state and authorization
    function updateAuthState() {
        const authorized = isUserAuthorized();

        // *** MODIFICA: Aggiorna la sezione autenticazione ***
        if (currentUser) {
            // Utente autenticato
            if (authSection) authSection.classList.add('authenticated'); // Aggiungi classe per background image
            if (authTitle) authTitle.style.display = 'none'; // Nascondi titolo autenticazione
            if (loginForm) loginForm.style.display = 'none'; // Nascondi form di login/signup
            if (logoutButton) logoutButton.style.display = 'block'; // Mostra pulsante logout (lo facciamo display: block per centrarlo via flexbox nel CSS)
            if (addPaintForm) addPaintForm.style.display = authorized ? 'block' : 'none'; // Mostra/nascondi form aggiunta
            if (addPaintButton) addPaintButton.disabled = !authorized; // Abilita/disabilita pulsante aggiunta
             // Resetta il messaggio di autenticazione se era presente un errore precedente al login
            if (authMessage) authMessage.textContent = '';

        } else {
            // Utente non autenticato
             if (authSection) authSection.classList.remove('authenticated'); // Rimuovi classe background image
            if (authTitle) authTitle.style.display = 'block'; // Mostra titolo autenticazione
            if (loginForm) loginForm.style.display = 'block'; // Mostra form di login/signup
            if (logoutButton) logoutButton.style.display = 'none'; // Nascondi pulsante logout
            if (addPaintForm) addPaintForm.style.display = 'none'; // Nascondi form aggiunta
            if (addPaintButton) addPaintButton.disabled = true; // Disabilita pulsante aggiunta
             // Potresti voler pulire i campi email/password qui opzionalmente
             if (emailInput) emailInput.value = '';
             if (passwordInput) passwordInput.value = '';
        }
        // *** FINE MODIFICA ***

        // Aggiorna lo stato dei pulsanti Modifica ed Elimina nella lista vernici principale
        const editButtons = document.querySelectorAll('.edit-button');
        editButtons.forEach(button => {
            button.disabled = !authorized;
        });
        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.disabled = !authorized;
        });
    }


    // Event listener for signup
    if (signupButton) {
        signupButton.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                if (authMessage) authMessage.textContent = 'Registrazione effettuata con successo! Ora puoi accedere.';
                console.log('Utente registrato:', user);
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';
            } catch (error) {
                console.error("Errore durante la registrazione:", error);
                let errorMessage = 'Errore durante la registrazione.';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'Questa email è già in uso.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Email non valida.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'La password deve essere lunga almeno 6 caratteri.';
                }
                if (authMessage) authMessage.textContent = errorMessage;
            }
        });
    }

    // Event listener for login
    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                if (authMessage) authMessage.textContent = 'Login effettuato con successo!';
                console.log('Utente loggato:', user);
                updateAuthState(); // Aggiorna lo stato UI dopo il login
            } catch (error) {
                console.error("Errore durante il login:", error);
                let errorMessage = 'Errore durante il login.';
                if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Password errata.';
                } else if (error.code === 'auth/user-not-found') {
                    errorMessage = 'Utente non trovato.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Email non valida.';
                }
                if (authMessage) authMessage.textContent = errorMessage;
            }
        });
    }

    // Event listener for logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                if (authMessage) authMessage.textContent = 'Logout effettuato con successo.';
                console.log('Utente disconnesso.');
                updateAuthState(); // Aggiorna lo stato UI dopo il logout
            } catch (error) {
                console.error("Errore durante il logout:", error);
                if (authMessage) authMessage.textContent = 'Errore durante il logout.';
            }
        });
    }


    // Function to add a new paint to Firebase (only if authorized)
    if (addPaintButton) { // Ensure the button exists (only on index.html)
        addPaintButton.addEventListener('click', () => {
            if (isUserAuthorized()) { // Controllo autorizzazione
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
                        // Resetta i campi dopo l'aggiunta
                        document.getElementById('colorCodeInput').value = '';
                        document.getElementById('descriptionInput').value = '';
                        document.getElementById('categoryInput').value = '';
                        document.getElementById('producerInput').value = '';
                        document.getElementById('customerInput').value = '';
                        document.getElementById('quantityInput').value = '';
                        document.getElementById('unitInput').value = 'L';
                    }).catch((error) => {
                        console.error("Errore durante l'aggiunta della vernice:", error);
                        alert("Errore durante l'aggiunta della vernice.");
                    });
                } else {
                    alert('Per favore, compila tutti i campi obbligatori (Codice colore, Categoria, Quantità, Unità).');
                }
            } else {
                alert('Non sei autorizzato ad aggiungere vernici.');
            }
        });
    }


    // Function to display the paint list (for index.html)
    function displayPaints(paintsToDisplay) {
        paintListDiv.innerHTML = ''; // Clear the previous list

        if (paintsToDisplay.length > 0) {
            const authorized = isUserAuthorized(); // Controlla autorizzazione una volta

            paintsToDisplay.forEach(paint => {
                const paintItem = document.createElement('div');
                paintItem.classList.add('paint-item');
                // Aggiungi i pulsanti Modifica ed Elimina
                paintItem.innerHTML = `
                    <div data-field="colorCode"><strong>Codice:</strong> ${paint.colorCode}</div>
                    <div data-field="description"><strong>Descrizione:</strong> ${paint.description || '-'}</div>
                    <div data-field="category"><strong>Categoria:</strong> ${paint.category}</div>
                    <div data-field="producer"><strong>Produttore:</strong> ${paint.producer || '-'}</div>
                    <div data-field="customer"><strong>Cliente:</strong> ${paint.customer || '-'}</div>
                    <div data-field="quantity"><strong>Quantità:</strong> ${paint.quantity} ${paint.unit}</div>
                    <div class="action-buttons">
                        <button class="edit-button" data-id="${paint.id}" ${authorized ? '' : 'disabled'}>Modifica</button>
                        <button class="delete-button" data-id="${paint.id}" ${authorized ? '' : 'disabled'}>Elimina</button>
                    </div>
                `;
                paintListDiv.appendChild(paintItem);
            });

            // Aggiungi event listeners ai pulsanti (delegazione per performance)
            // Rimuovi listener precedenti per evitare duplicazioni se onValue si attiva più volte
            paintListDiv.removeEventListener('click', handlePaintListClick); // Rimuovi il vecchio listener
            paintListDiv.addEventListener('click', handlePaintListClick); // Aggiungi il nuovo listener


        } else {
            paintListDiv.innerHTML = '<p>Nessuna vernice trovata.</p>';
        }
    }

    // Funzione delegata per gestire i click sui pulsanti della lista vernici principale
    function handlePaintListClick(event) {
        const target = event.target;
         // Solo se l'utente è loggato si considerano i click sui pulsanti modifica/elimina/salva nella lista principale
        // Annulla funziona anche senza autorizzazione per uscire dalla modalità di modifica
        if (target.classList.contains('delete-button')) {
             if (isUserAuthorized()) {
                const paintId = target.dataset.id;
                deletePaint(paintId); // Questa funzione sposta in archivio
            } else {
                alert('Non sei autorizzato a eliminare una vernice.');
            }
        } else if (target.classList.contains('edit-button')) {
             if (isUserAuthorized()) {
                const paintId = target.dataset.id;
                startEditPaint(paintId, target.closest('.paint-item')); // Passa l'elemento padre
            } else {
                alert('Non sei autorizzato a modificare una vernice.');
            }
        } else if (target.classList.contains('save-button')) {
             if (isUserAuthorized()) {
                const paintId = target.dataset.id;
                savePaintChanges(paintId, target.closest('.paint-item')); // Passa l'elemento padre
            } else {
                alert('Non sei autorizzato a salvare le modifiche.');
            }
        } else if (target.classList.contains('cancel-button')) {
             // Annulla NON richiede autorizzazione, chiunque può uscire dalla modalità di modifica
             const paintId = target.dataset.id;
             cancelEditPaint(paintId, target.closest('.paint-item')); // Passa l'elemento padre
        }
    }


    // Event listener per la ricerca (aggiunto null check per searchInput)
    if (searchInput) { // Only run on index.html
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const filteredPaints = allPaints.filter(paint => {
                // Controlla se il termine di ricerca è presente in QUALSIASI valore dell'oggetto paint
                // Convertiamo tutto in stringa e in minuscolo per la ricerca case-insensitive su tutti i campi
                return Object.values(paint).some(value => {
                     // Evita di cercare nell'ID della vernice se non è necessario, ma qui cerchiamo in tutto per semplicità
                     if (value === null || value === undefined) return false; // Salta valori null/undefined
                     return String(value).toLowerCase().includes(searchTerm);
                });
            });
            displayPaints(filteredPaints);
        });
    }


    // Function to fetch and display the paint list from Firebase (for index.html)
    // Questa parte si attiva solo se paintListDiv esiste, cioè sulla pagina index.html
    onValue(paintsRef, (snapshot) => {
        paintListDiv.innerHTML = '<p class="loading">Caricamento...</p>';
        allPaints = []; // Reset the array

        if (snapshot.exists()) {
            const paintsData = snapshot.val();
            for (const key in paintsData) {
                allPaints.push({ id: key, ...paintsData[key] });
            }
            // Applica la ricerca corrente se presente prima di visualizzare
            const currentSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            if (currentSearchTerm) {
                const filteredPaints = allPaints.filter(paint => {
                    return Object.values(paint).some(value => {
                        if (value === null || value === undefined) return false;
                        return String(value).toLowerCase().includes(currentSearchTerm);
                    });
                });
                 displayPaints(filteredPaints);
            } else {
                displayPaints(allPaints); // Mostra tutte le vernici all'inizio
            }

        } else {
            paintListDiv.innerHTML = '<p>Nessuna vernice presente in magazzino.</p>';
        }
        // updateAuthState() viene chiamata dal listener globale onAuthStateChanged
    });


    // Function to delete a paint from Firebase (moves to archive if authorized)
    function deletePaint(paintId) {
        if (isUserAuthorized()) { // Controllo autorizzazione
            const paintRefToDelete = ref(database, `paints/${paintId}`);
            get(paintRefToDelete) // Leggi i dati prima di eliminare
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const paintData = snapshot.val();
                        // Aggiungi un prompt di conferma prima di spostare in archivio (opzionale ma consigliato)
                        if (confirm(`Sei sicuro di voler spostare nell'archivio la vernice con codice ${paintData.colorCode}?`)) {
                             push(archivedPaintsRef, paintData) // Sposta nell'archivio
                                .then(() => {
                                    remove(paintRefToDelete) // Elimina dall'inventario principale
                                    .then(() => {
                                        console.log(`Vernice con ID ${paintId} spostata nell'archivio.`);
                                    })
                                    .catch((error) => {
                                        console.error("Errore durante la rimozione della vernice:", error);
                                        alert("Errore durante la rimozione della vernice.");
                                    });
                                })
                                .catch((error) => {
                                    console.error("Errore durante lo spostamento della vernice nell'archivio:", error);
                                    alert("Errore durante lo spostamento della vernice nell'archivio.");
                                });
                        }
                    } else {
                        console.log(`La vernice con ID ${paintId} non esiste nell'inventario principale.`);
                         // Potrebbe essere già stata rimossa dall'onValue se eliminata altrove
                    }
                })
                .catch((error) => {
                    console.error("Errore durante la lettura dei dati della vernice per archiviazione:", error);
                    alert("Errore durante la lettura dei dati della vernice per archiviazione.");
                });
        } else {
            alert('Non sei autorizzato a eliminare una vernice.');
        }
    }

    // Function to start editing a paint
    function startEditPaint(paintId, paintItemElement) {
        // Assicurati che l'utente sia autorizzato prima di iniziare la modifica
        if (!isUserAuthorized()) {
            alert('Non sei autorizzato a modificare una vernice.');
            return;
        }

        const paint = allPaints.find(p => p.id === paintId);
        if (!paint || !paintItemElement) return;

        // Rimuovi la modalità di visualizzazione e aggiungi la classe per la modalità di modifica
        paintItemElement.classList.add('edit-mode');

        // Crea i campi di input pre-compilati
        paintItemElement.innerHTML = `
            <div>
                <label for="edit-colorCode-${paintId}">Codice:</label>
                <input type="text" id="edit-colorCode-${paintId}" value="${paint.colorCode || ''}">
            </div>
            <div>
                <label for="edit-description-${paintId}">Descrizione:</label>
                <input type="text" id="edit-description-${paintId}" value="${paint.description || ''}">
            </div>
            <div>
                <label for="edit-category-${paintId}">Categoria:</label>
                 <select id="edit-category-${paintId}">
                    <option value="ESTERNO" ${paint.category === 'ESTERNO' ? 'selected' : ''}>ESTERNO</option>
                    <option value="TRASPIRANTE" ${paint.category === 'TRASPIRANTE' ? 'selected' : ''}>TRASPIRANTE</option>
                    <option value="LAVABILE" ${paint.category === 'LAVABILE' ? 'selected' : ''}>LAVABILE</option>
                    <option value="SMALTI MURALI" ${paint.category === 'SMALTI MURALI' ? 'selected' : ''}>SMALTI MURALI</option>
                    <option value="SMALTI ALL'ACQUA" ${paint.category === "SMALTI ALL'ACQUA" ? 'selected' : ''}>SMALTI ALL'ACQUA</option>
                    <option value="SMALTI AL SOLVENTE" ${paint.category === 'SMALTI AL SOLVENTE' ? 'selected' : ''}>SMALTI AL SOLVENTE</option>
                    <option value="FERROMICACEO" ${paint.category === 'FERROMICACEO' ? 'selected' : ''}>FERROMICACEO</option>
                    <option value="FINITURE PER LEGNO" ${paint.category === 'FINITURE PER LEGNO' ? 'selected' : ''}>FINITURE PER LEGNO</option>
                    <option value="FONDI" ${paint.category === 'FONDI' ? 'selected' : ''}>FONDI</option>
                 </select>
            </div>
            <div>
                <label for="edit-producer-${paintId}">Produttore:</label>
                <input type="text" id="edit-producer-${paintId}" value="${paint.producer || ''}">
            </div>
            <div>
                <label for="edit-customer-${paintId}">Cliente:</label>
                <input type="text" id="edit-customer-${paintId}" value="${paint.customer || ''}">
            </div>
            <div>
                <label for="edit-quantity-${paintId}">Quantità:</label>
                <input type="number" id="edit-quantity-${paintId}" value="${paint.quantity || 0}" step="0.1">
            </div>
             <div>
                <label for="edit-unit-${paintId}">Unità:</label>
                <input type="text" id="edit-unit-${paintId}" value="${paint.unit || ''}">
            </div>
            <div class="edit-actions">
                <button class="save-button" data-id="${paintId}">Salva</button>
                <button class="cancel-button" data-id="${paintId}">Annulla</button>
            </div>
        `;
         // Nota: Gli event listener per Salva e Annulla vengono aggiunti tramite delega in displayPaints
    }

    // Function to save paint changes
    function savePaintChanges(paintId, paintItemElement) {
        // Assicurati che l'utente sia autorizzato prima di salvare
        if (!isUserAuthorized()) {
             alert('Non sei autorizzato a salvare le modifiche.');
             return;
        }

        const updatedColorCode = document.getElementById(`edit-colorCode-${paintId}`).value;
        const updatedDescription = document.getElementById(`edit-description-${paintId}`).value;
        const updatedCategory = document.getElementById(`edit-category-${paintId}`).value;
        const updatedProducer = document.getElementById(`edit-producer-${paintId}`).value;
        const updatedCustomer = document.getElementById(`edit-customer-${paintId}`).value;
        const updatedQuantity = parseFloat(document.getElementById(`edit-quantity-${paintId}`).value);
        const updatedUnit = document.getElementById(`edit-unit-${paintId}`).value;

        if (!updatedColorCode || !updatedCategory || isNaN(updatedQuantity) || !updatedUnit) {
            alert('Per favore, compila tutti i campi obbligatori per la modifica.');
            return;
        }

        const updatedPaintData = {
            colorCode: updatedColorCode.toUpperCase(),
            description: updatedDescription,
            category: updatedCategory,
            producer: updatedProducer,
            customer: updatedCustomer,
            quantity: updatedQuantity,
            unit: updatedUnit
        };

        const paintRefToUpdate = ref(database, `paints/${paintId}`);
        update(paintRefToUpdate, updatedPaintData)
            .then(() => {
                console.log(`Vernice con ID ${paintId} aggiornata con successo.`);
                // L'onValue listener gestirà il ripristino della visualizzazione normale
                // Non c'è bisogno di rimuovere la classe edit-mode qui, lo farà displayPaints
            })
            .catch((error) => {
                console.error("Errore durante l'aggiornamento della vernice:", error);
                alert("Errore durante l'aggiornamento della vernice.");
            });
    }

    // Function to cancel paint editing
    function cancelEditPaint(paintId, paintItemElement) {
        // Trova i dati originali della vernice
        const originalPaint = allPaints.find(p => p.id === paintId);
        if (!originalPaint || !paintItemElement) return;

        // Rimuovi la classe edit-mode
        paintItemElement.classList.remove('edit-mode');

        // Ripristina l'HTML visuale originale (puoi riutilizzare la logica di displayPaints per una singola voce)
         paintItemElement.innerHTML = `
            <div data-field="colorCode"><strong>Codice:</strong> ${originalPaint.colorCode}</div>
            <div data-field="description"><strong>Descrizione:</strong> ${originalPaint.description || '-'}</div>
            <div data-field="category"><strong>Categoria:</strong> ${originalPaint.category}</div>
            <div data-field="producer"><strong>Produttore:</strong> ${originalPaint.producer || '-'}</div>
            <div data-field="customer"><strong>Cliente:</strong> ${originalPaint.customer || '-'}</div>
            <div data-field="quantity"><strong>Quantità:</strong> ${originalPaint.quantity} ${originalPaint.unit}</div>
            <div class="action-buttons">
                <button class="edit-button" data-id="${originalPaint.id}" ${isUserAuthorized() ? '' : 'disabled'}>Modifica</button>
                <button class="delete-button" data-id="${originalPaint.id}" ${isUserAuthorized() ? '' : 'disabled'}>Elimina</button>
            </div>
        `;
        // Nota: gli event listener verranno riattaccati grazie alla delegazione sulla paintListDiv
    }

} // Fine della logica specifica per index.html


// --- Logica specifica per la pagina Archivio (archivio.html) ---
// Questa parte si attiva solo se archivedPaintListDiv esiste
if (archivedPaintListDiv) {

    // Function to display the archived paint list
    function displayArchivedPaints(paintsToDisplay) {
        archivedPaintListDiv.innerHTML = ''; // Clear the previous list

        if (paintsToDisplay.length > 0) {
             const authorized = isUserAuthorized(); // Controlla autorizzazione una volta

            paintsToDisplay.forEach(paint => {
                const paintItem = document.createElement('div');
                paintItem.classList.add('paint-item'); // Puoi riutilizzare la stessa classe di stile
                // Visualizza i dati archiviati e aggiungi il pulsante di eliminazione permanente
                paintItem.innerHTML = `
                    <div><strong>Codice:</strong> ${paint.colorCode}</div>
                    <div><strong>Descrizione:</strong> ${paint.description || '-'}</div>
                    <div><strong>Categoria:</strong> ${paint.category}</div>
                    <div><strong>Produttore:</strong> ${paint.producer || '-'}</div>
                    <div><strong>Cliente:</strong> ${paint.customer || '-'}</div>
                    <div><strong>Quantità:</strong> ${paint.quantity} ${paint.unit}</div>
                    <div class="action-buttons">
                        <button class="permanent-delete-button" data-id="${paint.id}" ${authorized ? '' : 'disabled'}>Elimina Definitivamente</button>
                    </div>
                `;
                archivedPaintListDiv.appendChild(paintItem);
            });

            // Aggiungi event listener ai pulsanti di eliminazione permanente (delegazione)
             archivedPaintListDiv.removeEventListener('click', handleArchivedPaintListClick); // Rimuovi il vecchio listener
             archivedPaintListDiv.addEventListener('click', handleArchivedPaintListClick); // Aggiungi il nuovo listener

        } else {
            archivedPaintListDiv.innerHTML = '<p>Nessuna vernice archiviata.</p>';
        }
    }

    // Funzione delegata per gestire i click sui pulsanti della lista vernici archiviate
    function handleArchivedPaintListClick(event) {
        const target = event.target;
         if (target.classList.contains('permanent-delete-button')) {
             if (isUserAuthorized()) { // Controllo autorizzazione prima di chiamare la funzione di eliminazione
                const paintId = target.dataset.id;
                deleteArchivedPaintPermanently(paintId); // Questa funzione elimina definitivamente
            } else {
                alert('Non sei autorizzato a eliminare vernici dall\'archivio.');
            }
         }
    }


    // Event listener per la ricerca nell'archivio (aggiunto null check)
    if (archiveSearchInput) { // Only run on archivio.html
        archiveSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const filteredArchivedPaints = allArchivedPaints.filter(paint => {
                return Object.values(paint).some(value => {
                     if (value === null || value === undefined) return false;
                     return String(value).toLowerCase().includes(searchTerm);
                });
            });
            displayArchivedPaints(filteredArchivedPaints);
        });
    }


    // Function to fetch and display the archived paint list from Firebase (for archivio.html)
    onValue(archivedPaintsRef, (snapshot) => {
        archivedPaintListDiv.innerHTML = '<p class="loading">Caricamento archivio...</p>';
        allArchivedPaints = []; // Reset the array per l'archivio

        if (snapshot.exists()) {
            const paintsData = snapshot.val();
            for (const key in paintsData) {
                allArchivedPaints.push({ id: key, ...paintsData[key] });
            }
            // Applica la ricerca corrente dell'archivio se presente prima di visualizzare
            const currentSearchTerm = archiveSearchInput ? archiveSearchInput.value.toLowerCase() : '';
            if (currentSearchTerm) {
                const filteredArchivedPaints = allArchivedPaints.filter(paint => {
                    return Object.values(paint).some(value => {
                        if (value === null || value === undefined) return false;
                        return String(value).toLowerCase().includes(currentSearchTerm);
                    });
                });
                 displayArchivedPaints(filteredArchivedPaints);
            } else {
                displayArchivedPaints(allArchivedPaints); // Mostra tutte le vernici archiviate all'inizio
            }

        } else {
            archivedPaintListDiv.innerHTML = '<p>Nessuna vernice archiviata.</p>';
        }
    });


    // Function to delete a paint permanently from the archive (only if authorized)
    function deleteArchivedPaintPermanently(paintId) {
         if (isUserAuthorized()) { // Controllo autorizzazione anche qui
             const paintRefToDelete = ref(database, `archived_paints/${paintId}`);
             // Aggiungi un prompt di conferma prima di eliminare definitivamente
             if (confirm("Sei sicuro di voler eliminare definitivamente questa vernice dall'archivio? Questa azione è irreversibile.")) {
                 remove(paintRefToDelete)
                     .then(() => {
                         console.log(`Vernice con ID ${paintId} eliminata definitivamente dall'archivio.`);
                     })
                     .catch((error) => {
                         console.error("Errore durante l'eliminazione definitiva dall'archivio:", error);
                         alert("Errore durante l'eliminazione definitiva dall'archivio.");
                     });
             }
         } else {
             alert('Non sei autorizzato a eliminare vernici dall\'archivio.');
         }
    }
} // Fine della logica specifica per archivio.html