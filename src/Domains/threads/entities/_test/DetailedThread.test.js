const DetailedThread = require('../DetailedThread');

describe('a DetailedThread entities', () => {
  it('should throw error when payload does not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'dicoding',
      body: 'dicoding',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          content: 'dicoding',
          date: '2021-01-01',
          username: 'dicoding',
        },
      ],
    };

    // Action & Assert
    expect(() => new DetailedThread(payload)).toThrowError('DETAILED_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload does not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: true,
      body: 'dicoding',
      date: 123,
      username: 'dicoding',
      comments: 'harusnya array',
    };

    // Action & Assert
    expect(() => new DetailedThread(payload)).toThrowError('DETAILED_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailedThread entities correctly', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'dicoding',
      body: 'dicoding',
      date: '2021-01-01',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          content: 'dicoding',
          date: '2021-01-01',
          username: 'dicoding',
        },
      ],
    };

    // Action
    const {
      id, title, body, date, username, comments,
    } = new DetailedThread(payload);

    // Assert
    expect(id).toEqual(payload.id);
    expect(title).toEqual(payload.title);
    expect(body).toEqual(payload.body);
    expect(date).toEqual(payload.date);
    expect(username).toEqual(payload.username);
    expect(comments).toEqual(payload.comments);
  });
});
