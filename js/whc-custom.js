/* Variables */
const Time = Math.floor(Date.now() / 1000);
const Form = document.querySelector(document.currentScript.getAttribute('formid'));
const FormButton = Form.querySelector("button");
const {
    verifiedText, /* Button text after verification */
    loading, /* look for loading percent in WW message */
    verifiedClass,
} = FormButton.attributes;



/* From the original script */
// Cross-Browser & Cross-Domain Web Worker
const createWorker = (workerUrl) => {
    var worker = null;
    try {
        var blob;
        try {
            blob = new Blob(["importScripts('" + workerUrl + "');"], { "type": 'application/javascript' });
        } catch (e) {
            var blobBuilder = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
            blobBuilder.append("importScripts('" + workerUrl + "');");
            blob = blobBuilder.getBlob('application/javascript');
        }
        var url = window.URL || window.webkitURL;
        var blobUrl = url.createObjectURL(blob);
        worker = new Worker(blobUrl);
    } catch (e1) {
        //if it still fails, there is nothing much we can do
    }
    return worker;
};



// Functions
const getQuestion = () => {
    var verifiedText = FormButton.getAttribute('verified');

    if (sessionStorage.getItem('verified')) {
        FormButton.disabled = false;
        FormButton.innerHTML = verifiedText;

        console.log('skipped verification');

        return
    }
    var difficulty = FormButton.getAttribute("difficulty");
    if (difficulty === null || difficulty === "") {
        difficulty = 5;
    }
    sendRequest("https://wehatecaptchas.com/api.php", {
        "endpoint": "question"
    })
        .then(function (data) {

            worker.postMessage({
                "question": data.data.question,
                "Time": Time,
                "difficulty": difficulty
            });

            FormButton.disabled = true;

        })
}

function verificationInput(verification) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', 'captcha_verification');
    input.setAttribute('value', JSON.stringify(verification));
    return input;
}

const sendRequest = async (url, parameters) => {

    var formData = new FormData();

    for (key in parameters) {
        formData.append(key, parameters[key]);
    }

    let response = await fetch(url, {
        method: "POST",
        body: formData
    });

    let data = await response.json();

    return data;

};

// Load in web worker
const worker = createWorker("https://wehatecaptchas.com/load.php?name=captcha-worker.js");

Form.insertAdjacentHTML("beforeend", (`
    <a href="https://wehatecaptchas.com" target="_blank" rel="noreferrer" id="_branding">we<b>hate</b>captchas</a>
`));

worker.addEventListener("message", function (e) {

    const { action, verification, message } = e.data;

    if (action === "captchaSuccess") {

        Form.appendChild(verificationInput(verification));
        document.querySelector("#_branding").remove();
        FormButton.classList.add("verified");
        console.log(message);
        var buttonText = FormButton.getAttribute("text");
        var verifiedText = FormButton.getAttribute('verified');

        if (verifiedText === null || verifiedText === '') {
            FormButton.innerHTML = buttonText;
        } else {
            FormButton.innerHTML = verifiedText;
        }

        FormButton.disabled = false;

        sessionStorage.setItem('verified', true)

        return

    } else {
        console.log('verifying -> percent done: ' + message.match(/(?<=value=")\d*(?=")/gi));
        return
    }

}, false);

document.addEventListener('DOMContentLoaded', getQuestion);