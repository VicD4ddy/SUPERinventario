export default function TestPage() {
    return (
        <div style={{ padding: 50, background: 'white', color: 'black' }}>
            <h1>System Status Check</h1>
            <p>If you can read this, the application core is working.</p>
            <p>Timestamp: {new Date().toISOString()}</p>
        </div>
    )
}
