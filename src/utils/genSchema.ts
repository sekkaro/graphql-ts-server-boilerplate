import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import * as path from "path";
import * as fs from "fs";
import { makeExecutableSchema } from "graphql-tools";
import * as glob from "glob";

export const genSchema = (): any => {
  const pathToModules = path.join(__dirname, "../modules");
  const graphqlTypes = glob
    .sync(`${pathToModules}/**/*.graphql`)
    .map((x) => fs.readFileSync(x, { encoding: "utf8" }));

  const resolvers = glob
    .sync(`${pathToModules}/**/resolvers.?s`)
    .map((resolver) => require(resolver).resolvers);

  return makeExecutableSchema({
    typeDefs: mergeTypeDefs(graphqlTypes),
    resolvers: mergeResolvers(resolvers),
  });
};
