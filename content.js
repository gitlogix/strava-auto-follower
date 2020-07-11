const {
    CREATE_SHADOWDOM,
    OPEN_POPUP,
    LETS_START_FOLLOWING,
    START_FOLLOWING,
    LETS_START_UNFOLLOWING,
    START_UNFOLLOWING,
    LETS_STOP,
    SHOW_PAGE_ACTION
} = require("./constants.json");

let shadowDOM = undefined;

chrome.runtime.sendMessage({reason: SHOW_PAGE_ACTION})
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.reason === CREATE_SHADOWDOM) {
        if (shadowDOM && shadowDOM.getElementById("strava-main-popup")) {
            let element = document.getElementById("shadow-host");
            element.parentNode.removeChild(element);
        }
        shadowDOM = createShadowDom();
    } else if (request.reason === OPEN_POPUP && shadowDOM) {
        if (!shadowDOM.getElementById("strava-main-popup")) {
            shadowDOM.innerHTML = CREATE_POPUP() + shadowDOM.innerHTML;
        } else {
            const stravaPopup = shadowDOM.getElementById('strava-main-popup');
            stravaPopup.style.display = stravaPopup.style.display === 'block' ? 'none' : 'block';
            if (stravaPopup.style.display === 'block') {
                $('#start-following', shadowDOM).click(function(e) {
                    const maxNumberOfPages = $('.strava-no-of-pages', shadowDOM).val()
                    chrome.runtime.sendMessage({reason: LETS_START_FOLLOWING, maxNumberOfPages: maxNumberOfPages}, resp => {
                        resp && startFollowing()
                    });
                })
                $('#start-unfollowing', shadowDOM).click(function(e) {
                    const maxNumberOfPages = $('.strava-no-of-pages', shadowDOM).val()
                    chrome.runtime.sendMessage({reason: LETS_START_UNFOLLOWING, maxNumberOfPages: maxNumberOfPages}, resp => {
                        resp && startUnfollowing()
                    });
                })
                handleCloseAction()
            }
        }
    } else if (request.reason === START_FOLLOWING) {
        startFollowing(true)
    } else if (request.reason === START_UNFOLLOWING) {
        startUnfollowing(true)
    }
})

function startFollowing(isSecond) {
    if  (window.location.href.includes("strava.com/athletes/search") ||
            (window.location.href.includes("www.strava.com/athletes/") &&
                (window.location.href.includes("type=following") ||
                    window.location.href.includes("type=followers") ||
                    window.location.href.includes("type=suggested")
            )
        )
    ) {
        if ($("[data-state='follow']").length ||
            $("[data-state='follow_with_approval']").length ||
            (isSecond && ($("[data-state='unfollow']").length ||
            $("[data-state='cancel_pending']").length) ||
            $("[data-state='unfollow_for_approval']").length)
        ) {
            $("[data-state='follow']").trigger('click')
            $("[data-state='follow_with_approval']").trigger('click')
            nextPage(true)
        } else {
            chrome.runtime.sendMessage({ reason: LETS_STOP });
            alert("Oops, We couldn't detect anyone to follow")
            !shadowDOM && location.reload()
        }
    } else {
        chrome.runtime.sendMessage({ reason: LETS_STOP });
        alert("Oops, Page doesn't exist")
        !shadowDOM && location.reload()
    }
}


