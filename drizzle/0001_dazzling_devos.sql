ALTER TABLE "orders" RENAME COLUMN "flw_tx_ref" TO "payment_ref";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "flw_tx_id" TO "payment_id";