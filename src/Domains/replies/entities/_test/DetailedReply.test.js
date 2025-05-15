const DetailedReply = require('../DetailedReply');

describe('a DetailedReply entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'reply content',
      date: '2021-08-08T07:19:09.775Z',
      // username: 'dicoding',
    };

    // Action and Assert
    expect(() => new DetailedReply(payload)).toThrowError('DETAILED_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: true,
      date: '2021-08-08T07:19:09.775Z',
      username: 123,
      deleted_at: '2021-08-08T07:19:09.775Z',
    };

    // Action and Assert
    expect(() => new DetailedReply(payload)).toThrowError('DETAILED_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailedReply object correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'reply content',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      deleted_at: null,
    };

    // Action
    const detailedReply = new DetailedReply(payload);

    // Assert
    expect(detailedReply).toBeInstanceOf(DetailedReply);
    expect(detailedReply.id).toEqual(payload.id);
    expect(detailedReply.content).toEqual(payload.content);
    expect(detailedReply.date).toEqual(payload.date);
    expect(detailedReply.username).toEqual(payload.username);
  });

  it('should create DetailedReply object with deleted content correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'reply content',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      deleted_at: '2021-08-08T07:19:09.775Z',
    };

    // Action
    const detailedReply = new DetailedReply(payload);

    // Assert
    expect(detailedReply.content).toEqual('**balasan telah dihapus**');
  });

  it('should show original content when reply is not deleted', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'reply content',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      deleted_at: null, // reply tidak dihapus
    };

    // Action
    const detailedReply = new DetailedReply(payload);

    // Assert
    expect(detailedReply.content).toEqual(payload.content);
  });

  it('should throw error when deleted_at is not string or null', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'reply content',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      deleted_at: 123, // invalid type
    };

    // Action and Assert
    expect(() => new DetailedReply(payload)).toThrowError('DETAILED_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
});
