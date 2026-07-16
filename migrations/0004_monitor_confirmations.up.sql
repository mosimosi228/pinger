ALTER TABLE monitors
    ADD COLUMN confirmations INTEGER NOT NULL DEFAULT 1
        CHECK (confirmations >= 1);
