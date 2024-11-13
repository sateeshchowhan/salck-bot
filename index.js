// Import the App class from the @slack/bolt package to create and configure the Slack bot
const { App } = require('@slack/bolt');
require('dotenv').config(); // Load environment variables from a .env file

// Initialize the Slack bot with required tokens and settings
const app = new App({
    token: process.env.SLACK_BOT_TOKEN, // Token to authenticate the bot
    signingSecret: process.env.SLACK_SIGNING_SECRET, // Signing secret for request verification
    appToken: process.env.SLACK_APP_TOKEN, // App-level token for Socket Mode
    socketMode: true, // Enable Socket Mode to avoid needing a public URL
});

// Slash command to open the approval request modal
app.command('/approval-test', async ({ command, ack, client }) => {
    await ack(); // Acknowledge the command request to Slack immediately

    try {
        // Open a modal where the user can enter approval request details
        await client.views.open({
            trigger_id: command.trigger_id, // Trigger ID to open the modal in Slack
            view: {
                type: 'modal',
                callback_id: 'approval_request_modal', // Unique identifier for modal submission handling
                title: {
                    type: 'plain_text',
                    text: 'Request Approval' // Title of the modal
                },
                blocks: [
                    {
                        // Dropdown menu for selecting an approver from the Slack workspace users
                        type: 'input',
                        block_id: 'approver_block', // Unique block identifier
                        label: {
                            type: 'plain_text',
                            text: 'Select Approver' // Label displayed to the user
                        },
                        element: {
                            type: 'users_select', // Dropdown element for selecting a user
                            action_id: 'approver', // Unique action identifier for the dropdown
                            placeholder: {
                                type: 'plain_text',
                                text: 'Choose an approver'
                            }
                        }
                    },
                    {
                        // Text input for providing the details of the approval request
                        type: 'input',
                        block_id: 'approval_text_block', // Unique block identifier
                        label: {
                            type: 'plain_text',
                            text: 'Approval Details' // Label for the text area
                        },
                        element: {
                            type: 'plain_text_input', // Text input element
                            action_id: 'approval_text', // Unique action identifier for the text input
                            multiline: true // Allows multiple lines of text
                        }
                    }
                ],
                submit: {
                    type: 'plain_text',
                    text: 'Submit' // Label for the submit button
                }
            }
        });
    } catch (error) {
        console.error('Error opening modal:', error); // Log error if modal cannot be opened
    }
});

// Handle modal submission event
app.view('approval_request_modal', async ({ ack, body, view, client }) => {
    await ack(); // Acknowledge the modal submission

    // Extract approver ID and approval text inputted by the user in the modal
    const approverId = view.state.values.approver_block.approver.selected_user;
    const approvalText = view.state.values.approval_text_block.approval_text.value;
    const requesterId = body.user.id; // User ID of the requester

    try {
        // Send a message to the approver with the approval details and action buttons
        const result = await client.chat.postMessage({
            channel: approverId, // Channel set to approver's ID so they receive the message
            text: `Approval Request:\n${approvalText}`, // Fallback text if blocks are not displayed
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Approval Request from <@${requesterId}>:*\n${approvalText}` // Displays requester and approval text
                    }
                },
                {
                    type: 'actions',
                    block_id: 'approval_actions', // Block ID for actions (approve/reject buttons)
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Approve'
                            },
                            style: 'primary', // Button style for "Approve"
                            action_id: 'approve_request', // Action ID to identify approval button clicks
                            value: requesterId // Value holds requester ID to send notification later
                        },
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Reject'
                            },
                            style: 'danger', // Button style for "Reject"
                            action_id: 'reject_request', // Action ID to identify rejection button clicks
                            value: requesterId // Value holds requester ID to send notification later
                        }
                    ]
                }
            ]
        });

        console.log('Approval request sent to approver:', result.ts); // Log timestamp of the message sent to approver
    } catch (error) {
        console.error('Error sending approval request:', error); // Log error if message sending fails
    }
});

// Handle approval or rejection button actions
app.action({ block_id: 'approval_actions', action_id: /^(approve_request|reject_request)$/ }, async ({ ack, body, action, client }) => {
    await ack(); // Acknowledge the action (button click) to Slack

    // Determine who the requester and approver are
    const requesterId = action.value; // ID of the original requester (from button value)
    const approverId = body.user.id; // ID of the approver (user who clicked the button)
    const decision = action.action_id === 'approve_request' ? 'approved' : 'rejected'; // Determine if action was approval or rejection

    try {
        // Notify the requester of the decision made by the approver
        await client.chat.postMessage({
            channel: requesterId, // Channel set to requester ID so they receive the notification
            text: `Your request has been ${decision} by <@${approverId}>.`, // Notification text showing the approver's decision
        });

        // Optionally, update the original message in approver's chat with the decision
        await client.chat.update({
            channel: body.channel.id, // Channel where the approver clicked the button
            ts: body.message.ts, // Timestamp of the original message to update it
            text: `Request ${decision} by <@${approverId}>`, // Update text to reflect the decision
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Request ${decision} by <@${approverId}>*` // Display decision message in markdown format
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error sending decision notification:', error); // Log error if notification fails
    }
});

// Start the Slack app (bot) on the specified port, or default to port 3000
(async () => {
    await app.start(process.env.PORT || 3000);
    console.log(`⚡️ Slack bot is running on port ${process.env.PORT || 3000}!`); // Log that the bot is running
})();
