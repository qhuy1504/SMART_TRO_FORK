import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import { authAPI, apiUtils } from "../../services/api";
import { toast } from 'react-toastify';
import { useAuth } from "../../contexts/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { setUserData } = useAuth();

    // Load remembered login khi component mount
    React.useEffect(() => {
        const remembered = apiUtils.getRememberedLogin();
        if (remembered.email && remembered.password) {
            setEmail(remembered.email);
            setPassword(remembered.password);
            setRemember(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);


        try {
            const res = await authAPI.login({ email, password });
          

            if (res.data && res.data.success) {
                const { token, user } = res.data.data;
                // Luôn lưu token vào localStorage
                apiUtils.setAuthData(token, user._id, user.role);
                
                // Xử lý ghi nhớ đăng nhập
                if (remember) {
                    apiUtils.saveRememberedLogin(email, password);
                } else {
                    apiUtils.clearRememberedLogin();
                }
                
                toast.success(`Chào mừng ${user.fullName}! Đăng nhập thành công.`);
                setTimeout(() => {
                    setUserData(user);
                    navigate("/");
                }, 2200);
            } else {
                setTimeout(() => {
                    if (res.data?.errors && Array.isArray(res.data.errors)) {
                        res.data.errors.forEach(error => {
                            toast.error(error);
                        });
                    } else {
                        toast.error(res.data?.message || "Đăng nhập thất bại");
                    }
                }, 100);
            }
        } catch (err) {
            console.log("Login error:", err);
            // Đặt timeout để đảm bảo toast hiển thị
            setTimeout(() => {
                // Xử lý lỗi từ backend
                if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                    err.response.data.errors.forEach(error => {
                        toast.error(error);
                    });
                } else {
                    toast.error(err.response?.data?.message || "Đăng nhập thất bại");
                }
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth">
            <div className="container">
                <div className="form-box modern-card">
                    <h2>Đăng nhập</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                            </button>
                        </div>

                        <div className="remember-box">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                            />
                            <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                        </div>



                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="btn-primary" disabled={loading} onClick={(e) => e.stopPropagation()}>
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
