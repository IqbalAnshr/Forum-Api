const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const InvariantError = require('../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuhorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(commentId, userId, newReply) {
    const { content } = newReply;

    const id = `reply-${this._idGenerator()}`; // generate unique id
    const query = 'INSERT INTO replies VALUES($1, $2, $3, $4) RETURNING id, content, owner';
    const values = [id, content, commentId, userId];

    const result = await this._pool.query(query, values);

    if (!result.rowCount) {
      throw new InvariantError('balasan gagal ditambahkan');
    }

    return new AddedReply({ ...result.rows[0] });
  }

  async getRepliesByCommentIds(commentIds) {
    const query = `
      SELECT
        replies.id,
        replies.comment,
        users.username,
        replies.content,
        to_char(replies.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date,
        to_char(replies.deleted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS deleted_at
      FROM replies
      JOIN users ON replies.owner = users.id
      WHERE replies.comment = ANY($1::text[])
      ORDER BY replies.created_at ASC
    `;
    const result = await this._pool.query(query, [commentIds]);
    return result.rows;
  }

  async verifyIsReplyExist(replyId) {
    const query = 'SELECT * FROM replies WHERE id = $1';
    const result = await this._pool.query(query, [replyId]);

    if (!result.rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }
  }

  async verifyReplyOwner(replyId, userId) {
    const query = 'SELECT * FROM replies WHERE id = $1 AND owner = $2';
    const result = await this._pool.query(query, [replyId, userId]);

    if (!result.rowCount) {
      throw new AuhorizationError('anda tidak berhak melakukan aksi ini');
    }
  }

  async deleteReply(replyId) {
    const query = 'UPDATE replies SET deleted_at = now() WHERE id = $1 RETURNING id';
    const result = await this._pool.query(query, [replyId]);

    if (!result.rowCount) {
      throw new InvariantError('balasan gagal dihapus');
    }
  }
}

module.exports = ReplyRepositoryPostgres;
