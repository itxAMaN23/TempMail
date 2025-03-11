import express from 'express';
import { generateEmail, fetchInbox, getMessageById, markMessageAsRead, deleteMessage, viewAttachments } from '../controllers/mailController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        "status": "success",
        "message": "API is working"
    })
})

router.get('/generate', generateEmail);
router.get('/messages', fetchInbox);
router.get('/messages/:id', getMessageById);
router.patch('/messages/:id/read', markMessageAsRead);
router.delete('/messages/:id', deleteMessage);
router.get('/messages/:id/attachment/:attachmentId', viewAttachments);

export default router;