function startUnfollowing(isSecond) {
    if  (window.location.href.includes("strava.com/athletes/search") ||
            (window.location.href.includes("www.strava.com/athletes/") &&
                (window.location.href.includes("type=following") ||
                    window.location.href.includes("type=followers") ||
                    window.location.href.includes("type=suggested")
            )
        )
    ) {
        if ($("[data-state='unfollow']").length ||
            $("[data-state='cancel_pending']").length ||
            $("[data-state='unfollow_for_approval']") ||
            (isSecond && ($("[data-state='follow']").length ||
            $("[data-state='follow_with_approval']").length))
        ) {
            $("[data-state='unfollow']").trigger('click')
            $("[data-state='cancel_pending']").trigger('click')
            $("[data-state='unfollow_for_approval']").trigger('click')
            nextPage()
        } else {
            chrome.runtime.sendMessage({ reason: LETS_STOP });
            alert("Oops, We couldn't detect anyone to unfollow")
            !shadowDOM && location.reload()
        }
    } else {
        chrome.runtime.sendMessage({ reason: LETS_STOP });
        alert("Oops, Page doesn't exist")
        !shadowDOM && location.reload()
    }
}

function nextPage(isFollowing) {
    const nextPageTimer = this.setInterval(() => {
        clearInterval(nextPageTimer)
        const nextPageNumber = $(".pagination .active").next().text()
        if (nextPageNumber && !isNaN(nextPageNumber)) {
            if (window.location.href.includes("type=following")) {
                let atheletsID = window.location.href.match(/athletes\/[0-9]*\/follows/)[0].substr(9)
                atheletsID = atheletsID.substr(0, atheletsID.length - 8)
                console.log(document.querySelector(".tab-content .drop-down-menu .options li").innerText)
                if (document.querySelector(".tab-content .drop-down-menu .options li").innerText === "I'm Following") {
                    window.open(`https://www.strava.com/athletes/${atheletsID}/follows?page=${nextPageNumber - 1}&type=following`, "_self")
                } else {
                    window.open(`https://www.strava.com/athletes/${atheletsID}/follows?page=${nextPageNumber}&type=following`, "_self")
                }
            } else if (window.location.href.includes("type=followers")) {
                let atheletsID = window.location.href.match(/athletes\/[0-9]*\/follows/)[0].substr(9)
                atheletsID = atheletsID.substr(0, atheletsID.length - 8)
                window.open(`https://www.strava.com/athletes/${atheletsID}/follows?page=${nextPageNumber}&type=followers`, "_self")
            } else if (window.location.href.includes("type=suggested")) {
                let atheletsID = window.location.href.match(/athletes\/[0-9]*\/follows/)[0].substr(9)
                atheletsID = atheletsID.substr(0, atheletsID.length - 8)
                window.open(`https://www.strava.com/athletes/${atheletsID}/follows?page=${nextPageNumber}&type=suggested`, "_self")
            } else if (window.location.href.includes("https://www.strava.com/athletes/search") && window.location.href.includes("&text=")) {
                let keyword = window.location.href.match(/text=([^&]*)+/)[0].substr(5)
                window.open(`https://www.strava.com/athletes/search?page=${nextPageNumber}&text=${keyword}&utf8=%E2%9C%93`, "_self")
            } else {
                window.open(`https://www.strava.com/athletes/search?page=${nextPageNumber}`, "_self")
            }  
        } else {
            chrome.runtime.sendMessage({ reason: LETS_STOP });
            location.reload()
        }
    }, 3000);
}

function createShadowDom() {
    let shadowHost = document.createElement("div");
    shadowHost.id = "shadow-host";
    document.body.appendChild(shadowHost);
    const style = document.createElement("style");
    let shadowDOM = shadowHost.attachShadow({ mode: 'closed' });
    shadowDOM.appendChild(style);
    shadowDOM.innerHTML = shadowDOMStyle;
    return shadowDOM;
}

function CREATE_POPUP() {
    return `
        <div id="strava-main-popup" class="strava-main-popup-container">
            <div class="strava-logo-block">
                <span class="strava-title">Strava Auto Follower</span>
                <div class="strava-close-block" id="strava-close-block">
                    X
                </div>
            </div>
            <div class="strava-body-block">
                <div class="strava-body" id="strava-body">
                    <div class="strava-submit-button">
                        <button id="start-following" class="btn-outline-secondary" type="button">
                            Start Following
                        </button>
                        <button id="start-unfollowing" class="btn-outline-secondary" type="button">
                            Start Unfollowing
                        </button>
                    </div>
                    <div class="strava-no-of-srapping-pages">
                        <label class="strava-no-of-pages-title">
                            Number of pages: 
                            <input type="number" class="strava-no-of-pages" min=1 max=99 value=3 />
                        </label>
                    </div>
                </div>
            </div>    
        </div>`;
}


