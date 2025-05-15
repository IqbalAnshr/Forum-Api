const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread use case action correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'dicoding',
      body: 'sebuah thread',
    };
    const owner = 'user-123';

    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.addThread = jest.fn().mockImplementation(() => Promise.resolve(
      new AddedThread({
        id: 'thread-123',
        title: useCasePayload.title,
        owner,
      }),
    ));

    // create use case instance
    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await addThreadUseCase.execute(owner, useCasePayload);

    // Assert
    expect(mockThreadRepository.addThread).toBeCalledWith(owner, new NewThread(useCasePayload));
    expect(thread).toStrictEqual(new AddedThread({ id: 'thread-123', title: useCasePayload.title, owner }));
  });
});
