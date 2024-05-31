import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDYuTQDXbkmGM73f-mBCghdLeTsXLoS9Q",
  authDomain: "cana-goals.firebaseapp.com",
  projectId: "cana-goals",
  storageBucket: "cana-goals.appspot.com",
  messagingSenderId: "77801609796",
  appId: "1:77801609796:web:da20da804555c984113a11",
  measurementId: "G-54LFB530MD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

function changeSidebarMenuItem(id, text, iClass, color) {
  const elem = document.getElementById(id);
  elem.innerHTML = text + " <i class=\"fas " + iClass + "\"></i>";
  if (color) elem.style.background = color;
}

function showNotifToast(title, message, statusColor, isTimed, seconds) {
  const toastElem = document.querySelector('.toast');
  const toastMessage = document.querySelector('.toast-message');
  const toastProgress = document.querySelector('.toast-progress');
  const toastClose = document.querySelector('.toast .close');

  //Check if toast is active, wait if it is
  if (toastElem.classList.contains('active')) {
    setTimeout(() => {
      showNotifToast(title, message, statusColor, isTimed, seconds);
    }, 1000);
  } else {
    //Change --toast-status css var to statusColor
    toastElem.style.setProperty('--toast-status', statusColor);

    //Update toast title
    toastMessage.children[0].textContent = title;
    toastMessage.children[1].textContent = message;

    //Now show the toast
    toastElem.classList.add('active');

    //Show the progress bar if isTimed is true
    if (isTimed === true) {
      toastProgress.style.setProperty('--toast-duration', seconds + 's');
      toastProgress.classList.add('active');

      toastProgress.addEventListener("animationend", function () {
        toastElem.classList.remove('active');
        toastProgress.classList.remove('active');
      });
    }
  }

  toastClose.addEventListener('click', function () {
    toastProgress.classList.remove('active');
    toastElem.classList.remove('active');
  });
}

window.addEventListener('load', () => {
  //Ensure that the browser supports the service worker API then register it
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      console.log('Service Worker Registered');
    }).catch(swErr => console.log(`Service Worker Installation Error: ${swErr}}`));
  }

  //Color theme variables and functions
  const menuTheme = document.getElementById('menu-themes');
  const localTheme = localStorage.getItem("theme");
  const darkTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const currTheme = getThemeString(localTheme, darkTheme);
  document.querySelector("html").setAttribute("data-theme", currTheme);
  currTheme === "dark" ? changeSidebarMenuItem("menu-themes", "Light Mode", "fa-sun") : changeSidebarMenuItem("menu-themes", "Dark Mode", "fa-moon");

  function getThemeString(localTheme, darkTheme) {
    if (localTheme !== null) return localTheme;
    if (darkTheme.matches) return "dark";
    return "light";
  }

  menuTheme.addEventListener('click', function () {
    const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    document.querySelector("html").setAttribute("data-theme", newTheme);
    newTheme === "dark" ? changeSidebarMenuItem("menu-themes", "Light Mode", "fa-sun") : changeSidebarMenuItem("menu-themes", "Dark Mode", "fa-moon");
  });

  //Goal language variables and functions
  const languageScreen = document.getElementById('language-page');
  const menuGoals = document.getElementById('menu-goals');
  const languageClose = document.getElementById('language-close');

  menuGoals.addEventListener('click', function () {
    languageScreen.classList.add('pop-up');
  });

  languageClose.addEventListener('click', function () {
    languageScreen.classList.remove('pop-up');
  });

  //#region LOGIN FUNCTIONS
  const menuLogin = document.getElementById('menu-login');
  const loginScreen = document.getElementById('login-page');
  const loginClose = document.getElementById('login-close');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginButton = document.getElementById('login-button');
  const loginPeek = loginPassword.nextElementSibling;

  //Detect login status and setup tables
  onAuthStateChanged(auth, (user) => {
    if (user === null) {
      // No one is signed in, prompt login
      changeSidebarMenuItem("menu-login", "Log In", "fa-right-to-bracket", "var(--color-green)");
      menuLogin.click();
    } else if (user.isAnonymous === false) {
      // User is signed in
      continueWithApp();
      changeSidebarMenuItem("menu-login", "Sign Out", "fa-right-from-bracket", "var(--color-red)");
      loginScreen.remove();
    }
  });

  menuLogin.addEventListener('click', function () {
    if (this.textContent.includes("Log In")) {
      loginScreen.classList.add('pop-up');
    } else {
      signOutUser(auth);
    }
  });

  loginClose.addEventListener('click', function () {
    loginScreen.classList.remove('pop-up');
    loginEmail.value = null;
    loginPassword.value = null;
    loginEmail.classList.remove('login-error');
    loginPassword.classList.remove('login-error');
  });

  loginButton.addEventListener('click', function (e) {
    e.preventDefault();
    loginEmail.classList.remove('login-error');
    loginPassword.classList.remove('login-error');
    loginButton.classList.add('login-click');
    signInUser(auth, loginEmail.value, loginPassword.value);
  });

  loginPeek.addEventListener('click', function () {
    if (loginPeek.classList.contains('fa-eye')) {
      loginPeek.className = "fa-solid fa-eye-slash eye-icon";
      loginPassword.setAttribute('type', 'text');
    } else {
      loginPeek.className = "fa-solid fa-eye eye-icon";
      loginPassword.setAttribute('type', 'password');
    }
  });

  function signInUser(auth, email, password) {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        loginButton.classList.remove('login-click');
        changeSidebarMenuItem("menu-login", "Sign Out", "fa-right-from-bracket", "var(--color-red)");
        loginClose.click();
      })
      .catch((error) => {
        // Unsuccessful Sign In
        loginEmail.classList.add('login-error');
        loginPassword.classList.add('login-error');
        loginButton.classList.remove('login-click');
      });
  }

  function signOutUser(auth) {
    signOut(auth).then(() => {
      loginClose.click();
      window.location.reload();
    }).catch((error) => {
      console.log(error.code + ": " + error.message);
      showNotifToast("Sign Out Error", "There was an issue with signing you out. Please try again.", "var(--red)", true, 8);
    });
  }
  //#endregion LOGIN FUNCTIONS
});

