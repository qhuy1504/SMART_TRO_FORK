import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import { authAPI, apiUtils } from "../../services/api";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await authAPI.login({ email, password });
            if (res.data && res.data.success) {
                const { token, user } = res.data.data;
                apiUtils.setAuthData(token, user._id, user.role);
                navigate("/admin/rooms");
            } else {
                setError(res.data?.message || "Đăng nhập thất bại");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth">
            <div className="container">
                <div className="form-box">
                    <h2>Đăng nhập</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && <div style={{color:'#dc2626',fontSize:'14px',marginBottom:'8px'}}>{error}</div>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </form>
                    <div className="form-links">
                        <p>Bạn chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
                        <p><Link to="/forgot-password">Quên mật khẩu?</Link></p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;
