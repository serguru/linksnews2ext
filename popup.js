//let siteUrl = "https://localhost:44397/";
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
let pages = [];
let rows = [];
let column;

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
}

function showAddLinkMessage(message, error) {
    $addLinkMessage.html(message);
    if (error) {
        $addLinkMessage.css("color", "red");
    } else {
        $addLinkMessage.css("color", "");
    }
    $addLinkMessage.show();
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

function showAddLinkForm(data) {
    pages = data;

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

function populateColumnsSelect() {
    let rowId = $rowSelect[0].value;
    let columns = [];

    if (rowId) {

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].id == rowId) {
                columns = rows[i].columns;
                break;
            }
        }
    }

    $columnSelect.find("option").remove();

    columns.forEach(function (x) {
        let option = new Option(x.name || "No name column", x.id);
        $columnSelect.append($(option));
    });
}

function populateRowsSelect() {
    let pageId = $pageSelect[0].value;
    rows = [];
    if (pageId) {
        for (let i = 0; i < pages.length; i++) {
            if (pages[i].id == pageId) {
                rows = pages[i].rows;
                break;
            }
        }
    }

    $rowSelect.find("option").remove();

    rows.forEach(function (x) {
        let option = new Option(x.name || "No name row", x.id);
        $rowSelect.append($(option));
    });
    onRowsSelectChange();
}

function onPagesSelectChange() {
    populateRowsSelect();
}

function onRowsSelectChange() {
    populateColumnsSelect();
}

function populatePagesSelect() {
    pages.forEach(function (x) {
        let option = new Option(x.name, x.id);
        $pageSelect.append($(option));
    });
    onPagesSelectChange();
}


function getMyPages() {

    $.get(siteUrl + "account")
        .done(function (response) {

            if (response.pages.length === 0) {
                showGeneralMessage("You have no pages to add a link to", true);
                return;
            }

            showAddLinkForm(response.pages);
        })
        .fail(function (response) {
            if (response.status === 401) {
                showLoginForm();
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

    $.ajaxSetup({
        headers: { login: localStorage.getItem("login") }
    });

    getMyPages();
}

function addLink() {

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

    let data = JSON.stringify({
        pageId: $pageSelect[0].value,
        columnId: $columnSelect[0].value,
        title: linkName,
        href: linkAddress
    });

    $.post(siteUrl + "pages/addLink/", data)
        .done(function (response) {

            if (response.error) {
                showAddLinkMessage(response.message, true);
                return;
            }

            showGeneralMessage("Link has been added");

            setTimeout(function () {
                window.close();
            }, 2000);
        })
        .fail(function (response) {
            showAddLinkMessage('Error. Failed adding a link.', true);
        })
        .always(function () {

        });
}

$(document).ready(function () {

    $.ajaxSetup({
        contentType: "application/json; charset=utf-8",
        headers: { login: localStorage.getItem("login") }
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

    $("#loginBtn").on("click", function () {
        login();
    });

    $("#addLinkBtn").on("click", function () {
        addLink();
    });

    getMyPages();
})
