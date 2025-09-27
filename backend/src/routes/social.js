const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const Friend = require('../models/Friend');
const Group = require('../models/Group');
const Post = require('../models/Post');
const Message = require('../models/Message');

const router = express.Router();

// Validation schemas
const friendRequestSchema = Joi.object({
  targetUserId: Joi.number().required()
});

const groupCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).required(),
  icon: Joi.string().length(1).required()
});

const postCreateSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  image: Joi.string().uri().optional(),
  type: Joi.string().valid('status', 'achievement', 'trip', 'photo').default('status')
});

const messageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  type: Joi.string().valid('text', 'image', 'location').default('text')
});

// Friend routes
router.post('/friends/request', authenticateToken, async (req, res) => {
  try {
    const { error, value } = friendRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const result = await Friend.sendFriendRequest(req.user.id, value.targetUserId);
    res.json({
      success: true,
      message: 'Friend request sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request'
    });
  }
});

router.get('/friends/requests', authenticateToken, async (req, res) => {
  try {
    const requests = await Friend.getFriendRequests(req.user.id);
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friend requests'
    });
  }
});

router.post('/friends/accept/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await Friend.acceptFriendRequest(parseInt(requestId), req.user.id);
    res.json({
      success: true,
      message: 'Friend request accepted',
      data: result
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept friend request'
    });
  }
});

router.post('/friends/reject/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await Friend.rejectFriendRequest(parseInt(requestId), req.user.id);
    res.json({
      success: true,
      message: 'Friend request rejected',
      data: result
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject friend request'
    });
  }
});

router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const result = await Friend.removeFriend(req.user.id, parseInt(friendId));
    res.json({
      success: true,
      message: 'Friend removed successfully',
      data: result
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove friend'
    });
  }
});

router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user.id);
    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get friends'
    });
  }
});

// Group routes
router.post('/groups', authenticateToken, async (req, res) => {
  try {
    const { error, value } = groupCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const groupData = {
      ...value,
      createdBy: req.user.id
    };

    const group = await Group.create(groupData);
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

router.get('/groups', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.getUserGroups(req.user.id);
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get groups'
    });
  }
});

router.get('/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.getById(parseInt(groupId));

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group'
    });
  }
});

router.post('/groups/:groupId/join', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    await Group.addMember(parseInt(groupId), req.user.id, 'member');
    res.json({
      success: true,
      message: 'Joined group successfully'
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group'
    });
  }
});

router.delete('/groups/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await Group.removeMember(parseInt(groupId), req.user.id);
    if (result) {
      res.json({
        success: true,
        message: 'Left group successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Group membership not found'
      });
    }
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group'
    });
  }
});

// Post routes
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { error, value } = postCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const postData = {
      ...value,
      authorId: req.user.id
    };

    const post = await Post.create(postData);
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

router.get('/posts/feed', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const posts = await Post.getFeed(req.user.id, parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feed'
    });
  }
});

router.get('/posts/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const posts = await Post.getByUserId(parseInt(userId), parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user posts'
    });
  }
});

router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await Post.toggleLike(parseInt(postId), req.user.id);
    res.json({
      success: true,
      message: result.liked ? 'Post liked' : 'Post unliked',
      data: result
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
});

router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const comment = await Post.addComment(parseInt(postId), req.user.id, content.trim());
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

router.get('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const comments = await Post.getComments(parseInt(postId), parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments'
    });
  }
});

// Message routes
router.post('/messages/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const message = await Message.sendGroupMessage(
      parseInt(groupId),
      req.user.id,
      value.content,
      value.type
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

router.post('/messages/direct/:recipientId', authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const message = await Message.sendDirectMessage(
      req.user.id,
      parseInt(recipientId),
      value.content,
      value.type
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

router.get('/messages/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const messages = await Message.getGroupMessages(parseInt(groupId), parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

router.get('/messages/direct/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const messages = await Message.getDirectMessages(req.user.id, parseInt(userId), parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const conversations = await Message.getRecentConversations(req.user.id, parseInt(limit));
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
});

module.exports = router;
