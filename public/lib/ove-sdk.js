OVE_SDK_CONFIGURED = false;

function _util_setGlobalParam(obj, field, required = false) {
    window[field] = window[field] || obj.get(field);

    if (required && !window[field]) {
        console.error(`No value provided for field = ${field}`)
    } else if (OVE_DEBUG) {
        console.log(`[OVE SDK] ${field} = ${window[field]}`)
    }
}

function autoconfig() {
    if (!OVE_SDK_CONFIGURED) {
        let params = new URL(document.location).searchParams;

        _util_setGlobalParam(params, 'OVE_DEBUG', false);
        _util_setGlobalParam(params, 'OVE_SPACE', true);
        _util_setGlobalParam(params, 'OVE_CORE', true);
        _util_setGlobalParam(params, 'OVE_APP_HTML', true);
        _util_setGlobalParam(params, 'OVE_APP_IMAGES', true);

        window.OVE_SDK_CONFIGURED = true;
    }
}

function observatory() {
    return region.bind(this)(0, 0, 30720, 4320);
}

function region(x, y, w, h) {
    autoconfig();

    return {
        regionBox: {x, y, w, h},
        background: _background,
        cleanSpace: _cleanSpace,
        html: _html,
        images: _images,
        delete: _delete
    };
}

function _html() {
    return _app.bind(this)(OVE_APP_HTML);
}

function _images() {
    return _app.bind(this)(OVE_APP_IMAGES);
}


function _app(appUrl = "") {
    _validateRegion.bind(this)();

    return {
        regionBox: this.regionBox,
        app: appUrl,
        create: _create,
        update: _update
    }
}

function _background(color = "White") {
    autoconfig();
    _validateRegion.bind(this)();

    return $.ajax({
        type: 'POST', url: `${OVE_CORE}/section`, data: JSON.stringify({
            "space": OVE_SPACE,
            "h": this.regionBox.h, "w": this.regionBox.w, "x": this.regionBox.x, "y": this.regionBox.y,
            "app": {
                "url": `${OVE_APP_HTML}`,
                "states": {
                    "load": {
                        "url": `${OVE_APP_HTML}/data/background/index.html?background=${params.color}`,
                        "launchDelay": 0
                    }
                }
            }
        }), contentType: 'application/json'
    })
}

function _cleanSpace() {
    autoconfig();
    _validateRegion.bind(this)();

    return $.ajax({url: `${OVE_CORE}/sections?space=${OVE_SPACE}`, type: 'DELETE'});
}

function _create(url = "") {
    _validateRegion.bind(this)();
    _validateApp.bind(this)();

    console.log("Creating section url =", url, " app =", this.app);

    return _ajax_post("/section", {
        "space": OVE_SPACE,
        "h": this.regionBox.h, "w": this.regionBox.w, "x": this.regionBox.x, "y": this.regionBox.y,
        "app": {"url": this.app, "states": {"load": {"url": url}}}
    });
}

function _update(url = "") {
    _validateRegion.bind(this)();
    _validateApp.bind(this)();

    return _query_sections(this.regionBox).done(function (sections) {
        sections.forEach(section => {
            _ajax_post(`/sections/${section}`, {"app": {"url": this.app, "states": {"load": {"url": url}}}})
        });
    });
}

function _delete() {
    _validateRegion.bind(this)();

    return _query_sections(this.regionBox).done(function (sections) {
        sections.forEach(section => {
            _ajax_delete(`/sections/${section}`)
        });
    });
}

// helper methods

function _validateRegion() {
    if (!this.regionBox) {
        console.error("Region is not defined. Have you called this function directly?")
    }
}

function _validateApp() {
    if (!this.app) {
        console.error("App is not defined. Have you called this function directly?")
    }
}

function _ajax_post(api, data) {
    autoconfig();

    if (OVE_DEBUG) {
        console.debug("Posting to", api, data)
    }

    return $.ajax({
        type: 'POST',
        url: `${OVE_CORE}${api}`,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json'
    });
}

function _ajax_delete(api, data) {
    autoconfig();

    if (OVE_DEBUG) {
        console.debug("Posting to", api, data)
    }

    return $.ajax({
        type: 'DELETE',
        url: `${OVE_CORE}${api}`,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json'
    });
}

function _ajax_get(api, data) {
    autoconfig();

    if (OVE_DEBUG) {
        console.debug("Getting from", api, data)
    }

    return $.ajax({
        type: 'GET',
        url: `${OVE_CORE}${api}`,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json'
    });
}

function _query_sections(box) {
    return _ajax_get("/sections", {"geometry": `${box.x},${box.y},${box.w},${box.h}`})
        .then(function (data) {
            return data.map(item => item.id);
        });
}