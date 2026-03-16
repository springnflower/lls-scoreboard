-- CreateEnum
CREATE TYPE "GoalScope" AS ENUM ('TOTAL', 'CATEGORY', 'CHANNEL', 'SKU');

-- CreateEnum
CREATE TYPE "MonthlyTargetScope" AS ENUM ('TOTAL', 'SKU');

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3),
    "monthKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "consumerPrice" DECIMAL(18,2) NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3),
    "settlementId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "grossSales" DECIMAL(18,2) NOT NULL,
    "fee" DECIMAL(18,2) NOT NULL,
    "adjustment" DECIMAL(18,2) NOT NULL,
    "settlementAmount" DECIMAL(18,2) NOT NULL,
    "qty" INTEGER NOT NULL,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "cancelType" TEXT NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseCost" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "vendor" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "supplyCost" DECIMAL(18,2) NOT NULL,
    "totalWithVat" DECIMAL(18,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL,

    CONSTRAINT "PurchaseCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTarget" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "scope" "GoalScope" NOT NULL,
    "label" TEXT NOT NULL,
    "targetRevenue" DECIMAL(18,2) NOT NULL,
    "targetMarginRate" DECIMAL(8,4),

    CONSTRAINT "GoalTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSpend" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "media" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "spend" DECIMAL(18,2) NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCostMaster" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "packageCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "logisticsCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "memo" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCostMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryPosition" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "skuKeyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "onHandQty" INTEGER NOT NULL,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "memo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyTarget" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "scope" "MonthlyTargetScope" NOT NULL,
    "label" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "targetRevenue" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "MonthlyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelFeeRule" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "baseRate" DECIMAL(8,4) NOT NULL,
    "extraRate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "fixedFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL,

    CONSTRAINT "ChannelFeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaSource" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "media" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL,

    CONSTRAINT "MediaSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesFact" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "netRevenue" DOUBLE PRECISION NOT NULL,
    "qty" INTEGER NOT NULL,
    "orders" INTEGER NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "adSpend" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_importedAt_idx" ON "ImportBatch"("importedAt");

-- CreateIndex
CREATE INDEX "SalesOrder_batchId_idx" ON "SalesOrder"("batchId");

-- CreateIndex
CREATE INDEX "SalesOrder_monthKey_idx" ON "SalesOrder"("monthKey");

-- CreateIndex
CREATE INDEX "SalesOrder_channel_idx" ON "SalesOrder"("channel");

-- CreateIndex
CREATE INDEX "SalesOrder_category_idx" ON "SalesOrder"("category");

-- CreateIndex
CREATE INDEX "Settlement_batchId_idx" ON "Settlement"("batchId");

-- CreateIndex
CREATE INDEX "Settlement_category_idx" ON "Settlement"("category");

-- CreateIndex
CREATE INDEX "PurchaseCost_batchId_idx" ON "PurchaseCost"("batchId");

-- CreateIndex
CREATE INDEX "GoalTarget_batchId_idx" ON "GoalTarget"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTarget_batchId_scope_label_key" ON "GoalTarget"("batchId", "scope", "label");

-- CreateIndex
CREATE INDEX "AdSpend_batchId_idx" ON "AdSpend"("batchId");

-- CreateIndex
CREATE INDEX "AdSpend_channel_idx" ON "AdSpend"("channel");

-- CreateIndex
CREATE INDEX "AdSpend_media_idx" ON "AdSpend"("media");

-- CreateIndex
CREATE INDEX "AdSpend_monthKey_idx" ON "AdSpend"("monthKey");

-- CreateIndex
CREATE INDEX "ProductCostMaster_batchId_idx" ON "ProductCostMaster"("batchId");

-- CreateIndex
CREATE INDEX "ProductCostMaster_category_idx" ON "ProductCostMaster"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCostMaster_batchId_keyword_key" ON "ProductCostMaster"("batchId", "keyword");

-- CreateIndex
CREATE INDEX "InventoryPosition_batchId_idx" ON "InventoryPosition"("batchId");

-- CreateIndex
CREATE INDEX "InventoryPosition_category_idx" ON "InventoryPosition"("category");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryPosition_batchId_skuKeyword_key" ON "InventoryPosition"("batchId", "skuKeyword");

-- CreateIndex
CREATE INDEX "MonthlyTarget_batchId_idx" ON "MonthlyTarget"("batchId");

-- CreateIndex
CREATE INDEX "MonthlyTarget_monthKey_idx" ON "MonthlyTarget"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTarget_batchId_scope_label_monthKey_key" ON "MonthlyTarget"("batchId", "scope", "label", "monthKey");

-- CreateIndex
CREATE INDEX "ChannelFeeRule_batchId_idx" ON "ChannelFeeRule"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelFeeRule_batchId_channel_key" ON "ChannelFeeRule"("batchId", "channel");

-- CreateIndex
CREATE INDEX "MediaSource_batchId_idx" ON "MediaSource"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaSource_batchId_media_accountId_key" ON "MediaSource"("batchId", "media", "accountId");

-- CreateIndex
CREATE INDEX "SalesFact_date_idx" ON "SalesFact"("date");

-- CreateIndex
CREATE INDEX "SalesFact_month_idx" ON "SalesFact"("month");

-- CreateIndex
CREATE INDEX "SalesFact_channel_idx" ON "SalesFact"("channel");

-- CreateIndex
CREATE INDEX "SalesFact_sku_idx" ON "SalesFact"("sku");

-- CreateIndex
CREATE INDEX "SalesFact_category_idx" ON "SalesFact"("category");

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCost" ADD CONSTRAINT "PurchaseCost_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTarget" ADD CONSTRAINT "GoalTarget_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSpend" ADD CONSTRAINT "AdSpend_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCostMaster" ADD CONSTRAINT "ProductCostMaster_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryPosition" ADD CONSTRAINT "InventoryPosition_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTarget" ADD CONSTRAINT "MonthlyTarget_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelFeeRule" ADD CONSTRAINT "ChannelFeeRule_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaSource" ADD CONSTRAINT "MediaSource_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
