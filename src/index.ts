import { CronJob } from "cron";
import { Server } from "hapi";
import { mysqlClientProvider } from "./clients/mysql-client";
import { config } from "./config";
import { AccountDao } from "./dao/accounts";
import { GroupDao } from "./dao/group";
import { RssFeedDao } from "./dao/rss-feed";
import { RssItemDao } from "./dao/rss-item";
import { FeedsController } from "./endpoints/feed-controller";
import { GroupFeedController } from "./endpoints/group-feed-controller";
import { GroupsController } from "./endpoints/groups-controller";
import { AccountModel } from "./models/accounts";
import { EndpointController } from "./models/endpoint-controller";
import { FeedGroupModel } from "./models/feed-group";
import { GroupModel } from "./models/group";
import { Rss } from "./models/rss";
import { Authentication } from "./utils/authentication";
import { DateTime } from "./utils/date-time";
import { FeedParser } from "./utils/feed-parser";
import { Http } from "./utils/http";
import { logger } from "./utils/logger";

const datetime = new DateTime();
const feedParser = new FeedParser();
const http = new Http();

const accountDao = new AccountDao(mysqlClientProvider);
const rssFeedDao = new RssFeedDao(mysqlClientProvider, datetime);
const rssItemDao = new RssItemDao(mysqlClientProvider);
const groupDao = new GroupDao(mysqlClientProvider);

const accountModel = new AccountModel(accountDao);
const rssModel = new Rss(rssFeedDao, rssItemDao, feedParser, http);
const groupModel = new GroupModel(groupDao);
const feedGroupModel = new FeedGroupModel(rssFeedDao, rssModel, groupModel, groupDao);

const authentication = new Authentication(accountModel);

const feedController: FeedsController = new FeedsController(rssModel);
const groupFeedController: GroupFeedController = new GroupFeedController(feedGroupModel);
const groupsController: GroupsController = new GroupsController(groupModel);

const endpointControllers: EndpointController[] = [
  feedController,
  groupFeedController,
  groupsController,
];

// TODO : Refactor
const rssFetchJob = new CronJob({
  cronTime: config.schedule,
  onTick: async () => {
    return await rssModel.fetchFeeds();
  },
  start: false,
});
rssFetchJob.start();

getHapiServer(authentication, endpointControllers).then((server) => {
  server.start();
  return server;
}).then((server) => {
  logger.info(`Hapi Running at: ${server.info.uri}`);
}).catch((err) => {
  throw err;
});

async function getHapiServer(
  auth: Authentication,
  controllers: EndpointController[],
): Promise<Server> {
  const server = new Server({
    host: config.hapi.host,
    port: config.hapi.port,
  });

  await server.register(require("hapi-auth-basic"));

  auth.registerAuthStrategies(server);

  controllers.forEach((c) => {
    server.route(c.registerRoutes());
  });

  await server.initialize();

  return server;
}
