/**
 * 登录/注册页面
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../api';
import { LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (mode === 'login') {
        user = await login(username, password);
      } else {
        if (!email) { setError('请输入邮箱'); setLoading(false); return; }
        user = await register(username, email, password);
      }
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/editor');
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-96 bg-surface-800 rounded-xl p-8 border border-surface-700">
        <h1 className="text-2xl font-bold text-center mb-6">
          {mode === 'login' ? '登录' : '注册'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-surface-200">用户名</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 bg-surface-700 rounded text-white outline-none focus:ring-2 focus:ring-primary-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-sm text-surface-200">邮箱</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 bg-surface-700 rounded text-white outline-none focus:ring-2 focus:ring-primary-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-surface-200">密码</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 bg-surface-700 rounded text-white outline-none focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded font-medium flex items-center justify-center gap-2"
          >
            {loading ? '处理中...' : mode === 'login' ? (
              <><LogIn size={16} /> 登录</>
            ) : (
              <><UserPlus size={16} /> 注册</>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-surface-200 mt-4">
          {mode === 'login' ? '没有账号？' : '已有账号？'}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-primary-500 hover:underline ml-1"
          >
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
