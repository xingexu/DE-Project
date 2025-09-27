const { pool } = require('../config/database');

class Group {
  // Create a new group
  static async create(groupData) {
    const { name, description, icon, createdBy } = groupData;

    const query = `
      INSERT INTO groups (name, description, icon, created_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, icon, createdBy]);

    const group = result.rows[0];

    // Add creator as admin member
    await this.addMember(group.id, createdBy, 'admin');

    return group;
  }

  // Get all groups for a user (groups they're a member of)
  static async getUserGroups(userId) {
    const query = `
      SELECT g.*,
             gm.role,
             gm.joined_at,
             u.name as created_by_name,
             u.avatar as created_by_avatar,
             COUNT(gm2.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id
      WHERE gm.user_id = $1
      GROUP BY g.id, gm.role, gm.joined_at, u.name, u.avatar
      ORDER BY g.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get group details with members
  static async getById(groupId) {
    const groupQuery = `
      SELECT g.*,
             u.name as created_by_name,
             u.avatar as created_by_avatar
      FROM groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.id = $1
    `;
    const groupResult = await pool.query(groupQuery, [groupId]);

    if (groupResult.rows.length === 0) {
      return null;
    }

    const group = groupResult.rows[0];

    // Get members
    const membersQuery = `
      SELECT gm.*, u.name, u.avatar, u.email
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.role, gm.joined_at
    `;
    const membersResult = await pool.query(membersQuery, [groupId]);
    group.members = membersResult.rows;

    return group;
  }

  // Add member to group
  static async addMember(groupId, userId, role = 'member') {
    const query = `
      INSERT INTO group_members (group_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (group_id, user_id) DO UPDATE SET role = $3
      RETURNING *
    `;
    const result = await pool.query(query, [groupId, userId, role]);
    return result.rows[0];
  }

  // Remove member from group
  static async removeMember(groupId, userId) {
    const query = `
      DELETE FROM group_members
      WHERE group_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [groupId, userId]);
    return result.rowCount > 0;
  }

  // Update member role
  static async updateMemberRole(groupId, userId, role) {
    const query = `
      UPDATE group_members
      SET role = $3, updated_at = NOW()
      WHERE group_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [groupId, userId, role]);
    return result.rowCount > 0;
  }

  // Get groups by search term
  static async searchGroups(searchTerm, userId) {
    const query = `
      SELECT g.*,
             CASE WHEN gm.user_id IS NOT NULL THEN true ELSE false END as is_member,
             gm.role
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $2
      WHERE g.name ILIKE $1 OR g.description ILIKE $1
      ORDER BY g.created_at DESC
      LIMIT 20
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, userId]);
    return result.rows;
  }

  // Delete group (only by creator or admin)
  static async deleteGroup(groupId, userId) {
    // Check if user is admin or creator
    const checkQuery = `
      SELECT g.created_by, gm.role
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $2
      WHERE g.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [groupId, userId]);

    if (checkResult.rows.length === 0) {
      throw new Error('Group not found');
    }

    const { created_by, role } = checkResult.rows[0];

    if (created_by !== userId && role !== 'admin') {
      throw new Error('Only group creator or admin can delete the group');
    }

    // Delete group (cascade will handle members and messages)
    const query = 'DELETE FROM groups WHERE id = $1';
    const result = await pool.query(query, [groupId]);

    return result.rowCount > 0;
  }

  // Get recent groups activity
  static async getRecentActivity(limit = 10) {
    const query = `
      SELECT g.*, u.name as created_by_name
      FROM groups g
      JOIN users u ON g.created_by = u.id
      ORDER BY g.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

module.exports = Group;
