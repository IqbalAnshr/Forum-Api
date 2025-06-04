const InvariantError = require('../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedThread = require('../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(userId, newThread) {
    const { title, body } = newThread;
    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4) RETURNING id, title, body, owner',
      values: [id, title, body, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('thread gagal ditambahkan');
    }

    return new AddedThread(result.rows[0]);
  }

  async verifyIsThreadExist(threadId) {
    const query = 'SELECT * FROM threads WHERE id = $1';
    const result = await this._pool.query(query, [threadId]);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }
  }

  async getThreadById(threadId) {
    const query = `
            SELECT 
                threads.id,
                threads.title,
                threads.body,
                to_char(threads.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date,
                users.username
            FROM threads
            JOIN users ON users.id = threads.owner
            WHERE threads.id = $1
            `;

    const result = await this._pool.query(query, [threadId]);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    return result.rows[0];
  }
}

module.exports = ThreadRepositoryPostgres;
