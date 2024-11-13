// const handleInteraction = async (req, res, client) => {
//     const payload = JSON.parse(req.body.payload);
  
//     if (payload.type === 'view_submission') {
//       const approver = payload.view.state.values.approver_block.approver.selected_user;
//       const approvalText = payload.view.state.values.approval_text_block.approval_text.value;
  
//       await client.chat.postMessage({
//         channel: approver,
//         text: `Approval Request:\n${approvalText}`,
//         blocks: [
//           { type: 'section', text: { type: 'mrkdwn', text: `Approval Request:\n${approvalText}` } },
//           {
//             type: 'actions',
//             block_id: 'approval_actions',
//             elements: [
//               {
//                 type: 'button',
//                 text: { type: 'plain_text', text: 'Approve' },
//                 action_id: 'approve'
//               },
//               {
//                 type: 'button',
//                 text: { type: 'plain_text', text: 'Reject' },
//                 action_id: 'reject'
//               }
//             ]
//           }
//         ]
//       });
  
//       res.status(200).json({ response_action: 'clear' });
//     } else if (payload.type === 'block_actions') {
//       const action = payload.actions[0].action_id;
//       const requester = payload.user.id;
//       const response = action === 'approve' ? 'Approved' : 'Rejected';
  
//       await client.chat.postMessage({
//         channel: requester,
//         text: `Your request has been ${response}.`
//       });
  
//       res.status(200).send();
//     }
//   };
  
//   module.exports = { handleInteraction };
  