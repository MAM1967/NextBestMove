export default function TestAuthPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Basic Auth Test Page</h1>
      <p>If you can see this page, Basic Auth either:</p>
      <ul>
        <li>Didn't prompt (middleware not running or staging detection failed)</li>
        <li>You entered credentials and they were accepted</li>
      </ul>
      <p>
        <strong>Expected:</strong> You should have been prompted for username/password before seeing this page.
      </p>
    </div>
  );
}

