const routes = (handler) => ([
  {
    method: 'PUT',
    path: '/threads/{threadId}/comments/{commentId}/likes',
    handler: handler.putCommentLikeHandler,
    options: {
      auth: 'forum_jwt',
    },
  },
]);

module.exports = routes;
