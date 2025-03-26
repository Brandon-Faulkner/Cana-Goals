const { onCall } = require("firebase-functions/v2/https");
const axios = require('axios').default;
const functions = require("firebase-functions");

const SLACK_MESSAGE_WEBHOOK = functions.config().slack.message_webhook;
const SLACK_STATUS_WEBHOOK = functions.config().slack.status_webhook;

// Called from the Cana Goals web app to send user goal changes to Slack
exports.sendSlackMessage = onCall(async (request) => {
    const message = request.data.message;

    if (!message) {
        throw new Error('Invalid argument: The function must be called with a message');
    }

    try {
        const response = await axios.post(SLACK_MESSAGE_WEBHOOK, { text: message });
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error sending message to Slack:", error);
        throw new Error('Internal error: Unable to send message to Slack.');
    }
});

// Called from the Cana Goals web app to send user status changes to Slack
exports.sendSlackUserStatus = onCall(async (request) => {
    const message = request.data.message;

    if (!message) {
        throw new Error('Invalid argument: The function must be called with a message');
    }

    try {
        const response = await axios.post(SLACK_STATUS_WEBHOOK, { text: message });
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Error sending status to Slack:", error);
        throw new Error('Internal error: Unable to send status to Slack.');
    }
});
