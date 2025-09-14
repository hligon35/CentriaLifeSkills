-- CreateTable
CREATE TABLE "WorkShift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "therapistId" TEXT NOT NULL,
    "studentId" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkShift_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkShift_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClockEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "therapistId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "ClockEntry_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkShift_therapistId_startAt_idx" ON "WorkShift"("therapistId", "startAt");

-- CreateIndex
CREATE INDEX "ClockEntry_therapistId_startedAt_idx" ON "ClockEntry"("therapistId", "startedAt");
