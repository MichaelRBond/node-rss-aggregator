import { mysqlClientEnd, mysqlClientProvider } from "../../../src/clients/mysql-client";
import { RssFeedDao } from "../../../src/dao/rss-feed";
import { RssFeed, RssFeedBase } from "../../../src/models/rss";
import { DateTime } from "../../../src/utils/date-time";
import { Mock, mock, verify } from "../../utils/mockfill";
import { resetTables } from "../../utils/mysql";

describe("Integration: rss-feed", () => {

  let datetime: Mock<DateTime>;
  let dao: RssFeedDao;

  let feed: RssFeedBase;

  const date = 123456789;

  beforeEach(async () => {
    datetime = mock<DateTime>();
    dao = new RssFeedDao(mysqlClientProvider, datetime);

    await resetTables(mysqlClientProvider);

    feed = {
      title: "test feed",
      url: "http://url.com",
    };

    datetime.dateNoWInSeconds = () => date;
  });

  afterAll(async () => {
    await mysqlClientEnd();
  });

  describe("save()", () => {
    it("saves a feed to the database", async () => {
      const feedId = await dao.save(feed);
      expect(feedId).not.toEqual(null);
      expect(feedId).toBeGreaterThan(0);

      const savedFeed = await dao.getById(feedId);

      expect(savedFeed).toHaveProperty("title", feed.title);
      expect(savedFeed).toHaveProperty("url", feed.url);
      expect(savedFeed).toHaveProperty("addedOn", date);
      expect(savedFeed).toHaveProperty("lastUpdated", 0);

      verify(datetime.dateNoWInSeconds).calledOnce();
    });
  });

  describe("getFeeds()", () => {
    it("gets a list of all the feeds", async () => {
      expect((await dao.getFeeds()).length).toEqual(0);

      for (let i = 0; i < 20; i++) {
        const f: RssFeedBase = {
          title: `test ${i}`,
          url: `http://${0}`,
        };
        await dao.save(f);
      }

      const result = await dao.getFeeds();
      expect(result.length).toEqual(20);
      verify(datetime.dateNoWInSeconds).called(20);
    });
  });

  describe("getById()", () => {
    it("gets a feed by feed id", async () => {
      const saveId = await dao.save(feed);
      const getResult = await dao.getById(saveId);
      expect(getResult).toHaveProperty("title", feed.title);
      expect(getResult).toHaveProperty("url", feed.url);
      expect(getResult).toHaveProperty("addedOn", date);
      expect(getResult).toHaveProperty("lastUpdated", 0);
    });

    it("returns null when a feed cannot be found", async () => {
      const result = await dao.getById(0);
      expect(result).toBeNull();
    });
  });

  describe("update()", () => {
    it("updates a feed", async () => {
      const insertId = await dao.save(feed);

      const newFeed = await dao.getById(insertId);
      expect(newFeed).toHaveProperty("title", feed.title);
      expect(newFeed).toHaveProperty("url", feed.url);
      expect(newFeed).toHaveProperty("addedOn", date);
      expect(newFeed).toHaveProperty("lastUpdated", 0);

      newFeed.title = "updated title";

      const updateId = await dao.update(newFeed);
      const updatedFeed = await dao.getById(updateId);
      expect(updateId).toEqual(insertId);
      expect(updatedFeed).toHaveProperty("title", "updated title");
      expect(updatedFeed).toHaveProperty("url", feed.url);
      expect(updatedFeed).toHaveProperty("addedOn", date);
      expect(updatedFeed).toHaveProperty("lastUpdated", date);

      verify(datetime.dateNoWInSeconds).called(2);
    });

    it("returns null when updating an id that doesn't exist", async () => {
      const feedUpdate = {
        id: 100,
        title: "test feed",
        url: "http://url.com",
      } as RssFeed;
      const result = await dao.update(feedUpdate);
      expect(result).toBeNull();
    });
  });

  describe("getFeedsForGroup()", () => {
    it("returns the expected RSS Feeds", async () => {
      await dao.save(feed);

      feed = {
        title: "test2",
        url: "http://test2.com",
      };
      await dao.save(feed);

      feed = {
        title: "test3",
        url: "http://test3.com",
      };
      await dao.save(feed);

      const mysql = mysqlClientProvider();
      mysql.query("INSERT INTO `feedGroups` (`feedId`, `groupId`) VALUES(1, 2), (2, 2), (3, 2)");

      const results = await dao.getFeedsForGroup(2);
      expect(results.length).toEqual(3);
    });
  });

  describe("delete", () => {
    it("deletes an rss feed as expected", async () => {
      const idToDelete = await dao.save(feed);

      feed = {
        title: "test2",
        url: "http://test2.com",
      };
      await dao.save(feed);

      feed = {
        title: "test3",
        url: "http://test3.com",
      };
      await dao.save(feed);

      const mysql = mysqlClientProvider();
      let sqlCheck = await mysql.query("SELECT * FROM `feeds`");
      expect(sqlCheck).toHaveLength(3);

      await dao.delete(idToDelete);
      sqlCheck = await mysql.query("SELECT * FROM `feeds`");
      expect(sqlCheck).toHaveLength(2);

      for (const checkFeed of sqlCheck) {
        expect(checkFeed.id).not.toEqual(idToDelete);
      }
    });
  });
});