function handleCloseAction() {
    $('#strava-close-block', shadowDOM).click(function() {
        shadowDOM.getElementById('strava-main-popup').style.display = 'none';
    })
}

//CSS 
const BP_BLUE = '#0985d3';
const BP_WHITE = '#feffff';
const BP_GREEN = '#96d35f';
const BP_GREY = '#e3e7e8';
const BP_ORANGE = 'rgb(252, 82, 0)';
const shadowDOMStyle = `
        <style>
        ::placeholder {
            color: ${BP_GREY};
            opacity: 1;
        }
        
        .strava-popup {
            position: fixed;
            background-color: rgb(250, 250, 250);
            z-index: 99999;
            width: 360px;
            height: 500px;
            overflow: visible;
            pointer-events: auto;
            border-radius: 10px;
            box-shadow: rgba(0, 0, 0, 0.3) 1px 5px 6px;
            box-sizing: content-box;
            border: solid 1px ${BP_GREY};
            right: 10px;
            top: 10px;
            padding: 12px;
        }
        
        .not-empty-container {
            height: 605px;
        }
        
        .strava-main-popup-container {
            display: none;
            width: 360px;
            background-color: ${BP_WHITE};
            z-index: 9999999999 !important;
            position: fixed;
            line-height: normal;
            border-radius: 10px;
            pointer-events: auto;
            box-shadow: rgba(0, 0, 0, 0.3) 3px 2px 6px;
            box-sizing: content-box;
            border: solid 2px ${BP_ORANGE};
            right: 10px;
            top: 10px;
        }
        
        .strava-logo-block  {
            display: flex;
            width: 340px;
            padding: 10px !important;
            margin-bottom: 0px !important;
            background-color: ${BP_ORANGE};
            position: fixed;
            border-radius: 6px !important;
            border: 0px !important;
            border-bottom-left-radius: 0px !important;
            border-bottom-right-radius: 0px !important;
            text-align: center;
        }

        .strava-title {
            color: white;
            font-family: cursive;
            font-weight: bold;
            font-size: 19px;
            margin: auto;
        }

        .strava-close-block {
            display: inline-block;
            position: absolute;
            top: 15px;
            right: 12px;
            cursor: pointer;
            font-size: 12px;
            font-family: cursive;
            font-weight: 1000;
            color: white;
        }

        .strava-close-block:hover {
            font-size: 11px;
        }

        .strava-logo-img {
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: left;
        }

        .strava-title-img {
            height: 30px;
            margin: auto;
        }

        .strava-body-block {
            margin-top: 47px;
            overflow-y: auto;
            height: 115px;
        }

        .strava-body {
            margin-top: 20px;
        }

        .strava-submit-button {
            display: flex;
            flex-direction: row;
        }

        .btn-outline-secondary {
            color: #ffffff;
            width: 140px;
            padding: 10px;
            border: 0px;
            margin: auto;
            border-radius: 25px;
            cursor: pointer;
            background-color: ${BP_ORANGE};
            font-family: cursive;
            font-size: 13px;
            font-weight: 600;
        }

        .btn-outline-secondary:hover {
            color: #ffffff;
            background-color: #e34a00;
        }

        .strava-no-of-srapping-pages {
            display: flex;
            flex-direction: row;
        }

        .strava-no-of-pages-title {
            margin: 14px auto;
            font-size: 14px;
            font-weight: 600;
        }

        .strava-no-of-pages {
            width: 40px;
            height: 20px;
            font-size: 16px;
            border-color: #fc5200;
            border-radius: 5px;
        }
    `