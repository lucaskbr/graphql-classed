const postsResolvers = require("./posts");
const commentsResolvers = require("./comments");
const usersResolvers = require("./users");

module.exports = {
  Query: {
    ...postsResolvers.Query
  },
  Mutation: {
    ...usersResolvers.Mutatation,
    ...postsResolvers.Mutation,
    ...commentsResolvers.Mutation
  }
};
