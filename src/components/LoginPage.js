import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const { data } = supabase.storage
      .from("logos_clientes")
      .getPublicUrl("ris3.jpg");

    if (data?.publicUrl) {
      setLogoUrl(data.publicUrl);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      if (onLogin) onLogin();
    } catch (err) {
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          .loginPageRoot {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 18px;
            box-sizing: border-box;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background:
              radial-gradient(circle at 12% 18%, rgba(59, 130, 246, 0.30), transparent 28%),
              radial-gradient(circle at 85% 78%, rgba(15, 118, 110, 0.28), transparent 30%),
              linear-gradient(135deg, #0f172a 0%, #1e3a5f 48%, #0f766e 100%);
            position: relative;
            overflow: hidden;
          }

          .loginPageRoot::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(180deg, rgba(255,255,255,0.035) 1px, transparent 1px);
            background-size: 44px 44px;
            opacity: 0.45;
            pointer-events: none;
          }

          .loginShell {
            width: 100%;
            max-width: 960px;
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            border-radius: 28px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 28px 70px rgba(15, 23, 42, 0.42);
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255, 255, 255, 0.35);
          }

          .loginBrandPanel {
            padding: 46px 42px;
            color: #ffffff;
            background:
              linear-gradient(155deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 58, 95, 0.96) 52%, rgba(15, 118, 110, 0.94) 100%);
            position: relative;
            min-height: 460px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .loginBrandPanel::after {
            content: "";
            position: absolute;
            width: 260px;
            height: 260px;
            border-radius: 50%;
            right: -110px;
            top: -90px;
            background: rgba(255, 255, 255, 0.08);
          }

          .loginBrandTop {
            position: relative;
            z-index: 1;
          }

          .loginBadge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 11px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.18);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #dbeafe;
            margin-bottom: 26px;
          }

          .loginBrandTitle {
            margin: 0;
            font-size: 34px;
            line-height: 1.08;
            letter-spacing: -0.04em;
            font-weight: 850;
          }

          .loginBrandText {
            margin: 18px 0 0;
            max-width: 390px;
            color: #cbd5e1;
            font-size: 14px;
            line-height: 1.7;
          }

          .loginFeatureList {
            position: relative;
            z-index: 1;
            display: grid;
            gap: 10px;
            margin-top: 32px;
          }

          .loginFeature {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #e2e8f0;
            font-size: 13px;
          }

          .loginFeatureMark {
            width: 22px;
            height: 22px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.22);
            color: #bfdbfe;
            font-size: 12px;
            font-weight: 800;
            flex-shrink: 0;
          }

          .loginBrandFooter {
            position: relative;
            z-index: 1;
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.5;
          }

          .loginFormPanel {
            padding: 46px 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 30%),
              #ffffff;
          }

          .loginCard {
            width: 100%;
            max-width: 380px;
          }

          .loginLogoWrap {
            text-align: center;
            margin-bottom: 20px;
          }

          .loginLogoBox {
            width: 96px;
            height: 96px;
            margin: 0 auto;
            border-radius: 22px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.10);
            overflow: hidden;
          }

          .loginLogoBox img {
            max-width: 82px;
            max-height: 82px;
            object-fit: contain;
          }

          .loginHeader {
            text-align: center;
            margin-bottom: 28px;
          }

          .loginHeader h1 {
            margin: 0;
            font-size: 25px;
            line-height: 1.2;
            font-weight: 850;
            color: #0f172a;
            letter-spacing: -0.03em;
          }

          .loginHeader p {
            margin: 8px 0 0;
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
          }

          .loginError {
            margin-bottom: 16px;
            padding: 11px 13px;
            border-radius: 12px;
            font-size: 13px;
            background-color: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
            box-shadow: 0 8px 18px rgba(153, 27, 27, 0.06);
          }

          .loginField {
            margin-bottom: 17px;
          }

          .loginLabel {
            font-size: 13px;
            font-weight: 750;
            color: #334155;
            margin-bottom: 7px;
            display: block;
          }

          .loginInput {
            width: 100%;
            box-sizing: border-box;
            padding: 12px 13px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
            background-color: #f8fafc;
            color: #0f172a;
          }

          .loginInput:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.13);
            background-color: #ffffff;
          }

          .loginInput::placeholder {
            color: #94a3b8;
          }

          .loginButton {
            width: 100%;
            padding: 13px 14px;
            border-radius: 13px;
            border: none;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.02em;
            cursor: pointer;
            color: #ffffff;
            background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 54%, #0f766e 100%);
            box-shadow: 0 12px 26px rgba(37, 99, 235, 0.30);
            transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
          }

          .loginButton:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 16px 34px rgba(37, 99, 235, 0.36);
          }

          .loginButton:disabled {
            cursor: default;
            opacity: 0.78;
            box-shadow: none;
          }

          .loginSecurityNote {
            margin-top: 18px;
            padding: 11px 12px;
            border-radius: 13px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
            line-height: 1.45;
          }

          .loginSecurityNote strong {
            color: #334155;
          }

          @media (max-width: 860px) {
            .loginShell {
              max-width: 440px;
              grid-template-columns: 1fr;
            }

            .loginBrandPanel {
              display: none;
            }

            .loginFormPanel {
              padding: 38px 28px;
            }
          }

          @media (max-width: 460px) {
            .loginPageRoot {
              padding: 18px 12px;
            }

            .loginShell {
              border-radius: 22px;
            }

            .loginFormPanel {
              padding: 32px 22px;
            }

            .loginHeader h1 {
              font-size: 22px;
            }

            .loginLogoBox {
              width: 82px;
              height: 82px;
              border-radius: 18px;
            }

            .loginLogoBox img {
              max-width: 70px;
              max-height: 70px;
            }
          }
        `}
      </style>

      <div className="loginPageRoot">
        <div className="loginShell">
          <aside className="loginBrandPanel">
            <div className="loginBrandTop">
              <div className="loginBadge">Plataforma de consulta</div>

              <h2 className="loginBrandTitle">
                Gestión de Listas Especiales
              </h2>

              <p className="loginBrandText">
                Herramienta institucional para consultas, reportes y trazabilidad
                de búsquedas en listas especiales.
              </p>

              <div className="loginFeatureList">
                <div className="loginFeature">
                  <span className="loginFeatureMark">✓</span>
                  <span>Acceso autenticado por usuario autorizado</span>
                </div>
                <div className="loginFeature">
                  <span className="loginFeatureMark">✓</span>
                  <span>Registro histórico de consultas realizadas</span>
                </div>
                <div className="loginFeature">
                  <span className="loginFeatureMark">✓</span>
                  <span>Reportes institucionales y análisis de uso</span>
                </div>
              </div>
            </div>

            <div className="loginBrandFooter">
              Sistema diseñado para apoyar procesos de debida diligencia,
              cumplimiento y control operativo.
            </div>
          </aside>

          <main className="loginFormPanel">
            <div className="loginCard">
              {logoUrl && (
                <div className="loginLogoWrap">
                  <div className="loginLogoBox">
                    <img src={logoUrl} alt="Logo aplicación" />
                  </div>
                </div>
              )}

              <div className="loginHeader">
                <h1>Listas Especiales</h1>
                <p>Ingrese sus credenciales para acceder a consultas y reportes.</p>
              </div>

              {error && <div className="loginError">{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="loginField">
                  <label htmlFor="email" className="loginLabel">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="loginInput"
                    placeholder="usuario@entidad.com"
                  />
                </div>

                <div className="loginField">
                  <label htmlFor="password" className="loginLabel">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="loginInput"
                    placeholder="Ingrese su contraseña"
                  />
                </div>

                <button type="submit" disabled={loading} className="loginButton">
                  {loading ? "Validando acceso..." : "Ingresar a la plataforma"}
                </button>
              </form>

              <div className="loginSecurityNote">
                <strong>Autenticación segura.</strong> El acceso está reservado
                para usuarios autorizados.
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}