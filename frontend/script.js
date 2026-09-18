let currentNoteId = null;
let isNewNote = false;


// ================================================
// ELEMENTS
// ================================================

const loginPage = document.getElementById("loginPage");
const workspacePage = document.getElementById("workspacePage");
const notePage = document.getElementById("notePage");

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginError = document.getElementById("loginError");

const menuButton = document.getElementById("menuButton");
const menuPanel = document.getElementById("menuPanel");

const newButton = document.getElementById("newButton");

const searchInput = document.getElementById("searchInput");
const notesContainer = document.getElementById("notesContainer");
const emptyMessage = document.getElementById("emptyMessage");

const backButton = document.getElementById("backButton");

const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");

const saveButton = document.getElementById("saveButton");
const renameButton = document.getElementById("renameButton");
const deleteButton = document.getElementById("deleteButton");

const nameModal = document.getElementById("nameModal");
const newNoteName = document.getElementById("newNoteName");

const cancelNameButton =
    document.getElementById("cancelNameButton");

const confirmNameButton =
    document.getElementById("confirmNameButton");

const renameModal =
    document.getElementById("renameModal");

const renameInput =
    document.getElementById("renameInput");

const cancelRenameButton =
    document.getElementById("cancelRenameButton");

const confirmRenameButton =
    document.getElementById("confirmRenameButton");


// ================================================
// INITIAL CHECK
// ================================================

window.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("/api/me");

        if (response.ok) {
            showWorkspace();
            await loadNotes();
        }

    } catch (error) {

        console.error(error);

    }

});


// ================================================
// LOGIN
// ================================================

loginButton.addEventListener("click", login);


passwordInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        login();
    }

});


async function login() {

    loginError.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {

        loginError.textContent =
            "Please enter username and password.";

        return;
    }


    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        });


        const data = await response.json();


        if (!response.ok) {

            loginError.textContent =
                data.detail || "Login failed.";

            return;
        }


        passwordInput.value = "";

        showWorkspace();

        await loadNotes();

    } catch (error) {

        loginError.textContent =
            "Unable to connect to server.";

    }

}


// ================================================
// LOGOUT
// ================================================

logoutButton.addEventListener(
    "click",
    async () => {

        await fetch("/api/logout", {
            method: "POST"
        });

        menuPanel.classList.add("hidden");

        workspacePage.classList.add("hidden");
        notePage.classList.add("hidden");

        loginPage.classList.remove("hidden");

        usernameInput.value = "";
        passwordInput.value = "";

    }
);


// ================================================
// SHOW WORKSPACE
// ================================================

function showWorkspace() {

    loginPage.classList.add("hidden");

    notePage.classList.add("hidden");

    workspacePage.classList.remove("hidden");

}


// ================================================
// HAMBURGER MENU
// ================================================

menuButton.addEventListener(
    "click",
    () => {

        menuPanel.classList.toggle("hidden");

    }
);


// ================================================
// NEW NOTE
// ================================================

newButton.addEventListener(
    "click",
    () => {

        currentNoteId = null;
        isNewNote = true;

        noteTitle.value = "";
        noteContent.value = "";

        workspacePage.classList.add("hidden");
        notePage.classList.remove("hidden");

        noteTitle.focus();

    }
);


// ================================================
// BACK
// ================================================

backButton.addEventListener(
    "click",
    async () => {

        notePage.classList.add("hidden");

        workspacePage.classList.remove("hidden");

        currentNoteId = null;

        await loadNotes();

    }
);


// ================================================
// SAVE
// ================================================

