exports.up = (pgm) => {
  pgm.createTable('comments', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    content: {
      type: 'TEXT',
      notNull: true,
    },
    thread: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    deleted_at: {
      type: 'TIMESTAMP',
      notNull: false,
    },
  });

  pgm.addConstraint('comments', 'fk_comments.owner_users.id', {
    foreignKeys: {
      columns: 'owner',
      references: 'users(id)',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    },
  });

  pgm.addConstraint('comments', 'fk_comments.thread_threads.id', {
    foreignKeys: {
      columns: 'thread',
      references: 'threads(id)',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('comments');
};
