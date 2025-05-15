/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ReplyTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'a reply',
    commentId = 'comment-123',
    owner = 'user-123',
    date = new Date(),
    deletedAt = null,
  }) {
    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, commentId, owner, date, deletedAt],
    };

    await pool.query(query);
  },

  async findReplyById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findRepliesByCommentId(commentId) {
    const query = {
      text: 'SELECT * FROM replies WHERE comment = $1 ORDER BY created_at ASC',
      values: [commentId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findRepliesByOwner(owner) {
    const query = {
      text: 'SELECT * FROM replies WHERE owner = $1',
      values: [owner],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

module.exports = ReplyTableTestHelper;
