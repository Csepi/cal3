export const timestampTzType =
  process.env.DB_TYPE === 'postgres' ? 'timestamptz' : 'datetime';
export const timestampType =
  process.env.DB_TYPE === 'postgres' ? 'timestamp' : 'datetime';
export const timestampWithTimeZoneType =
  process.env.DB_TYPE === 'postgres' ? 'timestamp with time zone' : 'datetime';
export const enumType =
  process.env.DB_TYPE === 'postgres' ? 'enum' : 'simple-enum';
