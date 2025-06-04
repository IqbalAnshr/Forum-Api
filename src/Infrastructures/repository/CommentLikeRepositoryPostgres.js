const CommentLikeRepository = require('../../Domains/commentLikes/CommentLikeRepository');
const InvariantError = require('../../Commons/exceptions/InvariantError');

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addCommentLike(commentId, userId) {
    const id = `like-${this._idGenerator()}`;
    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3) RETURNING id, comment_id, user_id',
      values: [id, commentId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal menambahkan like pada komentar');
    }

    return result.rows[0];
  }

  async deleteCommentLike(commentId, userId) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING id',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal menghapus like dari komentar');
    }
  }

  async getCommentLike(commentId, userId) {
    const query = {
      text: 'SELECT id, comment_id, user_id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }
}

module.exports = CommentLikeRepositoryPostgres;