function continueWithApp() {
  const semestersMenu = document.getElementById('semesters-menu');
  const semestersContainer = document.getElementById('semesters-container');

  var semesterTitlesArr = []; var semesterLi = null;
  onValue(ref(database, 'Semesters/'), (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((semester) => {
        //Check if this semester has already been handled
        if (!semesterTitlesArr.includes(semester.key)) {
          semesterTitlesArr.unshift(semester.key);

          //Create the li for this semester
          semesterLi = document.createElement('li');
          semesterLi.setAttribute("data-semester", semester.key + ": " + semester.child("Start").val() + " - " + semester.child("End").val());
          semestersContainer.insertBefore(semesterLi, semestersContainer.firstChild);

          //Create menu item tab for the semester
          createSemesterMenuItem(semester.key + ": " + semester.child("Start").val() + " - " + semester.child("End").val());
        } else {
          //Get existing li and update goal focus for it
          semesterLi = semestersContainer.querySelector('[data-semester="' + semester.key + '"]');
          semesterLi.querySelector(".goal-focus-p").textContent = semester.child("Focus").val();
        }

        //Make sure tables exist for this semester in the DB
        if (semester.child("Tables").exists()) {
          //Create the tables for each user
          semester.child("Tables").forEach((uid) => {
            createUserTable(semesterLi, uid);
          });
        } else {

        }

      });
    }
  });

  function createSemesterMenuItem(semesterKey) {
    const label = document.createElement('label');
    const input = document.createElement('input');

    input.setAttribute("id", semesterKey);
    input.setAttribute("type", "radio");
    input.setAttribute("name", "semester-menu");

    label.setAttribute("for", semesterKey);
    label.textContent = semesterKey;

    semestersMenu.insertBefore(input, semestersMenu.firstChild);
    input.insertAdjacentElement('afterend', label);

    input.addEventListener('click', () => {
      Array.from(document.getElementsByName('semester-menu')).forEach((tab) => {
        if (tab === input) {
          tab.checked = true;
          document.querySelector('[data-semester="' + tab.getAttribute("id") + '"]').style = "";
        } else {
          tab.checked = false;
          document.querySelector('[data-semester="' + tab.getAttribute("id") + '"]').style = "display: none";
        }
      });
    });

    input.click();
  }

  function createUserTable(semesterLi, tableData) {
    var tableWrap = document.createElement("div"); tableWrap.setAttribute("id", tableData.key + "-table");
    var userName = document.createElement("h2"); userName.textContent = tableData.child("Name").val();
    var table = document.createElement("table"); tableWrap.appendChild(userName);

    //Create the table header with an extra empty th
    var tableHead = document.createElement("thead");
    var headRow = document.createElement("tr");
    headRow.appendChild(document.createElement('th'));
    tableData.child("Headers").forEach((col) => {
      var headCol = document.createElement('th');
      headCol.textContent = col.val(); headRow.appendChild(headCol);
    });
    tableHead.appendChild(headRow); table.appendChild(tableHead);

    //Create the table body
    var tableBody = document.createElement('tbody');
    tableData.child("Content").forEach((row) => {
      //Initial creation of framework pieces of the table
      var bodyGoalRow = document.createElement('tr'); bodyGoalRow.className = "view"; tableBody.appendChild(bodyGoalRow);
      var bodyBlockRow = document.createElement('tr'); bodyBlockRow.className = "fold-closed"; tableBody.appendChild(bodyBlockRow);
      bodyGoalRow.appendChild(createTableButtons(BUTTON_ENUM.FOLDS));

      var blockTd = document.createElement('td'); 
      blockTd.setAttribute('colspan', 4); bodyBlockRow.appendChild(blockTd);
      var blockDiv = document.createElement('div'); blockTd.appendChild(blockDiv);
      var blockTable = document.createElement('table'); blockDiv.appendChild(blockTable);
      var blockHead = document.createElement('thead'); blockTable.appendChild(blockHead);
      var blockBody = document.createElement('tbody'); blockTable.appendChild(blockBody);
      blockTable.classList.add('building-block-table');
      blockBody.appendChild(createTableButtons(BUTTON_ENUM.BUILDING_BLOCK));

      var commentTable = document.createElement('table'); blockDiv.appendChild(commentTable);
      var commentHead = document.createElement('thead'); commentTable.appendChild(commentHead);
      var commentBody = document.createElement('tbody'); commentTable.appendChild(commentBody);
      var commentColRow = document.createElement('tr'); commentHead.appendChild(commentColRow);
      var commentColHead = document.createElement('th'); commentColHead.textContent = "Comments";
      commentColRow.appendChild(commentColHead); commentTable.classList.add('comment-table');
      commentBody.appendChild(createTableButtons(BUTTON_ENUM.COMMENT));

      //Create Goal rows
      row.forEach((rowData) => {
        var rowTd = document.createElement('td');
        if (rowData.key != "BB" && rowData.key != "Comments") {
          rowTd.textContent = rowData.val();
          bodyGoalRow.appendChild(rowTd);
        } else if (rowData.key == "BB") {
          //Create Building block rows
          var blockColRow = document.createElement('tr'); blockHead.appendChild(blockColRow);
          var colIndex = 0;
          tableData.child("Headers").forEach((col) => {
            var blockColTh = document.createElement('th');
            blockColTh.textContent = colIndex === 0 ? "Building Blocks" : col.val();
            blockColRow.appendChild(blockColTh); colIndex++;
          });

          rowData.forEach((buildBlock) => {
            var blockBodyTr = document.createElement('tr'); blockBody.insertBefore(blockBodyTr, blockBody.firstChild);
            buildBlock.forEach((blockData) => {
              var blockBodyTd = document.createElement('td'); blockBodyTd.textContent = blockData.val();
              blockBodyTr.appendChild(blockBodyTd);
            });
          });
        } else {
          //Create Comment rows
          rowData.forEach((comment) => {
            var commentRow = document.createElement('tr'); commentBody.insertBefore(commentRow, commentBody.firstChild);
            var commentRowTd = document.createElement('td'); commentRowTd.textContent = comment.val();
            commentRow.appendChild(commentRowTd);
          });
        }
      });
    });

    //Append rest of elements
    table.appendChild(tableBody);
    tableWrap.appendChild(table);
    semesterLi.appendChild(tableWrap);
  }

  const BUTTON_ENUM = { BUILDING_BLOCK: 0, COMMENT: 1, FOLDS: 2 }
  function createTableButtons(buttonToMake) {
    var button = document.createElement('button');
    var buttonTd = document.createElement('td'); buttonTd.appendChild(button);
    var elemToReturn = buttonTd;

    switch (buttonToMake) {
      case BUTTON_ENUM.BUILDING_BLOCK:
        var tableRow = document.createElement('tr');
        var emptyCell = document.createElement('td'); 
        emptyCell.classList.add('empty-cell');
        tableRow.appendChild(emptyCell);
        tableRow.appendChild(emptyCell.cloneNode());
        button.className = "add-building-block";
        button.innerHTML = '<i class="fas fa-plus"></i> Add Building Block';
        tableRow.appendChild(buttonTd); elemToReturn = tableRow;
        break;
      case BUTTON_ENUM.COMMENT:
        var tableRow = document.createElement('tr'); 
        button.className = "add-comment";
        button.innerHTML = '<i class="fas fa-plus"></i> Add Comment';
        tableRow.appendChild(buttonTd); elemToReturn = tableRow;
        break;
      case BUTTON_ENUM.FOLDS:
        button.className = "fold-btn fas fa-caret-down";
        button.addEventListener('click', () => {
          var parentTableRowElem = button.parentElement.parentElement;
          if (button.classList.contains('fa-caret-down')) {
            button.className = 'fold-btn fas fa-caret-up';
            parentTableRowElem.nextElementSibling.className = 'fold-open';
          } else {
            button.className = 'fold-btn fas fa-caret-down';
            parentTableRowElem.nextElementSibling.className = 'fold-closed';
          }
        });
        break;
    }

    return elemToReturn;
  }
}