class MockClient {
  query(sql: string, params?: any[]) {
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  release() {}
}

class MockPool {
  connect() {
    return Promise.resolve(new MockClient());
  }
}

module.exports = new MockPool();
