const ReplyHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'replies',
  version: '1.0.0',
  register: async (server, { container }) => {
    const replyHandler = new ReplyHandler(container);
    server.route(routes(replyHandler));
  },
};
