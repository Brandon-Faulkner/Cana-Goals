import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
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

const STATUS_COLOR = { RED: "var(--color-red)", GREEN: "var(--color-green)" };
const dateRegex = new RegExp(/^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/gm, 'gm');

function changeSidebarMenuItem(id, text, iClass, color) {
  const elem = document.getElementById(id);
  elem.innerHTML = text + " <i class=\"fas " + iClass + "\"></i>";
  if (color) elem.style.background = color;
}

function showNotifToast(title, message, statusColor, isTimed, seconds) {
  const toastHolder = document.getElementById('toast-holder');
  const toastTemplate = document.getElementById('template-toast');
  const toast = toastTemplate.content.cloneNode(true);
  const toastElem = toast.querySelector('.toast');
  const toastMessage = toast.querySelector('.toast-message');
  const toastProgress = toast.querySelector('.toast-progress');
  const toastClose = toast.querySelector('.toast .close');

  //Add the new toast into the toast holder
  toastHolder.insertBefore(toast, toastHolder.firstChild);

  //Change --toast-status css var to statusColor
  toastElem.style.setProperty('--toast-status', statusColor);

  //Update toast title
  toastMessage.children[0].textContent = title;
  toastMessage.children[1].textContent = message;

  //Now show the toast
  setTimeout(() => {
    toastElem.classList.add('active');
  }, 100); //Brief pause to show animation

  //Show the progress bar if isTimed is true
  if (isTimed === true) {
    toastProgress.style.setProperty('--toast-duration', seconds + 's');
    toastProgress.classList.add('active');

    toastProgress.addEventListener("animationend", function () {
      toastElem.classList.remove('active');
      toastProgress.classList.remove('active');
      setTimeout(() => {
        toastElem.remove();
      }, 500);
    });
  }

  //Check if there are too many toasts: Phone-2, Desktop-4
  const currToastArr = Array.from(toastHolder.children);
  if (window.innerWidth <= 600) { //Mobile
    if (currToastArr.length > 2) {
      for (let i = 2; i < currToastArr.length; i++) {
        currToastArr[i].querySelector('.close').click();
      }
    }
  } else { //Desktop
    if (currToastArr.length > 4) {
      for (let i = 4; i < currToastArr.length; i++) {
        currToastArr[i].querySelector('.close').click();
      }
    }
  }

  toastClose.addEventListener('click', function () {
    toastProgress.classList.remove('active');
    toastElem.classList.remove('active');
    setTimeout(() => {
      toastElem.remove();
    }, 500);
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

async function continueWithApp() {
  const semestersMenu = document.getElementById('semesters-menu');
  const semestersContainer = document.getElementById('semesters-container');
  const contextMenu = document.getElementById('context-menu');
  const statusMenu = document.getElementById('status-menu');
  var currUserName, isUserAdmin;

  //#region TABLE CREATION FUNCTIONS
  await get(ref(database, `Users/${auth.currentUser.uid}/`)).then((snapshot) => {
    currUserName = snapshot.child("Name").val();
    isUserAdmin = snapshot.child("isAdmin").val();
    createAddSemesterMenuItem(isUserAdmin);
  }).catch(() => {
    const message = "There was an error retrieving your info from the database. Refresh the page to try again."
    showNotifToast("Error Retrieving Info", message, STATUS_COLOR.RED, false);
  });

  //Add semester menu item
  function createAddSemesterMenuItem(isAdmin) {
    if (isAdmin) {
      const addSemesterScreen = document.getElementById('add-semester-page');
      const addSemesterClose = document.getElementById('add-semester-close');
      const addSemesterName = document.getElementById('add-semester-name');
      const addSemesterStart = document.getElementById('add-semester-start'); 
      const addSemesterEnd = document.getElementById('add-semester-end'); 
      const addSemesterSubmit = document.getElementById('add-semester-submit');  

      const sideMenuToggle = document.getElementById("menu-toggle");
      const menuSidebar = document.querySelector('.menu-sidebar');
      const menuSemester = document.createElement('span');   

      menuSemester.setAttribute('id', 'menu-semester');
      menuSemester.innerHTML = "Add Semester<i class=\"fas fa-calendar-plus\"></i>";
      menuSidebar.appendChild(menuSemester);

      menuSemester.addEventListener('click', function () {
        addSemesterScreen.classList.add('pop-up');
        sideMenuToggle.checked = false;
      });

      addSemesterClose.addEventListener('click', function () {
        addSemesterScreen.classList.remove('pop-up');
      });

      addSemesterSubmit.addEventListener('click', function () {
        //Check if inputs are empty
        if (addSemesterName.value.trim() !== "" && Date.parse(addSemesterStart.value) && Date.parse(addSemesterEnd.value)) {
          //Inputs are good, submit to database and then show toast
          addSemesterSubmit.classList.add('login-click');

          const startDate = new Date(addSemesterStart.value);
          const endDate = new Date(addSemesterEnd.value);
          const startString = `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear().toString().slice(2)}`;
          const endString = `${endDate.getMonth() + 1}/${endDate.getDate()}/${endDate.getFullYear().toString().slice(2)}`;

          set(ref(database, `Semesters/${addSemesterName.value}`), {
            End: endString,
            Focus: "",
            Start: startString
          }).then(() => {
            addSemesterClose.click();
            addSemesterSubmit.classList.remove('login-click');
            addSemesterName.value = null;
            addSemesterStart.value = null;
            addSemesterEnd.value = null;
            showNotifToast("Semester Added", "New semester has been successfully added.", STATUS_COLOR.GREEN, true, 4); 
          }).catch(() => {
            addSemesterSubmit.classList.remove('login-click');
            showNotifToast("Error Adding Semester", "There was an issue adding this semester. Please try again.", STATUS_COLOR.RED, true, 4);
          });
        } else {
          //Inputs are empty, show error
          showNotifToast("Missing Information", "Please fill in all info for the new semester.", STATUS_COLOR.RED, true, 4);
        }
      });
    }
  }

  var semesterTitlesArr = []; var semesterLi = null; var dbAllSemesters;
  onValue(ref(database, 'Semesters/'), (snapshot) => {
    if (snapshot.exists()) {
      dbAllSemesters = snapshot;
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

    //Now add all data from tableData into user table
    const tableBody = tableWrap.querySelector('tbody');
    insertTableData(tableData, tableBody, semesterLi);
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
    tableWrap.querySelector('h2').textContent = currUserName;

    var userTableBody = userTableClone.querySelector('tbody');
    userTableBody.appendChild(goalClone);

    var buildBlockTableBody = foldRow.querySelector('.building-block-table tbody');
    buildBlockTableBody.appendChild(buildBlockClone);

    var commentTableBody = foldRow.querySelector('.comment-table tbody');
    commentTableBody.appendChild(commentClone);

    //Set default semester due date
    var goalTDs = Array.from(userTableClone.querySelectorAll('.view td:not(td:first-of-type)'));
    var bbTDs = Array.from(userTableClone.querySelectorAll('.building-block-table td'));
    setCellData(goalTDs[1], 1, "", semesterLi);
    setCellData(bbTDs[1], 1, "", semesterLi);

    semesterLi.insertBefore(userTableClone, semesterLi.querySelector('div:nth-child(2)'));
  }

  function insertTableData(tableData, tableBody, semesterLi) {
    //Template elements
    const goalTemplate = document.getElementById('template-goal');
    const buildBlockTemplate = document.getElementById('template-build-block');
    const commentTemplate = document.getElementById('template-comment');

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
          setCellData(goalTDs[goalIndex], goalIndex, rowData.val(), semesterLi);
          goalIndex++;
        } else if (rowData.key === "BB") {
          containsBB = true;
          //Clone BB template then update elements
          rowData.forEach((bbRow) => {
            var bbIndex = 0;
            var bbClone = buildBlockTemplate.content.cloneNode(true);
            var bbTDs = Array.from(bbClone.querySelectorAll('td'));
            bbRow.forEach((bbRowData) => {
              setCellData(bbTDs[bbIndex], bbIndex, bbRowData.val(), semesterLi);
              bbIndex++;
            });
            foldRow.querySelector('.building-block-table tbody').appendChild(bbClone);
          });
        } else {
          containsComment = true;
          //Clone Comment template then update elements
          rowData.forEach((comment) => {
            var commentClone = commentTemplate.content.cloneNode(true);
            var commentTD = commentClone.querySelector('td');
            var commentData = comment.val();
            if (commentData !== null) {
              var author = commentData.split(" - Made by ")[1];
              var message = commentData.split(" - Made by ")[0];
              commentTD.textContent = message;
              commentTD.setAttribute('data-author', author);
            }
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

  function setCellData(cell, index, data, semesterLi) {
    switch (index) {
      case 0:
        cell.textContent = data;
        break;
      case 1:
        if (data !== null && dateRegex.test(data)) {
          cell.firstChild.value = data;
        } else {
          //Set default end date
          var endDate = new Date(semesterLi.getAttribute('data-semester').split("- ")[1]);
          cell.firstChild.value = endDate.getFullYear() + "-" + ('0' + (endDate.getMonth() + 1)).slice(-2) + "-" + ('0' + endDate.getDate()).slice(-2);
        }
        break;
      case 2:
        switch (data) {
          case 'Not Working On':
            cell.innerHTML = `<i class="fas fa-circle-xmark"></i>${data}`;
            cell.style = "color: var(--color-more-dark);";
            break;
          case 'Working On':
            cell.innerHTML = `<i class="fas fa-briefcase"></i>${data}`;
            cell.style = "background: var(--color-status-blue); color: var(--color-white);";
            break;
          case 'Completed':
            cell.innerHTML = `<i class="fas fa-check-double"></i>${data}`;
            cell.style = "background: var(--color-green); color: var(--color-white);";
            break;
          case 'Waiting':
            cell.innerHTML = `<i class="fas fa-hourglass-half"></i>${data}`;
            cell.style = "background: var(--color-status-orange); color: var(--color-white);";
            break;
          case 'Stuck':
            cell.innerHTML = `<i class="fas fa-triangle-exclamation"></i>${data}`;
            cell.style = "background: var(--color-red); color: var(--color-white);";
            break;
        }
        break;
    }
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
  var lastContextTable, lastContextGoal, lastItemToDelete, lastStatusInput;

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
          if ((targetElem.textContent.trim() === "" && commentList.length > 1) || targetElem.firstElementChild.getAttribute('data-author') === currUserName) {
            showHideContextAction(deleteItem, true, 'fa-trash', `Delete Comment #${commentList.indexOf(targetElem) + 1}`);
            lastItemToDelete = { elem: commentList[commentList.indexOf(targetElem)], type: 'comment' };
          }

          contextLine.style.display = '';
          break;
      }

      //Only show if context menu is allowed. ie: table is not being edited
      if (lastContextTable.getAttribute("style") !== "pointer-events: none;") {
        showActionMenu(contextMenu, e.clientX, e.clientY);
        e.preventDefault();
      }
    }
  }

  semestersContainer.addEventListener('contextmenu', (e) => {
    statusMenu.className = '';
    handleContextMenu(e);
  });

  var lastClick = 0;
  document.addEventListener('mousedown', (e) => {
    statusMenu.className = '';

    //Check if user is double tapping to 
    //show context menu on mobile devices
    let date = new Date();
    let time = date.getTime();
    const timeBetweenTaps = 200; //200ms
    if (time - lastClick < timeBetweenTaps) {
      handleContextMenu(e);
      document.activeElement.blur();
      lastClick = time;
      return;
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

    //Status action menu
    if (e.target.classList.contains('status-input') && e.button === 0) {
      lastStatusInput = e.target;
      showActionMenu(statusMenu, e.clientX, e.clientY);
    } else {
      statusMenu.classList.remove('show-menu');
    }

    if (e.target.parentElement.getAttribute('id') === "status-menu") {
      lastStatusInput.innerHTML = e.target.innerHTML;

      switch (e.target.getAttribute('id')) {
        case 'status-not-working':
          lastStatusInput.style = "color: var(--color-more-dark);";
          break;
        case 'status-working-on':
          lastStatusInput.style = "background: var(--color-status-blue); color: var(--color-white);";
          break;
        case 'status-completed':
          lastStatusInput.style = "background: var(--color-green); color: var(--color-white);";
          break;
        case 'status-waiting':
          lastStatusInput.style = "background: var(--color-status-orange); color: var(--color-white);";
          break;
        case 'status-stuck':
          lastStatusInput.style = "background: var(--color-red); color: var(--color-white);";
          break;
      }
    }

    contextMenu.className = '';
  });

  document.addEventListener('wheel', () => {
    contextMenu.className = '';
  });

  function showActionMenu(menu, posX, posY) {
    // Get the dimensions of the menu
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

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

    // Set the position of the menu
    menu.style.top = posY + 'px';
    menu.style.left = posX + 'px';
    menu.className = 'show-menu';
    document.activeElement.blur();
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
    const clonedGoal = goalTemplate.content.cloneNode(true);
    const semester = userTable.closest('[data-semester]');
    const dateTD = clonedGoal.querySelector('[type="date"]').parentElement;
    setCellData(dateTD, 1, null, semester);
    userTableBody.appendChild(clonedGoal);
  }

  function addBuildBlockFunc(userGoal) {
    const buildBlockTable = userGoal.nextElementSibling.querySelector('.building-block-table tbody');
    const buildBlockTemplate = document.getElementById('template-build-block');
    const clonedBuildBlock = buildBlockTemplate.content.cloneNode(true);
    const semester = userGoal.closest('[data-semester]');
    const dateTD = clonedBuildBlock.querySelector('[type="date"]').parentElement;
    setCellData(dateTD, 1, null, semester);
    buildBlockTable.appendChild(clonedBuildBlock);
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
    lastInputEdited = item.elem;
    currSemesterEdited = item.elem.closest('[data-semester]').getAttribute('data-semester');
    currUserTableEdited = item.elem.closest('[data-context="user-table"]').getAttribute('id');

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

    setTimeout(autoSaveData, AUTO_SAVE_DELAY);
  }
  //#endregion CONTEXT MENU AND TABLE ACTION FUNCTIONS

  //#region AUTO SAVE FUNCTIONS
  const AUTO_SAVE_DELAY = 1000; // 1 second
  const ALLOW_EDITS_DELAY = 30000; //30 seconds

  var inputTimeout, lastInputEdited;
  var dbUserTime, currUserTime;
  var dbSemesterEdited, currSemesterEdited;
  var dbUserTableEdited, currUserTableEdited;
  const saveStatusDiv = document.getElementById('autosave-status');

  onValue(ref(database, 'Save System/'), (snapshot) => {
    snapshot.forEach((uid) => {
      //Find out the recent changes made from each user from db,
      //disable input for tables the current user doesnt own that
      //are being worked on, and update tables with new data
      const currentTime = new Date().getTime();
      const timestamp = new Date(uid.child("timestamp").val()).getTime();
      const semesterEdited = uid.child("semester").val();
      const tableEdited = uid.child("table").val();

      //Used to update db later with what the current user is working on
      if (uid.key === auth.currentUser.uid) {
        dbUserTime = timestamp;
        dbSemesterEdited = semesterEdited;
        dbUserTableEdited = tableEdited;
      } else {
        //Disable the table that this uid is working on
        const table = document.querySelector(`[data-semester="${semesterEdited}"] [id="${tableEdited}"]`);
        const timeDiff = Math.abs(currentTime - timestamp);
        changeTableEditability(table, timeDiff);
      }
    });
  });

  var allowTableEditTimeout;
  function changeTableEditability(table, time) {
    //Get all needed elements
    const editSpan = table.querySelector('span');
    const editableElems = Array.from(table.querySelectorAll('[contenteditable]'));
    const inputElems = Array.from(table.querySelectorAll('input'));

    function changeElemsEditability(isEditable) {
      if (isEditable) {
        table.removeAttribute("style");
        editSpan.removeAttribute("style");

        editableElems.forEach((elem) => {
          elem.setAttribute("contenteditable", "plaintext-only");
        });
        inputElems.forEach((elem) => {
          elem.removeAttribute("disabled");
        });
      } else {
        table.style = "pointer-events: none";
        editSpan.style = "opacity: 1";

        editableElems.forEach((elem) => {
          elem.setAttribute("contenteditable", false);
        });
        inputElems.forEach((elem) => {
          elem.setAttribute("disabled", true);
        });
      }
    }

    //The current user is not allowed to edit the table this user is working on
    if (time < ALLOW_EDITS_DELAY) {
      //Change elements to not be editable
      changeElemsEditability(false);

      clearTimeout(allowTableEditTimeout);
      allowTableEditTimeout = setTimeout(() => {
        //Update the table with any new data
        const semesterLi = table.closest('[data-semester]');
        updateUserTable(semesterLi, dbAllSemesters, table);
        table.removeAttribute("style");
        editSpan.removeAttribute("style");
      }, Math.abs(time - ALLOW_EDITS_DELAY));
    } else {
      //Editing is allowed for this table
      changeElemsEditability(true);
    }
  }

  function updateUserTable(semesterLi, allSemestersData, table) {
    //First get the semester name / semester data
    const semesterName = semesterLi.getAttribute('data-semester').split(": ")[0];
    const semesterData = allSemestersData.child(semesterName);

    //Change table data for the specific table
    const uid = table.getAttribute("id").split("-table")[0];
    const tableData = semesterData.child("Tables").child(uid);

    var userTableDiv = semesterLi.querySelector(`[id="${uid}-table"]`);
    var userTableBody = userTableDiv.querySelector('tbody');

    //Delete everything from table body and reinsert
    userTableBody.replaceChildren();
    insertTableData(tableData, userTableBody, semesterLi);
  }

  document.addEventListener('input', (e) => {
    if (e.target.type !== "radio" && e.target.type !== "checkbox" 
      && !e.target.classList.contains('goal-focus-p') && !e.target.parentElement.classList.contains('login-field')) {
      lastInputEdited = e.target;

      //Get the current timestamp and semester
      currUserTime = new Date().getTime();
      currSemesterEdited = e.target.closest('[data-semester]').getAttribute('data-semester');
      currUserTableEdited = e.target.closest('[data-context="user-table"]').getAttribute('id');

      //Check if the currUserTime is > auto save delay of dbUserTime or semester changed
      if ((Math.abs(currUserTime - dbUserTime) > AUTO_SAVE_DELAY) ||
        currSemesterEdited !== dbSemesterEdited || dbUserTableEdited !== currUserTableEdited) {
        //Update database with new timestamp, semester, and user table worked on
        const saveUpdate = {};
        saveUpdate[`Save System/${auth.currentUser.uid}/timestamp`] = currUserTime;
        saveUpdate[`Save System/${auth.currentUser.uid}/semester`] = currSemesterEdited;
        saveUpdate[`Save System/${auth.currentUser.uid}/table`] = currUserTableEdited;
        update(ref(database), saveUpdate);
      }

      //Wait for auto save delay before saving any changes
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(autoSaveData, AUTO_SAVE_DELAY);
    } else if (e.target.classList.contains('goal-focus-p')) {
      //Handle goal focus update changes
      currSemesterEdited = e.target.closest('[data-semester]').getAttribute('data-semester');
      lastInputEdited = e.target;
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(autoSaveData, AUTO_SAVE_DELAY);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (e.target.className === "status-input") {
      lastInputEdited = e.target;
    }

    if (e.target.parentElement === statusMenu) {
      //Get the current timestamp and semester
      currUserTime = new Date().getTime();
      currSemesterEdited = lastInputEdited.closest('[data-semester]').getAttribute('data-semester');
      currUserTableEdited = lastInputEdited.closest('[data-context="user-table"]').getAttribute('id');

      //Check if the currUserTime is > auto save delay of dbUserTime or semester changed
      if ((Math.abs(currUserTime - dbUserTime) > AUTO_SAVE_DELAY) ||
        currSemesterEdited !== dbSemesterEdited || dbUserTableEdited !== currUserTableEdited) {
        //Update database with new timestamp, semester, and user table worked on
        const saveUpdate = {};
        saveUpdate[`Save System/${auth.currentUser.uid}/timestamp`] = currUserTime;
        saveUpdate[`Save System/${auth.currentUser.uid}/semester`] = currSemesterEdited;
        saveUpdate[`Save System/${auth.currentUser.uid}/table`] = currUserTableEdited;
        update(ref(database), saveUpdate);
      }

      //Wait for auto save delay before saving any changes
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(autoSaveData, AUTO_SAVE_DELAY);
    }
  });

  document.addEventListener('keydown', (e) => {
    //Update comments with author
    if (e.target.getAttribute('placeholder') === "Add a comment...") {
      //Make sure there isn't already an author on this comment
      const currAuthor = e.target.getAttribute('data-author');

      if (currAuthor === null || currAuthor === currUserName) {
        e.target.setAttribute('data-author', currUserName);
      } else {
        //Don't let people edit comments that aren't theirs
        e.preventDefault();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    //Update comments with author
    if (e.target.getAttribute('placeholder') === "Add a comment...") {
      //Remove author if input is empty
      if (e.target.textContent.trim() === "") {
        e.target.removeAttribute('data-author');
      }
    }
  });

  function autoSaveData() {
    //First update save status div
    saveStatusDiv.querySelector('p').textContent = "Saving...";
    saveStatusDiv.querySelector('i').className = "fas fa-spinner";

    if (!lastInputEdited.classList.contains('goal-focus-p')) {
      //Get all table data and then save it to database
      const table = document.querySelector(`[data-semester="${currSemesterEdited}"] [id="${currUserTableEdited}"]`);
      const tableBody = table.querySelector('tbody');
      var goalRowsList = []; var goalCellList = [];
      var buildBlockRowsList = []; var buildBlockCellList = []; var commentList = [];

      Array.from(tableBody.children).forEach((row) => {
        goalCellList = [];
        if (row.className === "view") {
          //Get goal values 
          goalCellList.push(row.children[1].textContent);
          goalCellList.push(row.children[2].firstChild.value);
          goalCellList.push(row.children[3].textContent);

          //Get build block values
          buildBlockRowsList = [];
          var buildBlockRow = row.nextElementSibling.querySelector('.building-block-table tbody');
          Array.from(buildBlockRow.children).forEach((blockRow) => {
            buildBlockCellList = [];
            buildBlockCellList.push(blockRow.children[0].textContent);
            buildBlockCellList.push(blockRow.children[1].firstChild.value);
            buildBlockCellList.push(blockRow.children[2].textContent);
            buildBlockRowsList.push(buildBlockCellList);
          });

          //Get comment values
          commentList = [];
          var commentRow = row.nextElementSibling.querySelector('.comment-table tbody');
          Array.from(commentRow.children).forEach((commentRow) => {
            if (commentRow.firstElementChild.textContent.trim() !== "") {
              commentList.push(`${commentRow.firstElementChild.textContent} - Made by ${commentRow.firstElementChild.getAttribute('data-author')}`);
            }
          });

          goalRowsList.push({ 0: goalCellList[0], 1: goalCellList[1], 2: goalCellList[2], BB: buildBlockRowsList, Comments: commentList });
        }
      });

      //Update the table in the database
      const semesterPath = currSemesterEdited.split(": ")[0];
      const userID = currUserTableEdited.split("-table")[0];

      const saveUpdate = {};
      saveUpdate[`Semesters/${semesterPath}/Tables/${userID}/Content`] = goalRowsList;
      saveUpdate[`Semesters/${semesterPath}/Tables/${userID}/Name`] = table.querySelector('h2').textContent;
      update(ref(database), saveUpdate).then(() => {
        showNotifToast("Changes Saved", "Your recent changes have been saved.", STATUS_COLOR.GREEN, true, 4);
        setTimeout(() => {
          saveStatusDiv.querySelector('p').textContent = "Up to Date";
          saveStatusDiv.querySelector('i').className = "fas fa-circle-check";
        }, 500);
      }).catch(() => {
        const message = "There was an issue saving your data. Please reload the page to get the most recent saved data."
        showNotifToast("Error Saving Data", message, STATUS_COLOR.RED, false);
        setTimeout(() => {
          saveStatusDiv.querySelector('p').textContent = "Error with Save";
          saveStatusDiv.querySelector('i').className = "fas fa-circle-exclamation";
        }, 500);
      });
    } else {
      //Get the goal focus changes and save to database
      const semesterPath = currSemesterEdited.split(": ")[0];
      const saveUpdate = {};
      saveUpdate[`Semesters/${semesterPath}/Focus`] = lastInputEdited.textContent;
      update(ref(database), saveUpdate).then(() => {
        showNotifToast("Changes Saved", "Your recent changes have been saved.", STATUS_COLOR.GREEN, true, 4);
        setTimeout(() => {
          saveStatusDiv.querySelector('p').textContent = "Up to Date";
          saveStatusDiv.querySelector('i').className = "fas fa-circle-check";
        }, 500);
      }).catch(() => {
        const message = "There was an issue saving your data. Please reload the page to get the most recent saved data."
        showNotifToast("Error Saving Data", message, STATUS_COLOR.RED, false);
        setTimeout(() => {
          saveStatusDiv.querySelector('p').textContent = "Error with Save";
          saveStatusDiv.querySelector('i').className = "fas fa-circle-exclamation";
        }, 500);
      });
    }
  }
  //#endregion AUTO SAVE FUNCTIONS
}