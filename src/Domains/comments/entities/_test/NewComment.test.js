const NewComment = require('../NewComment');

describe('a NewComment entities', () => {
  it('should throw error when payload does not contain needed property', () => {
    // Arrange
    const payload = {
      test: 'dicoding',
    };

    // Action & Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw erro when payload does not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 123,
    };

    // Action & Assert
    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewComment entities correctly', () => {
    // Arrange
    const payload = {
      content: 'a comment',
    };

    // Action
    const newComment = new NewComment(payload);

    // Assert
    expect(newComment).toBeInstanceOf(NewComment);
    expect(newComment).toHaveProperty('content', payload.content);
  });
});
