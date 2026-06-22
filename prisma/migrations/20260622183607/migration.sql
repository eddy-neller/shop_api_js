-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firstname" TEXT,
    "lastname" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" JSONB NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "security" JSONB NOT NULL,
    "active_email" JSONB NOT NULL,
    "reset_password" JSONB NOT NULL,
    "preferences" JSONB NOT NULL,
    "avatar_name" TEXT,
    "last_visit" TIMESTAMP(3) NOT NULL,
    "nb_login" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "UserUsernameIdx" ON "users"("username");

-- CreateIndex
CREATE INDEX "UserEmailIdx" ON "users"("email");

-- CreateIndex
CREATE INDEX "UserCreatedAtIdx" ON "users"("created_at");
