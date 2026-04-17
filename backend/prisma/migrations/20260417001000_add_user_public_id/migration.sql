ALTER TABLE `User` ADD COLUMN `publicId` CHAR(36) NULL;

CREATE UNIQUE INDEX `User_publicId_key` ON `User`(`publicId`);
