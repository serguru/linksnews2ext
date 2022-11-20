//let siteUrl = "https://localhost:7055/";
let siteUrl = "https://linksnews2api.azurewebsites.net/";

let $loginForm;
let $loginInput;
let $passwordInput;
let $addLinkForm;
let $loginError;
let $addLinkMessage;
let $generalMessageDiv;
let $pageSelect;
let $columnSelect;
let $linkNameInput;
let $linkAddressInput;
let account;
let pages;
let page;
let rows;
let row;
let columns;
let column;

function resetAll() {
    account = undefined;
    pages = undefined;
    page = undefined;
    rows = undefined;
    row = undefined;
    columns = undefined;
    column = undefined;
}

function showGeneralMessage(message, error) {
    $loginForm.hide();
    $addLinkForm.hide();
    $generalMessageDiv.show();

    if (error) {
        $generalMessageDiv.css("color", "red");
    } else {
        $generalMessageDiv.css("color", "");
    }

    $generalMessageDiv.html(message);
}

function showLoginError(message) {
    $loginError.html(message);
    $loginError.show();
    setTimeout(function () {
        $loginError.html("");
    }, 5000);
}

function showAddLinkMessage(message, error) {
    $addLinkMessage.html(message);
    if (error) {
        $addLinkMessage.css("color", "red");
    } else {
        $addLinkMessage.css("color", "");
    }
    $addLinkMessage.show();
    setTimeout(function () {
        $addLinkMessage.html("");
    }, 5000);

}

function showLoading() {
    $loginForm.hide();
    $addLinkForm.hide();
    $generalMessageDiv.show();
    $generalMessageDiv.css("color", "");
    $generalMessageDiv.html("Loading...");
}

function showLoginForm() {
    $generalMessageDiv.hide();
    $addLinkForm.hide();
    $loginError.hide();
    $loginForm.show();
}

function showAddLinkForm() {
    pages = account.pages;

    $loginForm.hide();
    $generalMessageDiv.hide();
    populatePagesSelect();

    chrome.tabs.query({ active: true }, function (tab) {
        if (tab.length === 0) {
            return;
        }
        $linkNameInput.val(tab[0].title);
        $linkAddressInput.val(tab[0].url);
    });

    $addLinkForm.show();
}

function onPagesSelectChange() {
    rows = undefined;
    row = undefined;
    columns = undefined;
    column = undefined;
    $rowSelect.find("option").remove();
    $columnSelect.find("option").remove();
    if (!pages || pages.length === 0) {
        showGeneralMessage("Pages not found or empty", true);
        return;
    }
    page = pages.find(x => x.id === $pageSelect[0].value);
    if (!page) {
        showGeneralMessage("Page not found", true);
        return;
    }
    localStorage.setItem("savedPageId", page.id);
    if (!page.rows || page.rows.length === 0) {
        return;
    }
    rows = page.rows;
    const savedRowId = localStorage.getItem("savedRowId");
    rows.forEach(function (x) {
        let option = new Option(x.name || "No name row", x.id);
        option.selected = x.id === savedRowId;
        $rowSelect.append($(option));
    });
    onRowsSelectChange();
}

function onRowsSelectChange() {
    columns = undefined;
    column = undefined;
    $columnSelect.find("option").remove();
    if (!rows || rows.length === 0) {
        return;
    }
    row = rows.find(x => x.id === $rowSelect[0].value)
    if (!row) {
        showGeneralMessage("Row not found", true);
        return;
    }
    localStorage.setItem("savedRowId", row.id);
    if (!row.columns || row.columns.length === 0) {
        return;
    }
    columns = row.columns;
    const savedColumnId = localStorage.getItem("savedColumnId");

    columns.forEach(function (x) {
        let option = new Option(x.name || "No name column", x.id);
        option.selected = x.id === savedColumnId;
        $columnSelect.append($(option));
    });
    onColumnsSelectChange();
}

