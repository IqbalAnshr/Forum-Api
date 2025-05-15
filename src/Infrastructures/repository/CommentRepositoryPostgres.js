const InvariantError = require('../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(userId, threadId, comment) {
    const { content } = comment;

    const id = `comment-${this._idGenerator()}`; // generate unique id
    const query = 'INSERT INTO comments VALUES($1, $2, $3, $4) RETURNING id, content, thread, owner';
    const values = [id, content, threadId, userId];

    const result = await this._pool.query(query, values);

    if (!result.rowCount) {
      throw new InvariantError('komentar gagal ditambahkan');
    }

    return new AddedComment({ ...result.rows[0] });
  }

  async deleteComment(commentId) {
    const query = 'UPDATE comments SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id';
    const result = await this._pool.query(query, [commentId]);

    if (!result.rowCount) {
      throw new InvariantError('komentar gagal dihapus');
    }
  }

  async verifyIsCommentExist(commentId) {
    const query = 'SELECT * FROM comments WHERE id = $1';
    const result = await this._pool.query(query, [commentId]);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async verifyCommentOwner(commentId, userId) {
    const query = 'SELECT * FROM comments WHERE id = $1 AND owner = $2';
    const result = await this._pool.query(query, [commentId, userId]);

    if (!result.rowCount) {
      throw new AuthorizationError('anda tidak berhak melakukan aksi ini');
    }
  }

  async getCommentsByThreadId(threadId) {
    const query = `
        SELECT 
            comments.id, 
            users.username, 
            comments.content, 
            to_char(comments.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date, 
            to_char(comments.deleted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS deleted_at
        FROM comments
        JOIN users ON comments.owner = users.id
        WHERE comments.thread = $1
        ORDER BY comments.created_at ASC
      `;

    const result = await this._pool.query(query, [threadId]);
    return result.rows;
  }
}

module.exports = CommentRepositoryPostgres;
