/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentLikeTableTestHelper = {
  async addCommentLike({
    id = 'like-123',
    commentId = 'comment-123',
    userId = 'user-123',
    createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3, $4)',
      values: [id, commentId, userId, createdAt],
    };

    await pool.query(query);
  },

  async findCommentLikeById(id) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comment_likes WHERE 1=1');
  },

  async findCommentLikeByUserAndComment(userId, commentId) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
      values: [userId, commentId],
    };
    const result = await pool.query(query);
    return result.rows;
  },
};

module.exports = CommentLikeTableTestHelper;
