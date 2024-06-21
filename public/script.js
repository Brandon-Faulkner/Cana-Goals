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

  const sideMenuToggle = document.getElementById("menu-toggle");

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
    sideMenuToggle.checked = false;
  });

  //Goal language variables and functions
  const languageScreen = document.getElementById('language-page');
  const menuGoals = document.getElementById('menu-goals');
  const languageClose = document.getElementById('language-close');

  menuGoals.addEventListener('click', function () {
    languageScreen.classList.add('pop-up');
    sideMenuToggle.checked = false;
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
      sideMenuToggle.checked = false;
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

  //#region TABLE CREATION FUNCTIONS
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

          //Create the goal focus for the semester
          const goalFocusTemplate = document.getElementById("template-goal-focus");
          const goalFocusClone = goalFocusTemplate.content.cloneNode(true);
          goalFocusClone.querySelector('.goal-focus-p').textContent = semester.child("Focus").val();
          semesterLi.insertBefore(goalFocusClone, semesterLi.firstChild);

          //Make sure tables exist for this semester in the DB
          if (semester.child("Tables").exists()) {
            //Create the tables for each user
            var userHasTable = false;
            semester.child("Tables").forEach((uid) => {
              if (uid.key === auth.currentUser.uid) userHasTable = true;
              createUserTable(semesterLi, uid);
            });

            //If user doesn't have a table, create one.
            //Otherwise, move users table above the other ones
            if (!userHasTable) {
              createDefaultTable(semesterLi, auth.currentUser.uid);
            } else {
              //Get the users table then move to top
              var usersTable = semesterLi.querySelector(`[id='${auth.currentUser.uid}-table']`);
              semesterLi.insertBefore(usersTable, semesterLi.querySelector('div:nth-child(2)'));
            }
          } else {
            //No tables exist, create default one for user
            createDefaultTable(semesterLi, auth.currentUser.uid);
          }
        } else {
          //Get existing li and update goal focus for it
          semesterLi = semestersContainer.querySelector(`[data-semester*="${semester.key}"]`);
          semesterLi.querySelector(".goal-focus-p").textContent = semester.child("Focus").val();

          //Now update the tables that have changed
          //TODO---------
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
      var foldRow = goalClone.querySelector('tr[class*="fold"]');
      tableBody.appendChild(goalClone);

      //Now update elements with tableData
      var goalIndex = 0;
      var containsBB = false; var containsComment = false;
      var goalTDs = Array.from(viewRow.querySelectorAll('td:not(td:first-of-type)'));
      row.forEach((rowData) => {
        if (rowData.key != "BB" && rowData.key != "Comments") {
          if (goalIndex === 2) goalTDs[goalIndex].style = `--prog: ${rowData.val()}%;`;
          goalTDs[goalIndex++].textContent = rowData.val();
        } else if (rowData.key === "BB") {
          containsBB = true;
          //Clone BB template then update elements
          rowData.forEach((bbRow) => {
            var bbIndex = 0;
            var bbClone = buildBlockTemplate.content.cloneNode(true);
            var bbTDs = Array.from(bbClone.querySelectorAll('td'));
            bbRow.forEach((bbRowData) => {
              bbTDs[bbIndex++].textContent = bbRowData.val();
            });
            foldRow.querySelector('.building-block-table tbody').appendChild(bbClone);
          });
        } else {
          containsComment = true;
          //Clone Comment template then update elements
          rowData.forEach((comment) => {
            var commentClone = commentTemplate.content.cloneNode(true);
            var commentTD = commentClone.querySelector('td');
            commentTD.textContent = comment.val();
            foldRow.querySelector('.comment-table tbody').appendChild(commentClone);
          });
        }
      });

      //If this row does not contain a comment or a build block, add default one
      if (!containsBB) {
        var bbClone = buildBlockTemplate.content.cloneNode(true);
        foldRow.querySelector('.building-block-table tbody').appendChild(bbClone);
      }

      if (!containsComment) {
        var commentClone = commentTemplate.content.cloneNode(true);
        foldRow.querySelector('.comment-table tbody').appendChild(commentClone);
      }
    });
  }

  function createDefaultTable(semesterLi, userID) {
    const userTableTemplate = document.getElementById('template-user-table');
    const userTableClone = userTableTemplate.content.cloneNode(true);
    const goalTemplate = document.getElementById('template-goal');
    const goalClone = goalTemplate.content.cloneNode(true);
    const foldRow = goalClone.querySelector('tr[class*="fold"]');
    const buildBlockTemplate = document.getElementById('template-build-block');
    const buildBlockClone = buildBlockTemplate.content.cloneNode(true);
    const commentTemplate = document.getElementById('template-comment');
    const commentClone = commentTemplate.content.cloneNode(true);

    var tableWrap = userTableClone.querySelector('div');
    tableWrap.setAttribute('id', userID + '-table');

    var userTableBody = userTableClone.querySelector('tbody');
    userTableBody.appendChild(goalClone);

    var buildBlockTableBody = foldRow.querySelector('.building-block-table tbody');
    buildBlockTableBody.appendChild(buildBlockClone);

    var commentTableBody = foldRow.querySelector('.comment-table tbody');
    commentTableBody.appendChild(commentClone);

    semesterLi.insertBefore(userTableClone, semesterLi.querySelector('div:nth-child(2)'));
  }
  //#endregion TABLE CREATION FUNCTIONS

  //#region CONTEXT MENU AND TABLE ACTION FUNCTIONS
  const addGoal = document.getElementById('add-goal');
  const expandFolds = document.getElementById('expand-folds');
  const closeFolds = document.getElementById('close-folds');
  const contextLine = document.getElementById('context-menu-line');
  const addBuildBlock = document.getElementById('add-build-block');
  const addComment = document.getElementById('add-comment');
  const deleteItem = document.getElementById('delete-item');
  var lastContextTable, lastContextGoal, lastItemToDelete;

  function handleContextMenu(e) {
    //Allow different actions based on which context is targeted
    var targetElem = e.target.closest('[data-context]');
    if (targetElem) {
      //Initially hide extra actions
      contextLine.style.display = 'none';
      showHideContextAction(addBuildBlock, false);
      showHideContextAction(addComment, false);
      showHideContextAction(deleteItem, false);

      lastContextTable = e.target.closest('div[id*="-table"]');

      //Show specific actions
      switch (targetElem.getAttribute('data-context')) {
        case 'user-goal':
          //Determine which goal is highlighted
          lastContextGoal = targetElem;
          var goalList = Array.from(targetElem.parentElement.querySelectorAll('[data-context="user-goal"]'));
          if (goalList.length != 1) {
            showHideContextAction(deleteItem, true, 'fa-trash', `Delete Goal #${goalList.indexOf(targetElem) + 1}`);
            contextLine.style.display = '';
            lastItemToDelete = { elem: targetElem, type: 'goal' };
          }
          break;
        case 'user-build-block-head':
          lastContextGoal = targetElem.closest('.fold-open').previousElementSibling;
          showHideContextAction(addBuildBlock, true, 'fa-cube', 'Add Building Block');
          contextLine.style.display = '';
          break;
        case 'user-build-block':
          //Determine which build block is highlighted
          lastContextGoal = targetElem.closest('.fold-open').previousElementSibling;
          var bbList = Array.from(targetElem.parentElement.children);

          showHideContextAction(addBuildBlock, true, 'fa-cube', 'Add Building Block');
          if (bbList.length != 1) {
            showHideContextAction(deleteItem, true, 'fa-trash', `Delete Building Block #${bbList.indexOf(targetElem) + 1}`);
            lastItemToDelete = { elem: bbList[bbList.indexOf(targetElem)], type: 'build-block' };
          }

          contextLine.style.display = '';
          break;
        case 'user-comment-head':
          lastContextGoal = targetElem.closest('.fold-open').previousElementSibling;
          showHideContextAction(addComment, true, 'fa-comment', 'Add New Comment');
          contextLine.style.display = '';
          break;
        case 'user-comment':
          //Determine which comment is highlighted
          lastContextGoal = targetElem.closest('.fold-open').previousElementSibling;
          var commentList = Array.from(targetElem.parentElement.children);

          showHideContextAction(addComment, true, 'fa-comment', 'Add New Comment');
          if (commentList.length === 1 && commentList[0].textContent.trim() !== "") {
            showHideContextAction(deleteItem, true, 'fa-trash', `Delete Comment #${commentList.indexOf(targetElem) + 1}`);
            lastItemToDelete = { elem: commentList[commentList.indexOf(targetElem)], type: 'comment' };
          }

          contextLine.style.display = '';
          break;
      }

      showContextMenu(e.clientX, e.clientY);
      e.preventDefault();
    }
  }

  semestersContainer.addEventListener('contextmenu', (e) => {
    handleContextMenu(e);
  });

  var lastClick = 0;
  document.addEventListener('mousedown', (e) => {
    contextMenu.className = '';

    //Check if user is double tapping to 
    //show context menu on mobile devices
    let date = new Date();
    let time = date.getTime();
    const timeBetweenTaps = 200; //200ms
    if (time - lastClick < timeBetweenTaps) {
      handleContextMenu(e);
      document.activeElement.blur();
    }
    lastClick = time;

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
        deleteItemFunc(lastItemToDelete);
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

  var progTimeout;
  document.addEventListener('keydown', function (e) {
    if (e.target.getAttribute("placeholder") === "Progress...") {
      const allowedKeys = ['1','2','3','4','5','6','7','8','9','0','Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'];

      if (!(allowedKeys.includes(e.key))) {
        e.preventDefault();
      } else if (e.target.textContent.length >= 3) {
        e.preventDefault();
        e.target.textContent = 0;
      }

      clearTimeout(progTimeout);
      progTimeout = setTimeout(() => {
        if (parseInt(e.target.textContent) && parseInt(e.target.textContent) > 100) e.target.textContent = "100";
        if (e.target.textContent.length === 0 || !parseInt(e.target.textContent)) e.target.textContent = 0;
        if (e.target.textContent.length > 1) e.target.textContent = parseInt(e.target.textContent);
        e.target.style = `--prog: ${e.target.textContent}%;`;
      }, 1000);
    }
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
    const buildBlockTable = userGoal.nextElementSibling.querySelector('.building-block-table tbody');
    const buildBlockTemplate = document.getElementById('template-build-block');
    buildBlockTable.appendChild(buildBlockTemplate.content.cloneNode(true));
  }

  function addCommentFunc(userGoal) {
    const commentTable = userGoal.nextElementSibling.querySelector('.comment-table tbody');
    const commentTemplate = document.getElementById('template-comment');
    commentTable.appendChild(commentTemplate.content.cloneNode(true));
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
    switch (item.type) {
      case 'goal':
        item.elem.nextElementSibling.remove();
        item.elem.remove();
        break;
      case 'comment':
        if (item.elem.parentElement.children.length === 1) {
          addCommentFunc(lastContextGoal);
        }
        item.elem.remove();
        break;
      default:
        item.elem.remove();
        break;
    }
  }
  //#endregion CONTEXT MENU AND TABLE ACTION FUNCTIONS
}