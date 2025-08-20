import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import { authAPI } from "../../services/api";

const Register = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("landlord");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const res = await authAPI.register({ fullName, email, phone, password, role });
            if (res.data && res.data.success) {
                setSuccess("Đăng ký thành công. Chuyển sang đăng nhập...");
                setTimeout(() => navigate('/login'), 1200);
            } else {
                setError(res.data?.message || "Đăng ký thất bại");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth">
            <div className="container">
                <div className="form-box">
                    <h2>Đăng ký</h2>
                    <form onSubmit={handleSubmit}>
                        <input type="text" placeholder="Họ và tên" value={fullName} onChange={e=>setFullName(e.target.value)} required />
                        <input type="email" placeholder="Email của bạn" value={email} onChange={e=>setEmail(e.target.value)} required />
                        <input type="tel" placeholder="Số điện thoại" value={phone} onChange={e=>setPhone(e.target.value)} required />
                        <input type="password" placeholder="Mật khẩu" value={password} onChange={e=>setPassword(e.target.value)} required />
                        <select value={role} onChange={e => setRole(e.target.value)} style={{ marginBottom: '12px' }}
                            className="form-select"
                        >
                            <option value="tenant">Khách thuê</option>
                            <option value="landlord">Chủ trọ</option>
                            <option value="admin">Admin</option>
                        </select>
                        {error && <div style={{color:'#dc2626',fontSize:'14px',marginBottom:'8px'}}>{error}</div>}
                        {success && <div style={{color:'#16a34a',fontSize:'14px',marginBottom:'8px'}}>{success}</div>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                        </button>
                    </form>
                    <div className="form-links">
                        <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;
