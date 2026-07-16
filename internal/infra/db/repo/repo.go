package repo

import (
	"context"
	"database/sql"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	"github.com/mosimosi228/pinger/pkg/sqlite"
	"sync"
)

var (
	queries *mapping.Queries
	once    sync.Once
)

func GetRepository() *mapping.Queries {
	once.Do(func() {
		queries = mapping.New(sqlite.DB)
	})

	return queries
}

func BeginTransaction(ctx context.Context) (*sql.Tx, error) {
	return sqlite.DB.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
}

func RollbackTransaction(tx *sql.Tx) {
	if tx != nil {
		_ = tx.Rollback()
	}
}

func CommitTransaction(tx *sql.Tx) error {
	if tx == nil {
		return nil
	}
	return tx.Commit()
}

func WithTransaction(ctx context.Context, fn func(qtx *mapping.Queries) error) error {
	tx, err := BeginTransaction(ctx)
	if err != nil {
		return err
	}
	defer RollbackTransaction(tx)

	qtx := GetRepository().WithTx(tx)
	if err := fn(qtx); err != nil {
		return err
	}
	return CommitTransaction(tx)
}
