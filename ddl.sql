CREATE TABLE `newVolumeLightNovel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asin` varchar(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `volumeNum` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `releaseDate` date NOT NULL,
  `tweetCount` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asin` (`asin`)
) ENGINE=InnoDB AUTO_INCREMENT=3096 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reservableVolumeLightNovel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asin` varchar(10) NOT NULL,
  `title` varchar(255) NOT NULL,
  `volumeNum` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `releaseDate` date NOT NULL,
  `tweetCount` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `asin` (`asin`)
) ENGINE=InnoDB AUTO_INCREMENT=1691 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `twitterToken` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country` varchar(2) NOT NULL,
  `accessToken` varchar(255) NOT NULL,
  `refreshToken` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=224 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;