saveButton.addEventListener(
    "click",
    async () => {

        const content = noteContent.value;

        // New note
        if (isNewNote) {

            nameModal.classList.remove("hidden");

            newNoteName.value = "";

            newNoteName.focus();

            return;
        }


        // Existing note
        if (!currentNoteId) {
            return;
        }


        const response = await fetch(
            `/api/notes/${currentNoteId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: noteTitle.value,
                    content: content
                })
            }
        );


        if (response.ok) {

            alert("Note saved.");

        } else {

            alert("Could not save note.");

        }

    }
);


// ================================================
// CREATE NEW NOTE AFTER NAME
// ================================================

confirmNameButton.addEventListener(
    "click",
    async () => {

        const title =
            newNoteName.value.trim();

        if (!title) {

            alert("Please enter a note name.");

            return;
        }


        const response = await fetch(
            "/api/notes",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: title,
                    content: noteContent.value
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(
                data.detail || "Could not save note."
            );

            return;
        }


        nameModal.classList.add("hidden");

        currentNoteId = data.id;

        isNewNote = false;

        noteTitle.value = title;

        alert("Note saved.");

    }
);


// ================================================
// CANCEL NEW NOTE NAME
// ================================================

cancelNameButton.addEventListener(
    "click",
    () => {

        nameModal.classList.add("hidden");

    }
);


// ================================================
// RENAME
// ================================================

renameButton.addEventListener(
    "click",
    () => {

        if (!currentNoteId) {
            return;
        }

        renameInput.value = noteTitle.value;

        renameModal.classList.remove("hidden");

        renameInput.focus();

    }
);


confirmRenameButton.addEventListener(
    "click",
    async () => {

        const newTitle =
            renameInput.value.trim();

        if (!newTitle) {

            alert("Note name cannot be empty.");

            return;
        }


        const response = await fetch(
            `/api/notes/${currentNoteId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: newTitle
                })
            }
        );


        if (!response.ok) {

            alert("Could not rename note.");

            return;
        }


        noteTitle.value = newTitle;

        renameModal.classList.add("hidden");

    }
);


// ================================================
// CANCEL RENAME
// ================================================

cancelRenameButton.addEventListener(
    "click",
    () => {

        renameModal.classList.add("hidden");

    }
);


// ================================================
// DELETE
// ================================================

deleteButton.addEventListener(
    "click",
    async () => {

        if (!currentNoteId) {

            notePage.classList.add("hidden");

            workspacePage.classList.remove("hidden");

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this note?"
            );


        if (!confirmed) {
            return;
        }


        const response = await fetch(
            `/api/notes/${currentNoteId}`,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {

            alert("Could not delete note.");

            return;
        }


        currentNoteId = null;

        notePage.classList.add("hidden");

        workspacePage.classList.remove("hidden");

        await loadNotes();

    }
);


// ================================================
// LOAD NOTES
// ================================================

async function loadNotes() {

    const search =
        searchInput.value.trim();


    let url = "/api/notes";


    if (search) {

        url +=
            "?search=" +
            encodeURIComponent(search);

    }


    try {

        const response =
            await fetch(url);


        if (response.status === 401) {

            loginPage.classList.remove("hidden");

            workspacePage.classList.add("hidden");

            return;
        }


        const notes =
            await response.json();


        renderNotes(notes);

    } catch (error) {

        console.error(error);

    }

}


// ================================================
// RENDER NOTES
// ================================================

function renderNotes(notes) {

    notesContainer.innerHTML = "";


    if (notes.length === 0) {

        emptyMessage.classList.remove("hidden");

        return;
    }


    emptyMessage.classList.add("hidden");


    notes.forEach(note => {

        const card =
            document.createElement("div");

        card.className = "note-card";


        const title =
            document.createElement("div");

        title.className =
            "note-card-title";

        title.textContent =
            note.title;


        const date =
            document.createElement("div");

        date.className =
            "note-card-date";

        date.textContent =
            formatDate(note.updated_at);


        card.appendChild(title);

        card.appendChild(date);


        card.addEventListener(
            "click",
            () => openNote(note.id)
        );


        notesContainer.appendChild(card);

    });

}


// ================================================
// OPEN NOTE
// ================================================

async function openNote(id) {

    try {

        const response =
            await fetch(`/api/notes/${id}`);


        if (!response.ok) {

            alert("Could not open note.");

            return;
        }


        const note =
            await response.json();


        currentNoteId = note.id;

        isNewNote = false;


        noteTitle.value =
            note.title;

        noteContent.value =
            note.content;


        workspacePage.classList.add("hidden");

        notePage.classList.remove("hidden");


    } catch (error) {

        alert("Unable to open note.");

    }

}


// ================================================
// SEARCH
// ================================================

searchInput.addEventListener(
    "input",
    () => {

        loadNotes();

    }
);


// ================================================
// DATE
// ================================================

function formatDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}