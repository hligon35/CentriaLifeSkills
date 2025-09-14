-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "tags" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishAt" DATETIME,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "body", "category", "createdAt", "id", "imageUrl", "pinned", "tags", "title") SELECT "authorId", "body", "category", "createdAt", "id", "imageUrl", "pinned", "tags", "title" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_publishAt_idx" ON "Post"("publishAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
