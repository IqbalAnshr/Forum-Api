/* eslint-disable camelcase */
class DetailedReply {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, content, date, username, deleted_at,
    } = payload;

    this.id = id;
    this.content = deleted_at ? '**balasan telah dihapus**' : content;
    this.date = date;
    this.username = username;
  }

  _verifyPayload(payload) {
    if (!payload.id || !payload.content || !payload.date || !payload.username || !('deleted_at' in payload)) {
      throw new Error('DETAILED_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof payload.id !== 'string' || typeof payload.content !== 'string' || typeof payload.date !== 'string' || typeof payload.username !== 'string' || (payload.deleted_at !== null && typeof payload.deleted_at !== 'string')) {
      throw new Error('DETAILED_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailedReply;
