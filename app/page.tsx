export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f7f4",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "20px",
          }}
        >
          Goal Coach
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#666",
          }}
        >
          One thing at a time.
        </p>
      </div>
    </main>
  );
}
