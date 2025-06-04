const DetailedComment = require('../DetailedComment');

describe('a DetailedComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      content: 'dicoding',
      replies: [],
    };

    // Action & Assert
    expect(() => new DetailedComment(payload)).toThrowError('DETAILED_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      content: 123,
      likeCount: 3,
      date: '2021-08-08T07:19:09.775Z',
      deleted_at: null,
      replies: '[]',
    };

    // Action & Assert
    expect(() => new DetailedComment(payload)).toThrowError('DETAILED_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailedComment entities correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      content: 'dicoding',
      likeCount: 3,
      date: '2021-08-08T07:19:09.775Z',
      deleted_at: null,
      replies: [],
    };

    // Action
    const {
      id, username, content, likeCount, date, replies,
    } = new DetailedComment(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(username).toEqual(payload.username);
    expect(content).toEqual(payload.content);
    expect(likeCount).toEqual(payload.likeCount);
    expect(date).toEqual(payload.date);
    expect(replies).toEqual(payload.replies);
  });

  it('should show deleted content when comment is deleted', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      content: 'original content',
      likeCount: 3,
      date: '2021-08-08T07:19:09.775Z',
      deleted_at: '2021-08-09T10:00:00.000Z',
      replies: [],
    };

    // Action
    const { content } = new DetailedComment(payload);

    // Assert
    expect(content).toEqual('**komentar telah dihapus**');
  });
});
