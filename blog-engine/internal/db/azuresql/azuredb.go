package azuresql

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/microsoft/go-mssqldb/azuread"
)

var dbPool *sql.DB

var server = "<your_server.database.windows.net>"
var port = 1433
var database = "<your_database>"

func ConnectToAzureSqlDB() *sql.DB {
	// Build connection string
	connString := fmt.Sprintf("server=%s;port=%d;database=%s;fedauth=ActiveDirectoryMSI;", server, port, database)

	var err error

	// Create connection pool
	dbPool, err = sql.Open(azuread.DriverName, connString)
	if err != nil {
		log.Fatal("Error creating connection pool: ", err.Error())
	}
	ctx := context.Background()
	err = dbPool.PingContext(ctx)
	if err != nil {
		log.Fatal(err.Error())
	}
	fmt.Printf("Connected!\n")

	return dbPool
}