function onColumnsSelectChange() {
    column = undefined;
    if (!columns || columns.length === 0) {
        return;
    }
    column = columns.find(x => x.id === $columnSelect[0].value)
    if (!column) {
        showGeneralMessage("Column not found", true);
        return;
    }
    localStorage.setItem("savedColumnId", column.id);
}


function populatePagesSelect() {
    const savedPageId = localStorage.getItem("savedPageId");
    pages.forEach(function (x) {
        const option = new Option(x.name, x.id);
        option.selected = x.id === savedPageId;
        $pageSelect.append($(option));
    });

    onPagesSelectChange();
}


function getMyPages() {

    if (!isLoggedIn()) {
        showLoginForm();
        return;
    }

    $.ajaxSetup({
        headers: { login: localStorage.getItem("login") }
    });

    resetAll();

    $.get(siteUrl + "account")
        .done(function (response) {

            if (response?.pages.length === 0) {
                showGeneralMessage("You have no pages to add a link to", true);
                return;
            }

            account = response;
            showAddLinkForm();
        })
        .fail(function (response) {
            if (response.status === 401) {
                localStorage.removeItem("login");
                showLoginForm();
                showLoginError("Wrong login name or password");
                return;
            }
            showGeneralMessage('Error. Failed retrieving pages list.', true);
        })
        .always(function () {

        });
}



function login() {

    let name = $loginInput[0].value;
    let password = $passwordInput[0].value;

    if (!name || !password) {
        showLoginError("Name and Password are both required");
        return;
    }

    let data = JSON.stringify({
        name: name,
        password: password
    });

    localStorage.setItem("login", data);

    getMyPages();
}

function addLink() {

    if (!isLoggedIn()) {
        showLoginForm();
        return;
    }

    $.ajaxSetup({
        headers: { login: localStorage.getItem("login") }
    });


    if (!column?.links) {
        showAddLinkMessage('No column or column links to add a link to', true);
        return;
    }

    let linkName = $linkNameInput[0].value;
    let linkAddress = $linkAddressInput[0].value;

    if (!linkName || !linkAddress) {
        showAddLinkMessage("Link Name and Link Address are both required", true);
        return;
    }

    if (linkName.length > 100) {
        showAddLinkMessage("Link Name cannot be longer than 100 characters", true);
        return;
    }

    column.links.push(
        {
            id: '',
            name: linkName,
            url: linkAddress
        }
    )

    $.ajax({
        url: siteUrl + "account",
        type: 'PUT',
        data: JSON.stringify(account),
        success: function () {
            showGeneralMessage("Link has been added");

            setTimeout(function () {
                window.close();
            }, 2000);
        },
        error: function (error) {
            showAddLinkMessage('Error. Failed adding a link.', true);
        }
    });
}

const isLoggedIn = () => {
    try {
        const item = JSON.parse(localStorage.getItem("login"));
        const result = item && item.name && item.password;
        return !!(result);
    } catch (e) {
        localStorage.removeItem("login");
        return false;
    }
}


$(document).ready(function () {

    $.ajaxSetup({
        contentType: "application/json",
    });

    $generalMessageDiv = $("#generalMessageDiv");
    $loginForm = $("#loginForm");
    $loginInput = $("#loginInput");
    $passwordInput = $("#passwordInput");
    $addLinkForm = $("#addLinkForm");
    $linkNameInput = $("#linkNameInput");
    $linkAddressInput = $("#linkAddressInput");
    $loginError = $("#loginError");
    $addLinkMessage = $("#addLinkMessage");
    $pageSelect = $("#pageSelect");
    $columnSelect = $("#columnSelect");
    $rowSelect = $("#rowSelect");

    $pageSelect.on("change", function (e) {
        onPagesSelectChange();
    });

    $rowSelect.on("change", function (e) {
        onRowsSelectChange();
    });

    $columnSelect.on("change", function (e) {
        onColumnsSelectChange();
    });

    $("#loginBtn").on("click", function () {
        login();
    });

    $("#addLinkBtn").on("click", function () {
        addLink();
    });

    getMyPages();
})
