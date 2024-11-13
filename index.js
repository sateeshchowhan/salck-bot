const { App } = require('@slack/bolt');
require('dotenv').config();

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

// Slash command to open the approval request modal
app.command('/approval-test', async ({ command, ack, client }) => {
    await ack();

    try {
        // Open the modal to get approver and approval text
        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'approval_request_modal',
                title: {
                    type: 'plain_text',
                    text: 'Request Approval'
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'approver_block',
                        label: {
                            type: 'plain_text',
                            text: 'Select Approver'
                        },
                        element: {
                            type: 'users_select',
                            action_id: 'approver',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Choose an approver'
                            }
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'approval_text_block',
                        label: {
                            type: 'plain_text',
                            text: 'Approval Details'
                        },
                        element: {
                            type: 'plain_text_input',
                            action_id: 'approval_text',
                            multiline: true
                        }
                    }
                ],
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });
    } catch (error) {
        console.error('Error opening modal:', error);
    }
});

// Handle modal submission
app.view('approval_request_modal', async ({ ack, body, view, client }) => {
    await ack();

    const approverId = view.state.values.approver_block.approver.selected_user;
    const approvalText = view.state.values.approval_text_block.approval_text.value;
    const requesterId = body.user.id;

    try {
        // Send message to approver with approval options
        const result = await client.chat.postMessage({
            channel: approverId,
            text: `Approval Request:\n${approvalText}`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Approval Request from <@${requesterId}>:*\n${approvalText}`
                    }
                },
                {
                    type: 'actions',
                    block_id: 'approval_actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Approve'
                            },
                            style: 'primary',
                            action_id: 'approve_request',
                            value: requesterId
                        },
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Reject'
                            },
                            style: 'danger',
                            action_id: 'reject_request',
                            value: requesterId
                        }
                    ]
                }
            ]
        });

        console.log('Approval request sent to approver:', result.ts);
    } catch (error) {
        console.error('Error sending approval request:', error);
    }
});

// Handle approval or rejection actions
app.action({ block_id: 'approval_actions', action_id: /^(approve_request|reject_request)$/ }, async ({ ack, body, action, client }) => {
    await ack();

    const requesterId = action.value;
    const approverId = body.user.id;
    const decision = action.action_id === 'approve_request' ? 'approved' : 'rejected';

    try {
        // Notify requester of the decision
        await client.chat.postMessage({
            channel: requesterId,
            text: `Your request has been ${decision} by <@${approverId}>.`,
        });

        // Optionally update the approver's message
        await client.chat.update({
            channel: body.channel.id,
            ts: body.message.ts,
            text: `Request ${decision} by <@${approverId}>`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Request ${decision} by <@${approverId}>*`
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error sending decision notification:', error);
    }
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);
    console.log(`⚡️ Slack bot is running on port ${process.env.PORT || 3000}!`);
})();
