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

const STATUS_COLOR = { RED: "var(--color-red)", GREEN: "var(--color-green)" }

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
      showNotifToast("Sign Out Error", "There was an issue with signing you out. Please try again.", STATUS_COLOR.RED, true, 8);
    });
  }
  //#endregion LOGIN FUNCTIONS
});

function continueWithApp() {
  const semestersMenu = document.getElementById('semesters-menu');
  const semestersContainer = document.getElementById('semesters-container');
  const contextMenu = document.getElementById('context-menu');

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
    //First clone the user table then append it to semester with basic data
    const userTableTemplate = document.getElementById('template-user-table');
    const userTable = userTableTemplate.content.cloneNode(true);
    const tableWrap = userTable.querySelector('#userID-table'); 
    tableWrap.setAttribute("id", tableData.key + "-table");
    const userName = tableWrap.querySelector('h2');
    userName.textContent = tableData.child("Name").val();
    semesterLi.appendChild(userTable);

    //Template elements
    const goalTemplate = document.getElementById('template-goal');
    const buildBlockTemplate = document.getElementById('template-build-block');
    const commentTemplate = document.getElementById('template-comment');

    //Now add all data from tableData into user table
    const tableBody = tableWrap.querySelector('tbody');
    tableData.child("Content").forEach((row) => {
      //Clone new goal row to hold all data
      var goalClone = goalTemplate.content.cloneNode(true);
      var viewRow = goalClone.querySelector('.view');
      var foldRow = goalClone.querySelector('[class*="fold"]');
      tableBody.appendChild(goalClone);

      //Now update elements with tableData
      var index = 0;
      var goalTDs = Array.from(viewRow.querySelectorAll('td:not(td:first-of-type)'));
      row.forEach((rowData) => {
        if (rowData.key != "BB" && rowData.key != "Comments") {
          goalTDs[index].textContent = rowData.val();
        } else if (rowData.key === "BB") {
          //TODO: Clone BB template then insert forEach
        } else {
          //TODO: Clone Comment template then insert forEach
        }

        index++;
      });
    });

  }

  function createFoldButtons() {
    var button = document.createElement('button');
    var buttonTd = document.createElement('td'); buttonTd.appendChild(button);
    button.className = "fold-btn fas fa-caret-down";
    return buttonTd;
  }

  //Context Menu Functions -----------------------------------------
  const addGoal = document.getElementById('add-goal');
  const addBuildBlock = document.getElementById('add-build-block');
  const addComment = document.getElementById('add-comment');
  const expandFolds = document.getElementById('expand-folds');
  const closeFolds = document.getElementById('close-folds');
  const deleteItem = document.getElementById('delete-item');
  var lastContextTable, lastContextGoal;

  semestersContainer.addEventListener('contextmenu', (e) => {
    //Allow different actions based on which context is targeted
    var targetElem = e.target.closest('[data-context]');
    if (targetElem) {
      //Initially hide all actions
      showHideContextAction(addGoal, false);
      showHideContextAction(addBuildBlock, false);
      showHideContextAction(addComment, false);
      showHideContextAction(expandFolds, false);
      showHideContextAction(closeFolds, false);
      showHideContextAction(deleteItem, false);

      //Show specific actions
      switch (targetElem.getAttribute('data-context')) {
        case 'user-table':
          lastContextTable = targetElem;
          showHideContextAction(addGoal, true, 'fa-list-check', 'Add New Goal');
          showHideContextAction(expandFolds, true, 'fa-caret-up', 'Expand Table Folds');
          showHideContextAction(closeFolds, true, 'fa-caret-down', 'Close Table Folds');
          break;
        case 'user-goal':
          //Determine which goal is highlighted
          lastContextGoal = targetElem;
          var goalList = Array.from(targetElem.parentElement.querySelectorAll('[data-context="user-goal"]'));

          showHideContextAction(addGoal, true, 'fa-list-check', 'Add New Goal');
          showHideContextAction(deleteItem, true, 'fa-trash', `Delete Goal #${goalList.indexOf(targetElem) + 1}`);
          break;
        case 'user-build-block-head':
          lastContextGoal = targetElem.closest('.fold-open').previousSibling;
          showHideContextAction(addBuildBlock, true, 'fa-cube', 'Add Building Block');
          break;
        case 'user-build-block':
          //Determine which build block is highlighted
          lastContextGoal = targetElem.closest('.fold-open').previousSibling;
          var bbList = Array.from(targetElem.parentElement.children);

          showHideContextAction(addBuildBlock, true, 'fa-cube', 'Add Building Block');
          showHideContextAction(deleteItem, true, 'fa-trash', `Delete Building Block #${bbList.indexOf(targetElem) + 1}`);
          break;
        case 'user-comment-head':
          lastContextGoal = targetElem.closest('.fold-open').previousSibling;
          showHideContextAction(addComment, true, 'fa-comment', 'Add New Comment');
          break;
        case 'user-comment':
          //Determine which comment is highlighted
          lastContextGoal = targetElem.closest('.fold-open').previousSibling;
          var commentList = Array.from(targetElem.parentElement.children);

          showHideContextAction(addComment, true, 'fa-comment', 'Add New Comment');
          showHideContextAction(deleteItem, true, 'fa-trash', `Delete Comment #${commentList.indexOf(targetElem) + 1}`);
          break;
      }

      showContextMenu(e.clientX, e.clientY);
      e.preventDefault();
    }
  });

  document.addEventListener('mousedown', (e) => {
    contextMenu.className = '';

    //Context menu actions
    switch (e.target) {
      case addGoal:
        addGoalFunc(lastContextTable);
        break;
      case addBuildBlock:
        addBuildBlockFunc(lastContextGoal);
        break;
      case addComment:
        addCommentFunc(lastContextGoal);
        break;
      case expandFolds:
        expandFoldsFunc(lastContextTable);
        break;
      case closeFolds:
        closeFoldsFunc(lastContextTable);
        break;
      case deleteItem:
        deleteItemFunc();
        break;
    }

    //Carret fold buttons
    if (e.target.classList.contains('fold-btn')) {
      var parentTableRowElem = e.target.parentElement.parentElement;
      if (e.target.classList.contains('fa-caret-down')) {
        e.target.className = 'fold-btn fas fa-caret-up';
        parentTableRowElem.nextElementSibling.className = 'fold-open';
      } else {
        e.target.className = 'fold-btn fas fa-caret-down';
        parentTableRowElem.nextElementSibling.className = 'fold-closed';
      }
    }
  });

  document.addEventListener('wheel', () => {
    contextMenu.className = '';
  });

  function showContextMenu(posX, posY) {
    // Get the dimensions of the context menu
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;

    // Get the dimensions of the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust posX if the menu would go off the right side of the screen
    if (posX + menuWidth > viewportWidth) {
      posX = viewportWidth - menuWidth;
    }

    // Adjust posY if the menu would go off the bottom of the screen
    if (posY + menuHeight > viewportHeight) {
      posY = viewportHeight - menuHeight;
    }

    // Set the position of the context menu
    contextMenu.style.top = posY + 'px';
    contextMenu.style.left = posX + 'px';
    contextMenu.className = 'show-menu';
  }

  function showHideContextAction(elem, shouldShow, iconClass, actionText) {
    if (shouldShow) {
      elem.style.display = 'flex';
      elem.innerHTML = `<i class="fas ${iconClass}"></i>${actionText}`;
    } else {
      elem.style.display = 'none';
    }
  }

  //Context Action Functions
  function addGoalFunc(userTable) {
    const userTableBody = userTable.querySelector('tbody');
    const goalTemplate = document.getElementById('template-goal');
    userTableBody.appendChild(goalTemplate.content.cloneNode(true));
  }

  function addBuildBlockFunc(userGoal) {
    const buildBlockTemplate = document.getElementById('template-build-block');

  }

  function addCommentFunc(userGoal) {

  }

  function expandFoldsFunc(userTable) {
    var foldBtns = userTable.querySelectorAll('.fold-btn');
    foldBtns.forEach((btn) => {
      var parentTableRow = btn.parentElement.parentElement;
      btn.className = 'fold-btn fas fa-caret-up';
      parentTableRow.nextElementSibling.className = 'fold-open';
    });
  }

  function closeFoldsFunc(userTable) {
    var foldBtns = userTable.querySelectorAll('.fold-btn');
    foldBtns.forEach((btn) => {
      var parentTableRow = btn.parentElement.parentElement;
      btn.className = 'fold-btn fas fa-caret-down';
      parentTableRow.nextElementSibling.className = 'fold-closed';
    });
  }

  function deleteItemFunc(item) {

  }
  //----------------------------------------------------------------
}