const getTransport = require('./email/service-email');

const expiryMinutes = 30;

function sendPasscode(email, passcode, httpOrigin, redirect_to) {
    const hrefUrl = `${httpOrigin}/api/sessions/?passcode=${passcode}${redirect_to ? `&redirect_to=${redirect_to}` : ''}`;
    return getTransport().send({
        toAddress: email,
        subject: 'USDR Grants Tool Access Link',
        body: `<p>Your link to access USDR's Grants Tool is
     <a href="${hrefUrl}">${hrefUrl}</a>.
     It expires in ${expiryMinutes} minutes</p>`,
    });
}


function sendWelcomeEmail(email, httpOrigin) {
    return getTransport().send({
        toAddress: email,
        subject: 'Welcome to USDR Grants Tool',
        body: `<p>Visit USDR's Grants Tool at:
     <a href="${httpOrigin}">${httpOrigin}</a>.`,
    });
}

module.exports = { sendPasscode, sendWelcomeEmail };
