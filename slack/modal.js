// const openModal = async (client, trigger_id) => {
//     await client.views.open({
//       trigger_id,
//       view: {
//         type: 'modal',
//         callback_id: 'approval_request',
//         title: { type: 'plain_text', text: 'Request Approval' },
//         blocks: [
//           {
//             type: 'input',
//             block_id: 'approver_block',
//             element: {
//               type: 'users_select',
//               action_id: 'approver'
//             },
//             label: { type: 'plain_text', text: 'Select Approver' }
//           },
//           {
//             type: 'input',
//             block_id: 'approval_text_block',
//             element: {
//               type: 'plain_text_input',
//               multiline: true,
//               action_id: 'approval_text'
//             },
//             label: { type: 'plain_text', text: 'Approval Details' }
//           }
//         ],
//         submit: { type: 'plain_text', text: 'Submit' }
//       }
//     });
//   };
  
//   module.exports = { openModal };
  