/* eslint-disable camelcase */
class DetailedComment {
  constructor(payload) {
    this._validate(payload);

    const {
      id, username, content, date, deleted_at, replies,
    } = payload;

    this.id = id;
    this.username = username;
    this.content = deleted_at ? '**komentar telah dihapus**' : content;
    this.date = date;
    this.replies = replies;
  }

  _validate(payload) {
    // Validasi keberadaan properti
    if (
      !payload.id
            || !payload.username
            || !payload.content
            || !payload.date
            || !('deleted_at' in payload)
            || !('replies' in payload)
    ) {
      throw new Error('DETAILED_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof payload.id !== 'string'
            || typeof payload.username !== 'string'
            || typeof payload.content !== 'string'
            || typeof payload.date !== 'string'
            || !Array.isArray(payload.replies)
            || (payload.deleted_at !== null
             && typeof payload.deleted_at !== 'string')
    ) {
      throw new Error('DETAILED_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailedComment;
