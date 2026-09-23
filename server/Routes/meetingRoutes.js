import express from 'express'
import { protect } from '../Middleware/auth';
import { createMeeting, getMeeting, getMeetingStats, getSessionDetails, getUserSessions } from '../Controllers/meetingController';

const meetingRouter = express.Router();

meetingRouter.post('/', protect, createMeeting);
meetingRouter.get('/stats', protect, getMeetingStats);
meetingRouter.get('/sessions', protect, getUserSessions);
meetingRouter.get('/sessions:id', protect, getSessionDetails);
meetingRouter.get('/:meetingId', protect, getMeeting);

export default meetingRouter;
