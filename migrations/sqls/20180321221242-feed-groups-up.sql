CREATE TABLE IF NOT EXISTS `groups`(
    id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    PRIMARY KEY(id)
) engine=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feedGroups`(
    id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    groupId INT(11) UNSIGNED NOT NULL,
    feedId INT(11) UNSIGNED NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT feed_group_unique UNIQUE (groupId, feedId)
) engine=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
