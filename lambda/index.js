const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
      connectionLimit: 5,
    });
  }
  return pool;
}

exports.handler = async (event) => {
  const db = getPool();
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      const { apiKey } = payload;

      if (!apiKey) {
        console.error('Skipping message with no apiKey:', record.messageId);
        continue;
      }

      await db.execute(
        'UPDATE ApiKey SET requests = requests + 1 WHERE `key` = ?',
        [apiKey]
      );
    } catch (err) {
      console.error('Failed to process record', record.messageId, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};