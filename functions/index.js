const { onCall } = require("firebase-functions/v2/https");
const axios = require('axios').default;
require('dotenv').config();

const SLACK_MESSAGE_WEBHOOK = process.env.SLACK_MESSAGE_WEBHOOK_KEY;
const SLACK_STATUS_WEBHOOK = process.env.SLACK_STATUS_WEBHOOK_KEY;

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
