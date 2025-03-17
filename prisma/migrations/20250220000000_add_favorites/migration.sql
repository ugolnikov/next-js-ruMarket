-- Drop table if exists (to avoid conflicts)
DROP TABLE IF EXISTS "favorites";
DROP SEQUENCE IF EXISTS favorites_id_seq;

-- Create sequence for favorites
CREATE SEQUENCE favorites_id_seq;

-- CreateTable
CREATE TABLE "favorites" (
    "id" BIGINT NOT NULL DEFAULT nextval('favorites_id_seq'),
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- Add sequence ownership
ALTER SEQUENCE favorites_id_seq OWNED BY favorites.id;

-- Add unique constraint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_product_id_key" UNIQUE ("user_id", "product_id");

-- Add foreign keys
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;