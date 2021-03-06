import { MySqlClient } from "../../src/clients/mysql-client";
import { config } from "../../src/config";

export async function resetTables(mysqlClientProvider: () => MySqlClient): Promise<void> {
  const mysql = mysqlClientProvider();
  const tables = await mysql.query("SELECT `table_name` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA="
    + `'${config.mysql.database}' AND TABLE_TYPE='BASE TABLE'`);
  for (const table of tables) {
    if (table.table_name === "migrations") {
      continue;
    }
    await mysql.query(`TRUNCATE TABLE ${table.table_name}`);
  }
  return;
}
