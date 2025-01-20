import express from 'express';
import { createNotification, getNotifications, updateNotificationStatus } from '../controllers/notificationController.js';

const router = express.Router();

// Route to create a new notification
router.post('/create', createNotification);

// Route to get notifications for a user or guest
router.get('/notifications', getNotifications);

// Route to update the notification status (read/unread)
router.put('/notifications/:notification_id', updateNotificationStatus);

export default router;
