const functions = require("firebase-functions");
const axios = require('axios').default;

const SLACK_MESSAGE_WEBHOOK = 'REDACTED';
const SLACK_STATUS_WEBHOOK = 'REDACTED';

//Called from the Cana Goals web app to send user goal changes to Slack
exports.sendSlackMessage = functions.https.onCall(async (data, context) => {
    const message = data.message;

    if (!message) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a message');
    }

    try {
        const response = await axios.post(SLACK_MESSAGE_WEBHOOK, {
            text: message
        });
        return { success: true, data: response.data };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Unable to send message to Slack.', error);
    }
});

//Called from the Cana Goals web app to send user status changes to Slack
exports.sendSlackUserStatus = functions.https.onCall(async (data, context) => {
    const message = data.message;

    if (!message) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a message');
    }

    try {
        const response = await axios.post(SLACK_STATUS_WEBHOOK, {
            text: message
        });
        return { success: true, data: response.data };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Unable to send message to Slack.', error);
    }
});