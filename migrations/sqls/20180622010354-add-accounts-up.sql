CREATE TABLE IF NOT EXISTS `accounts`(
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(30) NOT NULL,
  addedOn int(11) NOT NULL DEFAULT 0,
  lastUpdated INT(11) NOT NULL DEFAULT 0,
  salt VARCHAR(32) NOT NULL,
  apikeyHash VARCHAR(60) NOT NULL,
  PRIMARY KEY (id)
) engine=InnoDB DEFAULT CHARACTER SET=utf8mb4;
