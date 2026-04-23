import LoginForm from "../modules/auth/components/LoginForm";

export default function LoginPage() {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            justifyContent: "center",
            height: "100svh",
            gap: 0,
        }}>
            <h1 style={{}}>Gestión del Fin</h1>
            <div style={{
                background: "#f9f9f7",
                border: "0.5px solid var(--border)",
                borderRadius: 16,
                padding: "32px 36px",
                width: "100%",
                maxWidth: 380,
                boxSizing: "border-box",
            }}>
                <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4, marginTop: 0, textAlign: "left" }}>
                    Inicio de sesión
                </h1>
                <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 24, textAlign: "left" }}>
                    Para continuar, debes iniciar sesión
                </p>
                <LoginForm />
            </div>
        </div>
    );
}