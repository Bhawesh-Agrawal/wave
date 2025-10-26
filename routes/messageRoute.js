// routes/messageRoute.js
import express from 'express';
import { 
    sendMessage, 
    getMessages, 
    searchMessages, 
    reactToMessage, 
    deleteMessage, 
    uploadGroupMemory, 
    getGroupMemories,
    createJournalEntry,
    getJournalEntries
} from '../controllers/messageControllers.js';

const router = express.Router();

// MESSAGE ROUTES

/**
 * @route POST /api/messages
 * @desc Send a new message (group or direct)
 * @access Private (Auth token required)
 */
router.post('/', sendMessage);

/**
 * @route GET /api/messages?group_id=uuid OR ?user1=uuid&user2=uuid
 * @desc Get messages for a direct or group chat
 * @access Private
 */
router.get('/', getMessages);

/**
 * @route GET /api/messages/search?q=text&group_id=uuid OR ?q=text&user1=uuid&user2=uuid
 * @desc Search messages by content within a chat
 * @access Private
 */
router.get('/search', searchMessages);

/**
 * @route PUT /api/messages/:id/react
 * @desc Add or update reaction to a specific message
 * @access Private
 */
router.put('/:id/react', reactToMessage);

/**
 * @route DELETE /api/messages/:id
 * @desc Delete a specific message (user must be sender)
 * @access Private
 */
router.delete('/:id', deleteMessage);

// GROUP MEMORY ROUTES

/**
 * @route POST /api/messages/memories
 * @desc Upload a group memory (special message type)
 * @access Private
 */
router.post('/memories', uploadGroupMemory);

/**
 * @route GET /api/messages/memories/:group_id
 * @desc Get all memories for a group
 * @access Private
 */
router.get('/memories/:group_id', getGroupMemories);

// JOURNAL ROUTES (Uses the same messages table with 'journal' type)

/**
 * @route POST /api/messages/journal
 * @desc Create a personal or group journal entry
 * @access Private
 */
router.post('/journal', createJournalEntry);

/**
 * @route GET /api/messages/journal?group_id=uuid OR /api/messages/journal (for personal)
 * @desc Get journal entries (personal or group)
 * @access Private
 */
router.get('/journal', getJournalEntries);


export default router;