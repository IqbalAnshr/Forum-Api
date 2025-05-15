const DetailedComment = require('../../Domains/comments/entities/DetailedComment');
const DetailedThread = require('../../Domains/threads/entities/DetailedThread');
const DetailedReply = require('../../Domains/replies/entities/DetailedReply');

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyIsThreadExist(threadId);
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const commentIds = comments.map((comment) => comment.id);
    const allReplies = await this._replyRepository.getRepliesByCommentIds(commentIds);

    const detailedComments = comments.map((comment) => {
      const replies = allReplies
        .filter((reply) => reply.comment === comment.id)
        .map((reply) => new DetailedReply(reply));

      return new DetailedComment({
        ...comment,
        replies,
      });
    });

    return new DetailedThread({
      ...thread,
      comments: detailedComments,
    });
  }
}

module.exports = GetThreadDetailUseCase;
