const functions = require("firebase-functions");
const axios = require('axios').default;

const SLACK_WEBHOOK = 'REDACTED';

//Called from the Cana Goals web app
exports.sendSlackMessage = functions.https.onCall(async (data, context) => {
    const message = data.message;

    if (!message) {
        throw new functions.https.HttpsError('invalid-argument', 'THe function must be called with a message text');
    }

    try {
        const response = await axios.post(SLACK_WEBHOOK, {
            text: message
        });
        return { success: true, data: response.data };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Unable to send message to Slack.', error);
    }
});